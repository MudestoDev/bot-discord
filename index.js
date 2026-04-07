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

// =========================
// 🚀 INTERAÇÕES
// =========================
client.on(Events.InteractionCreate, async interaction => {

  // =========================
  // 🔘 BOTÕES
  // =========================
  if (interaction.isButton()) {

    // 🎮 FILA
    if (interaction.customId && interaction.customId.startsWith('fila_')) {

      const [_, action, id] = interaction.customId.split('_');
      const fila = filas.get(id);

      if (!fila) {
        return interaction.reply({ content: '❌ Fila não encontrada.', flags: 64 });
      }

      const userId = interaction.user.id;

      // =========================
      // 🔴 CONFIRMAR FINALIZAÇÃO
      // =========================
      if (action === 'confirm') {
        return interaction.reply({
          content: '⚠️ Tem certeza que deseja finalizar?',
          components: [
            new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId(`fila_end_${id}`)
                .setLabel('Confirmar')
                .setStyle(ButtonStyle.Danger),

              new ButtonBuilder()
                .setCustomId(`fila_cancel_${id}`)
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
            )
          ],
          flags: 64
        });
      }

      if (action === 'cancel') {
        return interaction.update({
          content: '❌ Cancelado.',
          components: []
        });
      }

      // =========================
      // ➕ ENTRAR
      // =========================
if (action === 'entrar') {

  if (fila.jogadores.includes(userId)) {
    return interaction.reply({
      content: '❌ Você já está na fila.',
      flags: 64
    });
  }

  if (fila.jogadores.length >= fila.tamanho) {
    return interaction.reply({
      content: '❌ Fila cheia.',
      flags: 64
    });
  }

  fila.jogadores.push(userId);
}

      // =========================
      // ➖ SAIR
      // =========================
      if (action === 'sair') {
        fila.jogadores = fila.jogadores.filter(u => u !== userId);
      }

      // =========================
      // ▶ START (APENAS CRIADOR)
      // =========================
      if (action === 'start') {

        if (interaction.user.id !== fila.criador) {
          return interaction.reply({
            content: '❌ Apenas quem criou a fila pode iniciar.',
            flags: 64
          });
        }

        if (fila.jogadores.length < fila.tamanho)
          return interaction.reply({ content: 'Fila não está cheia', flags: 64 });

        await interaction.deferUpdate();
        await iniciarFila(interaction.guild, fila, id);
        return;
      }

      // =========================
      // 🛑 FINALIZAR
      // =========================
if (action === 'end') {

  const canais = interaction.guild.channels.cache.filter(c =>
    c.name.startsWith(`Chat-Fila-${id}`) ||
    c.name.startsWith(`${id}-Call`)
  );

  // ✅ mensagem pública no chat
  await interaction.channel.send({
    content: `⚠️ A fila **${id}** foi finalizada.\n🗑️ Os canais serão apagados em 10 segundos...`
  });

  // ✅ resposta privada pra quem clicou
  await interaction.reply({
    content: '✅ Fila finalizada com sucesso.',
    flags: 64
  });

  // ⏳ delay antes de apagar
  setTimeout(async () => {

    for (const canal of canais.values()) {
      await canal.delete().catch(() => {});
    }

    filas.delete(id);

  }, 10000);

  return;
}
      // =========================
      // 📊 ATUALIZAR SLOTS
      // =========================
      let slots = [];

      for (let i = 0; i < fila.tamanho; i++) {
        if (fila.jogadores[i]) {
          slots.push(`\`${i + 1}.\` <@${fila.jogadores[i]}>`);
        } else {
          slots.push(`\`${i + 1}.\` Vazio`);
        }
      }

      const embed = EmbedBuilder.from(interaction.message.embeds[0])
        .setFields({
          name: `👥 Jogadores (${fila.jogadores.length}/${fila.tamanho})`,
          value: slots.join('\n')
        });

      await interaction.update({ embeds: [embed] });

      // =========================
      // ⏱ AUTO START
      // =========================
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
// 🚀 FUNÇÃO INICIAR FILA
// =========================
async function iniciarFila(guild, fila, id) {
const canalFila = await guild.channels.fetch(fila.channelId).catch(() => null);

if (canalFila) {
  const mensagem = await canalFila.messages.fetch(fila.messageId).catch(() => null);

  if (mensagem) {
    const rowDesativada = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('fila_locked')
        .setLabel('Entrar')
        .setStyle(ButtonStyle.Success)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId('fila_locked')
        .setLabel('Sair')
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(true),

      new ButtonBuilder()
        .setCustomId('fila_locked')
        .setLabel('Iniciar')
        .setStyle(ButtonStyle.Danger)
        .setDisabled(true)
    );

    await mensagem.edit({
      components: [rowDesativada]
    });
  }
}
  if (fila.iniciadaExecutada) return;
  fila.iniciadaExecutada = true;

  const jogadores = fila.jogadores;
  const categoria = '1490917601524842528';

  // 📁 CRIA CANAIS
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

  // 🔐 PERMISSÕES
  await chat.permissionOverwrites.set([
    {
      id: guild.id,
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

  // 🔊 MOVER PRA CALL
  let toggle = true;

  for (const idUser of jogadores) {
    const member = await guild.members.fetch(idUser).catch(() => null);

    if (member?.voice.channel) {
      await member.voice.setChannel(toggle ? call1 : call2);
      toggle = !toggle;
    }
  }

  // 📢 MENSAGEM FINAL
  const embed = new EmbedBuilder()
    .setColor(0x57F287)
    .setTitle(`🔥 Fila ${id}`)
    .setDescription(
      `🎮 **Modo:** ${fila.modo}\n` +
      `💰 **Valor:** R$${fila.valor}\n\n` +
      `👥 **Jogadores:**\n${jogadores.map(id => `<@${id}>`).join('\n')}`
    )
    .setFooter({ text: 'Partida iniciada' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fila_confirm_${id}`)
      .setLabel('Finalizar')
      .setStyle(ButtonStyle.Danger)
  );

  await chat.send({ embeds: [embed], components: [row] });
}

client.login(process.env.TOKEN);