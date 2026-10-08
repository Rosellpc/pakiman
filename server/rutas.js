const { Router } = require('express')

function crearRutas(almacen) {
  const router = Router()
  router.get('/unirse', (req, res) => {
    res.set('Cache-Control', 'no-store').send(almacen.crear().id)
  })
  router.use('/pakiman/:jugadorId', (req, res, next) => {
    const jugador = almacen.buscar(req.params.jugadorId)
    if (!jugador) return res.status(404).json({ error: 'Jugador desconectado o inexistente.' })
    req.jugador = jugador
    // Consultar al rival no mantiene viva su sesión.
    if (req.method === 'POST') almacen.actualizarActividad(jugador)
    res.set('Cache-Control', 'no-store')
    next()
  })
  router.post('/pakiman/:jugadorId', (req, res) => {
    const nombre = req.body?.pakiman
    if (!['Suytun', 'Ratulia', 'Katybara'].includes(nombre)) {
      return res.status(400).json({ error: 'Bestia inválida.' })
    }
    req.jugador.pakiman = { nombre }
    res.sendStatus(204)
  })
  router.post('/pakiman/:jugadorId/posicion', (req, res) => {
    const { x, y } = req.body || {}
    if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) {
      return res.status(400).json({ error: 'Posición inválida.' })
    }
    Object.assign(req.jugador, { x, y })
    res.json({ enemigos: almacen.enemigos(req.jugador.id) })
  })
  router.post('/pakiman/:jugadorId/latido', (req, res) => res.sendStatus(204))
  router.post('/pakiman/:jugadorId/salir', (req, res) => {
    almacen.eliminar(req.jugador.id)
    res.sendStatus(204)
  })
  router.post('/pakiman/:jugadorId/ataques', (req, res) => {
    const ataques = req.body?.ataques
    if (!Array.isArray(ataques) || ataques.length !== 5 ||
        ataques.some(a => !['AGUA', 'FUEGO', 'TIERRA'].includes(a))) {
      return res.status(400).json({ error: 'Selecciona cinco ataques válidos.' })
    }
    req.jugador.ataques = ataques
    res.sendStatus(204)
  })
  router.get('/pakiman/:jugadorId/ataques', (req, res) => res.json({ ataques: req.jugador.ataques }))
  return router
}

module.exports = { crearRutas }
