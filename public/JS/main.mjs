import { crearApi } from './api.mjs'
import { crearControles } from './controles.mjs'
import { crearMapa } from './mapa.mjs'
import { crearVista } from './vista.mjs'
import { crearJuego } from './juego.mjs'

const vista = crearVista()
let juego
const controles = crearControles({ habilitado: () => juego?.estado === 'mapa' })
const mapa = crearMapa(vista.canvas, controles, enemigo => juego.colisionar(enemigo))
juego = crearJuego({ api: crearApi(), vista, mapa })
juego.iniciar()

window.addEventListener('pagehide', () => {
  juego.salir()
  controles.destruir()
  vista.destruir()
})
window.addEventListener('pageshow', e => { if (e.persisted) location.reload() })
