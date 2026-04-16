import { getalumnosCollection, getAsistenciasHoy } from "./firebase.js";

async function calcularProgresoPorCurso() {
    try {
        // Obtenemos los alumnos y las asistencias en paralelo
        const [snapAlumnos, snapAsistencias] = await Promise.all([
            getalumnosCollection(),
            getAsistenciasHoy()
        ]);

        const alumnos = [];
        snapAlumnos.forEach(doc => {
            alumnos.push({ id: doc.key, ...doc.val() });
        });

        // Identificamos quiénes asistieron HOY
        const presentesHoy = new Set();
        const fechaHoy = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD

               snapAsistencias.forEach(doc => {
            const data = doc.val();
            
            // Convertimos el timestamp a String por si es un número o fecha
            // Si es un número (milisegundos), lo convertimos a formato YYYY-MM-DD
            let fechaFichaje = "";
            
            if (typeof data.timestamp === 'number') {
                fechaFichaje = new Date(data.timestamp).toISOString().split('T')[0];
            } else {
                fechaFichaje = String(data.timestamp); // Lo forzamos a texto
            }

            // Ahora comparamos de forma segura
            if (fechaFichaje.includes(fechaHoy)) {
                presentesHoy.add(data.id_user); 
            }
        });
    
    

        // Agrupamos por curso
        const cursos = {};
        alumnos.forEach(alumno => {
            if (!cursos[alumno.curso]) {
                cursos[alumno.curso] = { total: 0, presentes: 0 };
            }
            cursos[alumno.curso].total++;
            if (presentesHoy.has(alumno.id)) {
                cursos[alumno.curso].presentes++;
            }
        });

        // Renderizamos la tabla
        const tbody = document.querySelector("#tablaProgreso tbody");
        tbody.innerHTML = "";

        for (const nombreCurso in cursos) {
            const { total, presentes } = cursos[nombreCurso];
            const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

            const fila = `
                <tr>
                    <td>${nombreCurso} <br><small class="text-muted">${presentes} de ${total} presentes</small></td>
                    <td class="align-middle">
                        <div class="progress" style="height: 20px;">
                            <div class="progress-bar progress-bar-striped progress-bar-animated ${porcentaje < 50 ? 'bg-danger' : 'bg-success'}" 
                                 role="progressbar" 
                                 style="width: ${porcentaje}%">
                                 ${porcentaje}%
                            </div>
                        </div>
                    </td>
                </tr>`;
            tbody.innerHTML += fila;
        }
    } catch (error) {
        console.error("Error al procesar datos:", error);
    }
}

window.addEventListener("DOMContentLoaded", calcularProgresoPorCurso);
