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

let jugadorId = null
let enemigoId = null
let pakimanes = []
let pakimanesEnemigos = []
let ataqueJugador = []
let ataqueEnemigo = []
let opcionDePakimanes
let inputSuytun
let inputRatulia
let inputKatybara
let bestiaJugador
let bestiaJugadorObjeto
let ataquesPakiman
let ataquesPakimanEnemigo
let buttonFuego
let buttonAgua   
let buttonTierra
let buttons = []
let indexAtaqueJugador
let indexAtaqueEnemigo
let victoriasJugador = 0
let victoriasEnemigo = 0
let vidasJugador = 3
let vidasEnemigo = 3
let lienzo = mapa.getContext("2d")
let intervalo
let mapaBackground = new Image()
mapaBackground.src = './img/map.webp'
let alturaQueBuscamos
let anchoDelMapa = window.innerWidth -50
const anchoMaximoDelMapa = 800

if (anchoDelMapa > anchoMaximoDelMapa) {
    anchoDelMapa = anchoMaximoDelMapa -50
}

alturaQueBuscamos = anchoDelMapa * 600 / 800

mapa.width = anchoDelMapa
mapa.height = alturaQueBuscamos

class Pakiman {
    constructor(nombre, foto, vida, fotoMapa, id = null) {
        this.id = id
        this.nombre = nombre
        this.foto = foto
        this.vida = vida
        this.ataques = []
        this.ancho = 80
        this.alto = 80
        this.x = aleatorio(0, mapa.width - this.ancho)
        this.y = aleatorio(0, mapa.height - this.alto)
        this.mapaFoto = new Image()
        this.mapaFoto.src = fotoMapa
        this.velocidadX = 0
        this.velocidadY = 0
    }

    pintarPakiman() {
        lienzo.drawImage(
            this.mapaFoto,
            this.x,
            this.y,
            this.ancho,
            this.alto
        )
    }
 }

let suytun = new Pakiman('Suytun', './img/Litia.png', 5, './img/Litia.png')
let ratulia = new Pakiman('Ratulia', './img/Rayan.png', 5, './img/Rayan.png')
let katybara = new Pakiman('Katybara', './img/Ryujin.png', 5, './img/Ryujin.png')

const SUYTUN_ATAQUES = [ 
    { nombre: '💧', id: 'boton-agua' },
    { nombre: '💧', id: 'boton-agua' },
    { nombre: '💧', id: 'boton-agua' },
    { nombre: '🔥', id: 'boton-fuego' },
    { nombre: '🌱', id: 'boton-tierra' },
]
suytun.ataques.push(...SUYTUN_ATAQUES)

const RATULIA_ATAQUES = [
    { nombre: '💧', id: 'boton-agua' },
    { nombre: '💧', id: 'boton-agua' },
    { nombre: '💧', id: 'boton-agua' },
    { nombre: '🔥', id: 'boton-fuego' },
    { nombre: '🌱', id: 'boton-tierra' },
]

ratulia.ataques.push(...RATULIA_ATAQUES)

const KATYBARA_ATAQUES = [
    { nombre: '🌱', id: 'boton-tierra' },
    { nombre: '🌱', id: 'boton-tierra' },
    { nombre: '🌱', id: 'boton-tierra' },
    { nombre: '💧', id: 'boton-agua' },
    { nombre: '🔥', id: 'boton-fuego' },
]

katybara.ataques.push(...KATYBARA_ATAQUES)

pakimanes.push(suytun, ratulia, katybara) 

function iniciarJuego() {
    sectionSeleccionarAtaque.style.display = 'none'
    sectionVerMapa.style.display = 'none'

    pakimanes.forEach((pakiman) => {
        opcionDePakimanes = `
        <input type="radio" name="bestia" id=${pakiman.nombre} />
        <label class="tarjeta-de-pakiman" for=${pakiman.nombre}>
            <p>${pakiman.nombre}</p>
            <img src=${pakiman.foto} alt=${pakiman.nombre}>
        </label>
        `
    contenedorTarjetas.innerHTML += opcionDePakimanes  

    inputSuytun = document.getElementById('Suytun')
    inputRatulia = document.getElementById('Ratulia')
    inputKatybara = document.getElementById('Katybara')
    
    })

    buttonBestiaJugador.addEventListener('click', selecionarBestiaJugador)
    buttonReiniciar.addEventListener('click', reiniciarJuego)

    unirseAlJuego()
}

function unirseAlJuego() {
    fetch("http://192.168.0.104:8080/unirse")
        .then(function (res) {
            if (res.ok) {
                res.text()
                    .then(function (respuesta) {
                        console.log(respuesta)
                        jugadorId = respuesta
                    })
            }
        })
}

