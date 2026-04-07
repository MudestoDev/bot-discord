if (interaction.isButton()) {

  // =========================
  // 🎫 TICKET
  // =========================

  if (interaction.customId === 'criar_ticket') {
    // seu código aqui
  }

  if (interaction.customId === 'fechar_ticket') {
    const modal = new ModalBuilder()
      .setCustomId('modal_fechar_ticket')
      .setTitle('Fechar Ticket');

    const motivo = new TextInputBuilder()
      .setCustomId('motivo')
      .setLabel('Motivo do fechamento')
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const row = new ActionRowBuilder().addComponents(motivo);
    modal.addComponents(row);

    return interaction.showModal(modal);
  }

  // =========================
  // 🎮 FILA
  // =========================

  if (!interaction.customId || !interaction.customId.startsWith('fila_')) return;

  const partes = interaction.customId.split('_');
  const action = partes[1];
  const id = partes[2];

  const fila = filas.get(id);
  if (!fila) {
    return interaction.reply({ content: '❌ Fila não encontrada.', flags: 64 });
  }

  const userId = interaction.user.id;

  // =========================
  // 🎯 AÇÕES
  // =========================

  if (action === 'entrar') {
    if (fila.jogadores.includes(userId)) {
      return interaction.reply({ content: '⚠️ Você já está na fila.', flags: 64 });
    }

    if (fila.jogadores.length >= fila.tamanho) {
      return interaction.reply({ content: '❌ Fila já está cheia.', flags: 64 });
    }

    fila.jogadores.push(userId);
  }

  if (action === 'sair') {
    fila.jogadores = fila.jogadores.filter(u => u !== userId);
  }

  if (action === 'start') {
    if (fila.jogadores.length < fila.tamanho) {
      return interaction.reply({ content: '❌ Fila ainda não está cheia.', flags: 64 });
    }

    await interaction.deferUpdate(); // 🔥 evita erro de interação
    await iniciarFila(interaction, fila, id);
    return;
  }

  if (action === 'end') {
    const canais = interaction.guild.channels.cache.filter(c =>
      c.name.startsWith(`fila-${id}`)
    );

    for (const canal of canais.values()) {
      await canal.delete().catch(() => {});
    }

    filas.delete(id);

    return interaction.reply({
      content: '✅ Fila finalizada e removida.',
      flags: 64
    });
  }

  // =========================
  // 🔄 ATUALIZAR EMBED
  // =========================

  const lista = fila.jogadores.length
    ? fila.jogadores.map(id => `<@${id}>`).join('\n')
    : 'Nenhum jogador';

  const embed = EmbedBuilder.from(interaction.message.embeds[0])
    .setFields({
      name: `👥 Jogadores (${fila.jogadores.length}/${fila.tamanho})`,
      value: lista
    });

  await interaction.update({ embeds: [embed] });

  // =========================
  // ⏱️ AUTO START
  // =========================

  if (fila.jogadores.length === fila.tamanho) {

    setTimeout(async () => {
      try {
        const filaAtual = filas.get(id);
        if (!filaAtual) return;

        await iniciarFila(interaction, filaAtual, id);
      } catch (err) {
        console.error('Erro no auto start:', err);
      }
    }, 10000);
  }
}