const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Ver ranking'),

  async execute(interaction) {

    const res = await pool.query(`
      SELECT * FROM ranking
      ORDER BY wins DESC
      LIMIT 10
    `);

    if (res.rows.length === 0) {
      return interaction.reply('❌ Ranking vazio.');
    }

    const lista = res.rows.map((r, i) =>
      `**#${i + 1}** <@${r.user_id}> - 🏆 ${r.wins}`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('🏆 Ranking')
      .setDescription(lista);

    return interaction.reply({ embeds: [embed] });
  }
};