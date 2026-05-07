import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase, ref, push } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// Tu configuración de Firebase (obtenla en la consola)
const firebaseConfig = {
  databaseURL: "https://asistencia-93328-default-rtdb.firebaseio.com/",
  // Agregá aquí tu apiKey, authDomain, projectId, etc.
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const asistenciaRef = ref(db, 'tbl_usuarios');


async function subirDatos() {
  // Definimos el objeto con los datos del curso
  const dato = {
    usuario: "viviadfdefdfdfddfdfdna",
    Password: "12345678",
    rol: "Preceptor",
    curso: "3ro B,1ro A,5to C",
    aviso: "Sin aviso"
  };

  try {
    // Usamos push para crear una nueva entrada con un ID único en Firebase
    await push(asistenciaRef, dato);
    console.log("¡Carga completadaaaaaaaaaaaaaaaaaaaaaaaaaaaa!");
    console.log(`Preceptor guardtghthgthgtghado: ${dato.preceptor}`);
  } catch (error) {
    console.error("Error al subir:", error);
  }
}

// Ejecutamos la función
subirDatos();
