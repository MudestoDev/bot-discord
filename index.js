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

// 🚀 INTERAÇÕES
client.on(Events.InteractionCreate, async interaction => {

  // =========================
  // 🔘 BOTÕES
  // =========================
  if (interaction.isButton()) {

    // 🎫 CRIAR TICKET
 if (interaction.customId === 'criar_ticket') {

  const nomeCanal = `ticket-${interaction.user.username}`
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '');

  const existente = interaction.guild.channels.cache.find(c => c.name === nomeCanal);
  if (existente) {
    return interaction.reply({
      content: '❌ Você já tem um ticket aberto.',
      flags: 64
    });
  }

  try {
    // 🔥 define categoria corretamente
        const categoriaId = interaction.channel.parentId ?? '1487970461466759248';

        const canal = await interaction.guild.channels.create({
          name: nomeCanal,
          type: ChannelType.GuildText
        });

        // 🔥 move pra categoria
        await canal.setParent(categoriaId, { lockPermissions: false });

        // 🔥 AGORA define permissões (depois de mover!)
        await canal.permissionOverwrites.set([
          {
            id: interaction.guild.id,
            deny: ['ViewChannel']
          },
          {
            id: interaction.user.id,
            allow: [
              'ViewChannel',
              'SendMessages',
              'AttachFiles',
              'EmbedLinks',
              'ReadMessageHistory'
            ]
          }
        ]);


    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('🎫 Ticket criado')
      .setDescription(`Olá <@${interaction.user.id}>, aguarde atendimento.`)
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('fechar_ticket')
        .setLabel('Fechar Ticket')
        .setStyle(ButtonStyle.Danger)
        .setEmoji('🔒')
    );

    // ✅ garante envio com botão
    await canal.send({
      embeds: [embed],
      components: [row]
    });

    return interaction.reply({
      content: `✅ Ticket criado: ${canal}`,
      flags: 64
    });

  } catch (err) {
    console.error('ERRO AO CRIAR TICKET:', err);

    return interaction.reply({
      content: '❌ Erro ao criar ticket.',
      flags: 64
    });
  }
}

    // 🔒 BOTÃO FECHAR
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
  }

  // =========================
  // 📝 MODAL (FECHAR TICKET)
  // =========================
  if (interaction.isModalSubmit()) {

    if (interaction.customId === 'modal_fechar_ticket') {

      const motivo = interaction.fields.getTextInputValue('motivo');

      const canalLog = interaction.guild.channels.cache.get('1488735992126111804'); // 🔥 ALTERAR

      const mensagens = await interaction.channel.messages.fetch({ limit: 100 });

      const transcript = mensagens
        .map(m => `[${m.author.tag}] ${m.content}`)
        .reverse()
        .join('\n');

      const embed = new EmbedBuilder()
        .setColor(0xED4245)
        .setTitle('📁 Ticket Fechado')
        .addFields(
          { name: '👤 Usuário', value: `<@${interaction.user.id}>` },
          { name: '📝 Motivo', value: motivo }
        )
        .setTimestamp();

      if (canalLog) {
        await canalLog.send({
          embeds: [embed],
          content: `\`\`\`\n${transcript || 'Sem mensagens'}\n\`\`\``
        });
      }

      await interaction.reply({
        content: '🔒 Ticket será fechado...',
        flags: 64
      });

      setTimeout(() => {
        interaction.channel.delete().catch(() => {});
      }, 3000);
    }
  }

  if (interaction.isButton()) {

  if (interaction.customId.startsWith('fila_')) {

    const [_, action, id] = interaction.customId.split('_');
    const fila = filas.get(id);

    if (!fila) return;

    const userId = interaction.user.id;

    // ENTRAR
    if (action === 'entrar') {
      if (fila.jogadores.includes(userId)) return interaction.reply({ content: 'Já está na fila', flags: 64 });

      if (fila.jogadores.length >= fila.tamanho)
        return interaction.reply({ content: 'Fila cheia', flags: 64 });

      fila.jogadores.push(userId);
    }

    // SAIR
    if (action === 'sair') {
      fila.jogadores = fila.jogadores.filter(u => u !== userId);
    }

    // START
    if (action === 'start') {
      if (fila.jogadores.length < fila.tamanho)
        return interaction.reply({ content: 'Fila não está cheia', flags: 64 });

      await iniciarFila(interaction, fila, id);
      return;
    }

    // UPDATE EMBED
    const lista = fila.jogadores.map(id => `<@${id}>`).join('\n') || 'Vazio';

    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .setFields({ name: 'Jogadores', value: lista });

    await interaction.update({ embeds: [embed] });

    // AUTO START
    if (fila.jogadores.length === fila.tamanho) {
      setTimeout(() => iniciarFila(interaction, fila, id), 10000);
    }
  }
}

async function iniciarFila(interaction, fila, id) {

  const jogadores = fila.jogadores;

  const categoria = '1490917601524842528';

  const chat = await interaction.guild.channels.create({
    name: `fila-${id}-chat`,
    type: 0,
    parent: categoria
  });

  const call1 = await interaction.guild.channels.create({
    name: `fila-${id}-call1`,
    type: 2,
    parent: categoria
  });

  const call2 = await interaction.guild.channels.create({
    name: `fila-${id}-call2`,
    type: 2,
    parent: categoria
  });

    // PERMISSÕES
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

  // MOVER PRA CALL
  for (const idUser of time1) {
    const member = await interaction.guild.members.fetch(idUser).catch(() => null);
    if (member?.voice.channel) member.voice.setChannel(call1);
  }

  for (const idUser of time2) {
    const member = await interaction.guild.members.fetch(idUser).catch(() => null);
    if (member?.voice.channel) member.voice.setChannel(call2);
  }

  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle(`🔥 Fila ${id} iniciada`)
    .setDescription(jogadores.map(id => `<@${id}>`).join('\n'))
    .setFooter({ text: 'Todos os jogadores liberados nas calls' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fila_end_${id}`)
      .setLabel('Finalizar')
      .setStyle(ButtonStyle.Danger)
  );

  await chat.send({ embeds: [embed], components: [row] });
}

if (interaction.customId.startsWith('fila_end_')) {

  const id = interaction.customId.split('_')[2];

  const canalLog = interaction.guild.channels.cache.get('ID_LOG');

  if (canalLog) {
    await canalLog.send(`Fila ${id} finalizada`);
  }

  await interaction.channel.delete();
}

  // =========================
  // 💬 SLASH COMMANDS
  // =========================
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  console.log(`📌 Comando executado: ${interaction.commandName} por ${interaction.user.tag}`);

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);

    if (interaction.replied || interaction.deferred) {
      await interaction.editReply({
        content: '❌ Ocorreu um erro ao executar este comando.'
      });
    } else {
      await interaction.reply({
        content: '❌ Ocorreu um erro ao executar este comando.',
        flags: 64
      });
    }
  }
});

client.login(process.env.TOKEN);