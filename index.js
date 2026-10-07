const express = require('express')
const { randomUUID } = require('node:crypto')
const path = require('node:path')
const app = express()
const jugadores = new Map()
const TIEMPO_DESCONEXION = 30000
app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))
app.get('/', (req, res) => res.redirect('/pakiman.html'))
function limpiarJugadores() {
  for (const [id, jugador] of jugadores) {
    if (Date.now() - jugador.ultimaActividad > TIEMPO_DESCONEXION) jugadores.delete(id)
  }
}
app.get('/unirse', (req, res) => {
  limpiarJugadores()
  const id = randomUUID()
  jugadores.set(id, { id, ataques: [], ultimaActividad: Date.now() })
  res.set('Cache-Control', 'no-store').send(id)
})
app.use('/pakiman/:jugadorId', (req, res, next) => {
  limpiarJugadores()
  const jugador = jugadores.get(req.params.jugadorId)
  if (!jugador) return res.status(404).json({ error: 'Jugador desconectado o inexistente.' })
  req.jugador = jugador
  // Consultar al rival no mantiene viva su sesión.
  if (req.method === 'POST') jugador.ultimaActividad = Date.now()
  res.set('Cache-Control', 'no-store')
  next()
})
app.post('/pakiman/:jugadorId', (req, res) => {
  const nombre = req.body.pakiman
  if (!['Suytun', 'Ratulia', 'Katybara'].includes(nombre)) return res.status(400).json({ error: 'Bestia inválida.' })
  req.jugador.pakiman = { nombre }
  res.sendStatus(204)
})
app.post('/pakiman/:jugadorId/posicion', (req, res) => {
  const { x, y } = req.body
  if (!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || y < 0) return res.status(400).json({ error: 'Posición inválida.' })
  Object.assign(req.jugador, { x, y })
  const enemigos = [...jugadores.values()]
    .filter(j => j.id !== req.jugador.id && j.pakiman && Number.isFinite(j.x) && Number.isFinite(j.y))
    .map(({ id, pakiman, x, y }) => ({ id, pakiman, x, y }))
  res.json({ enemigos })
})
app.post('/pakiman/:jugadorId/latido', (req, res) => res.sendStatus(204))
app.post('/pakiman/:jugadorId/salir', (req, res) => {
  jugadores.delete(req.jugador.id)
  res.sendStatus(204)
})
app.post('/pakiman/:jugadorId/ataques', (req, res) => {
  const { ataques } = req.body
  if (!Array.isArray(ataques) || ataques.length !== 5 || ataques.some(a => !['AGUA', 'FUEGO', 'TIERRA'].includes(a))) return res.status(400).json({ error: 'Selecciona cinco ataques válidos.' })
  req.jugador.ataques = ataques
  res.sendStatus(204)
})
app.get('/pakiman/:jugadorId/ataques', (req, res) => res.json({ ataques: req.jugador.ataques }))
const limpieza = setInterval(limpiarJugadores, 5000)
limpieza.unref()
if (require.main === module) app.listen(process.env.PORT || 8080, () => console.log('Servidor funcionando'))
module.exports = { app, jugadores, limpiarJugadores }
