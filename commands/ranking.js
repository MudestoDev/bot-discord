const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const pool = require('../database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ranking')
    .setDescription('Ver ranking'),

  async execute(interaction) {

    const res = await pool.query(`
      SELECT * FROM ranking
      ORDER BY wins DESC
    `);

    if (res.rows.length === 0) {
      return interaction.reply('❌ Ranking vazio.');
    }

    let pagina = 0;
    const porPagina = 10;

    const gerarEmbed = (pagina) => {

      const inicio = pagina * porPagina;
      const fim = inicio + porPagina;

      const slice = res.rows.slice(inicio, fim);

      const lista = slice.map((r, i) => {
        const pos = inicio + i + 1;

        let medalha = '🏅';
        if (pos === 1) medalha = '🥇';
        if (pos === 2) medalha = '🥈';
        if (pos === 3) medalha = '🥉';

        return `**#${pos}** ${medalha} <@${r.user_id}> — 🏆 **${r.wins}**`;
      }).join('\n');

      return new EmbedBuilder()
        .setColor('#FF4DA6') // 💖 ROSA
        .setTitle('💖 Ranking2')
        .setDescription(lista)
        .setFooter({
          text: `Página ${pagina + 1} de ${Math.ceil(res.rows.length / porPagina)}`
        });
    };

    const gerarBotoes = () => {
      return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('rank_prev')
          .setLabel('⬅️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(pagina === 0),

        new ButtonBuilder()
          .setCustomId('rank_next')
          .setLabel('➡️')
          .setStyle(ButtonStyle.Secondary)
          .setDisabled((pagina + 1) * porPagina >= res.rows.length)
      );
    };

    await interaction.reply({
      embeds: [gerarEmbed(pagina)],
      components: [gerarBotoes()]
    });

    const msg = await interaction.fetchReply();

    const collector = msg.createMessageComponentCollector({
      time: 60000
    });

    collector.on('collect', async i => {

      if (i.user.id !== interaction.user.id) {
        return i.reply({
          content: '❌ Apenas quem executou pode usar.',
          flags: 64
        });
      }

      if (i.customId === 'rank_next') pagina++;
      if (i.customId === 'rank_prev') pagina--;

      await i.update({
        embeds: [gerarEmbed(pagina)],
        components: [gerarBotoes()]
      });
    });

    collector.on('end', async () => {
      await msg.edit({
        components: []
      }).catch(() => {});
    });
  }
};