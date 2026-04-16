const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vencedor')
    .setDescription('Registrar vencedores')
    .addUserOption(opt => opt.setName('jogador1').setRequired(true))
    .addUserOption(opt => opt.setName('jogador2'))
    .addUserOption(opt => opt.setName('jogador3'))
    .addUserOption(opt => opt.setName('jogador4')),

  async execute(interaction) {

    const jogadores = [
      interaction.options.getUser('jogador1'),
      interaction.options.getUser('jogador2'),
      interaction.options.getUser('jogador3'),
      interaction.options.getUser('jogador4')
    ].filter(Boolean);

    for (const user of jogadores) {
      await pool.query(`
        INSERT INTO ranking (user_id, wins)
        VALUES ($1, 1)
        ON CONFLICT (user_id)
        DO UPDATE SET wins = ranking.wins + 1
      `, [user.id]);
    }

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('🏆 Vitória Registrada')
      .setDescription(jogadores.map(j => `<@${j.id}>`).join('\n'))
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};