const { randomUUID } = require('node:crypto')

// El almacenamiento queda aislado para poder sustituirlo por una base de datos.
function crearAlmacenJugadores({ tiempoDesconexion = 30000, ahora = Date.now } = {}) {
  const jugadores = new Map()
  function limpiar() {
    for (const [id, jugador] of jugadores) {
      if (ahora() - jugador.ultimaActividad > tiempoDesconexion) jugadores.delete(id)
    }
  }
  return {
    jugadores,
    limpiar,
    crear() {
      limpiar()
      const jugador = { id: randomUUID(), ataques: [], ultimaActividad: ahora() }
      jugadores.set(jugador.id, jugador)
      return jugador
    },
    buscar(id) { limpiar(); return jugadores.get(id) },
    actualizarActividad(jugador) { jugador.ultimaActividad = ahora() },
    eliminar(id) { jugadores.delete(id) },
    enemigos(id) {
      return [...jugadores.values()]
        .filter(j => j.id !== id && j.pakiman && Number.isFinite(j.x) && Number.isFinite(j.y))
        .map(({ id, pakiman, x, y }) => ({ id, pakiman, x, y }))
    }
  }
}

module.exports = { crearAlmacenJugadores }
