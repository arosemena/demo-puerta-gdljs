const exec = require('child_process').exec
const bcrypt = require('bcryptjs')
const express = require('express')
const redis = require('redis').createClient()
const uuid = require('uuid/v1')
const server = express()

// Configuración
var pin = 18 // El pin del raspberry en el que conectamos el relay
var port = 80 // Si usas un puerto menor a 1024 necesitaras root
var openTime = 4000 // El tiempo que permanecerá abierta en milisegundos

// Para simplificar el demo pondré la password aquí, en una implementación
// real puedes usar una base de datos o por variables del environment
// la password está hasheada con bcrypt, es gdljs
var password = '$2a$04$ujCCAe8haxb2fF1Zw5HY4eEEpVzD9.0KojO0KZaLk.TadHfW7rQrq'

// Activamos el módulo de express de cookies y json para variables POST
server.use(require('cookie-parser')())
server.use(require('body-parser').json())

// Acceso a archivos estaticos por medio de express
server.use(express.static(__dirname + '/public'))

// Inicializamos el pin para poder utilizarlo
exec(`echo ${pin} > /sys/class/gpio/export`)

// Funciones para prender y apagar el pin
var on = () => exec(`echo out > /sys/class/gpio/gpio${pin}/direction`)
var off = () => exec(`echo in > /sys/class/gpio/gpio${pin}/direction`)

// Endpoint para verificar el password
server.post('/auth', (req, res) => {
  var valid = bcrypt.compareSync(req.body.password, password)
  var token = uuid() // Generamos un UUID para que funcione como token
  if(valid) {
    redis.set(token, true) // Guardamos el token en redis
    return res
      .cookie('token', token, {httpOnly: true})
      .json({success: true})
  }
  // Si no se valido el password 
  return res
    .status(403)
    .json({message: "Password incorrecta"})
})

// Endpoint para verificar si hay un token guardado
server.post('/me', (req, res) => {
  var token = req.cookies.token
  if(!token) return res.status(403).send()
  // Verificamos que el token existe en el cache
  redis.get(token, (err, exists) => {
    // Si no existe marcamos el HTTP code como 403
    if(!exists) res.status(403).send()
    res.send()
  })
})

var doorTimeout = null // Timeout de la puerta
// Endpoint para abrir la puerta
server.post('/open', (req, res) => {
  var token = req.cookies.token
  if(!token) return res.status(403).send()
  redis.get(token, (err, exists) => {
    if(exists) { // Abrimos la puerta
       // Quitamos timeouts actuales
      clearTimeout(doorTimeout)
      // Abrimos la puerta
      on() 
      // Y la cerramos despues del tiempo establecido
      doorTimeout = setTimeout(off, openTime)
      return res.send()
    }
    // Si el usuario no tiene token valido aventamos error
    return res.status(403).send()
  })
})

// Endpoint para cerrar sesión
server.post('/bye', (req, res) => {
  var token = req.cookies.token
  redis.del(token) // Simplemente eliminamos el token del cache
  return res.send()
})

// Finalmente prendemos el server
server.listen(port, (err) => console.log(err))
console.log("Demo inicializado!")