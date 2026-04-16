import {
    addEmpleado,
    getEmpleadosCollection,
    deleteEmpleadoCollection,
    getEmpleadoCollection,
    updateEmpleadoCollection,
} from "./firebase.js";

/**
 * Función para refrescar la tabla después de cualquier acción
 */
async function refrescarTabla() {
    await mostrarEmpleadosEnHTML();
}

window.miModal = async function (idModal, idEmpleado = "") {
    try {
        // 1. Limpieza de seguridad
        const existing = document.getElementById(idModal);
        if (existing) {
            const ins = bootstrap.Modal.getInstance(existing);
            if (ins) ins.dispose();
            existing.remove();
        }
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

        // 2. Cargar el PHP
        let url = "";
        switch (idModal) {
            case "agregarEmpleadoModal": url = "modales/modalAdd.php"; break;
            case "detalleEmpleadoModal": url = "modales/modalDetalles.php"; break;
            case "editarEmpleadoModal": url = "modales/modalEditar.php"; break;
            case "eliminarEmpleadoModal": url = "modales/modalDelete.php"; break;
            default: return;
        }

        const response = await fetch(url);
        const text = await response.text();

        // 3. Convertir texto a elementos y FILTRAR solo el DIV del modal
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(text, 'text/html');
        
        // Esto busca el div.modal real ignorando comentarios y textos
        const modalElement = htmlDoc.querySelector('.modal');

        if (!modalElement) {
            console.error("No se encontró un div con clase 'modal' en el archivo cargado.");
            return;
        }

        // 4. Inyectar y mostrar
        document.body.appendChild(modalElement);

        const myModal = new bootstrap.Modal(modalElement);
        myModal.show();

        // 5. Cargar datos según corresponda
        if (idModal === "detalleEmpleadoModal") {
            await cargarDetalleEmpleado(idEmpleado);
        } else if (idModal === "editarEmpleadoModal") {
            await getEmpleadoUpdateCollection(idEmpleado);
        } else if (idModal === "eliminarEmpleadoModal") {
            const btn = modalElement.querySelector("#confirmDeleteBtn");
            if (btn) btn.onclick = async () => { await eliminarEmpleado(idEmpleado); myModal.hide(); };
        }

    } catch (error) {
        console.error("Error al abrir modal:", error);
    }
};

async function mostrarEmpleadosEnHTML() {
    try {
        const queryCollection = await getEmpleadosCollection();
        const tablaEmpleados = document.querySelector("#tablaEmpleados tbody");
        if (!tablaEmpleados) return;

        tablaEmpleados.innerHTML = "";

        queryCollection.forEach((doc) => {
            const empleado = doc.val();
            const id = doc.key;
            const fila = document.createElement("tr");
            fila.id = id; 
            fila.innerHTML = `
                <td>${empleado.curso}</td>
                <td>${empleado.nombre}</td>
                <td>${empleado.dni}</td>
                <td>${empleado.obs}</td>
                <td>
                    <a title="Ver detalles" href="#" onclick="window.miModal('detalleEmpleadoModal','${id}')" class="btn btn-success btn-sm">
                        <i class="bi bi-binoculars"></i>
                    </a>
                    <a title="Editar" href="#" onclick="window.miModal('editarEmpleadoModal','${id}')" class="btn btn-warning btn-sm">
                        <i class="bi bi-pencil-square"></i>
                    </a>
                    <a title="Eliminar" href="#" onclick="window.miModal('eliminarEmpleadoModal','${id}')" class="btn btn-danger btn-sm">
                        <i class="bi bi-trash"></i>
                    </a> 
                </td>
            `;
            tablaEmpleados.appendChild(fila);
        });
    } catch (error) {
        console.error("Error al obtener los empleados:", error);
    }
}

/**
 * Función para mostrar alertas (Usando iziToast)
 * Movida arriba para que esté disponible cuando se necesite.
 */
