const { test } = require('node:test')
const assert = require('node:assert/strict')

test('Combate: todas las reglas, cinco rondas y resultado final', async () => {
  const { resolverCombate } = await import('../public/JS/combate.mjs')
  for (const [ganador, perdedor] of [['AGUA', 'FUEGO'], ['FUEGO', 'TIERRA'], ['TIERRA', 'AGUA']]) {
    assert.equal(resolverCombate(Array(5).fill(ganador), Array(5).fill(perdedor)).victoriasJugador, 5)
    const derrota = resolverCombate(Array(5).fill(perdedor), Array(5).fill(ganador))
    assert.equal(derrota.victoriasEnemigo, 5)
    assert.equal(derrota.rondas.length, 5)
    assert.equal(derrota.ganador, 'enemigo')
  }
  assert.equal(resolverCombate(Array(5).fill('AGUA'), Array(5).fill('AGUA')).ganador, 'empate')
  assert.throws(() => resolverCombate([], []))
})

test('Mapa: límites, velocidad diagonal, colisiones y enemigos incompletos', async () => {
  const { crearBestia, moverBestia, hayColision, actualizarEnemigos } = await import('../public/JS/mapa.mjs')
  const { PAKIMANES } = await import('../public/JS/datos.mjs')
  const bestia = crearBestia(PAKIMANES[0])
  Object.assign(bestia, { x: 720, y: 520 })
  moverBestia(bestia, new Set(['derecha', 'abajo']), .05)
  assert.equal(bestia.x, 720)
  assert.equal(bestia.y, 520)
  Object.assign(bestia, { x: 0, y: 0 })
  moverBestia(bestia, new Set(['izquierda', 'arriba']), .05)
  assert.equal(bestia.x, 0)
  assert.equal(bestia.y, 0)
  moverBestia(bestia, new Set(['derecha', 'abajo']), .05)
  assert.ok(Math.abs(Math.hypot(bestia.x, bestia.y) - 5) < .001)
  assert.equal(hayColision(bestia, { ...bestia }), true)
  assert.equal(hayColision(bestia, { ...bestia, x: 300 }), false)
  const datos = [
    { id: 'sin-bestia', x: 0, y: 0 },
    { id: 'sin-posicion', pakiman: { nombre: 'Suytun' } },
    { id: 'valido', pakiman: { nombre: 'Katybara' }, x: 5, y: 6 }
  ]
  const enemigos = actualizarEnemigos(datos)
  assert.equal(enemigos.length, 1)
  assert.equal(enemigos[0].id, 'valido')
  assert.equal(actualizarEnemigos(datos, enemigos)[0], enemigos[0])
})

test('API: consulta al rival y conserva el estado HTTP de errores', async () => {
  const { crearApi } = await import('../public/JS/api.mjs')
  const api = crearApi({ fetchImpl: async (ruta, opciones) => {
    assert.equal(ruta, '/pakiman/rival/ataques')
    assert.equal(opciones.method, 'GET')
    return { ok: true, status: 200, text: async () => '{"ataques":["TIERRA"]}' }
  } })
  assert.deepEqual(await api.obtenerAtaques('rival'), { ataques: ['TIERRA'] })
  const errorApi = crearApi({ fetchImpl: async () => ({ ok: false, status: 404 }) })
  await assert.rejects(errorApi.obtenerAtaques('ausente'), { status: 404 })
})

test('Sincronización: espera las peticiones y no reprograma al detenerse', async () => {
  const { crearSincronizacion } = await import('../public/JS/sincronizacion.mjs')
  let resolver
  let programadas = 0
  const peticion = new Promise(resolve => { resolver = resolve })
  const ciclo = crearSincronizacion(() => peticion, () => 150, {
    programar() { programadas++ }, cancelar() {}
  })
  ciclo.iniciar()
  ciclo.iniciar()
  assert.equal(programadas, 0)
  resolver()
  await peticion
  await Promise.resolve()
  assert.equal(programadas, 1)
  let resolverOtra
  const otra = new Promise(resolve => { resolverOtra = resolve })
  const detenido = crearSincronizacion(() => otra, () => 150, {
    programar() { programadas++ }, cancelar() {}
  })
  detenido.iniciar()
  detenido.detener()
  resolverOtra()
  await otra
  await Promise.resolve()
  assert.equal(programadas, 1)
})

function eventoTarget() {
  const listeners = new Map()
  return {
    addEventListener(evento, handler) {
      if (!listeners.has(evento)) listeners.set(evento, new Set())
      listeners.get(evento).add(handler)
    },
    removeEventListener(evento, handler) { listeners.get(evento)?.delete(handler) },
    emitir(evento, datos = {}) { listeners.get(evento)?.forEach(handler => handler(datos)) }
  }
}

