const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const pool = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('remvitoria')
    .setDescription('Remover vitórias (ranking geral)')
    
    .addUserOption(opt =>
      opt.setName('jogador')
        .setDescription('Jogador')
        .setRequired(true)
    )

    .addIntegerOption(opt =>
      opt.setName('quantidade')
        .setDescription('Quantidade de vitórias a remover')
    ),

  async execute(interaction) {

    if (!interaction.member.roles.cache.some(role => CARGOS_PERMITIDOS.includes(role.id))) {
  return interaction.reply({
    content: '❌ Você não tem permissão.',
    flags: 64
  });
}

    const user = interaction.options.getUser('jogador');
    const qtd = interaction.options.getInteger('quantidade') || 1;

    await pool.query(`
      UPDATE ranking
      SET wins = GREATEST(wins - $2, 0)
      WHERE user_id = $1
    `, [user.id, qtd]);

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('➖ Vitória Removida')
      .setDescription(`Removido **${qtd}** vitória(s) de:\n👤 <@${user.id}>`)
      .setTimestamp();

    return interaction.reply({ embeds: [embed] });
  }
};