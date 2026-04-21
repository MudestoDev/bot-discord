const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../database');
const { verificarCargo } = require('../utils/rankingHelper');
const { RANKING_CARGOS, CARGOS_PERMITIDOS } = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vencedor')
    .setDescription('Registrar vencedores')

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
          INSERT INTO ranking (user_id, wins)
          VALUES ($1, 1)
          ON CONFLICT (user_id)
          DO UPDATE SET wins = ranking.wins + 1
        `, [user.id]);

        // 🔎 pega wins atualizado
        const res = await pool.query(`
          SELECT wins FROM ranking WHERE user_id = $1
        `, [user.id]);

        const wins = res.rows[0].wins;

        // 👤 pega membro
        const member = await interaction.guild.members.fetch(user.id).catch(() => null);
        if (!member) continue;

        // 🎖 verifica cargo
        await verificarCargo(member, wins, RANKING_CARGOS);
        console.log('verificarCargo:', verificarCargo);
      }

      const embed = new EmbedBuilder()
        .setColor(0x57F287)
        .setTitle('🏆 Vitória Registrada')
        .setDescription(
          `Vitória adicionada para:\n\n${jogadores.map(j => `👤 <@${j.id}>`).join('\n')}`
        )
        .setTimestamp();

      return interaction.reply({ embeds: [embed] });

    } catch (err) {
      console.error('ERRO /vencedor:', err);

      return interaction.reply({
        content: '❌ Erro ao registrar vitória.',
        flags: 64
      });
    }
  }
};