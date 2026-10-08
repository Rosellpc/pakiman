const express = require('express')
const path = require('node:path')
const { crearAlmacenJugadores } = require('./jugadores')
const { crearRutas } = require('./rutas')

function crearApp({ almacen = crearAlmacenJugadores() } = {}) {
  const app = express()
  app.use(express.json())
  app.use(express.static(path.join(__dirname, '..', 'public')))
  app.get('/', (req, res) => res.redirect('/pakiman.html'))
  app.use(crearRutas(almacen))
  return { app, almacen }
}

module.exports = { crearApp }
