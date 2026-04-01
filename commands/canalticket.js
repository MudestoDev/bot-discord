const {
  SlashCommandBuilder,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('canalticket')
    .setDescription('Envia o painel de tickets')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0x5865F2)                                                   
      .setTitle('🎫 Sistema de Tickets')
      .setDescription('Clique no botão abaixo para abrir um ticket.')
      .setFooter({
        text: `Sistema de suporte`,
        iconURL: interaction.guild.iconURL()
      });

    const button = new ButtonBuilder()
      .setCustomId('criar_ticket')
      .setLabel('Criar Ticket')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('🎫');

    const row = new ActionRowBuilder().addComponents(button);

    return interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};