import { ICONOS } from './datos.mjs'

// Toda manipulación del DOM se concentra en esta vista.
export function crearVista(documento = document) {
  const elemento = id => documento.getElementById(id)
  const seleccion = elemento('seleccionar-bestia')
  const mapa = elemento('ver-mapa')
  const combate = elemento('seleccionar-ataque')
  const reiniciar = elemento('reiniciar')
  const ataques = elemento('contenedorAtaques')
  const reintentar = elemento('reintentar')
  const listeners = []
  let accionReintento
  function escuchar(target, handler) {
    target.addEventListener('click', handler)
    listeners.push(() => target.removeEventListener('click', handler))
  }
  function mostrarPantalla(pantalla) {
    seleccion.style.display = pantalla === 'seleccion' ? 'flex' : 'none'
    mapa.style.display = pantalla === 'mapa' ? 'flex' : 'none'
    combate.style.display = pantalla === 'combate' ? 'flex' : 'none'
  }
  function mostrarEstado(mensaje) { elemento('estado-conexion').textContent = mensaje }
  function limpiarReintento() { reintentar.hidden = true; accionReintento = null }
  return {
    canvas: elemento('mapa'),
    mostrarEstado,
    mostrarPantalla,
    limpiarReintento,
    habilitarSeleccion(habilitado) { elemento('button-bestia').disabled = !habilitado },
    bestiaSeleccionada: () => documento.querySelector('input[name="bestia"]:checked')?.id,
    ofrecerReintento(error, accion) {
      mostrarEstado(error.message)
      accionReintento = accion
      reintentar.hidden = false
    },
    iniciar(pakimanes, { seleccionar, reiniciar: alReiniciar }) {
      mostrarPantalla('seleccion')
      reiniciar.style.display = 'none'
      elemento('contenedorTarjetas').innerHTML = pakimanes.map(p =>
        `<input type="radio" name="bestia" id="${p.nombre}" /><label class="tarjeta-de-pakiman" for="${p.nombre}"><p>${p.nombre}</p><img src="${p.foto}" alt="${p.nombre}"></label>`).join('')
      escuchar(elemento('button-bestia'), seleccionar)
      escuchar(elemento('button-reiniciar'), alReiniciar)
      escuchar(reintentar, () => {
        const accion = accionReintento
        limpiarReintento()
        accion?.()
      })
    },
    prepararJugador(bestia, alAtacar) {
      elemento('bestia-jugador').textContent = bestia.nombre
      ataques.replaceChildren()
      bestia.ataques.forEach((ataque, index) => {
        const button = documento.createElement('button')
        button.id = `ataque-${index}`
        button.className = 'button-de-ataque BAtaque'
        button.textContent = ICONOS[ataque]
        button.setAttribute('aria-label', ataque)
        button.addEventListener('click', () => {
          if (!button.disabled && alAtacar(ataque)) button.disabled = true
        })
        ataques.appendChild(button)
      })
    },
    mostrarRival(enemigo) {
      mostrarPantalla('combate')
      elemento('bestia-enemigo').textContent = enemigo.nombre
      mostrarEstado('Elige tus cinco ataques.')
    },
    mostrarResultado(resultado) {
      const jugador = elemento('ataque-del-jugador')
      const enemigo = elemento('ataque-del-enemigo')
      jugador.replaceChildren()
      enemigo.replaceChildren()
      resultado.rondas.forEach(ronda => {
        for (const [target, ataque] of [[jugador, ronda.jugador], [enemigo, ronda.enemigo]]) {
          const p = documento.createElement('p')
          p.textContent = ataque
          target.appendChild(p)
        }
      })
      elemento('vidas-jugador').textContent = resultado.victoriasJugador
      elemento('vidas-enemigo').textContent = resultado.victoriasEnemigo
      const mensajes = { empate: 'EMPATASTE, ESFUERZATE MÁS', jugador: '¡FELICITACIONES! GANASTE, BRO :(', enemigo: 'PERDISTE CON EL REY' }
      elemento('resultado').textContent = mensajes[resultado.ganador]
      reiniciar.style.display = 'block'
      mostrarEstado('Partida terminada.')
    },
    mostrarDesconexion(mensaje) {
      mostrarPantalla('combate')
      limpiarReintento()
      reiniciar.style.display = 'block'
      elemento('resultado').textContent = mensaje
      ataques.querySelectorAll('button').forEach(b => { b.disabled = true })
      mostrarEstado(mensaje)
    },
    destruir() { listeners.forEach(quitar => quitar()); limpiarReintento() }
  }
}
