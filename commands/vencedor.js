const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../database');
const { verificarCargo } = require('../utils/rankingHelper');
const { RANKING_CARGOS } = require('../config');

const { CARGOS_PERMITIDOS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vencedor')
    .setDescription('Registrar vencedores')

    .addUserOption(opt =>
      opt.setName('jogador1')
        .setDescription('Jogador 1') // ✅ obrigatório
        .setRequired(true)
    )

    .addUserOption(opt =>
      opt.setName('jogador2')
        .setDescription('Jogador 2') // ✅ obrigatório
    )

    .addUserOption(opt =>
      opt.setName('jogador3')
        .setDescription('Jogador 3') // ✅ obrigatório
    )

    .addUserOption(opt =>
      opt.setName('jogador4')
        .setDescription('Jogador 4') // ✅ obrigatório
    ),

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
          await verificarCargo(member, wins, RANKING_CARGOS);

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('🏆 Vitória Registrada')
      .setDescription(
        `Vitória adicionada para:\n\n${jogadores.map(j => `👤 <@${j.id}>`).join('\n')}`
      )
      .setTimestamp();


    return interaction.reply({ embeds: [embed] });
  }
};