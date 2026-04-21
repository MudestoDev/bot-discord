const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../database');
const { CARGOS_PERMITIDOS } = require('../config');       
const { RANKING_FEM_CARGOS } = require('../config');
const { verificarCargo } = require('../utils/rankingHelper');;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vencedorfem')
    .setDescription('Registrar vencedores femininos') // ✅ OBRIGATÓRIO

    .addUserOption(opt =>
      opt.setName('jogador1')
        .setDescription('Jogador 1') // ✅
        .setRequired(true)
    )

    .addUserOption(opt =>
      opt.setName('jogador2')
        .setDescription('Jogador 2') // ✅
    )

    .addUserOption(opt =>
      opt.setName('jogador3')
        .setDescription('Jogador 3') // ✅
    )

    .addUserOption(opt =>
      opt.setName('jogador4')
        .setDescription('Jogador 4') // ✅
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
        INSERT INTO ranking_fem (user_id, wins)
        VALUES ($1, 1)
        ON CONFLICT (user_id)
        DO UPDATE SET wins = ranking_fem.wins + 1
      `, [user.id]);
    }

    await verificarCargo(member, wins, RANKING_CARGOS);

    const embed = new EmbedBuilder()
      .setColor(0xFF69B4)
      .setTitle('🏆 Vitória Feminina Registrada')
      .setDescription(jogadores.map(j => `<@${j.id}>`).join('\n'))
      .setTimestamp();

      

    return interaction.reply({ embeds: [embed] });
  }
};