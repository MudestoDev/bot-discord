const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const fs = require('fs');

let contadorData = JSON.parse(fs.readFileSync('./filaCount.json', 'utf-8'));

const filas = new Map();
const CARGOS_PERMITIDOS = [
  '1490523988747878401', // ID do cargo 1
  '1487970426222018592', // ID do cargo 2
  '1487970427329577021'  // ID do cargo 3
];
let contadorFila = 1;

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

    if (!interaction.member.roles.cache.some(role => CARGOS_PERMITIDOS.includes(role.id))) {
  return interaction.reply({
    content: '❌ Você não tem permissão para usar este comando.',
    flags: 64
  });
}

    const modo = interaction.options.getString('modo');
    const valor = interaction.options.getInteger('valor');

    const tamanho = parseInt(modo.split('v')[0]) * 2;

const idFila = String(contadorData.contador).padStart(3, '0');

contadorData.contador++;

fs.writeFileSync('./filaCount.json', JSON.stringify(contadorData, null, 2));

    filas.set(idFila, {
      jogadores: [],
      modo,
      valor,
      tamanho,
      criador: interaction.user.id 
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