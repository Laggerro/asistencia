import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// Tu configuración de Firebase (obtenla en la consola)
const firebaseConfig = {
  databaseURL: "https://asistencia-93328-default-rtdb.firebaseio.com/",
  // Agregá aquí tu apiKey, authDomain, projectId, etc.
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const asistenciaRef = ref(db, 'asistencia');

function generarDatos() {
  const registros = [];
  const ahora = new Date();

  for (let i = 0; i < 20; i++) {
    const id_user = Math.floor(Math.random() * 1000) + 1;
    let timestamp;

    if (i < 10) {
      // 10 registros de hoy (hora aleatoria)
      const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
      timestamp = inicioHoy + Math.floor(Math.random() * (ahora.getTime() - inicioHoy));
    } else {
      // 10 registros de fechas pasadas (últimos 30 días)
      const diasAtras = Math.floor(Math.random() * 30) + 1;
      timestamp = ahora.getTime() - (diasAtras * 24 * 60 * 60 * 1000);
    }

    registros.push({ id_user, timestamp });
  }
  return registros;
}

async function subirDatos() {
  const datos = generarDatos();
  for (const dato of datos) {
    try {
      await push(asistenciaRef, dato);
      console.log(`Cargado: ID ${dato.id_user}`);
    } catch (error) {
      console.error("Error al subir:", error);
    }
  }
  console.log("¡Carga completada!");
}

subirDatos();