const {
  SlashCommandBuilder,
  EmbedBuilder
} = require('discord.js');

const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Ver ranking de vitórias'),

  async execute(interaction) {

    const caminho = './ranking.json';

    if (!fs.existsSync(caminho)) {
      return interaction.reply({
        content: '❌ Nenhum ranking encontrado.',
        flags: 64
      });
    }

    const ranking = JSON.parse(fs.readFileSync(caminho, 'utf-8'));

    if (Object.keys(ranking).length === 0) {
      return interaction.reply({
        content: '❌ Ranking vazio.',
        flags: 64
      });
    }

    // ordenar ranking
    const top = Object.entries(ranking)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const lista = top.map(([id, vitorias], i) =>
      `**#${i + 1}** <@${id}> - 🏆 ${vitorias}`
    ).join('\n');

    const embed = new EmbedBuilder()
      .setColor(0xF1C40F)
      .setTitle('🏆 Ranking de Vitórias')
      .setDescription(lista)
      .setTimestamp();

    return interaction.reply({
      embeds: [embed]
    });
  }
};