test('Vista: una derrota muestra cinco rondas y permite reiniciar', async () => {
  const { crearVista } = await import('../public/JS/vista.mjs')
  const { resolverCombate } = await import('../public/JS/combate.mjs')
  const elementos = new Map()
  const elemento = () => Object.assign(eventoTarget(), {
    style: {}, children: [], textContent: '',
    appendChild(child) { this.children.push(child) },
    replaceChildren() { this.children = [] },
    querySelectorAll() { return this.children },
    setAttribute() {}
  })
  const documento = {
    getElementById(id) {
      if (!elementos.has(id)) elementos.set(id, elemento())
      return elementos.get(id)
    },
    createElement: elemento
  }
  const vista = crearVista(documento)
  const derrota = resolverCombate(Array(5).fill('AGUA'), Array(5).fill('TIERRA'))
  vista.mostrarResultado(derrota)
  assert.equal(elementos.get('ataque-del-jugador').children.length, 5)
  assert.equal(elementos.get('ataque-del-enemigo').children.length, 5)
  assert.equal(elementos.get('vidas-enemigo').textContent, 5)
  assert.equal(elementos.get('reiniciar').style.display, 'block')
  // Repetir el render no duplica el historial.
  vista.mostrarResultado(derrota)
  assert.equal(elementos.get('ataque-del-jugador').children.length, 5)
})

test('Controles: teclado, pérdida de foco, punteros y limpieza de listeners', async () => {
  const { crearControles } = await import('../public/JS/controles.mjs')
  const ventana = eventoTarget()
  const boton = Object.assign(eventoTarget(), { dataset: { direccion: 'arriba' }, setPointerCapture() {} })
  const documento = Object.assign(eventoTarget(), { querySelectorAll: () => [boton] })
  let habilitado = true
  const controles = crearControles({ ventana, documento, habilitado: () => habilitado })
  ventana.emitir('keydown', { key: 'ArrowRight', preventDefault() {} })
  assert.equal(controles.direcciones().has('derecha'), true)
  ventana.emitir('blur')
  assert.equal(controles.direcciones().size, 0)
  boton.emitir('pointerdown', { pointerId: 1, preventDefault() {} })
  assert.equal(controles.direcciones().has('arriba'), true)
  boton.emitir('pointercancel', { pointerId: 1 })
  assert.equal(controles.direcciones().size, 0)
  habilitado = false
  ventana.emitir('keydown', { key: 'ArrowRight', preventDefault() {} })
  assert.equal(controles.direcciones().size, 0)
  controles.destruir()
  habilitado = true
  ventana.emitir('keydown', { key: 'ArrowRight', preventDefault() {} })
  assert.equal(controles.direcciones().size, 0)
})

test('Juego: confirma conexión y selección, envía ataques y consulta al rival una vez', async () => {
  const { crearJuego } = await import('../public/JS/juego.mjs')
  let resolverConexion, resolverSeleccion
  let callbacks, atacar, siguiente
  let habilitada, pantalla, resultado, inicios = 0, consultas = 0
  const conexion = new Promise(resolve => { resolverConexion = resolve })
  const seleccion = new Promise(resolve => { resolverSeleccion = resolve })
  const api = {
    unirse: () => conexion,
    seleccionar: (id, nombre) => { assert.equal(id, 'propio'); assert.equal(nombre, 'Suytun'); return seleccion },
    enviarAtaques: async (id, ataques) => { assert.equal(id, 'propio'); assert.equal(ataques.length, 5) },
    latido: async () => {},
    obtenerAtaques: async id => { consultas++; assert.equal(id, 'rival'); return { ataques: Array(5).fill('TIERRA') } },
    salir() {}
  }
  const vista = {
    iniciar(datos, acciones) { callbacks = acciones },
    habilitarSeleccion(valor) { habilitada = valor },
    mostrarEstado() {}, limpiarReintento() {},
    bestiaSeleccionada: () => 'Suytun',
    prepararJugador(bestia, accion) { atacar = accion },
    mostrarPantalla(valor) { pantalla = valor },
    mostrarRival() {},
    mostrarResultado(valor) { resultado = valor }
  }
  const mapa = { iniciar() { inicios++ }, detener() {} }
  const juego = crearJuego({ api, vista, mapa, opcionesSincronizacion: {
    programar(fn) { siguiente = fn }, cancelar() {}
  } })
  juego.iniciar()
  assert.equal(habilitada, false)
  resolverConexion('propio')
  await conexion
  await Promise.resolve()
  assert.equal(habilitada, true)
  const confirmacion = callbacks.seleccionar()
  assert.equal(habilitada, false)
  assert.equal(inicios, 0)
  resolverSeleccion()
  await confirmacion
  assert.equal(pantalla, 'mapa')
  assert.equal(inicios, 1)
  juego.colisionar({ id: 'rival', nombre: 'Katybara' })
  assert.equal(juego.estado, 'combate')
  for (let i = 0; i < 5; i++) assert.equal(atacar('AGUA'), true)
  await Promise.resolve()
  assert.equal(juego.estado, 'esperando')
  await siguiente()
  assert.equal(consultas, 1)
  assert.equal(resultado.victoriasEnemigo, 5)
  assert.equal(resultado.rondas.length, 5)
  assert.equal(juego.estado, 'terminado')
  await siguiente()
  assert.equal(consultas, 1)
  juego.salir()
})
