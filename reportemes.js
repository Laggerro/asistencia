// reportes_mensuales.js
// IMPORTANTE: Importamos las herramientas vinculadas directamente desde tu archivo unificado
import { db, ref, get } from "./assets/js/firebase.js";

// Referencias a los elementos del DOM
const selectMes = document.getElementById('mesFiltro');
const selectCurso = document.getElementById('cursoFiltro');
const btnGenerarMensual = document.getElementById('btnGenerarMensual');

/**
 * Rellena de forma dinámica el selector de cursos al cargar la página
 */
async function cargarCursosEnSelect() {
    try {
        const CollegeCursosSnap = await get(ref(db, "cursos"));
        const todosLosCursos = CollegeCursosSnap.val() || {};
        
        selectCurso.innerHTML = '<option value="">-- Selecciona un Curso --</option>';
        
        Object.values(todosLosCursos).forEach(curso => {
            const option = document.createElement('option');
            option.value = curso.curso; 
            option.textContent = curso.curso;
            selectCurso.appendChild(option);
        });
    } catch (error) {
        console.error("Error al cargar los cursos en el selector:", error);
    }
}

/**
 * Escuchador del botón que gatilla la lógica de cálculo y filtrado masivo
 */
btnGenerarMensual.addEventListener('click', async () => {
    const mesSeleccionado = selectMes.value; 
    const cursoSeleccionado = selectCurso.value;

    if (!mesSeleccionado || !cursoSeleccionado) {
        return alert("Por favor, selecciona un mes y un curso.");
    }

    // 1. Cálculos de tiempo base del calendario
    const [anio, mes] = mesSeleccionado.split('-');
    const diasEnMes = new Date(anio, mes, 0).getDate(); 
    const prefijoMesFirebase = `${anio}_${mes}`; 

    // 2. Consulta paralela en Firebase usando los elementos importados
    const [asistSnap, alumnosSnap, cursosSnap] = await Promise.all([
        get(ref(db, "asistencia")), 
        get(ref(db, "tbl_alumnos")),
        get(ref(db, "cursos"))
    ]);

    const todasLasAsistencias = asistSnap.val() || {};
    const todosLosAlumnos = alumnosSnap.val() || {};
    const todosLosCursos = cursosSnap.val() || {};

    // 3. Buscar el horario de ingreso del curso seleccionado
    const cursoInfo = Object.values(todosLosCursos).find(c => c.curso === cursoSeleccionado);
    if (!cursoInfo || !cursoInfo.ingreso) {
        return alert(`No se encontró el horario de ingreso configurado para el curso: ${cursoSeleccionado}`);
    }

    const [horaIngreso, minIngreso] = cursoInfo.ingreso.split(':').map(Number);
    const limiteIngresoMinutos = (horaIngreso * 60) + minIngreso;

    // 4. Filtramos los alumnos pertenecientes al curso seleccionado
    const alumnosDelCurso = Object.values(todosLosAlumnos).filter(a => a.curso === cursoSeleccionado);

    if (alumnosDelCurso.length === 0) {
        return alert("No hay alumnos registrados en el curso seleccionado.");
    }

    const reporteMensual = [];

    // 5. ITERACIÓN CENTRAL: Alumno por Alumno
    alumnosDelCurso.forEach(alumno => {
        const registroAlumno = {
            nombre: alumno.nombre,
            dni: alumno.dni,
            asistenciasDias: {},
            totalAnual: 0 
        };

        // --- SUB-CÁLCULO 1: Cómputo del Total Anual ---
        Object.keys(todasLasAsistencias).forEach(nodoDiaKey => {
            if (nodoDiaKey.startsWith(anio)) {
                const asistenciasDelDia = todasLasAsistencias[nodoDiaKey] || {};
                
                Object.values(asistenciasDelDia).forEach(registro => {
                    let datos = typeof registro === "string" ? JSON.parse(registro) : registro;
                    if (datos && datos.fichada) {
                        const partes = datos.fichada.trim().split(',');
                        if (partes[0] == alumno.huellaId) {
                            registroAlumno.totalAnual++; 
                        }
                    }
                });
            }
        });

        // --- SUB-CÁLCULO 2: Procesamiento Diario del Mes Seleccionado ---
        for (let dia = 1; dia <= diasEnMes; dia++) {
            const diaFormateado = String(dia).padStart(2, '0');
            const nodoDiaKey = `${prefijoMesFirebase}_${diaFormateado}`;
            const asistenciasDelDia = todasLasAsistencias[nodoDiaKey] || {};
            
            let fichadaAlumno = null;

            Object.values(asistenciasDelDia).forEach(registro => {
                let datos = typeof registro === "string" ? JSON.parse(registro) : registro;
                if (datos && datos.fichada) {
                    const partes = datos.fichada.trim().split(',');
                    if (partes[0] == alumno.huellaId) {
                        fichadaAlumno = partes[1]; // Guardamos la cadena ISO: "2026-05-21T19:28:35"
                    }
                }
            });

            // Aplicación de Reglas de Negocio en base a los minutos de retardo
            if (!fichadaAlumno) {
                registroAlumno.asistenciasDias[dia] = 'A'; 
            } else {
                const horaFichadaISO = fichadaAlumno.substring(11, 19);
                const [hFichada, mFichada] = horaFichadaISO.split(':').map(Number);
                const minutosFichada = (hFichada * 60) + mFichada;

                const diferenciaMinutos = minutosFichada - limiteIngresoMinutos;

                if (diferenciaMinutos <= 0) {
                    registroAlumno.asistenciasDias[dia] = 'P'; 
                } else if (diferenciaMinutos > 0 && diferenciaMinutos <= 30) {
                    registroAlumno.asistenciasDias[dia] = 't'; 
                } else if (diferenciaMinutos > 30 && diferenciaMinutos <= 60) {
                    registroAlumno.asistenciasDias[dia] = 'T'; 
                } else {
                    registroAlumno.asistenciasDias[dia] = 'R'; 
                }
            }
        }

        reporteMensual.push(registroAlumno);
    });

    // 6. Renderizar la tabla con la información procesada
    renderizarReporteMensual(reporteMensual, diasEnMes, mesSeleccionado);
});

