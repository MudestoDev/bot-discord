const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType
} = require('discord.js');

const fs = require('fs');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const { filas } = require('./commands/fila');

client.commands = new Collection();

// 📂 Carregar comandos
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
}

// ✅ Bot pronto
client.once(Events.ClientReady, () => {
  console.log(`✅ Bot online como ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {

  // =========================
  // BOTÕES
  // =========================
  if (interaction.isButton()) {

    // 🎫 TICKET
    if (interaction.customId === 'criar_ticket') {
      // seu código
    }

    if (interaction.customId === 'fechar_ticket') {
      const modal = new ModalBuilder()
        .setCustomId('modal_fechar_ticket')
        .setTitle('Fechar Ticket');

      const motivo = new TextInputBuilder()
        .setCustomId('motivo')
        .setLabel('Motivo do fechamento')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(motivo);
      modal.addComponents(row);

      return interaction.showModal(modal);
    }

    // 🎮 FILA
    if (interaction.customId && interaction.customId.startsWith('fila_')) {

      const [_, action, id] = interaction.customId.split('_');
      const fila = filas.get(id);

      if (!fila) {
        return interaction.reply({ content: '❌ Fila não encontrada.', flags: 64 });
      }

      const userId = interaction.user.id;

      if (action === 'entrar') {
        if (fila.jogadores.includes(userId))
          return interaction.reply({ content: 'Já está na fila', flags: 64 });

        if (fila.jogadores.length >= fila.tamanho)
          return interaction.reply({ content: 'Fila cheia', flags: 64 });

        fila.jogadores.push(userId);
      }

      if (action === 'sair') {
        fila.jogadores = fila.jogadores.filter(u => u !== userId);
      }

      if (action === 'start') {
        if (fila.jogadores.length < fila.tamanho)
          return interaction.reply({ content: 'Fila não está cheia', flags: 64 });

        await interaction.deferUpdate(); // ✅ AGORA FUNCIONA
        await iniciarFila(interaction, fila, id);
        return;
      }

      if (action === 'end') {
        const canais = interaction.guild.channels.cache.filter(c =>
          c.name.startsWith(`fila-${id}`)
        );

        for (const canal of canais.values()) {
          await canal.delete().catch(() => {});
        }

        filas.delete(id);

        return interaction.reply({
          content: '✅ Fila finalizada',
          flags: 64
        });
      }

      const lista = fila.jogadores.map(id => `<@${id}>`).join('\n') || 'Vazio';

      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setFields({
          name: `👥 Jogadores (${fila.jogadores.length}/${fila.tamanho})`,
          value: lista
        });

      await interaction.update({ embeds: [embed] });

      if (fila.jogadores.length === fila.tamanho) {
        setTimeout(() => {
          iniciarFila(interaction, fila, id).catch(console.error);
        }, 10000);
      }
    }
  }

  // =========================
  // SLASH COMMANDS
  // =========================
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({ content: 'Erro ao executar comando' });
    } else {
      await interaction.reply({ content: 'Erro ao executar comando', flags: 64 });
    }
  }

});

// =========================
// 🚀 FUNÇÃO FILA
// =========================
async function iniciarFila(interaction, fila, id) {

  const jogadores = fila.jogadores;
  const categoria = '1490917601524842528';

  const chat = await interaction.guild.channels.create({
    name: `fila-${id}-chat`,
    type: ChannelType.GuildText,
    parent: categoria
  });

  const call1 = await interaction.guild.channels.create({
    name: `fila-${id}-call1`,
    type: ChannelType.GuildVoice,
    parent: categoria
  });

  const call2 = await interaction.guild.channels.create({
    name: `fila-${id}-call2`,
    type: ChannelType.GuildVoice,
    parent: categoria
  });

  await chat.permissionOverwrites.set([
    {
      id: interaction.guild.id,
      deny: ['ViewChannel']
    },
    ...jogadores.map(id => ({
      id,
      allow: [
        'ViewChannel',
        'SendMessages',
        'AttachFiles',
        'ReadMessageHistory'
      ]
    }))
  ]);

  let toggle = true;

  for (const idUser of jogadores) {
    const member = await interaction.guild.members.fetch(idUser).catch(() => null);

    if (member?.voice.channel) {
      await member.voice.setChannel(toggle ? call1 : call2);
      toggle = !toggle;
    }
  }

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle(`🔥 Fila ${id} iniciada`)
    .setDescription(jogadores.map(id => `<@${id}>`).join('\n'));

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fila_end_${id}`)
      .setLabel('Finalizar')
      .setStyle(ButtonStyle.Danger)
  );

  await chat.send({ embeds: [embed], components: [row] });
}

client.login(process.env.TOKEN);