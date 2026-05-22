import { getalumnosCollection, listenAsistenciasHoy } from "./firebase.js";


async function iniciarMonitoreoAsistencias() {
  try {
    // Levantamos los datos estáticos de alumnos una sola vez al inicio
    const snapAlumnos = await getalumnosCollection();

    // 1. Generamos la fecha de hoy con el formato AÑO#MES#DIA (ej: 2026#05#21)
    const hoy = new Date();
    const fechaHoyFormateada = `${hoy.getFullYear()}_${String(hoy.getMonth() + 1).padStart(2, '0')}_${String(hoy.getDate()).padStart(2, '0')}`;

    console.log("Escuchando tiempo real en el nodo de hoy:", fechaHoyFormateada);

    // 2. Iniciamos la escucha pasando la fecha calculada
    listenAsistenciasHoy(fechaHoyFormateada, (snapAsistencias) => {
      const huellasPresentesHoy = new Set();

      // Procesamos los registros (que ahora pertenecen exclusivamente a HOY)
      snapAsistencias.forEach(doc => {
        try {
          const valorRaw = doc.val();
          if (!valorRaw) return;

          // Conversión del string JSON o lectura directa del objeto
          const registro = typeof valorRaw === "string" ? JSON.parse(valorRaw) : valorRaw;

          // COMPATIBILIDAD DE FORMATO:
          // Opción A: Si sigues guardando el string antiguo "id, fecha completo" dentro del nuevo nodo
          if (registro && registro.fichada) {
            const partes = registro.fichada.split(',');
            if (partes.length >= 1) {
              const idAlumno = partes[0].trim();
              huellasPresentesHoy.add(Number(idAlumno));
            }
          }
          // Opción B: Si en tu nuevo nodo guardas el ID limpio (ej: { huellaId: 5, hora: "12:30" })
          else if (registro && registro.huellaId !== undefined) {
            huellasPresentesHoy.add(Number(registro.huellaId));
          }

        } catch (e) {
          console.error("Error al procesar registro:", doc.key, e);
        }
      });

      // 3. Ejecutamos los contadores utilizando el Set actualizado (Se mantiene igual)
      let totalPresentes = 0;
      let totalAusentes = 0;
      let totalSinHuella = 0;
      const cursos = {};

      snapAlumnos.forEach(doc => {
        const alumno = doc.val();
        const hIdRaw = alumno.huellaId;
        const hIdNum = Number(hIdRaw);
        const cursoNombre = alumno.curso || "Sin Curso";

        if (hIdRaw === "-1" || hIdRaw === -1) {
          totalSinHuella++;
        } else {
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

      // 4. Renderizado automático instantáneo en la UI
      renderizarGrafico(totalPresentes, totalAusentes, totalSinHuella);
      actualizarTotalesUI(totalPresentes, totalAusentes, totalSinHuella);
      renderizarTablaCursos(cursos);
    });

  } catch (error) {
    console.error("Error crítico al inicializar el monitoreo:", error);
  }
}

function actualizarTotalesUI(p, a, s) {
  const div = document.getElementById("totalesGrafico");
  if (!div) return;
  div.innerHTML = `
        <div class="text-center mb-2"><strong>Total Alumnos: ${p + a + s}</strong></div>
        <div class="d-flex justify-content-between text-success"><span>Presentes:</span> <span>${p}</span></div>
        <div class="d-flex justify-content-between text-danger"><span>Ausentes:</span> <span>${a}</span></div>
        <div class="d-flex justify-content-between text-normal border-top mt-2 pt-1">
            <small>Sin registro de Huella :</small> <small>${s}</small>
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


// Escuchamos el evento de carga del DOM para arrancar el listener activo
window.addEventListener("DOMContentLoaded", iniciarMonitoreoAsistencias);

