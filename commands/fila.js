const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle
} = require('discord.js');

const fs = require('fs');

// 📂 CONTADOR PERSISTENTE
let contadorData = JSON.parse(fs.readFileSync('./filaCount.json', 'utf-8'));

// 🧠 FILAS EM MEMÓRIA
const filas = new Map();

// 🔒 CARGOS PERMITIDOS
const CARGOS_PERMITIDOS = [
  '1490523988747878401',
  '1487970426222018592',
  '1487970427329577021'
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fila')
    .setDescription('Criar fila')
    .addStringOption(opt =>
      opt.setName('modo')
        .setDescription('Modo da fila')
        .setRequired(true)
        .addChoices(
          { name: '1v1', value: '1v1' },
          { name: '2v2', value: '2v2' },
          { name: '3v3', value: '3v3' },
          { name: '4v4', value: '4v4' }
        ))
    .addIntegerOption(opt =>
      opt.setName('valor')
        .setDescription('Valor da partida')
        .setRequired(true)),

  async execute(interaction) {

    // =========================
    // 🔒 PERMISSÃO POR CARGO
    // =========================
    if (!interaction.member.roles.cache.some(role => CARGOS_PERMITIDOS.includes(role.id))) {
      return interaction.reply({
        content: '❌ Você não tem permissão para usar este comando.',
        flags: 64
      });
    }

    const modo = interaction.options.getString('modo');
    const valor = interaction.options.getInteger('valor');

    const tamanho = parseInt(modo.split('v')[0]) * 2;

    // =========================
    // 🔢 ID SEQUENCIAL
    // =========================
    const idFila = String(contadorData.contador).padStart(3, '0');

    contadorData.contador++;
    if (contadorData.contador > 999) contadorData.contador = 1;

    fs.writeFileSync('./filaCount.json', JSON.stringify(contadorData, null, 2));

    // =========================
    // 🧠 SALVAR FILA
    // =========================
    filas.set(idFila, {
      jogadores: [],
      modo,
      valor,
      tamanho,
      criador: interaction.user.id
    });

 // =========================
// 🎯 SLOTS VISUAIS
// =========================
let slots = [];

for (let i = 0; i < tamanho; i++) {
  slots.push(`\`${i + 1}.\` Vazio`);
}

const lista = slots.join('\n');

// =========================
// 🎨 EMBED
// =========================
const embed = new EmbedBuilder()
  .setColor(0x5865F2)
  .setTitle(`🎮 Fila ${idFila}`)
  .setDescription(
    `🎯 **Modo:** ${modo}\n` +
    `💰 **Valor:** R$${valor}`
  )
  .addFields({
    name: `👥 Jogadores (0/${tamanho})`,
    value: lista
  })
  .setFooter({
    text: `Criado por ${interaction.user.username}`,
    iconURL: interaction.user.displayAvatarURL()
  });

    // =========================
    // 🔘 BOTÕES
    // =========================
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

    // =========================
    // ✅ RESPOSTA (UMA SÓ)
    // =========================
        const msg = await interaction.reply({
        embeds: [embed],
        components: [row],
        fetchReply: true
        });

        filas.get(idFila).messageId = msg.id;
        filas.get(idFila).channelId = msg.channel.id;
  }
};

// 🔥 EXPORTA FILAS PRO INDEX
module.exports.filas = filas;