const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removercargo')
    .setDescription('Remove um cargo de usuários')
    .addStringOption(option =>
      option.setName('cargo')
        .setDescription('Nome, ID ou menção do cargo (@cargo)')
        .setRequired(true))
    .addUserOption(option => option.setName('usuario1').setDescription('Usuário 1').setRequired(true))
    .addUserOption(option => option.setName('usuario2').setDescription('Usuário 2'))
    .addUserOption(option => option.setName('usuario3').setDescription('Usuário 3'))
    .addUserOption(option => option.setName('usuario4').setDescription('Usuário 4'))
    .addUserOption(option => option.setName('usuario5').setDescription('Usuário 5'))
    .addUserOption(option => option.setName('usuario6').setDescription('Usuário 6'))
    .addUserOption(option => option.setName('usuario7').setDescription('Usuário 7'))
    .addUserOption(option => option.setName('usuario8').setDescription('Usuário 8'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    // 🔥 evita erro 10062
    await interaction.deferReply();

    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.editReply({ content: '❌ Você não tem permissão.' });
    }

    let cargoInput = interaction.options.getString('cargo');

    const match = cargoInput.match(/^<@&(\d+)>$/);
    if (match) cargoInput = match[1];

    const cargo =
      interaction.guild.roles.cache.get(cargoInput) ||
      interaction.guild.roles.cache.find(r => r.name.toLowerCase() === cargoInput.toLowerCase());

    if (!cargo) {
      return interaction.editReply({ content: '❌ Cargo não encontrado.' });
    }

    // 🔒 proteção (cargo acima do bot)
    if (cargo.position >= interaction.guild.members.me.roles.highest.position) {
      return interaction.editReply({
        content: '❌ Não posso gerenciar esse cargo (ele é maior que o meu).'
      });
    }

    const usuarios = [
      interaction.options.getUser('usuario1'),
      interaction.options.getUser('usuario2'),
      interaction.options.getUser('usuario3'),
      interaction.options.getUser('usuario4'),
      interaction.options.getUser('usuario5'),
      interaction.options.getUser('usuario6'),
      interaction.options.getUser('usuario7'),
      interaction.options.getUser('usuario8')
    ].filter(Boolean);

    let sucesso = [];
    let falha = [];

    // ⚡ execução paralela
    await Promise.all(
      usuarios.map(async (user) => {
        try {
          const membro = await interaction.guild.members.fetch(user.id);
          await membro.roles.remove(cargo);
          sucesso.push(user.id);
        } catch {
          falha.push(user.id);
        }
      })
    );

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('🗑️ Cargo Removido')
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .addFields(
        {
          name: '📌 Cargo',
          value: `<@&${cargo.id}>`
        },
        {
          name: '✅ Removido de',
          value: sucesso.length ? sucesso.map(id => `<@${id}>`).join('\n') : 'Nenhum',
          inline: true
        },
        {
          name: '❌ Falhas',
          value: falha.length ? falha.map(id => `<@${id}>`).join('\n') : 'Nenhum',
          inline: true
        }
      )
      .setFooter({
        text: `Executado por ${interaction.user.username}`,
        iconURL: interaction.user.displayAvatarURL()
      })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  }
};
