const { test } = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const { app, jugadores, limpiarJugadores } = require('../index')

test('API: enemigos válidos, ataques independientes y limpieza de sesiones', async () => {
  const server = app.listen(0)
  await new Promise(resolve => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const request = (route, body) => fetch(base + route, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  })
  try {
    const a = await (await request('/unirse')).text()
    const b = await (await request('/unirse')).text()
    assert.equal((await request('/pakiman/inexistente/ataques')).status, 404)
    await request(`/pakiman/${a}`, { pakiman: 'Suytun' })
    const position = () => request(`/pakiman/${a}/posicion`, { x: 10, y: 10 })
    assert.deepEqual((await (await position()).json()).enemigos, [])
    await request(`/pakiman/${b}`, { pakiman: 'Katybara' })
    assert.deepEqual((await (await position()).json()).enemigos, [])
    await request(`/pakiman/${b}/posicion`, { x: 30, y: 40 })
    assert.equal((await (await position()).json()).enemigos[0].id, b)
    const propios = ['AGUA', 'AGUA', 'AGUA', 'FUEGO', 'TIERRA']
    const rival = ['TIERRA', 'TIERRA', 'TIERRA', 'AGUA', 'FUEGO']
    await request(`/pakiman/${a}/ataques`, { ataques: propios })
    await request(`/pakiman/${b}/ataques`, { ataques: rival })
    assert.deepEqual((await (await request(`/pakiman/${b}/ataques`)).json()).ataques, rival)
    assert.equal((await request(`/pakiman/${a}/posicion`, { x: 'mal', y: 2 })).status, 400)
    jugadores.get(b).ultimaActividad = Date.now() - 31000
    limpiarJugadores()
    assert.equal((await request(`/pakiman/${b}/ataques`)).status, 404)
    await request(`/pakiman/${a}/salir`, {})
    assert.equal((await request(`/pakiman/${a}/ataques`)).status, 404)
  } finally {
    jugadores.clear()
    await new Promise(resolve => server.close(resolve))
  }
})

function cliente() {
  const elementos = new Map()
  const elemento = () => ({ style: {}, children: [], textContent: '',
    appendChild(child) { this.children.push(child) }, querySelectorAll() { return [] },
    getContext() { return { clearRect() {}, drawImage() {} } }
  })
  const context = vm.createContext({
    document: { getElementById(id) {
      if (!elementos.has(id)) elementos.set(id, elemento())
      return elementos.get(id)
    }, createElement: elemento },
    window: { addEventListener() {} }, Image: class {},
    setTimeout, clearTimeout, AbortController,
    requestAnimationFrame() {}, cancelAnimationFrame() {},
    location: { reload() {} }
  })
  vm.runInContext(fs.readFileSync('public/JS/pakiman.js', 'utf8'), context)
  return { context, elementos, run: code => vm.runInContext(code, context) }
}

test('Cliente: ID rival, combate de cinco rondas y límites del mapa', async () => {
  const { run, elementos } = cliente()
  run("bestiaJugadorObjeto = pakimanes[0]; estado = 'mapa'; revisarColision({id:'rival', nombre:'Katybara', x:bestiaJugadorObjeto.x, y:bestiaJugadorObjeto.y, ancho:80, alto:80})")
  assert.equal(run('enemigoId'), 'rival')
  assert.equal(run('estado'), 'combate')
  run("estado = 'esperando'; ataqueJugador = ['AGUA','AGUA','AGUA','FUEGO','TIERRA']; solicitar = async ruta => { if(ruta !== '/pakiman/rival/ataques') throw Error(ruta); return JSON.stringify({ataques:['TIERRA','TIERRA','TIERRA','AGUA','FUEGO']}) }")
  await run('obtenerAtaques()')
  assert.equal(run('victoriasEnemigo'), 5)
  assert.equal(elementos.get('ataque-del-jugador').children.length, 5)
  assert.equal(elementos.get('reiniciar').style.display, 'block')
  run('combate()')
  assert.equal(elementos.get('ataque-del-jugador').children.length, 5)
  run("estado='mapa'; pakimanesEnemigos=[]; bestiaJugadorObjeto.x=720; bestiaJugadorObjeto.y=520; teclas.add('derecha'); teclas.add('abajo'); ultimoFrame=0; pintarCanvas(50)")
  assert.equal(run('bestiaJugadorObjeto.x'), 720)
  assert.equal(run('bestiaJugadorObjeto.y'), 520)
  run('detenerMovimiento()')
  assert.equal(run('teclas.size'), 0)
})

test('Cliente: descarta enemigos incompletos y conserva objetos existentes', async () => {
  const { run } = cliente()
  run("estado='mapa'; jugadorId='propio'; bestiaJugadorObjeto=pakimanes[0]; solicitar=async () => JSON.stringify({enemigos:[{id:'sin-bestia',x:0,y:0},{id:'sin-posicion',pakiman:{nombre:'Suytun'}},{id:'valido',pakiman:{nombre:'Katybara'},x:5,y:6}]})")
  await run('enviarPosicion()')
  assert.equal(run('pakimanesEnemigos.length'), 1)
  assert.equal(run('pakimanesEnemigos[0].id'), 'valido')
  const anterior = run('pakimanesEnemigos[0]')
  await run('enviarPosicion()')
  assert.equal(run('pakimanesEnemigos[0]'), anterior)
})

test('Cliente: espera confirmación de conexión y selección antes de abrir el mapa', async () => {
  const { context, run, elementos } = cliente()
  let resolver
  context.document.querySelector = () => ({ id: 'Suytun' })
  context.confirmacion = new Promise(resolve => { resolver = resolve })
  run('solicitar = () => confirmacion')
  const conexion = run('unirseAlJuego()')
  assert.equal(elementos.get('button-bestia').disabled, true)
  resolver('jugador-real')
  await conexion
  assert.equal(run('jugadorId'), 'jugador-real')
  assert.equal(elementos.get('button-bestia').disabled, false)
  context.confirmacion = new Promise(resolve => { resolver = resolve })
  // Los botones de ataque no necesitan un DOM completo para esta comprobación.
  run('mostrarAtaques = () => {}')
  const seleccion = run('selecionarBestiaJugador()')
  assert.equal(run('estado'), 'seleccion')
  assert.equal(elementos.get('button-bestia').disabled, true)
  resolver(null)
  await seleccion
  assert.equal(run('estado'), 'mapa')
  assert.equal(elementos.get('ver-mapa').style.display, 'flex')
})

test('Cliente: programa la siguiente sincronización después de finalizar la petición', async () => {
  const { context, run } = cliente()
  let resolver
  let programadas = 0
  context.setTimeout = () => { programadas++ }
  context.peticion = new Promise(resolve => { resolver = resolve })
  run("estado='mapa'; jugadorId='a'; enviarPosicion=() => peticion")
  const sincronizacion = run('sincronizar()')
  assert.equal(programadas, 0)
  resolver()
  await sincronizacion
  assert.equal(programadas, 1)
})
