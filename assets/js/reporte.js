import { db } from './firebase.js'; // Ajusta la ruta a tu archivo
import { ref, get, push } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const btnGenerar = document.getElementById('btnGenerar');
const btnPdf = document.getElementById('btnPdf');
const resultado = document.getElementById('resultado');




btnGenerar.addEventListener('click', async () => {
    const fechaSeleccionada = document.getElementById('fechaFiltro').value;
    console.log("Fecha del calendario:", fechaSeleccionada); // Debe salir 2026-05-07

    if (!fechaSeleccionada) return alert("Selecciona una fecha");

    const [asistSnap, alumnosSnap] = await Promise.all([
        get(ref(db, "asistencia")),
        get(ref(db, "tbl_alumnos"))
    ]);

    const asistencias = asistSnap.val() || {};
    const alumnos = alumnosSnap.val() || {};
    const reporteMap = {};

    Object.values(asistencias).forEach(asist => {
        // 1. Limpiamos espacios por si las dudas
        const datoLimpio = asist.fichada.trim();

        // 2. Separamos por la coma
        const partes = datoLimpio.split(',');
        const hId = partes[0]; // "1"
        const fechaHoraISO = partes[1]; // "2026-05-07T08:18:59"

        if (fechaHoraISO) {
            const fechaSolo = fechaHoraISO.substring(0, 10); // "2026-05-07"

            // LOG DE CONTROL: Quita esto cuando funcione
            console.log(`Comparando: DB(${fechaSolo}) vs Calendario(${fechaSeleccionada})`);

            if (fechaSolo === fechaSeleccionada) {
                // Buscamos al alumno. Usamos == para no tener problemas si uno es string y otro number
                const alumnoInfo = Object.values(alumnos).find(a => a.huellaId == hId);

                if (alumnoInfo) {
                    const curso = alumnoInfo.curso;
                    if (!reporteMap[curso]) reporteMap[curso] = [];

                    reporteMap[curso].push({
                        nombre: alumnoInfo.nombre,
                        dni: alumnoInfo.dni,
                        hora: fechaHoraISO.substring(11, 16)
                    });
                } else {
                    console.warn(`No se encontró alumno para huellaId: ${hId}`);
                }
            }
        }
    });

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
    const file = csvFile.files[0]; // Corregido: seleccionamos el primer archivo
    if (!file) return alert("Selecciona un archivo CSV primero");

    const reader = new FileReader();
    reader.readAsText(file, 'UTF-8'); // Forzamos UTF-8 para las tildes

    reader.onload = function (e) {
        const contenido = e.target.result;
        const lineas = contenido.split(/\r?\n/); // Corta por cualquier salto de línea

        let cargados = 0;

        // Empezamos en 1 para saltar encabezados
        for (let i = 1; i < lineas.length; i++) {
            if (lineas[i].trim() === "") continue; // Salta líneas vacías

            // Detecta si el separador es coma o punto y coma
            const separador = lineas[i].includes(';') ? ';' : ',';
            const columnas = lineas[i].split(separador);

            if (columnas.length >= 4) {
                const nuevoAlumno = {
                    nombre: columnas[0].trim(),
                    dni: columnas[1].trim(),
                    curso: columnas[2].trim(),
                    huellaId: parseInt(columnas[3].trim()),
                    obs: "Ninguna",
                    borrar: "No"
                };

                push(ref(db, 'tbl_alumnos'), nuevoAlumno)
                    .then(() => console.log("Alumno subido"))
                    .catch(err => console.error("Error al subir:", err));

                cargados++;
            }
        }
        alert(`Proceso finalizado. Se enviaron ${cargados} alumnos.`);
    };
});
