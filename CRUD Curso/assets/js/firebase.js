// Configuración de Firebase
// Importante las versiones para 'firebase-app.js' y para 'firebase-firestore.js' en ambos casos debes ser las mismas
import { initializeApp } from  "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
  getDatabase, 
  ref, 
  push, 
  get, 
  child, 
  update, 
  remove 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// Firebase configuration (replace with your actual project details)
const firebaseConfig = {
    apiKey: "AIzaSyAfpEDzd8wc6t9Y3foI2HDrWVL_MIzhYnA",
    authDomain: "asistencia-93328.firebaseapp.com",
    databaseURL: "https://asistencia-93328-default-rtdb.firebaseio.com",
    projectId: "asistencia-93328",
    storageBucket: "asistencia-93328.firebasestorage.app",
    messagingSenderId: "692275978617",
    appId: "1:692275978617:web:5579ef6c0aeb2d58c7cfa8"
  };

// Inicializar Firebase

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
const coleccion = "cursos";

// Agrega un curso
export const addCurso = (curso, ubicacion, capacidad, obs) => 
    push(ref(db, coleccion), { curso, ubicacion, capacidad, obs });

// Obtiene todos los cursos
export const getCursosCollection = () => get(ref(db, coleccion));

// Obtiene un curso específico por ID
export const getCursoCollection = (id) => get(ref(db, `${coleccion}/${id}`));

// Actualiza un curso
export const updateCursoCollection = (id, newFields) => 
    update(ref(db, `${coleccion}/${id}`), newFields);

// Elimina un curso
export const deleteCursoCollection = (id) => 
    remove(ref(db, `${coleccion}/${id}`));