// Client side del demo

// Función para cambiar entre las diferentes secciones
let show = (which) => {
  document
    .querySelectorAll('.loading, .login, .open')
    .forEach(el => el.classList.remove('active'))
  document.querySelector(which).classList.add('active')
}

// Primero verificamos si el usuario ya inició sesión
// para el demo utilizamos autenticación con un cookie
// que es httpOnly osea que javascript no tiene acceso
// a el, tenemos que hacer una solicitud al servidor y
// ver como nos responde para determinar nuestro estado
axios
  .post('/me')
  .then(() => show('.open'))
  .catch(() => show('.login'))


// Función para verificar la contraseña
let check = () => {
  let password = document.querySelector('input').value
  let message = document.querySelector('.loginErrorMessage')
  message.innerHTML = "" // Limpiamos el mensaje de error
  axios
    .post('/auth', {password})
    .then(() => show('.open')) // Si regresa 200 todo bien
    .catch(err => { // Clave incorrecta o error de red
      message.innerHTML = err.response.data.message || "Error de red"
    })
}

// sonidito para cuando se abre la puerta
let audio = new Audio('open.mp3')
// Función para solicitar que se abra la puerta
let open = () => {
  let message = document.querySelector('.openErrorMessage')
  message.innerHTML = "" // Limpiamos el mensaje de error
  axios
    .post('/open')
    .then(() => audio.play())
    .catch(err => {
      // Si el servidor regresa 403 se necesita hacer login
      if(err.response.status == 403) return show('.login')
      message.innerHTML = "Error de red"
    })
}

// Función para cerrar sesión
let logout = () => {
  let message = document.querySelector('.openErrorMessage')
  message.innerHTML = "" // Limpiamos el mensaje de error
  axios
    .post('/bye')
    .then(() => show('.login'))
    .catch(err => message.innerHTML = 'Error al cerrar sesión')
}

// Finalmente asignamos los eventos de las funciones
document.querySelector('.submitButton').addEventListener('click', check)
document.querySelector('.openButton').addEventListener('click', open)
document.querySelector('.logout').addEventListener('click', logout)
