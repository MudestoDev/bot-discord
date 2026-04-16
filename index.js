const {
  Client,
  GatewayIntentBits,
  Collection,
  Events,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
   ModalBuilder,
  TextInputBuilder,
  TextInputStyle
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

const CARGOS_PERMITIDOS = [
  '1490523988747878401',
  '1487970426222018592',
  '1487970427329577021'
];

const { filas } = require('./commands/fila');

const caminhoFilas = './filas.json';

if (fs.existsSync(caminhoFilas)) {
  const data = JSON.parse(fs.readFileSync(caminhoFilas, 'utf-8'));

  for (const id in data) {
    filas.set(id, data[id]);
  }

  console.log(`✅ ${Object.keys(data).length} filas carregadas do JSON`);
}

client.commands = new Collection();

// banco de dados

const pool = require('./database');

(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ranking (
      user_id TEXT PRIMARY KEY,
      wins INTEGER DEFAULT 0
    );
  `);
})();

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
// 🎫 CRIAR TICKET
// =========================
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

    const categoriaId = interaction.channel.parentId ?? '1487970461466759248';

    const canal = await interaction.guild.channels.create({
      name: nomeCanal,
      type: ChannelType.GuildText
    });

    await canal.setParent(categoriaId, { lockPermissions: false });

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

// =========================
// 🔒 BOTÃO FECHAR
// =========================
if (interaction.customId === 'fechar_ticket') {

  try {
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

  } catch (err) {
    console.error('ERRO AO ABRIR MODAL:', err);
  }
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

  const member = await interaction.guild.members.fetch(interaction.user.id);
console.log(CARGOS_PERMITIDOS);
  const temPermissao = member.roles.cache.some(role =>
    CARGOS_PERMITIDOS.includes(role.id)
  );

  const ehCriador = interaction.user.id === fila.criador;

  if (!temPermissao && !ehCriador) {
    return interaction.reply({
      content: '❌ Apenas quem criou a fila ou staff pode finalizar.',
      flags: 64
    });
  }

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
// 📝 MODAL (FECHAR TICKET)
// =========================
if (interaction.isModalSubmit()) {

  if (interaction.customId === 'modal_fechar_ticket') {

    await interaction.deferReply({ flags: 64 });

    try {
      const motivo = interaction.fields.getTextInputValue('motivo');

      const canalLog = interaction.guild.channels.cache.get('1488735992126111804');

      let transcript = 'Sem mensagens';

      try {
        const mensagens = await interaction.channel.messages.fetch({ limit: 50 });

        transcript = mensagens
          .map(m => `[${m.author.tag}] ${m.content}`)
          .reverse()
          .join('\n') || 'Sem mensagens';

      } catch (err) {
        console.error('Erro ao pegar mensagens:', err);
      }

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
          content: `\`\`\`\n${transcript}\n\`\`\``
        });
      }

      await interaction.editReply({
        content: '🔒 Ticket será fechado...'
      });

      setTimeout(() => {
        interaction.channel.delete().catch(console.error);
      }, 3000);

    } catch (err) {
      console.error('ERRO NO MODAL:', err);

      await interaction.editReply({
        content: '❌ Erro ao fechar ticket.'
      });
    }
  }
}
  // =========================
  // 💬 SLASH COMMANDS
  // =========================
  if (!interaction.isChatInputCommand()) return;

// 🔒 PERMISSÃO GLOBAL
const member = await interaction.guild.members.fetch(interaction.user.id);

const temPermissao = member.roles.cache.some(role =>
  CARGOS_PERMITIDOS.includes(role.id)
);

// 🔓 comandos liberados (opcional)
const comandosLiberados = ['ranking'];

if (!temPermissao && !comandosLiberados.includes(interaction.commandName)) {
  return interaction.reply({
    content: '❌ Você não tem permissão para usar este comando.',
    flags: 64
  });
}

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

async function iniciarFila(guild, fila, id) {

  if (fila.iniciadaExecutada) return;
  fila.iniciadaExecutada = true;

  const jogadores = fila.jogadores;

  console.log(
    `Fila(${id}) - JogadoresID:${jogadores.join(',')} - Iniciada por ${fila.criador}`
  );

  // =========================
  // 🔒 DESATIVAR BOTÕES DA FILA ORIGINAL
  // =========================
  const canalFila = await guild.channels.fetch(fila.channelId).catch(() => null);

  if (canalFila) {
    const mensagem = await canalFila.messages.fetch(fila.messageId).catch(() => null);

    if (mensagem) {
      const rowDesativada = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`fila_locked_entrar_${id}`)
          .setLabel('Entrar 🔒')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),

        new ButtonBuilder()
          .setCustomId(`fila_locked_sair_${id}`)
          .setLabel('Sair 🔒')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),

        new ButtonBuilder()
          .setCustomId(`fila_locked_start_${id}`)
          .setLabel('Iniciada 🔒')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true)
      );

      await mensagem.edit({
        components: [rowDesativada]
      }).catch(console.error);
    }
  }

  // =========================
  // 📁 CRIAR CANAIS
  // =========================

  let categoria = '1490917601524842528'; // padrão

if (fila.tipo === 'masc') {
  categoria = '1492266829513490623';
}

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

  // =========================
// 🔐 PERMISSÕES NAS CALLS
// =========================
const permissoesCall = [
  {
    id: guild.id,
    deny: ['ViewChannel']
  },
  {
    id: '1490523988747878401', // 👈 STAFF
    allow: ['ViewChannel', 'Connect', 'Speak', 'Stream']
  },
    {
    id: '1494092806937907371', // 👈 STAFF
    allow: ['ViewChannel', 'Connect', 'Speak', 'Stream']
  },
    {
    id: '1487970442760425552', // 👈 STAFF
    allow: ['ViewChannel', 'Connect', 'Speak', 'Stream']
  },
  ...jogadores.map(id => ({
    id,
    allow: ['ViewChannel', 'Connect', 'Speak', 'Stream']
  }))
];

// aplica nas duas calls
await call1.permissionOverwrites.set(permissoesCall);
await call2.permissionOverwrites.set(permissoesCall);

  // =========================
  // 🔐 PERMISSÕES
  // =========================
  await chat.permissionOverwrites.set([
    {
      id: guild.id,
      deny: ['ViewChannel']
    },
    {
      id: '1490523988747878401', // 👈 STAFF
      allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
    },
    ...jogadores.map(id => ({
      id,
      allow: ['ViewChannel', 'SendMessages', 'ReadMessageHistory']
    }))
  ]);

  // =========================
  // 📩 MENSAGEM DO CHAT
  // =========================
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