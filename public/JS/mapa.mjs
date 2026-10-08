import { MUNDO, PAKIMANES } from './datos.mjs'

export function moverBestia(bestia, direcciones, delta) {
  const dx = Number(direcciones.has('derecha')) - Number(direcciones.has('izquierda'))
  const dy = Number(direcciones.has('abajo')) - Number(direcciones.has('arriba'))
  const longitud = Math.hypot(dx, dy) || 1
  bestia.x = Math.max(0, Math.min(MUNDO.ancho - bestia.ancho, bestia.x + dx / longitud * MUNDO.velocidad * delta))
  bestia.y = Math.max(0, Math.min(MUNDO.alto - bestia.alto, bestia.y + dy / longitud * MUNDO.velocidad * delta))
}

export function hayColision(a, b) {
  return !(a.x + a.ancho < b.x || a.x > b.x + b.ancho || a.y + a.alto < b.y || a.y > b.y + b.alto)
}

export function crearBestia(plantilla, id = null) {
  return {
    ...plantilla, id, ancho: MUNDO.tamanoBestia, alto: MUNDO.tamanoBestia,
    x: Math.floor(Math.random() * (MUNDO.ancho - MUNDO.tamanoBestia + 1)),
    y: Math.floor(Math.random() * (MUNDO.alto - MUNDO.tamanoBestia + 1))
  }
}

export function actualizarEnemigos(enemigos, anteriores = []) {
  const porId = new Map(anteriores.map(p => [p.id, p]))
  return enemigos.flatMap(enemigo => {
    const plantilla = PAKIMANES.find(p => p.nombre === enemigo.pakiman?.nombre)
    if (!plantilla || !enemigo.id || !Number.isFinite(enemigo.x) || !Number.isFinite(enemigo.y) || enemigo.x < 0 || enemigo.y < 0) return []
    const bestia = porId.get(enemigo.id) || crearBestia(plantilla, enemigo.id)
    Object.assign(bestia, { x: enemigo.x, y: enemigo.y })
    return [bestia]
  })
}

export function crearMapa(canvas, controles, alColisionar, {
  Imagen = Image, pedirFrame = requestAnimationFrame, cancelarFrame = cancelAnimationFrame
} = {}) {
  const lienzo = canvas.getContext('2d')
  const imagenes = new Map()
  let jugador
  let enemigos = []
  let activo = false
  let animacion
  let ultimoFrame = null
  canvas.width = MUNDO.ancho
  canvas.height = MUNDO.alto
  function imagen(src) {
    if (!imagenes.has(src)) {
      const img = new Imagen()
      img.src = src
      imagenes.set(src, img)
    }
    return imagenes.get(src)
  }
  function dibujar(src, x, y, ancho, alto) {
    const img = imagen(src)
    if (img.complete && img.naturalWidth) lienzo.drawImage(img, x, y, ancho, alto)
  }
  function pintar(tiempo) {
    if (!activo) return
    const delta = ultimoFrame === null ? 0 : Math.min((tiempo - ultimoFrame) / 1000, .05)
    ultimoFrame = tiempo
    moverBestia(jugador, controles.direcciones(), delta)
    lienzo.clearRect(0, 0, canvas.width, canvas.height)
    dibujar('./img/map.webp', 0, 0, canvas.width, canvas.height)
    dibujar(jugador.foto, jugador.x, jugador.y, jugador.ancho, jugador.alto)
    for (const enemigo of enemigos) {
      dibujar(enemigo.foto, enemigo.x, enemigo.y, enemigo.ancho, enemigo.alto)
      if (hayColision(jugador, enemigo)) {
        detener()
        alColisionar(enemigo)
        break
      }
    }
    if (activo) animacion = pedirFrame(pintar)
  }
  function detener() {
    activo = false
    cancelarFrame(animacion)
    controles.detener()
    ultimoFrame = null
  }
  return {
    iniciar(bestia) { detener(); jugador = bestia; enemigos = []; activo = true; animacion = pedirFrame(pintar) },
    detener,
    posicion: () => ({ x: jugador.x, y: jugador.y }),
    actualizarEnemigos(datos) { enemigos = actualizarEnemigos(datos, enemigos); return enemigos.length }
  }
}
