AOS.init({ duration: 1000 });

// Fecha de la boda (ajusta con tu hora real)
const fechaBoda = new Date("2025-11-22T16:00:00-06:00"); // 22 nov 2025, 4:00 PM hora CDMX
const contador = document.getElementById("contador");

function actualizarContador() {
  const ahora = new Date();
  const diferencia = fechaBoda - ahora;

  if (diferencia <= 0) {
    contador.textContent = "¡Hoy es el gran día! 💍🎉";
    clearInterval(intervalo); // detiene el contador
    return;
  }

  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  const horas = Math.floor((diferencia / (1000 * 60 * 60)) % 24);
  const minutos = Math.floor((diferencia / (1000 * 60)) % 60);
  const segundos = Math.floor((diferencia / 1000) % 60);

  contador.textContent = `Faltan ${dias}d ${horas}h ${minutos}m ${segundos}s`;
}

// Actualizar cada segundo
const intervalo = setInterval(actualizarContador, 1000);
