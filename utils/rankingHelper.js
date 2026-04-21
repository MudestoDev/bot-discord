async function verificarCargo(member, wins, cargosConfig) {

  for (const vitoria in cargosConfig) {

    if (wins >= vitoria) {

      const cargoId = cargosConfig[vitoria];

      if (!member.roles.cache.has(cargoId)) {
        await member.roles.add(cargoId).catch(() => {});
      }
    }
  }
}

module.exports = { verificarCargo }; // 🔥 OBRIGATÓRIO