function selecionarBestiaJugador() {

    if (inputSuytun.checked) {
        spanBestiaJugador.innerHTML = inputSuytun.id
        bestiaJugador = inputSuytun.id                                            
    } else if (inputRatulia.checked) {
        spanBestiaJugador.innerHTML = inputRatulia.id
        bestiaJugador = inputRatulia.id
    } else if (inputKatybara.checked) {
        spanBestiaJugador.innerHTML = inputKatybara.id
        bestiaJugador = inputKatybara.id
    } else {
        alert('Selecciona una bestia, bro')
        return
    }
    
    sectionSeleccionarBestia.style.display = 'none'

    seleccionarPakiman(bestiaJugador)
    extraerAtaques(bestiaJugador)
    sectionVerMapa.style.display = 'flex'
    iniciarMapa()
}

function seleccionarPakiman(bestiaJugador) {
    fetch(`http://192.168.0.104:8080/pakiman/${jugadorId}`, {
        method: "post",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            pakiman: bestiaJugador
        })
    })

}

function extraerAtaques(bestiaJugador) {
    let ataques
    for (let i = 0; i < pakimanes.length; i++) {
        if (bestiaJugador === pakimanes[i].nombre) {
            ataques = pakimanes[i].ataques
        } 
    }
    mostrarAtaques(ataques)
}

function mostrarAtaques(ataques) {
    contenedorAtaques.innerHTML = ""; // Limpiar ataques anteriores

    ataques.forEach((ataque) => {
        const button = document.createElement("button");
        button.id = ataque.id;
        button.classList.add("button-de-ataque", "BAtaque");
        button.textContent = ataque.nombre;
        contenedorAtaques.appendChild(button);
    });

    buttons = document.querySelectorAll('.BAtaque'); // Actualizar buttons
}


function secuenciaAtaque() {
    buttons.forEach((button) => {
        button.addEventListener('click', (e) => {
            if (e.target.textContent === '🔥') {
                ataqueJugador.push('FUEGO')
                console.log(ataqueJugador)
                button.style.background = '#112f58' 
                button.disabled = true  
            } else if (e.target.textContent === '💧') {
                ataqueJugador.push('AGUA')
                console.log(ataqueJugador)
                button.style.background = '#112f58'
                button.disabled = true  
            } else {
                ataqueJugador.push('TIERRA')
                console.log(ataqueJugador)
                button.style.background = '#112f58'
                button.disabled = true  
            }
            if(ataqueJugador.length === 5) {
                enviarAtaques()
            }
        })
    })
}

function enviarAtaques() {
    fetch(`http://192.168.0.104:8080/pakiman/${jugadorId}/ataques`, {
        method: "post",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            ataques: ataqueJugador
        })
    })

    intervalo = setInterval(obtenerAtaques, 50)
}
  
function obtenerAtaques() {
    fetch(`http://192.168.0.104:8080/pakiman/${jugadorId}/ataques`)
        .then(function (res) {
            if (res.ok) {
                res.json()
                    .then(function ({ ataques }) {
                        if (ataques.length === 5) {
                            ataqueEnemigo = ataques
                            combate()
                        }
                    })
            }
        })
}

function seleccionarBestiaEnemigo (enemigo) {
    spanBestiaEnemigo.innerHTML = enemigo.nombre
    ataquesPakimanEnemigo = enemigo.ataques
  
    secuenciaAtaque()

}

function ataqueAleatorioEnemigo() {
    console.log('Error o no', ataquesPakimanEnemigo)
    let ataqueAleatorio = aleatorio(0, ataquesPakimanEnemigo.length -1)

    if (ataqueAleatorio == 0 || ataqueAleatorio == 1) {
        ataqueEnemigo.push('FUEGO')
    } else if (ataqueAleatorio == 3 || ataqueAleatorio == 4) {
        ataqueEnemigo.push('AGUA')
    } else {
        ataqueEnemigo.push('TIERRA')
    }
    console.log(ataqueEnemigo)
    iniciarPelea()
}

function iniciarPelea() {
    if(ataqueJugador.length === 5) {
        combate()
    }
}

function indexAmbosOponentes(jugador, enemigo) {
    indexAtaqueJugador = ataqueJugador[jugador]
    indexAtaqueEnemigo = ataqueEnemigo[enemigo]

}

