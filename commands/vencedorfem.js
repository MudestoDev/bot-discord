const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../database');
const { CARGOS_PERMITIDOS, RANKING_FEM_CARGOS } = require('../config');
const { verificarCargo } = require('../utils/rankingHelper');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vencedorfem')
    .setDescription('Registrar vencedores femininos')

    .addUserOption(opt =>
      opt.setName('jogador1')
        .setDescription('Jogador 1')
        .setRequired(true)
    )

    .addUserOption(opt =>
      opt.setName('jogador2')
        .setDescription('Jogador 2')
    )

    .addUserOption(opt =>
      opt.setName('jogador3')
        .setDescription('Jogador 3')
    )

    .addUserOption(opt =>
      opt.setName('jogador4')
        .setDescription('Jogador 4')
    ),

  async execute(interaction) {

    try {

      // 🔒 PERMISSÃO
      if (!interaction.member.roles.cache.some(role =>
        CARGOS_PERMITIDOS.includes(role.id)
      )) {
        return interaction.reply({
          content: '❌ Você não tem permissão.',
          flags: 64
        });
      }

      const jogadores = [
        interaction.options.getUser('jogador1'),
        interaction.options.getUser('jogador2'),
        interaction.options.getUser('jogador3'),
        interaction.options.getUser('jogador4')
      ].filter(Boolean);

      for (const user of jogadores) {

        // ➕ adiciona vitória
        await pool.query(`
          INSERT INTO ranking_fem (user_id, wins)
          VALUES ($1, 1)
          ON CONFLICT (user_id)
          DO UPDATE SET wins = ranking_fem.wins + 1
        `, [user.id]);

        // 🔎 pega wins atualizado
        const res = await pool.query(`
          SELECT wins FROM ranking_fem WHERE user_id = $1
        `, [user.id]);

        const wins = res.rows[0].wins;

        // 👤 pega membro
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) continue;

        // 🎖 verifica cargo FEMININO
        await verificarCargo(member, wins, RANKING_FEM_CARGOS);
      }

      const embed = new EmbedBuilder()
        .setColor(0xFF69B4)
        .setTitle('🏆 Vitória Feminina Registrada')
        .setDescription(
          `Vitória adicionada para:\n\n${jogadores.map(j => `👤 <@${j.id}>`).join('\n')}`
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error('ERRO /vencedorfem:', err);

      return interaction.reply({
        content: '❌ Erro ao registrar vitória feminina.',
        flags: 64
      });
    }
  }
};