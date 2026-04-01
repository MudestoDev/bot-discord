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
  TextInputStyle
} = require('discord.js');

const fs = require('fs');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

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

      const nomeCanal = `ticket-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9-]/g, '');

      const existente = interaction.guild.channels.cache.find(c => c.name === nomeCanal);
      if (existente) {
        return interaction.reply({
          content: '❌ Você já tem um ticket aberto.',
          flags: 64
        });
      }

      try {
        const canal = await interaction.guild.channels.create({
          name: nomeCanal,
          type: 0,
          parent: interaction.channel.parentId || '1487970461466759248',
          permissionOverwrites: [
            {
              id: interaction.guild.id,
              deny: ['ViewChannel']
            },
            {
              id: interaction.user.id,
              allow: ['ViewChannel', 'SendMessages']
            }
          ]
        });

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
        console.error(err);
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