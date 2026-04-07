const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const filas = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fila')
    .setDescription('Criar fila')
    .addStringOption(opt =>
      opt.setName('modo')
        .setDescription('Modo da fila')
        .setRequired(true)
        .addChoices(
        { name: '1v1', value: '1v1' }, // 👈 NOVO
        { name: '2v2', value: '2v2' },
        { name: '3v3', value: '3v3' },
        { name: '4v4', value: '4v4' }
        ))
    .addIntegerOption(opt =>
      opt.setName('valor')
        .setDescription('Valor da partida')
        .setRequired(true)),

  async execute(interaction) {

    const modo = interaction.options.getString('modo');
    const valor = interaction.options.getInteger('valor');

    const tamanho = parseInt(modo.split('v')[0]) * 2;

    const idFila = Math.floor(Math.random() * 999).toString().padStart(3, '0');

    filas.set(idFila, {
      jogadores: [],
      modo,
      valor,
      tamanho
    });

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`🎮 Fila ${idFila} - ${modo}`)
      .setDescription(`Valor: R$${valor}`)
      .addFields({
        name: 'Jogadores',
        value: 'Vazio'
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`fila_entrar_${idFila}`)
        .setLabel('Entrar')
        .setStyle(ButtonStyle.Success),

      new ButtonBuilder()
        .setCustomId(`fila_sair_${idFila}`)
        .setLabel('Sair')
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setCustomId(`fila_start_${idFila}`)
        .setLabel('Iniciar')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      embeds: [embed],
      components: [row]
    });
  }
};

module.exports.filas = filas;