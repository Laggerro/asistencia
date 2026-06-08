window.onload = function () {
    // 1. Configuración de Firebase
    const firebaseConfig = {
        databaseURL: "https://asistencia-93328-default-rtdb.firebaseio.com"
    };

    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        const db = firebase.database();

        const listaEnrolar = document.getElementById('lista-alumnos');
        const listaBorrar = document.getElementById('lista-borrar');
        const statusMsg = document.getElementById('status');

        // 2. Escuchar cambios en la base de datos
        db.ref('tbl_alumnos').on('value', (snapshot) => {
            listaEnrolar.innerHTML = '';
            listaBorrar.innerHTML = '';
            let countEnrolar = 0;
            let countBorrar = 0;

            snapshot.forEach((childSnapshot) => {
                const uid = childSnapshot.key;
                const data = childSnapshot.val();

                // 1. Lógica para la lista de BORRADO (Si el campo borrar es "Si")
                if (data.borrar === "Si") {
                    countBorrar++;

                    // Determina si va al sensor o directo a Firebase
                    const funcionBorrar = (data.huellaId === -1 || data.huellaId === "-1")
                        ? `borrarSoloFirebase('${uid}')`
                        : `borrarConSensor('${uid}')`;

                    listaBorrar.innerHTML += `
            <tr>
                <td>${data.nombre || 'Sin nombre'}</td>
                <td>${data.dni || '-'}</td>
                <td>
                    <button class="btn-borrar" onclick="${funcionBorrar} ">Borrar</button>
                    <button class="btn-recuperar" onclick="recuperarAlumno('${uid}')">Recuperar</button>
                </td>
            </tr>`;
                }
                // 2. Lógica para la lista de ENROLAR (Si NO está para borrar y no tiene huellaId)
                else if ((data.huellaId === -1 || data.huellaId === "-1") && data.borrar !== "Si") {
                    countEnrolar++;
                    listaEnrolar.innerHTML += `
            <tr>
                <td>${data.nombre || 'Sin nombre'}</td>
                <td>${data.dni || '-'}</td>
                <td><button class="btn-enrolar" onclick="enrolar('${uid}')">Registrar</button></td>
            </tr>`;
                }
            });


            // Actualizar mensajes de estado
            statusMsg.innerText = `Pendientes: ${countEnrolar} para registrar / ${countBorrar} para borrar.`;
            statusMsg.style.color = (countEnrolar === 0 && countBorrar === 0) ? "green" : "#333";

        }, (error) => {
            console.error("Error de Base de datos:", error);
            statusMsg.innerText = "Error al conectar con la Base de datos.";
            statusMsg.style.color = "red";
        });
    }
};

// --- CONFIGURACIÓN Y FUNCIONES GLOBALES ---

//const ipESP32 = "192.168.0.65";
const ipESP32 = window.location.host;

// Función para ENROLAR (Llama al ESP32)
window.enrolar = function (uid) {
    if (!confirm("¿Iniciar proceso de Registro en el sensor?")) return;

    // 1. Buscar en la tabla web el elemento que contiene el nombre del alumno para este UID
    // Para que funcione, asegúrate de que el botón o la fila de tu tabla tenga una forma de identificar el nombre.
    // Una forma limpia y directa es buscar el texto de la primera celda (columna nombre) de la fila actual:
    const boton = document.querySelector(`button[onclick="enrolar('${uid}')"]`);
    const fila = boton.closest('tr');
    const nombreAlumno = fila.cells[0].innerText.trim();

    // 2. Codificamos el nombre para que viaje seguro por la URL (ej: "Juan Perez" -> "Juan%20Perez")
    const nombreCodificado = encodeURIComponent(nombreAlumno);

    // 3. Enviamos la petición al ESP32 incluyendo el parámetro '&nombre='
    ejecutarAccion(`http://${ipESP32}/enrol?uid=${uid}&nombre=${nombreCodificado}`, "Registro exitoso");
};

window.enrolar = function (uid) {
    if (!confirm("¿Iniciar proceso de Registro en el sensor?")) return;
    ejecutarAccion(`http://${ipESP32}/enrol?uid=${uid}`, "Registro exitoso");
};

// Función para BORRAR CUANDO SÍ HAY HUELLA (Llama al ESP32)
window.borrarConSensor = function (uid) {
    if (!confirm("¿Seguro que deseas borrar la huella del sensor y el registro completo?")) return;
    ejecutarAccion(`http://${ipESP32}/delete?uid=${uid}`, "Borrado del sensor y base de datos");
};

// Función para BORRAR CUANDO NO HAY HUELLA (Directo a Firebase, sin ESP32)
window.borrarSoloFirebase = function (uid) {
    if (!confirm("Este alumno no tiene huella registrada. ¿Continuar?")) return;

    firebase.database().ref('tbl_alumnos/' + uid).remove()
        .then(() => alert("Registro borrado de la base de datos"))
        .catch(err => alert("Error al borrar: " + err));
};

// Función genérica para peticiones al ESP32
function ejecutarAccion(url, mensajeExito) {
    const statusMsg = document.getElementById('status');
    statusMsg.innerText = "Comunicando con sensor... espere";
    statusMsg.style.color = "blue";

    fetch(url)
        .then(response => response.text())
        .then(data => {
            if (data === "OK") {
                alert(mensajeExito);
            } else {
                alert("Respuesta del sensor: " + data);
                statusMsg.innerText = "Operación fallida.";
                statusMsg.style.color = "red";
            }
        })
        .catch(err => {
            alert("No se pudo conectar con el DISPOSITIVO. Verifique que esté encendido y en la misma red.");
            console.error("Error Fetch:", err);
            statusMsg.innerText = "Error de conexión con DISPOSITIVO.";
        });
}

window.recuperarAlumno = function (uid) {
    // Cambia el campo borrar a "No"
    firebase.database().ref('tbl_alumnos/' + uid).update({
        borrar: "No"
    })
        .then(() => {
            alert("Alumno recuperado. Volverá al listado general.");
        })
        .catch(err => {
            console.error("Error al recuperar:", err);
            alert("No se pudo recuperar el registro.");
        });
};