const { crearApp } = require('./server/app')

const { app, almacen } = crearApp()

if (require.main === module) {
  const limpieza = setInterval(almacen.limpiar, 5000)
  limpieza.unref()
  app.listen(process.env.PORT || 8080, () => console.log('Servidor funcionando'))
}

module.exports = { app, jugadores: almacen.jugadores, limpiarJugadores: almacen.limpiar }
