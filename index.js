const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType
} = require('discord.js');

const fs = require('fs');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
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

// =========================
// 🚀 INTERAÇÕES
// =========================
client.on(Events.InteractionCreate, async interaction => {

  // =========================
  // 🔘 BOTÕES
  // =========================
  if (interaction.isButton()) {

    // =========================
    // 🎫 TICKET
    // =========================
    if (interaction.customId === 'criar_ticket') {

      const guild = interaction.guild;
      const user = interaction.user;

      const nomeCanal = `ticket-${user.id}`;

      // ❌ evita duplicado
      const existente = guild.channels.cache.find(c => c.name === nomeCanal);

      if (existente) {
        return interaction.reply({
          content: '❌ Você já tem um ticket aberto.',
          flags: 64
        });
      }

      const canal = await guild.channels.create({
        name: nomeCanal,
        type: ChannelType.GuildText,
        permissionOverwrites: [
          {
            id: guild.id,
            deny: ['ViewChannel']
          },
          {
            id: user.id,
            allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
          }
        ]
      });

      await canal.send(`🎫 Olá ${user}, descreva seu problema.`);

      return interaction.reply({
        content: `✅ Ticket criado: ${canal}`,
        flags: 64
      });
    }

    // =========================
    // 🎮 FILA
    // =========================
    if (interaction.customId.startsWith('fila_')) {

      const [_, action, id] = interaction.customId.split('_');
      const fila = filas.get(id);

      if (!fila) {
        return interaction.reply({ content: '❌ Fila não encontrada.', flags: 64 });
      }

      const userId = interaction.user.id;

      // ➕ ENTRAR
      if (action === 'entrar') {

        if (fila.jogadores.includes(userId)) {
          return interaction.reply({ content: 'Já está na fila', flags: 64 });
        }

        if (fila.jogadores.length >= fila.tamanho) {
          return interaction.reply({ content: 'Fila cheia', flags: 64 });
        }

        fila.jogadores.push(userId);
      }

      // ➖ SAIR
      if (action === 'sair') {
        fila.jogadores = fila.jogadores.filter(u => u !== userId);
      }

      // ▶ START
      if (action === 'start') {

        if (interaction.user.id !== fila.criador) {
          return interaction.reply({
            content: '❌ Apenas o criador pode iniciar.',
            flags: 64
          });
        }

        if (fila.jogadores.length < fila.tamanho) {
          return interaction.reply({
            content: 'Fila não está cheia.',
            flags: 64
          });
        }

        await interaction.deferUpdate();
        await iniciarFila(interaction.guild, fila, id);
        return;
      }

      // 🛑 FINALIZAR
      if (action === 'end') {

        console.log(
          `Fila(${id}) - JogadoresID:${fila.jogadores.join(',')} - Finalizada por ${interaction.user.id}`
        );

        const canais = interaction.guild.channels.cache.filter(c =>
          c.name.includes(id)
        );

        await interaction.channel.send('⚠️ Esta fila será apagada em 10 segundos...');

        setTimeout(async () => {
          for (const canal of canais.values()) {
            await canal.delete().catch(() => {});
          }
          filas.delete(id);
        }, 10000);

        return interaction.reply({
          content: '✅ Fila finalizada',
          flags: 64
        });
      }

      // 📊 ATUALIZA EMBED
      let slots = [];

      for (let i = 0; i < fila.tamanho; i++) {
        if (fila.jogadores[i]) {
          slots.push(`\`${i + 1}.\` <@${fila.jogadores[i]}>`);
        } else {
          slots.push(`\`${i + 1}.\` Vazio`);
        }
      }

      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setFields([{
          name: `👥 Jogadores (${fila.jogadores.length}/${fila.tamanho})`,
          value: slots.join('\n')
        }]);

      await interaction.update({ embeds: [embed] });

      // ⏱ AUTO START
      if (fila.jogadores.length === fila.tamanho && !fila.iniciada) {
        fila.iniciada = true;

        setTimeout(() => {
          iniciarFila(interaction.guild, fila, id).catch(console.error);
        }, 10000);
      }
    }
  }

  // =========================
  // 💬 SLASH COMMANDS
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
// 🚀 INICIAR FILA
// =========================
async function iniciarFila(guild, fila, id) {

  if (fila.iniciadaExecutada) return;
  fila.iniciadaExecutada = true;

  const jogadores = fila.jogadores;

  console.log(
    `Fila(${id}) - JogadoresID:${jogadores.join(',')} - Iniciada por ${fila.criador}`
  );

  const categoria = '1490917601524842528';

  const chat = await guild.channels.create({
    name: `Chat-Fila-${id}`,
    type: ChannelType.GuildText,
    parent: categoria
  });

  const call1 = await guild.channels.create({
    name: `${id}-Call-1`,
    type: ChannelType.GuildVoice,
    parent: categoria
  });

  const call2 = await guild.channels.create({
    name: `${id}-Call-2`,
    type: ChannelType.GuildVoice,
    parent: categoria
  });

  await chat.permissionOverwrites.set([
    { id: guild.id, deny: ['ViewChannel'] },
    ...jogadores.map(id => ({
      id,
      allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
    }))
  ]);

  let toggle = true;

  for (const idUser of jogadores) {
    const member = await guild.members.fetch(idUser).catch(() => null);

    if (member?.voice.channel) {
      await member.voice.setChannel(toggle ? call1 : call2).catch(() => {});
      toggle = !toggle;
    }
  }

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle(`🔥 Fila ${id}`)
    .setDescription(
      `🎮 **Modo:** ${fila.modo}\n` +
      `💰 **Valor:** R$${fila.valor}\n\n` +
      `👥 **Jogadores:**\n${jogadores.map(id => `<@${id}>`).join('\n')}`
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fila_end_${id}`)
      .setLabel('Finalizar')
      .setStyle(ButtonStyle.Danger)
  );

  await chat.send({ embeds: [embed], components: [row] });
}

// 🔒 segurança
process.on('unhandledRejection', console.error);
process.on('uncaughtException', console.error);

client.login(process.env.TOKEN);