const { test } = require('node:test')
const assert = require('node:assert/strict')
const { app, jugadores, limpiarJugadores } = require('../index')

test('API: enemigos válidos, ataques independientes y limpieza de sesiones', async () => {
  const server = app.listen(0)
  await new Promise(resolve => server.once('listening', resolve))
  const base = `http://127.0.0.1:${server.address().port}`
  const request = (route, body) => fetch(base + route, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  })
  try {
    const pagina = await request('/pakiman.html')
    assert.match(await pagina.text(), /type="module" src="\.\/JS\/main\.mjs"/)
    for (const archivo of ['main', 'juego', 'vista', 'api', 'mapa', 'controles', 'datos', 'combate', 'sincronizacion']) {
      const modulo = await request(`/JS/${archivo}.mjs`)
      assert.equal(modulo.status, 200)
      assert.match(modulo.headers.get('content-type'), /javascript/)
    }
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

test('Almacenamiento: sesiones aisladas y expiración con reloj controlado', () => {
  const { crearAlmacenJugadores } = require('../server/jugadores')
  const { crearApp } = require('../server/app')
  let tiempo = 0
  const almacen = crearAlmacenJugadores({ ahora: () => tiempo })
  const jugador = almacen.crear()
  assert.equal(almacen.buscar(jugador.id), jugador)
  assert.equal(crearApp().almacen.buscar(jugador.id), undefined)
  tiempo = 20000
  almacen.actualizarActividad(jugador)
  tiempo = 40000
  assert.equal(almacen.buscar(jugador.id), jugador)
  tiempo = 51000
  assert.equal(almacen.buscar(jugador.id), undefined)
})