function combate() {
    clearInterval(intervalo)
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
        crearMensaje('PERDISTE CON EL REY')
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

function pintarCanvas() {
    bestiaJugadorObjeto.x = bestiaJugadorObjeto.x + bestiaJugadorObjeto.velocidadX
    bestiaJugadorObjeto.y = bestiaJugadorObjeto.y + bestiaJugadorObjeto.velocidadY
    lienzo.clearRect(0, 0, mapa.clientWidth, mapa.height)
    lienzo.drawImage(
        mapaBackground,
        0,
        0,
        mapa.width,
        mapa.height
    )
    bestiaJugadorObjeto.pintarPakiman()

    enviarPosicion(bestiaJugadorObjeto.x, bestiaJugadorObjeto.y)

    pakimanesEnemigos.forEach(function (pakiman) {
        pakiman.pintarPakiman()
        revisarColision(pakiman)
    })
      
}

function enviarPosicion(x, y) {
    fetch(`http://192.168.0.104:8080/pakiman/${jugadorId}/posicion`, {
        method: "post",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            x,
            y
        })
    })
    .then(function (res) {
        if(res.ok) {
            res.json()
                .then(function({ enemigos }) {
                    console.log(enemigos)
                    pakimanesEnemigos = enemigos.map(function (enemigo) {
                        let pakimanEnemigo = null
                        const pakimanNombre = enemigo.pakiman.nombre || ""
                        if(pakimanNombre === "Suytun") {
                            pakimanEnemigo = new Pakiman('Suytun', './img/Litia.png', 5, './img/Litia.png', enemigoId)
                        } else if(pakimanNombre === "Ratulia") {
                            pakimanEnemigo = new Pakiman('Ratulia', './img/Rayan.png', 5, './img/Rayan.png', enemigoId)
                        } else if(pakimanNombre === "Katybara") {
                            pakimanEnemigo = new Pakiman('Katybara', './img/Ryujin.png', 5, './img/Ryujin.png', enemigoId)
                        }

                        pakimanEnemigo.x = enemigo.x
                        pakimanEnemigo.y = enemigo.y
                        return pakimanEnemigo
                    })
                })
        }
    })


}

function moverDerecha() {
    bestiaJugadorObjeto.velocidadX = 5
}

function moverIzquierda() {
    bestiaJugadorObjeto.velocidadX = -5
}

function moverAbajo() {
    bestiaJugadorObjeto.velocidadY = 5
}

function moverArriba() {
    bestiaJugadorObjeto.velocidadY = -5
}

function detenerMovimiento() {
    bestiaJugadorObjeto.velocidadX = 0
    bestiaJugadorObjeto.velocidadY = 0
}

function sePresionoUnaTecla(event) {
    switch (event.key) {
        case 'ArrowUp':
            moverArriba()
            break 
        case 'ArrowDown':
            moverAbajo()
            break                  
        case 'ArrowLeft':
            moverIzquierda()
            break
        case 'ArrowRight':
            moverDerecha()
            break
        default:
            break
    }
}

function iniciarMapa() {
    bestiaJugadorObjeto = obtenerObjetoBestia(bestiaJugador)
    console.log(bestiaJugadorObjeto, bestiaJugador)
    intervalo = setInterval(pintarCanvas, 60)
    window.addEventListener('keydown', sePresionoUnaTecla)
    window.addEventListener('keyup', detenerMovimiento)
}

function obtenerObjetoBestia(bestiaJugador) {
    let ataques
    for (let i = 0; i < pakimanes.length; i++) {
        if (bestiaJugador === pakimanes[i].nombre) {
            return pakimanes[i]
        } 
    }
}

function revisarColision(enemigo) {
    const arribaEnemigo = enemigo.y
    const abajoEnemigo = enemigo.y + enemigo.alto
    const derechaEnemigo = enemigo.x + enemigo.ancho
    const izquierdaEnemigo = enemigo.x

    const arribaBestia = bestiaJugadorObjeto.y
    const abajoBestia = bestiaJugadorObjeto.y + bestiaJugadorObjeto.alto
    const derechaBestia = bestiaJugadorObjeto.x + bestiaJugadorObjeto.ancho
    const izquierdaBestia = bestiaJugadorObjeto.x


    if(
        abajoBestia < arribaEnemigo ||
        arribaBestia > abajoEnemigo ||
        derechaBestia < izquierdaEnemigo ||
        izquierdaBestia > derechaEnemigo
    ) {
        return
    }

    detenerMovimiento()
    clearInterval(intervalo)
    console.log('Hay mecha, bro')

    enemigoId = enemigoId
    sectionSeleccionarAtaque.style.display = 'flex'
    sectionVerMapa.style.display = 'none'
    seleccionarBestiaEnemigo(enemigo)

}


window.addEventListener('load', iniciarJuego)