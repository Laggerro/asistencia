// Use the full HTTPS URL so the browser can find the SDK
 import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
    getDatabase, 
    ref, 
    push, 
    get, 
    remove, 
    update 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// YOUR REAL CREDENTIALS (The ones you found in the console)
const firebaseConfig = {
    apiKey: "AIzaSyAfpEDzd8wc6t9Y3foI2HDrWVL_MIzhYnA",
    authDomain: "asistencia-93328.firebaseapp.com",
    databaseURL: "https://asistencia-93328-default-rtdb.firebaseio.com",
    projectId: "asistencia-93328",
    storageBucket: "asistencia-93328.firebasestorage.app",
    messagingSenderId: "692275978617",
    appId: "1:692275978617:web:5579ef6c0aeb2d58c7cfa8"
  };

// Initialize
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const nodoPrincipal = "tbl_alumnos";

/** 
 * ACCIONES CRUD ADAPTADAS
 */

// CREATE: Agrega un nuevo alumno. 
export const addalumno = (curso, nombre, dni, obs, huellaId) => {
    return push(ref(db, nodoPrincipal), { curso, nombre, dni, obs, huellaId: huellaId });
};

export const getalumnosCollection = () => {
    return get(ref(db, nodoPrincipal));
};

export const getalumnoCollection = (id) => {
    return get(ref(db, `${nodoPrincipal}/${id}`));
};

// UPDATE: Actualiza campos específicos usando el ID.
export const updatealumnoCollection = (id, newFields) => {
    return update(ref(db, `${nodoPrincipal}/${id}`), newFields);
};

// DELETE: Elimina el registro por ID.
export const deletealumnoCollection = (id) => {
    return remove(ref(db, `${nodoPrincipal}/${id}`));
};

export const getAsistenciasHoy = () => {
    const dbRef = ref(db, "asistencia"); // Nombre exacto de tu tabla
    return get(dbRef);
};