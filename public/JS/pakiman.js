const sectionSeleccionarAtaque = document.getElementById('seleccionar-ataque')
const sectionButtonReiniciar = document.getElementById('reiniciar')
const buttonBestiaJugador = document.getElementById('button-bestia')
const buttonReiniciar = document.getElementById('button-reiniciar')

const sectionSeleccionarBestia = document.getElementById('seleccionar-bestia')
const spanBestiaJugador = document.getElementById('bestia-jugador')

const spanBestiaEnemigo = document.getElementById('bestia-enemigo')

const spanVidasJugador = document.getElementById('vidas-jugador')
const spanVidasEnemigo = document.getElementById('vidas-enemigo')

const sectionMensajes = document.getElementById('resultado')
const ataqueDelJugador = document.getElementById('ataque-del-jugador')
const ataqueDelEnemigo = document.getElementById('ataque-del-enemigo')
const contenedorTarjetas = document.getElementById('contenedorTarjetas')
const contenedorAtaques = document.getElementById('contenedorAtaques')

const sectionVerMapa = document.getElementById('ver-mapa')
const mapa =document.getElementById('mapa')

const estadoConexion = document.getElementById('estado-conexion')
const reintentar = document.getElementById('reintentar')
let jugadorId = null
let enemigoId = null
let estado = 'conectando'
let bestiaJugador
let bestiaJugadorObjeto
let pakimanesEnemigos = []
let ataqueJugador = []
let ataqueEnemigo = []
let indexAtaqueJugador
let indexAtaqueEnemigo
let victoriasJugador = 0
let victoriasEnemigo = 0
let pendienteReintento = null
let animacion
let ultimoFrame = null
const teclas = new Set()
const punteros = new Map()
const lienzo = mapa.getContext('2d')
const mapaBackground = new Image()
mapaBackground.src = './img/map.webp'
// Todas las pantallas usan el mismo mundo; CSS adapta su tamaño visual.
mapa.width = 800
mapa.height = 600
class Pakiman {
    constructor(nombre, foto, ataques, id = null) {
        this.nombre = nombre
        this.foto = foto
        this.ataques = ataques
        this.id = id
        this.ancho = this.alto = 80
        this.x = aleatorio(0, mapa.width - this.ancho)
        this.y = aleatorio(0, mapa.height - this.alto)
        this.mapaFoto = new Image()
        this.mapaFoto.src = foto
    }
    pintarPakiman() {
        if (this.mapaFoto.complete && this.mapaFoto.naturalWidth) {
            lienzo.drawImage(this.mapaFoto, this.x, this.y, this.ancho, this.alto)
        }
    }
}
const pakimanes = [
    new Pakiman('Suytun', './img/Litia.png', ['AGUA', 'AGUA', 'AGUA', 'FUEGO', 'TIERRA']),
    new Pakiman('Ratulia', './img/Rayan.png', ['AGUA', 'AGUA', 'AGUA', 'FUEGO', 'TIERRA']),
    new Pakiman('Katybara', './img/Ryujin.png', ['TIERRA', 'TIERRA', 'TIERRA', 'AGUA', 'FUEGO'])
]
function mostrarEstado(mensaje) { estadoConexion.textContent = mensaje }
function ofrecerReintento(error, accion) {
    mostrarEstado(error.message)
    pendienteReintento = accion
    reintentar.hidden = false
}
async function solicitar(ruta, datos) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)
    try {
        const res = await fetch(ruta, {
            method: datos === undefined ? 'GET' : 'POST',
            headers: datos === undefined ? {} : { 'Content-Type': 'application/json' },
            body: datos === undefined ? undefined : JSON.stringify(datos),
            signal: controller.signal,
            cache: 'no-store'
        })
        if (!res.ok) {
            const error = new Error(res.status === 404 ? 'La sesión ya no existe. Reinicia la partida.' : 'El servidor rechazó la petición. Puedes reintentar.')
            error.status = res.status
            throw error
        }
        return res.status === 204 ? null : await res.text()
    } catch (error) {
        if (error.status) throw error
        throw new Error('No se pudo conectar al servidor. Comprueba la conexión y reintenta.')
    } finally { clearTimeout(timeout) }
}
async function unirseAlJuego() {
    buttonBestiaJugador.disabled = true
    mostrarEstado('Conectando al servidor...')
    try {
        jugadorId = await solicitar('/unirse')
        estado = 'seleccion'
        buttonBestiaJugador.disabled = false
        mostrarEstado('Conectado. Elige tu bestia.')
    } catch (error) { ofrecerReintento(error, unirseAlJuego) }
}
async function selecionarBestiaJugador() {
    if (estado !== 'seleccion') return
    const seleccionado = document.querySelector('input[name="bestia"]:checked')
    if (!seleccionado) { mostrarEstado('Selecciona una bestia para continuar.'); return }
    buttonBestiaJugador.disabled = true
    mostrarEstado('Confirmando tu bestia...')
    try {
        await solicitar(`/pakiman/${jugadorId}`, { pakiman: seleccionado.id })
        bestiaJugador = seleccionado.id
        bestiaJugadorObjeto = pakimanes.find(p => p.nombre === bestiaJugador)
        spanBestiaJugador.textContent = bestiaJugador
        mostrarAtaques(bestiaJugadorObjeto.ataques)
        sectionSeleccionarBestia.style.display = 'none'
        sectionVerMapa.style.display = 'flex'
        estado = 'mapa'
        mostrarEstado('Busca un rival en el mapa.')
        ultimoFrame = null
        animacion = requestAnimationFrame(pintarCanvas)
    } catch (error) {
        if (error.status === 404) terminarPorDesconexion(error.message)
        else ofrecerReintento(error, selecionarBestiaJugador)
    } finally { buttonBestiaJugador.disabled = estado !== 'seleccion' }
}
function mostrarAtaques(ataques) {
    const iconos = { AGUA: '💧', FUEGO: '🔥', TIERRA: '🌱' }
    contenedorAtaques.replaceChildren()
    ataques.forEach((ataque, index) => {
        const button = document.createElement('button')
        button.id = `ataque-${index}`
        button.className = 'button-de-ataque BAtaque'
        button.textContent = iconos[ataque]
        button.setAttribute('aria-label', ataque)
        button.addEventListener('click', () => {
            if (estado !== 'combate' || button.disabled) return
            ataqueJugador.push(ataque)
            button.disabled = true
            mostrarEstado(`Ataques elegidos: ${ataqueJugador.length} de 5.`)
            if (ataqueJugador.length === 5) enviarAtaques()
        })
        contenedorAtaques.appendChild(button)
    })
}
async function enviarAtaques() {
    estado = 'enviando'
    mostrarEstado('Enviando ataques...')
    try {
        await solicitar(`/pakiman/${jugadorId}/ataques`, { ataques: ataqueJugador })
        estado = 'esperando'
        mostrarEstado('Esperando los ataques del rival...')
    } catch (error) {
        if (error.status === 404) terminarPorDesconexion(error.message)
        else ofrecerReintento(error, enviarAtaques)
    }
}
async function obtenerAtaques() {
    const { ataques } = JSON.parse(await solicitar(`/pakiman/${enemigoId}/ataques`))
    if (estado === 'esperando' && ataques.length === 5) {
        ataqueEnemigo = ataques
        combate()
    }
}
function terminarPorDesconexion(mensaje) {
    estado = 'terminado'
    detenerMovimiento()
    cancelAnimationFrame(animacion)
    mostrarEstado(mensaje)
    reintentar.hidden = true
    sectionButtonReiniciar.style.display = 'block'
    // También permite reiniciar desde selección o mapa.
    sectionSeleccionarAtaque.style.display = 'flex'
    sectionVerMapa.style.display = 'none'
    sectionMensajes.textContent = mensaje
    contenedorAtaques.querySelectorAll('button').forEach(b => { b.disabled = true })
}
// Un único ciclo espera cada petición: nunca se superponen sincronizaciones.
async function sincronizar() {
    try {
        if (jugadorId && estado !== 'terminado') {
            if (estado === 'mapa') await enviarPosicion()
            else {
                await solicitar(`/pakiman/${jugadorId}/latido`, {})
                if (estado === 'esperando') await obtenerAtaques()
            }
        }
    } catch (error) {
        if (error.status === 404) terminarPorDesconexion('Tu sesión o la del rival terminó. Reinicia para volver a jugar.')
        else mostrarEstado(error.message + ' Reintentando automáticamente...')
    } finally { setTimeout(sincronizar, estado === 'mapa' ? 150 : estado === 'esperando' ? 500 : 3000) }
}
async function enviarPosicion() {
    const { enemigos } = JSON.parse(await solicitar(`/pakiman/${jugadorId}/posicion`, {
        x: bestiaJugadorObjeto.x, y: bestiaJugadorObjeto.y
    }))
    if (estado !== 'mapa') return
    const anteriores = new Map(pakimanesEnemigos.map(p => [p.id, p]))
    pakimanesEnemigos = enemigos.flatMap(enemigo => {
        const plantilla = pakimanes.find(p => p.nombre === enemigo.pakiman?.nombre)
        if (!plantilla || !Number.isFinite(enemigo.x) || !Number.isFinite(enemigo.y) || enemigo.x < 0 || enemigo.y < 0) return []
        const p = anteriores.get(enemigo.id) || new Pakiman(plantilla.nombre, plantilla.foto, plantilla.ataques, enemigo.id)
        p.x = enemigo.x
        p.y = enemigo.y
        return [p]
    })
    mostrarEstado(pakimanesEnemigos.length ? 'Acércate a un rival para combatir.' : 'Esperando que otro jugador entre al mapa...')
}
function pintarCanvas(tiempo) {
    if (estado !== 'mapa') return
    const delta = ultimoFrame === null ? 0 : Math.min((tiempo - ultimoFrame) / 1000, .05)
    ultimoFrame = tiempo
    const direcciones = new Set([...teclas, ...punteros.values()])
    let dx = Number(direcciones.has('derecha')) - Number(direcciones.has('izquierda'))
    let dy = Number(direcciones.has('abajo')) - Number(direcciones.has('arriba'))
    const longitud = Math.hypot(dx, dy) || 1
    bestiaJugadorObjeto.x = Math.max(0, Math.min(mapa.width - 80, bestiaJugadorObjeto.x + dx / longitud * 100 * delta))
    bestiaJugadorObjeto.y = Math.max(0, Math.min(mapa.height - 80, bestiaJugadorObjeto.y + dy / longitud * 100 * delta))
    lienzo.clearRect(0, 0, mapa.width, mapa.height)
    if (mapaBackground.complete && mapaBackground.naturalWidth) lienzo.drawImage(mapaBackground, 0, 0, mapa.width, mapa.height)
    bestiaJugadorObjeto.pintarPakiman()
    for (const enemigo of pakimanesEnemigos) {
        enemigo.pintarPakiman()
        revisarColision(enemigo)
        if (estado !== 'mapa') break
    }
    if (estado === 'mapa') animacion = requestAnimationFrame(pintarCanvas)
}
function revisarColision(enemigo) {
    const p = bestiaJugadorObjeto
    if (estado !== 'mapa' || p.x + p.ancho < enemigo.x || p.x > enemigo.x + enemigo.ancho || p.y + p.alto < enemigo.y || p.y > enemigo.y + enemigo.alto) return
    detenerMovimiento()
    enemigoId = enemigo.id
    estado = 'combate'
    sectionVerMapa.style.display = 'none'
    sectionSeleccionarAtaque.style.display = 'flex'
    spanBestiaEnemigo.textContent = enemigo.nombre
    mostrarEstado('Elige tus cinco ataques.')
}
function detenerMovimiento() { teclas.clear(); punteros.clear(); ultimoFrame = null }
function iniciarJuego() {
    sectionSeleccionarAtaque.style.display = 'none'
    sectionVerMapa.style.display = 'none'
    sectionButtonReiniciar.style.display = 'none'
    for (const p of pakimanes) {
        contenedorTarjetas.insertAdjacentHTML('beforeend', `<input type="radio" name="bestia" id="${p.nombre}" /><label class="tarjeta-de-pakiman" for="${p.nombre}"><p>${p.nombre}</p><img src="${p.foto}" alt="${p.nombre}"></label>`)
    }
    buttonBestiaJugador.addEventListener('click', selecionarBestiaJugador)
    buttonReiniciar.addEventListener('click', reiniciarJuego)
    reintentar.addEventListener('click', () => {
        const accion = pendienteReintento
        reintentar.hidden = true
        pendienteReintento = null
        if (accion) accion()
    })
    const direcciones = { ArrowUp: 'arriba', ArrowDown: 'abajo', ArrowLeft: 'izquierda', ArrowRight: 'derecha' }
    window.addEventListener('keydown', e => {
        if (estado === 'mapa' && direcciones[e.key]) { e.preventDefault(); teclas.add(direcciones[e.key]) }
    })
    window.addEventListener('keyup', e => { teclas.delete(direcciones[e.key]) })
    window.addEventListener('blur', detenerMovimiento)
    document.addEventListener('visibilitychange', detenerMovimiento)
    document.querySelectorAll('[data-direccion]').forEach(button => {
        button.addEventListener('pointerdown', e => {
            if (estado !== 'mapa') return
            e.preventDefault()
            button.setPointerCapture(e.pointerId)
            punteros.set(e.pointerId, button.dataset.direccion)
        })
        for (const evento of ['pointerup', 'pointercancel', 'lostpointercapture']) {
            button.addEventListener(evento, e => { punteros.delete(e.pointerId) })
        }
    })
    unirseAlJuego()
    sincronizar()
}
window.addEventListener('pagehide', () => {
    detenerMovimiento()
    if (jugadorId) navigator.sendBeacon(`/pakiman/${jugadorId}/salir`, '')
})
window.addEventListener('pageshow', e => { if (e.persisted) location.reload() })
window.addEventListener('load', iniciarJuego)

