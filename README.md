# Pakiman

Juego multijugador creado como proyecto de aprendizaje con HTML, CSS, JavaScript, Canvas y un servidor Node.js con Express.

Elige una bestia, recorre el mapa y acércate a otro jugador para combatir. Cada jugador selecciona cinco ataques: agua vence a fuego, fuego a tierra y tierra a agua. Gana quien consiga más victorias en las cinco rondas.

## Ejecutar

Necesitas Node.js y npm. Desde la carpeta del proyecto:

```powershell
npm.cmd install
npm.cmd start
```

Abre `http://localhost:8080`. Para probar el multijugador, abre dos pestañas y elige una bestia en cada una. Muévete con las flechas del teclado o los botones de la pantalla.

## Jugar desde el celular

Conecta el celular al mismo router que el computador. Consulta la IPv4 del computador con `ipconfig` y abre `http://IP-DEL-COMPUTADOR:8080` en el celular. Mantén el servidor encendido y permite el acceso de Node.js en el Firewall de Windows para redes privadas.

## Pruebas

```powershell
npm.cmd test
```

## Estructura

- `index.js`: inicia el servidor y la limpieza de sesiones.
- `server/`: aplicación Express, rutas y almacenamiento de jugadores.
- `public/JS/main.mjs`: inicia el cliente mediante módulos ES nativos, sin compilación.
- `public/JS/`: datos, API, sincronización, controles, mapa, vista y coordinación del juego. Las reglas de combate son independientes del navegador.
- `tests/`: pruebas del servidor y de los módulos del cliente.

Las sesiones se guardan en memoria y se pierden al reiniciar el servidor. El almacenamiento está separado para facilitar una futura persistencia.
