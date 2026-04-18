import { getalumnosCollection, getAsistenciasHoy } from "./firebase.js";

async function calcularProgresoPorCurso() {
    try {
        const [snapAlumnos, snapAsistencias] = await Promise.all([
            getalumnosCollection(),
            getAsistenciasHoy()
        ]);

        // Guardamos los IDs como NÚMEROS para que la comparación sea más fácil
        const huellasPresentesHoy = new Set();
        const hoy = new Date();
        const fechaHoyFormateada = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
        
        console.log("Buscando fichajes para hoy:", fechaHoyFormateada);

        snapAsistencias.forEach(doc => {
            const registro = doc.val();
            if (registro && registro.fichada) {
                const partes = registro.fichada.split(',');
                if (partes.length >= 2) {
                    const idAlumno = partes[0].trim();
                    const fechaCompleta = partes[1].trim();

                    if (fechaCompleta.includes(fechaHoyFormateada)) {
                        // Guardamos como NÚMERO
                        huellasPresentesHoy.add(Number(idAlumno));
                    }
                }
            }
        });

        console.log("IDs presentes hoy (como números):", Array.from(huellasPresentesHoy));

        let totalPresentes = 0;
        let totalAusentes = 0;
        let totalSinHuella = 0;
        const cursos = {};

        snapAlumnos.forEach(doc => {
            const alumno = doc.val();
            // Convertimos el ID del alumno a NÚMERO para comparar
            const hIdRaw = alumno.huellaId;
            const hIdNum = Number(hIdRaw);
            const cursoNombre = alumno.curso || "Sin Curso";

            // DEBUG: Solo para los primeros alumnos, ver qué traen
            if (totalPresentes + totalAusentes < 5) {
                console.log(`Alumno: ${alumno.nombre || 'S/N'} - huellaId original: ${hIdRaw} - convertido: ${hIdNum}`);
            }

            if (hIdRaw === "-1" || hIdRaw === -1) {
                totalSinHuella++;
            } else {
                // Comparamos número contra número
                if (huellasPresentesHoy.has(hIdNum)) {
                    totalPresentes++;
                    if (!cursos[cursoNombre]) cursos[cursoNombre] = { total: 0, presentes: 0 };
                    cursos[cursoNombre].total++;
                    cursos[cursoNombre].presentes++;
                } else {
                    totalAusentes++;
                    if (!cursos[cursoNombre]) cursos[cursoNombre] = { total: 0, presentes: 0 };
                    cursos[cursoNombre].total++;
                }
            }
        });

        console.log(`FINAL -> Presentes: ${totalPresentes}, Ausentes: ${totalAusentes}`);

        renderizarGrafico(totalPresentes, totalAusentes, totalSinHuella);
        actualizarTotalesUI(totalPresentes, totalAusentes, totalSinHuella);
        renderizarTablaCursos(cursos);

    } catch (error) {
        console.error("Error general:", error);
    }
}

// ... (Las funciones actualizarTotalesUI, renderizarTablaCursos y renderizarGrafico se mantienen igual)
// Asegúrate de incluirlas al final de tu archivo.

function actualizarTotalesUI(p, a, s) {
    const div = document.getElementById("totalesGrafico");
    if (!div) return;
    div.innerHTML = `
        <div class="text-center mb-2"><strong>Total Alumnos: ${p + a + s}</strong></div>
        <div class="d-flex justify-content-between text-success"><span>Presentes:</span> <span>${p}</span></div>
        <div class="d-flex justify-content-between text-danger"><span>Ausentes:</span> <span>${a}</span></div>
        <div class="d-flex justify-content-between text-muted border-top mt-2 pt-1">
            <small>Sin Huella (-1):</small> <small>${s}</small>
        </div>`;
}

function renderizarTablaCursos(cursos) {
    const tbody = document.querySelector("#tablaProgreso tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    for (const nombre in cursos) {
        const { total, presentes } = cursos[nombre];
        const porc = total > 0 ? Math.round((presentes / total) * 100) : 0;
        const color = porc >= 80 ? "bg-success" : (porc >= 50 ? "bg-warning" : "bg-danger");
        tbody.innerHTML += `
            <tr>
                <td><strong>${nombre}</strong><br><small>${presentes} de ${total} presentes</small></td>
                <td class="align-middle">
                    <div class="progress" style="height: 20px;">
                        <div class="progress-bar ${color}" style="width: ${porc}%">${porc}%</div>
                    </div>
                </td>
            </tr>`;
    }
}

function renderizarGrafico(p, a, s) {
    const canvas = document.getElementById('graficoGeneral');
    if (!canvas || !window.Chart) return;
    const existingChart = window.Chart.getChart(canvas);
    if (existingChart) existingChart.destroy();
    new window.Chart(canvas, {
        type: 'pie',
        data: {
            labels: ['Presentes', 'Ausentes', 'Sin Huella'],
            datasets: [{ data: [p, a, s], backgroundColor: ['#198754', '#dc3545', '#6c757d'] }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });
}

window.addEventListener("DOMContentLoaded", calcularProgresoPorCurso);