function indexAmbosOponentes(jugador, enemigo) {
    indexAtaqueJugador = ataqueJugador[jugador]
    indexAtaqueEnemigo = ataqueEnemigo[enemigo]

}

function combate() {
    if (estado === 'terminado') return
    estado = 'terminado'
    mostrarEstado('Partida terminada.')
    for (let index = 0; index < ataqueJugador.length; index++) {
        if(ataqueJugador[index] === ataqueEnemigo[index]) {
            indexAmbosOponentes(index, index)
            crearMensaje('EMPATE MAMA-BICHOS')
        } else if(ataqueJugador[index] === 'FUEGO' && ataqueEnemigo[index] === 'TIERRA') {
            indexAmbosOponentes(index, index)
            crearMensaje('GANASTE PERRO')
            victoriasJugador ++
            spanVidasJugador.innerHTML = victoriasJugador
        } else if(ataqueJugador[index] === 'AGUA' && ataqueEnemigo[index] === 'FUEGO') {
            indexAmbosOponentes(index, index)
            crearMensaje('GANASTE PERRO CON AGUITA')
            victoriasJugador ++
            spanVidasJugador.innerHTML = victoriasJugador
        } else if(ataqueJugador[index] === 'TIERRA' && ataqueEnemigo[index] === 'AGUA') {
            indexAmbosOponentes(index, index)
            crearMensaje('GANASTE ATIERRA')
            victoriasJugador ++
            spanVidasJugador.innerHTML = victoriasJugador
        } else {
            indexAmbosOponentes(index, index)
            crearMensaje('QUE SUERTE PERDISTE CONMIGO')
            victoriasEnemigo ++
            spanVidasEnemigo.innerHTML = victoriasEnemigo
        }
    }

    revisarVidas()
}

function revisarVidas() {
    if(victoriasJugador === victoriasEnemigo) {
        crearMensajeFinal('EMPATASTE, ESFUERZATE MÁS')
    } else if(victoriasJugador > victoriasEnemigo) {
        crearMensajeFinal('¡FELICITACIONES! GANASTE, BRO :(')
    } else {
        crearMensajeFinal('PERDISTE CON EL REY')
    }
}

function crearMensaje(resultado) {
    let nuevoAtaqueDelJugador = document.createElement('p')
    let nuevoAtaqueDelEnemigo = document.createElement('p')

    sectionMensajes.innerHTML = resultado
    nuevoAtaqueDelJugador.innerHTML = indexAtaqueJugador
    nuevoAtaqueDelEnemigo.innerHTML = indexAtaqueEnemigo

    ataqueDelJugador.appendChild(nuevoAtaqueDelJugador)
    ataqueDelEnemigo.appendChild(nuevoAtaqueDelEnemigo)
}

function crearMensajeFinal(resultadoFinal) {
    sectionMensajes.innerHTML = resultadoFinal

    sectionButtonReiniciar.style.display = 'block'
}

function reiniciarJuego() {
    location.reload()
 }
function aleatorio(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min)
}

