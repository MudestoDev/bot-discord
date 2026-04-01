const { Client, GatewayIntentBits, Collection, Events, EmbedBuilder } = require('discord.js');
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

// 🚀 INTERAÇÕES (COMANDOS + BOTÕES)
client.on(Events.InteractionCreate, async interaction => {

  // =========================
  // 🔘 BOTÕES (TICKET)
  // =========================
  if (interaction.isButton()) {

    if (interaction.customId === 'criar_ticket') {

      const nomeCanal = `ticket-${interaction.user.username}`;

      // ❌ evitar ticket duplicado
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
  parent: '1487970461466759248', // 👈 SUA CATEGORIA
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

        await canal.send({ embeds: [embed] });

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