export function crearApi({ fetchImpl = globalThis.fetch, timeoutMs = 5000 } = {}) {
  async function solicitar(ruta, datos) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetchImpl(ruta, {
        method: datos === undefined ? 'GET' : 'POST',
        headers: datos === undefined ? {} : { 'Content-Type': 'application/json' },
        body: datos === undefined ? undefined : JSON.stringify(datos),
        signal: controller.signal,
        cache: 'no-store'
      })
      if (!res.ok) {
        const error = new Error(res.status === 404 ? 'La sesión ya no existe. Reinicia la partida.' :
          'El servidor rechazó la petición. Puedes reintentar.')
        error.status = res.status
        throw error
      }
      return res.status === 204 ? null : await res.text()
    } catch (error) {
      if (error.status) throw error
      throw new Error('No se pudo conectar al servidor. Comprueba la conexión y reintenta.')
    } finally { clearTimeout(timeout) }
  }
  const ruta = id => `/pakiman/${encodeURIComponent(id)}`
  return {
    unirse: () => solicitar('/unirse'),
    seleccionar: (id, pakiman) => solicitar(ruta(id), { pakiman }),
    posicion: async (id, posicion) => JSON.parse(await solicitar(`${ruta(id)}/posicion`, posicion)),
    latido: id => solicitar(`${ruta(id)}/latido`, {}),
    enviarAtaques: (id, ataques) => solicitar(`${ruta(id)}/ataques`, { ataques }),
    obtenerAtaques: async id => JSON.parse(await solicitar(`${ruta(id)}/ataques`)),
    salir(id) { globalThis.navigator?.sendBeacon(`${ruta(id)}/salir`, '') }
  }
}
