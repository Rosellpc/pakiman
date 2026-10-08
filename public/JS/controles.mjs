export function crearControles({ ventana = window, documento = document, habilitado }) {
  const teclas = new Set()
  const punteros = new Map()
  const listeners = []
  const direcciones = { ArrowUp: 'arriba', ArrowDown: 'abajo', ArrowLeft: 'izquierda', ArrowRight: 'derecha' }
  function escuchar(target, evento, handler) {
    target.addEventListener(evento, handler)
    listeners.push(() => target.removeEventListener(evento, handler))
  }
  function detener() { teclas.clear(); punteros.clear() }
  escuchar(ventana, 'keydown', e => {
    if (habilitado() && direcciones[e.key]) {
      e.preventDefault()
      teclas.add(direcciones[e.key])
    }
  })
  escuchar(ventana, 'keyup', e => teclas.delete(direcciones[e.key]))
  escuchar(ventana, 'blur', detener)
  escuchar(documento, 'visibilitychange', detener)
  documento.querySelectorAll('[data-direccion]').forEach(button => {
    escuchar(button, 'pointerdown', e => {
      if (!habilitado()) return
      e.preventDefault()
      button.setPointerCapture(e.pointerId)
      punteros.set(e.pointerId, button.dataset.direccion)
    })
    for (const evento of ['pointerup', 'pointercancel', 'lostpointercapture']) {
      escuchar(button, evento, e => punteros.delete(e.pointerId))
    }
  })
  return {
    direcciones: () => new Set([...teclas, ...punteros.values()]),
    detener,
    destruir() { detener(); listeners.forEach(quitar => quitar()) }
  }
}
