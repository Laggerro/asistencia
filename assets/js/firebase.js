// firebase.js - ARCHIVO UNIFICADO
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import {
    getDatabase,
    ref,
    push,
    get,
    update,
    remove,
    query,
    onValue,
    orderByChild
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAfpEDzd8wc6t9Y3foI2HDrWVL_MIzhYnA",
    authDomain: "asistencia-93328.firebaseapp.com",
    databaseURL: "https://asistencia-93328-default-rtdb.firebaseio.com",
    projectId: "asistencia-93328",
    storageBucket: "asistencia-93328.firebasestorage.app",
    messagingSenderId: "692275978617",
    appId: "1:692275978617:web:5579ef6c0aeb2d58c7cfa8"
};

// Inicialización única
export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

// Nodos / Colecciones
const coleccionCursos = "cursos";
const coleccionPreceptores = "tbl_preceptor"; //para llenar el modal de cursos con los preceptores existentes
const nodoAlumnos = "tbl_alumnos";


/** 
 * --- SECCIÓN CURSOS ---
 */
export const addCurso = (curso, ubicacion, capacidad, obs, preceptorID) =>
    push(ref(db, coleccionCursos), { curso, ubicacion, capacidad, obs, preceptorID });

export const getCursosCollection = () => get(ref(db, coleccionCursos));

export const getCursoCollection = (id) => get(ref(db, `${coleccionCursos}/${id}`));

export const updateCursoCollection = (id, newFields) =>
    update(ref(db, `${coleccionCursos}/${id}`), newFields);

export const deleteCursoCollection = (id) =>
    remove(ref(db, `${coleccionCursos}/${id}`));

export const getPreceptoresCollection = () => get(ref(db, coleccionPreceptores)); //Es la función que trae la lista para el option del modal de Cursos).

/** 
 * --- SECCIÓN ALUMNOS ---
 */
export const addalumno = (curso, nombre, dni, obs, huellaId) => {
    return push(ref(db, nodoAlumnos), { curso, nombre, dni, obs, huellaId, borrar: "No" });
};

export const getalumnosCollection = () => {
    const consultaOrdenada = query(ref(db, nodoAlumnos), orderByChild('dni'));
    return get(consultaOrdenada);
};

export const getalumnoCollection = (id) => get(ref(db, `${nodoAlumnos}/${id}`));

export const updatealumnoCollection = (id, newFields) =>
    update(ref(db, `${nodoAlumnos}/${id}`), newFields);

export const deletealumnoCollection = (id) =>
    remove(ref(db, `${nodoAlumnos}/${id}`));

export const marcarParaBorrar = (id) =>
    update(ref(db, `${nodoAlumnos}/${id}`), { obs: "Borrar" });

/** 
 * --- SECCIÓN ASISTENCIAS --- 
 */

export const listenAsistenciasHoy = (fechaFormateada, callback) => {
    const asistenciaRef = ref(db, `asistencia/${fechaFormateada}`);
    return onValue(asistenciaRef, (snapshot) => {
        callback(snapshot);
    });
};


/** 
 * --- SECCIÓN PRECEPTORES ---
 */

export const addPreceptor = (nombre, turno, usuarioApp, passApp, cargo, obs) =>
    push(ref(db, coleccionPreceptores), { nombre, turno, usuarioApp, passApp, cargo, obs });

// Función para listar
export const getOtrosPreceptoresCollection = () => get(ref(db, coleccionPreceptores));

// Función para eliminar
export const deletePreceptorCollection = (id) => remove(ref(db, `${coleccionPreceptores}/${id}`));

export const updatePreceptorCollection = (id, newFields) =>
    update(ref(db, `${coleccionPreceptores}/${id}`), newFields);

export const getPreceptorCollection = (id) => get(ref(db, `${coleccionPreceptores}/${id}`));


export {  ref, get };