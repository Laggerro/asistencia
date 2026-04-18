// Configuración de tu Firebase
// Esperar a que toda la página y librerías externas carguen
window.onload = function() {
    
    // 1. Configuración de Firebase
    const firebaseConfig = {
        databaseURL: "https://asistencia-93328-default-rtdb.firebaseio.com"
   };

    // INICIALIZACIÓN CORRECTA PARA VERSIÓN COMPAT
    if (typeof firebase !== 'undefined') {
        firebase.initializeApp(firebaseConfig);
        
        // Aquí está el cambio: nos aseguramos de llamar al módulo correctamente
        const db = firebase.database(); 

        const listaBody = document.getElementById('lista-alumnos');
        const statusMsg = document.getElementById('status');

        console.log("Conectado a Firebase Realtime Database");


        // 2. Escuchar cambios en la tabla tbl_alumnos
        db.ref('tbl_alumnos').on('value', (snapshot) => {
            listaBody.innerHTML = '';
            let count = 0;

            snapshot.forEach((childSnapshot) => {
                const uid = childSnapshot.key;
                const data = childSnapshot.val();

                // Filtrar solo los que tienen huellId == -1
                if (data.huellaId === -1) {
                    count++;
                    const row = `
                        <tr>
                            <td>${data.nombre || 'Sin nombre'}</td>
                            <td>${data.curso || '-'}</td>
                            <td>${data.dni || '-'}</td>
                            <td>${data.obs || ''}</td>
                            <td>
                                <button class="btn-enrol" onclick="enrolar('${uid}')">Enrolar</button>
                            </td>
                        </tr>
                    `;
                    listaBody.innerHTML += row;
                }
            });

            if (count > 0) {
                statusMsg.innerText = `Se encontraron ${count} alumnos pendientes de enrolar.`;
                statusMsg.style.color = "#333";
            } else {
                statusMsg.innerText = "No hay alumnos para enrolar en este momento.";
                statusMsg.style.color = "green";
            }
        }, (error) => {
            console.error("Error de Firebase:", error);
            statusMsg.innerText = "Error al leer de Firebase. Revisa la consola.";
            statusMsg.style.color = "red";
        });

    } else {
        console.error("Firebase no se cargó. Verifica tu conexión a internet.");
        document.getElementById('status').innerText = "Error: No se pudo cargar Firebase desde Google.";
    }
};

// 3. Función de Enrolamiento (Global para que el botón la vea)

// 3. Función de Enrolamiento (Global para que el botón la vea)
window.enrolar = function(uid) {
    const statusMsg = document.getElementById('status');
    const ipESP32 = "192.168.0.65"; // Tu IP actual
    
    if(!confirm("¿Deseas iniciar el proceso de enrolamiento para este alumno?")) return;
    
    statusMsg.innerText = "Esperando al sensor... Pon el dedo cuando el LED parpadee.";
    statusMsg.style.color = "blue";

    // USAR ESTA LÍNEA EXACTA (Fíjate que lleva los acentos graves ` )
    fetch(`http://${ipESP32}/enrol?uid=${uid}`)
        .then(response => response.text())
        .then(data => {
            if(data === "OK") {
                alert("¡Enrolamiento exitoso!");
            } else {
                alert("El sensor no capturó la huella: " + data);
                statusMsg.innerText = "Fallo en el enrolamiento.";
                statusMsg.style.color = "red";
            }
        })
        .catch(err => {
            alert("Error de comunicación con el ESP32. ¿Está en la misma red?");
            console.error("Error fetch:", err);
        });
};
