if (interaction.isButton()) {

  // =========================
  // 🎫 TICKET
  // =========================

  if (interaction.customId === 'criar_ticket') {
    // (SEU CÓDIGO DE TICKET - PODE MANTER)
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

  if (interaction.customId.startsWith('fila_')) {

    const [_, action, id] = interaction.customId.split('_');
    const fila = filas.get(id);

    if (!fila) return;

    const userId = interaction.user.id;

    // ENTRAR
    if (action === 'entrar') {
      if (fila.jogadores.includes(userId))
        return interaction.reply({ content: 'Já está na fila', flags: 64 });

      if (fila.jogadores.length >= fila.tamanho)
        return interaction.reply({ content: 'Fila cheia', flags: 64 });

      fila.jogadores.push(userId);
    }

    // SAIR
    if (action === 'sair') {
      fila.jogadores = fila.jogadores.filter(u => u !== userId);
    }

    // START
    if (action === 'start') {
      if (fila.jogadores.length < fila.tamanho)
        return interaction.reply({ content: 'Fila não está cheia', flags: 64 });

      await iniciarFila(interaction, fila, id);
      return;
    }

    // FINALIZAR
    if (action === 'end') {
      const canais = interaction.guild.channels.cache.filter(c =>
        c.name.startsWith(`fila-${id}`)
      );

      for (const canal of canais.values()) {
        await canal.delete().catch(() => {});
      }

      return interaction.reply({ content: '✅ Fila finalizada', flags: 64 });
    }

    // UPDATE EMBED
    const lista = fila.jogadores.map(id => `<@${id}>`).join('\n') || 'Vazio';

    const embed = EmbedBuilder.from(interaction.message.embeds[0])
      .setFields({ name: 'Jogadores', value: lista });

    await interaction.update({ embeds: [embed] });

    // AUTO START
    if (fila.jogadores.length === fila.tamanho) {
      setTimeout(() => iniciarFila(interaction, fila, id), 10000);
    }
  }
}