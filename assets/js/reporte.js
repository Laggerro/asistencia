import { db } from './firebase.js'; // Ajusta la ruta a tu archivo
import { ref, get, push } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const btnGenerar = document.getElementById('btnGenerar');
const btnPdf = document.getElementById('btnPdf');
const resultado = document.getElementById('resultado');

btnGenerar.addEventListener('click', async () => {
    // 1. Declaramos la variable capturando el valor del input
    const fechaSeleccionada = document.getElementById('fechaFiltro').value;
    console.log("Fecha del calendario:", fechaSeleccionada); 

    if (!fechaSeleccionada) return alert("Selecciona una fecha");

    // 2. Convertimos el formato de fecha para Firebase: "2026-05-22" -> "2026_05_22"
    const fechaNodoFirebase = fechaSeleccionada.replace(/-/g, '_');

    // 3. Consultamos ÚNICAMENTE el subnodo de la fecha elegida y los alumnos
    const [asistSnap, alumnosSnap] = await Promise.all([
        get(ref(db, `asistencia/${fechaNodoFirebase}`)),
        get(ref(db, "tbl_alumnos"))
    ]);

    const asistenciasHoy = asistSnap.val() || {};
    const alumnos = alumnosSnap.val() || {};
    const reporteMap = {};

    // 4. Recorremos las asistencias de ese día específico
    Object.values(asistenciasHoy).forEach(asist => {
        let datosAsistencia;

        try {
            // Convertimos el texto JSON a objeto real si viene entre comillas
            datosAsistencia = typeof asist === "string" ? JSON.parse(asist) : asist;
        } catch (error) {
            console.error("Error al parsear el registro de asistencia:", asist);
            return; // Salta este registro roto
        }

        // Validación: Si no hay datos válidos o falta 'fichada', lo saltamos
        if (!datosAsistencia || !datosAsistencia.fichada) return;

        // Separamos los datos por la coma
        const partes = datosAsistencia.fichada.trim().split(',');
        const hId = partes[0]; 
        const fechaHoraISO = partes[1]; 

        if (fechaHoraISO) {
            // Buscamos al alumno por su huellaId
            const alumnoInfo = Object.values(alumnos).find(a => a.huellaId == hId);

            if (alumnoInfo) {
                const curso = alumnoInfo.curso;
                if (!reporteMap[curso]) reporteMap[curso] = [];

                reporteMap[curso].push({
                    nombre: alumnoInfo.nombre,
                    dni: alumnoInfo.dni,
                    hora: fechaHoraISO.substring(11, 16) // Extrae "19:28"
                });
            } else {
                console.warn(`No se encontró alumno para huellaId: ${hId}`);
            }
        }
    });

    // 5. Renderizamos el resultado final
    renderizarReporte(reporteMap, fechaSeleccionada);
});


function renderizarReporte(data, fecha) {
    if (Object.keys(data).length === 0) {
        resultado.innerHTML = "<p>No hay asistencias para este día.</p>";
        btnPdf.style.display = "none";
        return;
    }

    const fechaObj = new Date(fecha + 'T00:00:00'); // Forzamos hora local para evitar desfases
    const opciones = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    const fechaTexto = fechaObj.toLocaleDateString('es-ES', opciones);
    document.getElementById('tituloReporte').innerText = `Asistencias - ${fechaTexto}`;

    let html = "";
    for (const curso in data) {
        html += `
            <div class="seccion-curso">
                <h3>Curso: ${curso}</h3>
                <table>
                    <thead>
                        <tr><th>Nombre</th><th>DNI</th><th>Hora</th></tr>
                    </thead>
                    <tbody>
                        ${data[curso].map(al => `
                            <tr><td>${al.nombre}</td><td>${al.dni}</td><td>${al.hora} hs</td></tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>`;
    }
    resultado.innerHTML = html;

    btnPdf.style.display = "block";
}

// Lógica para descargar PDF
btnPdf.addEventListener('click', () => {
    const elemento = document.getElementById('hoja');

    // Usamos window.html2pdf para forzar la búsqueda de la librería global
    const libreriaPdf = window.html2pdf || html2pdf;

    if (!libreriaPdf) {
        alert("La librería aún no cargó. Revisa que la URL en el HTML sea correcta (cdnjs).");
        return;
    }

    const opciones = {
        margin: 1,
        filename: `Reporte_${document.getElementById('fechaFiltro').value}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
    };

    libreriaPdf().set(opciones).from(elemento).save();
});

const btnCargarCsv = document.getElementById('btnCargarCsv');
const csvFile = document.getElementById('csvFile');

btnCargarCsv.addEventListener('click', () => {
    const file = csvFile.files[0];
    if (!file) return alert("Selecciona un archivo CSV primero");

    console.log("Archivo detectado:", file.name);

    const reader = new FileReader();

    reader.onload = function (e) {
        const contenido = e.target.result.replace(/^\ufeff/, "");

        // 1. Separador de líneas ultra-compatible (detecta cualquier tipo de salto)
        const lineas = contenido.split(/\r\n|\n|\r/);
        console.log("Total de líneas detectadas:", lineas.length);

        let cargados = 0;
        const hoy = new Date().toLocaleDateString('es-AR');

        for (let i = 1; i < lineas.length; i++) {
            const linea = lineas[i].trim();
            if (!linea) continue;

            // 2. Usamos punto y coma porque tu log mostró: "Alumno;dni;curso..."
            const columnas = linea.split(';');

            console.log(`Línea ${i}: ${columnas.length} columnas detectadas`);

            if (columnas.length >= 5) {
                const nuevoAlumno = {
                    nombre: columnas[0].trim(),
                    dni: columnas[1].trim(),
                    curso: columnas[2].trim(),
                    huellaId: parseInt(columnas[3].trim()) || 0,
                    foto: columnas[4].trim(),
                    actualizado: hoy,
                    obs: "Ninguna",
                    borrar: "No"
                };

                push(ref(db, 'tbl_alumnos'), nuevoAlumno);
                cargados++;
            }
        }
        alert("Cargados: " + cargados);
    };

    reader.readAsText(file, 'UTF-8');
});
