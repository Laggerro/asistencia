
import { getalumnosCollection, getAsistenciasHoy } from "./firebase.js";

async function calcularProgresoPorCurso() {
    try {
        // 1. Obtenemos datos de alumnos y asistencias
        const [snapAlumnos, snapAsistencias] = await Promise.all([
            getalumnosCollection(),
            getAsistenciasHoy()
        ]);

        // 2. Identificar huellas que ficharon HOY
        const huellasPresentesHoy = new Set();
        const fechaHoy = new Date().toISOString().split('T')[0];

        snapAsistencias.forEach(doc => {
            const data = doc.val();
            let fechaFichaje = "";
            if (typeof data.timestamp === 'number') {
                fechaFichaje = new Date(data.timestamp).toISOString().split('T')[0];
            } else {
                fechaFichaje = String(data.timestamp);
            }
            if (fechaFichaje.includes(fechaHoy)) {
                huellasPresentesHoy.add(String(data.id_user));
            }
        });

        // 3. Contadores para el gráfico y la tabla
        let totalPresentes = 0;
        let totalAusentes = 0;
        let totalSinHuella = 0;
        const cursos = {};

        snapAlumnos.forEach(doc => {
            const alumno = doc.val();
            const hId = String(alumno.huellaId);
            const cursoNombre = alumno.curso || "Sin Curso";

            // Lógica para contadores del Gráfico (Todos los alumnos)
            if (hId === "-1") {
                totalSinHuella++;
            } else if (huellasPresentesHoy.has(hId)) {
                totalPresentes++;
            } else {
                totalAusentes++;
            }

            // Lógica para la Tabla (Excluye a los -1)
            if (hId !== "-1") {
                if (!cursos[cursoNombre]) {
                    cursos[cursoNombre] = { total: 0, presentes: 0 };
                }
                cursos[cursoNombre].total++;
                if (huellasPresentesHoy.has(hId)) {
                    cursos[cursoNombre].presentes++;
                }
            }
        });

        // 4. Renderizar Gráfico de Torta
        renderizarGrafico(totalPresentes, totalAusentes, totalSinHuella);
// ... dentro de calcularProgresoPorCurso
// ... justo después de renderizar el gráfico




const totalAlumnos = totalPresentes + totalAusentes + totalSinHuella;
const divTotales = document.getElementById("totalesGrafico");

if (divTotales) {
    divTotales.className = "mt-2 p-3"; // Clases de Bootstrap para margen y relleno
    divTotales.innerHTML = `
        <div class="item-total text-dark text-center">
            Total Alumnos: ${totalAlumnos}
        </div>
        <div class="item-dato text-success">
            <span>Presentes:</span> <span>${totalPresentes}</span>
        </div>
        <div class="item-dato text-danger">
            <span>Ausentes:</span> <span>${totalAusentes}</span>
        </div>
        <div class="item-dato text-secondary border-top mt-1 pt-1" style="font-size: 0.9rem;">
            <span>Sin Huella (-1):</span> <span>${totalSinHuella}</span>
        </div>
    `;
}






        // 5. Renderizar Tabla por Cursos
        const tbody = document.querySelector("#tablaProgreso tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        for (const nombreCurso in cursos) {
            const { total, presentes } = cursos[nombreCurso];
            const porcentaje = total > 0 ? Math.round((presentes / total) * 100) : 0;

            let colorBarra = "bg-danger";
            if (porcentaje >= 80) colorBarra = "bg-success";
            else if (porcentaje >= 50) colorBarra = "bg-warning";

            const fila = `
                <tr>
                    <td>
                        <strong>${nombreCurso}</strong><br>
                        <small class="text-muted">${presentes} de ${total} alumnos aptos presentes</small>
                    </td>
                    <td class="align-middle">
                        <div class="progress" style="height: 25px;">
                            <div class="progress-bar progress-bar-striped progress-bar-animated ${colorBarra}" 
                                 role="progressbar" style="width: ${porcentaje}%">
                                ${porcentaje}%
                            </div>
                        </div>
                    </td>
                </tr>`;
            tbody.innerHTML += fila;
        }

    } catch (error) {
        console.error("Error al procesar el progreso:", error);
    }
}

function renderizarGrafico(p, a, s) {
    const canvas = document.getElementById('graficoGeneral');
    if (!canvas) return;

    // Intentamos obtener la clase Chart de la ventana global
    const MiChart = window.Chart;

    if (typeof MiChart === 'undefined') {
        console.error("Error: El archivo chart.umd.js no se cargó correctamente.");
        canvas.parentElement.innerHTML = "<p>Error al cargar el archivo de gráficos.</p>";
        return;
    }

    new MiChart(canvas, {
        type: 'pie',
        data: {
            labels: ['Presentes', 'Ausentes', 'Sin Huella'],
            datasets: [{
                data: [p, a, s],
                backgroundColor: ['#198754', '#dc3545', '#6c757d']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}


window.addEventListener("DOMContentLoaded", calcularProgresoPorCurso);