window.mostrarAlerta = function ({ tipoToast, mensaje }) {
    if (typeof iziToast === 'undefined') {
        console.warn("iziToast no está cargado, usando alert normal:", mensaje);
        alert(mensaje);
        return;
    }

    if (tipoToast === "success") {
        iziToast.success({
            timeout: 5000,
            icon: "bi bi-check-circle-fill",
            title: "¡Éxito!",
            message: mensaje,
            position: "topRight"
        });
    } else if (tipoToast === "error" || tipoToast === "warning") {
        iziToast.error({
            timeout: 5000,
            icon: "bi bi-x-circle-fill",
            title: "¡Error!",
            message: mensaje,
            position: "topRight"
        });
    }
};

// ... resto de tus funciones (addNuevoEmpleado, etc.)


/**
 * CREATE: Agrega un nuevo empleado
 */
window.addNuevoEmpleado = async function (event) {
    event.preventDefault();
    const formulario = document.querySelector("#formularioEmpleado");
    const formData = new FormData(formulario);
    const dataJSON = Object.fromEntries(formData.entries());

    try {
        await addEmpleado(dataJSON.curso, dataJSON.nombre, dataJSON.dni, dataJSON.obs );
        formulario.reset();
        
        const modalElt = document.getElementById("agregarEmpleadoModal");
        bootstrap.Modal.getInstance(modalElt).hide();
        
        window.mostrarAlerta({ tipoToast: "success", mensaje: "¡Alumno registrado con éxito!" });
        await refrescarTabla();
    } catch (error) {
        console.error("Error al añadir:", error);
    }
};

/**
 * READ ONE: Detalles del empleado
 */
async function cargarDetalleEmpleado(id) {
    try {
        const empleadoDoc = await getEmpleadoCollection(id);
        if (empleadoDoc.exists()) {
            const data = empleadoDoc.val();
            const contenedor = document.querySelector("#detalleEmpleadoContenido ul");
            if (!contenedor) return;

            contenedor.innerHTML = ` 
                <li class="list-group-item"><b>Curso:</b> ${data.curso || "N/A"}</li>
                <li class="list-group-item"><b>Apellido y Nombre:</b> ${data.nombre || "N/A"}</li>
                <li class="list-group-item"><b>DNI:</b> ${data.dni || "N/A"}</li>
                <li class="list-group-item"><b>Obs:</b> ${data.obs || "N/A"}</li>
            `;
        }
    } catch (error) {
        console.error("Error al cargar detalles:", error);
    }
}

/**
 * UPDATE: Cargar datos en el formulario de edición
 */
async function getEmpleadoUpdateCollection(id) {
    try {
        const empleadoDoc = await getEmpleadoCollection(id);
        if (empleadoDoc.exists()) {
            const data = empleadoDoc.val();
            document.querySelector("#idEmpleado").value = id;
            document.querySelector("#curso").value = "Cambiar esto";
            document.querySelector("#nombre").value = data.nombre;
            document.querySelector("#dni").value = data.dni;
            document.querySelector("#obs").value = data.obs;
        }
    } catch (error) {
        console.error("Error al obtener datos para editar:", error);
    }
}

/**
 * UPDATE: Guardar cambios del empleado
 */
window.actualizarEmpleado = async function (event) {
    event.preventDefault();
    const formulario = document.querySelector("#formularioEmpleadoEdit");
    const formData = new FormData(formulario);
    const { idEmpleado, ...datosNuevos } = Object.fromEntries(formData.entries());

    try {
        await updateEmpleadoCollection(idEmpleado, datosNuevos);
        
        const modalElt = document.getElementById("editarEmpleadoModal");
        bootstrap.Modal.getInstance(modalElt).hide();
        
        window.mostrarAlerta({ tipoToast: "success", mensaje: "¡Alumno actualizado!" });
        await refrescarTabla();
    } catch (error) {
        console.error("Error al actualizar:", error);
    }
};

/**
 * DELETE: Borrar empleado
 */
async function eliminarEmpleado(id) {
    try {
        await deleteEmpleadoCollection(id);
        window.mostrarAlerta({ tipoToast: "success", mensaje: "Alumno eliminado correctamente" });
        await refrescarTabla();
    } catch (error) {
        console.error("Error al borrar:", error);
        window.mostrarAlerta({ tipoToast: "error", mensaje: "Error al eliminar" });
    }
}

// Inicialización
window.addEventListener("DOMContentLoaded", mostrarEmpleadosEnHTML);
