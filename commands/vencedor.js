const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vencedor')
    .setDescription('Registrar vencedores')
    .addUserOption(opt =>
      opt.setName('jogador1').setDescription('Jogador 1').setRequired(true))
    .addUserOption(opt =>
      opt.setName('jogador2').setDescription('Jogador 2'))
    .addUserOption(opt =>
      opt.setName('jogador3').setDescription('Jogador 3'))
    .addUserOption(opt =>
      opt.setName('jogador4').setDescription('Jogador 4')),

  async execute(interaction) {

    const caminho = './ranking.json';

    let ranking = {};

    if (fs.existsSync(caminho)) {
      ranking = JSON.parse(fs.readFileSync(caminho, 'utf-8'));
    }

    // ✅ AGORA ESTÁ NO LUGAR CERTO
    const jogadores = [
      interaction.options.getUser('jogador1'),
      interaction.options.getUser('jogador2'),
      interaction.options.getUser('jogador3'),
      interaction.options.getUser('jogador4')
    ].filter(Boolean);

    for (const user of jogadores) {
      if (!ranking[user.id]) {
        ranking[user.id] = 0;
      }

      ranking[user.id] += 1;
    }

    fs.writeFileSync(caminho, JSON.stringify(ranking, null, 2));

const embed = new EmbedBuilder()
  .setColor(0x57F287)
  .setTitle('🏆 Vitória Registrada')
  .setDescription(`Vitória adicionada para:\n${jogadores.map(j => `<@${j.id}>`).join('\n')}`)
  .setTimestamp();

return interaction.reply({
  embeds: [embed]
})}}