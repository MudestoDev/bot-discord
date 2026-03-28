const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('adicionarcargo')
    .setDescription('Adiciona um cargo a usuários')
    .addStringOption(option =>
      option.setName('cargo')
        .setDescription('Nome, ID ou menção do cargo (@cargo)')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('usuario1')
        .setDescription('Usuário 1')
        .setRequired(true))
    .addUserOption(option =>
      option.setName('usuario2')
        .setDescription('Usuário 2'))
    .addUserOption(option =>
      option.setName('usuario3')
        .setDescription('Usuário 3'))
    .addUserOption(option =>
      option.setName('usuario4')
        .setDescription('Usuário 4'))
    .addUserOption(option =>
      option.setName('usuario5')
        .setDescription('Usuário 5'))
    .addUserOption(option =>
      option.setName('usuario6')
        .setDescription('Usuário 6'))
    .addUserOption(option =>
      option.setName('usuario7')
        .setDescription('Usuário 7'))
    .addUserOption(option =>
      option.setName('usuario8')
        .setDescription('Usuário 8'))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return interaction.reply({ content: '❌ Você não tem permissão.', flags: 64 });
    }

    let cargoInput = interaction.options.getString('cargo');

    const match = cargoInput.match(/^<@&(\d+)>$/);
    if (match) cargoInput = match[1];

    const cargo =
      interaction.guild.roles.cache.get(cargoInput) ||
      interaction.guild.roles.cache.find(r => r.name.toLowerCase() === cargoInput.toLowerCase());

    if (!cargo) {
      return interaction.reply({ content: '❌ Cargo não encontrado.', flags: 64 });
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

    for (const user of usuarios) {
      try {
        const membro = await interaction.guild.members.fetch(user.id);
        await membro.roles.add(cargo);
        sucesso.push(user.id); // ✅ usar ID
      } catch {
        falha.push(user.id);
      }
    }

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle(' ➕ Cargo Adicionado')
      .setThumbnail(interaction.guild.iconURL({ dynamic: true }))
      .addFields(
        {
          name: '📌 Cargo',
          value: `<@&${cargo.id}>`
        },
        {
          name: '✅ Sucesso',
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

    // ✅ ESSENCIAL (isso resolve seu erro)
    return interaction.reply({ embeds: [embed] });
  }
};