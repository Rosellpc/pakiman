const VENCE_A = { FUEGO: 'TIERRA', AGUA: 'FUEGO', TIERRA: 'AGUA' }

// Reglas puras: no dependen del navegador ni de la conexión.
export function resolverCombate(ataquesJugador, ataquesEnemigo) {
  if (ataquesJugador.length !== 5 || ataquesEnemigo.length !== 5 ||
      [...ataquesJugador, ...ataquesEnemigo].some(a => !Object.hasOwn(VENCE_A, a))) {
    throw new Error('El combate requiere cinco ataques válidos por jugador.')
  }
  let victoriasJugador = 0
  let victoriasEnemigo = 0
  const rondas = ataquesJugador.map((jugador, index) => {
    const enemigo = ataquesEnemigo[index]
    const resultado = jugador === enemigo ? 'empate' : VENCE_A[jugador] === enemigo ? 'jugador' : 'enemigo'
    if (resultado === 'jugador') victoriasJugador++
    if (resultado === 'enemigo') victoriasEnemigo++
    return { jugador, enemigo, resultado }
  })
  const ganador = victoriasJugador === victoriasEnemigo ? 'empate' :
    victoriasJugador > victoriasEnemigo ? 'jugador' : 'enemigo'
  return { rondas, victoriasJugador, victoriasEnemigo, ganador }
}
