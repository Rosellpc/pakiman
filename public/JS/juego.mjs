import { PAKIMANES } from './datos.mjs'
import { crearBestia } from './mapa.mjs'
import { resolverCombate } from './combate.mjs'
import { crearSincronizacion } from './sincronizacion.mjs'

// Coordina los módulos; el estado pertenece a cada instancia de juego.
export function crearJuego({ api, vista, mapa, recargar = () => location.reload(), opcionesSincronizacion }) {
  let jugadorId = null
  let enemigoId = null
  let estado = 'conectando'
  let seleccionPendiente = false
  const ataquesJugador = []
  const sincronizacion = crearSincronizacion(sincronizar,
    () => estado === 'mapa' ? 150 : estado === 'esperando' ? 500 : 3000, opcionesSincronizacion)

  function errorDeAccion(error, accion) {
    if (error.status === 404) terminarPorDesconexion(error.message)
    else vista.ofrecerReintento(error, accion)
  }
  async function unirse() {
    vista.habilitarSeleccion(false)
    vista.mostrarEstado('Conectando al servidor...')
    try {
      const id = await api.unirse()
      if (estado === 'terminado') return
      jugadorId = id
      estado = 'seleccion'
      vista.limpiarReintento()
      vista.habilitarSeleccion(true)
      vista.mostrarEstado('Conectado. Elige tu bestia.')
    } catch (error) { errorDeAccion(error, unirse) }
  }
  async function seleccionar() {
    if (estado !== 'seleccion' || seleccionPendiente) return
    const nombre = vista.bestiaSeleccionada()
    const plantilla = PAKIMANES.find(p => p.nombre === nombre)
    if (!plantilla) { vista.mostrarEstado('Selecciona una bestia para continuar.'); return }
    seleccionPendiente = true
    vista.habilitarSeleccion(false)
    vista.mostrarEstado('Confirmando tu bestia...')
    try {
      await api.seleccionar(jugadorId, nombre)
      if (estado === 'terminado') return
      const bestia = crearBestia(plantilla, jugadorId)
      vista.limpiarReintento()
      vista.prepararJugador(bestia, elegirAtaque)
      vista.mostrarPantalla('mapa')
      estado = 'mapa'
      vista.mostrarEstado('Busca un rival en el mapa.')
      mapa.iniciar(bestia)
    } catch (error) { errorDeAccion(error, seleccionar) }
    finally { seleccionPendiente = false; vista.habilitarSeleccion(estado === 'seleccion') }
  }
  function colisionar(enemigo) {
    if (estado !== 'mapa') return
    mapa.detener()
    enemigoId = enemigo.id
    estado = 'combate'
    vista.mostrarRival(enemigo)
  }
  function elegirAtaque(ataque) {
    if (estado !== 'combate' || ataquesJugador.length >= 5) return false
    ataquesJugador.push(ataque)
    vista.mostrarEstado(`Ataques elegidos: ${ataquesJugador.length} de 5.`)
    if (ataquesJugador.length === 5) enviarAtaques()
    return true
  }
  async function enviarAtaques() {
    estado = 'enviando'
    vista.mostrarEstado('Enviando ataques...')
    try {
      await api.enviarAtaques(jugadorId, ataquesJugador)
      if (estado === 'terminado') return
      estado = 'esperando'
      vista.limpiarReintento()
      vista.mostrarEstado('Esperando los ataques del rival...')
    } catch (error) { errorDeAccion(error, enviarAtaques) }
  }
  async function sincronizar() {
    if (!jugadorId || estado === 'terminado') return
    try {
      if (estado === 'mapa') {
        const { enemigos } = await api.posicion(jugadorId, mapa.posicion())
        if (estado !== 'mapa') return
        const cantidad = mapa.actualizarEnemigos(enemigos)
        vista.mostrarEstado(cantidad ? 'Acércate a un rival para combatir.' : 'Esperando que otro jugador entre al mapa...')
      } else {
        await api.latido(jugadorId)
        if (estado !== 'esperando') return
        const { ataques } = await api.obtenerAtaques(enemigoId)
        if (estado === 'esperando' && ataques.length === 5) {
          estado = 'terminado'
          vista.mostrarResultado(resolverCombate(ataquesJugador, ataques))
          // Conserva la sesión con los ataques hasta que el rival termine.
        }
      }
    } catch (error) {
      if (error.status === 404) terminarPorDesconexion('Tu sesión o la del rival terminó. Reinicia para volver a jugar.')
      else vista.mostrarEstado(error.message + ' Reintentando automáticamente...')
    }
  }
  function terminarPorDesconexion(mensaje) {
    estado = 'terminado'
    mapa.detener()
    sincronizacion.detener()
    vista.habilitarSeleccion(false)
    vista.mostrarDesconexion(mensaje)
  }
  function salir() {
    estado = 'terminado'
    mapa.detener()
    sincronizacion.detener()
    if (jugadorId) api.salir(jugadorId)
  }
  return {
    get estado() { return estado },
    iniciar() {
      vista.iniciar(PAKIMANES, { seleccionar, reiniciar: recargar })
      unirse()
      sincronizacion.iniciar()
    },
    colisionar,
    salir
  }
}
