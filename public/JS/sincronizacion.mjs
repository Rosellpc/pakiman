// Programa cada petición después de completar la anterior.
export function crearSincronizacion(tarea, demora, {
  programar = setTimeout, cancelar = clearTimeout
} = {}) {
  let activo = false
  let timer
  let pendiente = false
  async function ejecutar() {
    if (!activo || pendiente) return
    pendiente = true
    try { await tarea() }
    finally {
      pendiente = false
      if (activo) timer = programar(ejecutar, demora())
    }
  }
  return {
    iniciar() { if (!activo) { activo = true; ejecutar() } },
    detener() { activo = false; cancelar(timer) }
  }
}