/**
 * Construye la interfaz gráfica y la inyecta en el HTML
 */
function renderizarReporteMensual(reporteMensual, diasEnMes, mesSeleccionado) {
    const contenedor = document.getElementById('contenedorTabla');
    const [anio, mes] = mesSeleccionado.split('-').map(Number);
    
    const semanas = { "Semana 01": [], "Semana 02": [], "Semana 03": [], "Semana 04": [], "Semana 05": [] };
    let contadorSemana = 1;

    for (let dia = 1; dia <= diasEnMes; dia++) {
        const fecha = new Date(anio, mes - 1, dia);
        const numeroDiaSemana = fecha.getDay(); 

        if (numeroDiaSemana !== 0 && numeroDiaSemana !== 6) { 
            semanas[`Semana 0${contadorSemana}`].push({
                numeroDia: dia,
                nombreDia: ['D', 'L', 'M', 'M', 'J', 'V', 'S'][numeroDiaSemana]
            });
        }
        
        if (numeroDiaSemana === 5) { 
            contadorSemana++;
        }
    }

    let htmlSemanas = '<th rowspan="2" class="col-nombre">Nombre</th>';
    let htmlDias = '';
    let totalColumnasDias = 0;

    Object.keys(semanas).forEach(semanaKey => {
        const diasDeLaSemana = semanas[semanaKey];
        if (diasDeLaSemana.length > 0) {
            htmlSemanas += `<th colspan="${diasDeLaSemana.length}">${semanaKey}</th>`;
            diasDeLaSemana.forEach(d => {
    htmlDias += `
        <th title="Día ${d.numeroDia}">
            ${d.nombreDia}<br>
            <small style="font-size: 10px; opacity: 0.8; display: block; margin-top: 2px;">
                ${String(d.numeroDia).padStart(2, '0')}
            </small>
        </th>`;
    totalColumnasDias++;
});
        }
    });
    
    htmlSemanas += '<th rowspan="2" class="col-total">Total Mensual</th>';
    htmlSemanas += '<th rowspan="2" class="col-total">Total Anual</th>';

    let htmlCuerpo = '';

    reporteMensual.forEach(alumno => {
        let fila = `<tr><td><strong>${alumno.nombre}</strong><br><small class="text-muted">${alumno.dni}</small></td>`;
        let asistenciasTotalesMes = 0;

        Object.keys(semanas).forEach(semanaKey => {
            semanas[semanaKey].forEach(d => {
                const estado = alumno.asistenciasDias[d.numeroDia] || 'A';
                
                let claseEstilo = 'asist-ausente'; 
                let iconoMostrado = 'A';

                if (estado === 'P') { claseEstilo = 'asist-presente'; iconoMostrado = '✔'; asistenciasTotalesMes++; }
                else if (estado === 't') { claseEstilo = 'asist-tarde-breve'; iconoMostrado = 't'; asistenciasTotalesMes++; }
                else if (estado === 'T') { claseEstilo = 'asist-tarde-media'; iconoMostrado = 'T'; asistenciasTotalesMes++; }
                else if (estado === 'R') { claseEstilo = 'asist-retraso'; iconoMostrado = 'R'; asistenciasTotalesMes++; }

                fila += `<td class="celda-asist ${claseEstilo}">${iconoMostrado}</td>`;
            });
        });

        fila += `<td class="celda-total">${asistenciasTotalesMes} / ${totalColumnasDias}</td>`;
        fila += `<td class="celda-total-anual">${alumno.totalAnual}</td></tr>`;
        htmlCuerpo += fila;
    });

    contenedor.innerHTML = `
        <div class="table-responsive">
            <h2 class="titulo-control">CONTROL ASISTENCIA</h2>
            <table class="tabla-control">
                <thead>
                    <tr>${htmlSemanas}</tr>
                    <tr>${htmlDias}</tr>
                </thead>
                <tbody>
                    ${htmlCuerpo}
                </tbody>
            </table>
        </div>
    `;
}

// Inicialización automática de selectores al arrancar la app
cargarCursosEnSelect();
