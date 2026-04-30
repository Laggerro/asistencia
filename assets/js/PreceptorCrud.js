import {
    
    addNuevopreceptor, deletePreceptorCollection, getPreceptorCollection, updatePreceptorCollection, getPreceptoresCollection
} from "./firebase.js";


async function refrescarTablas() {
    
    if (document.getElementById("tablaPreceptor")) await mostrarPreceptorEnHTML();
    
}

async function mostrarPreceptorEnHTML() {
    try {
        const tabla = document.querySelector("#tablaPreceptor tbody");
        if (!tabla) return;

        const snapshot = await getPreceptoresCollection();
        tabla.innerHTML = "";

        if (snapshot.exists()) {
            snapshot.forEach((child) => {
                const id = child.key;
                const preceptor = child.val();
                const fila = document.createElement("tr");
                fila.id = id;
                fila.innerHTML = `
                    <td>${preceptor.nombre || "N/A"}</td>
                    <td>${preceptor.turno || "N/A"}</td>
                    <td>${preceptor.obs || "N/A"}</td>
                    <td>
                        <button onclick="window.miModal('detallePreceptorModal','${id}')" class="btn btn-success btn-sm"><i class="bi bi-binoculars"></i></button>
                        <button onclick="window.miModal('editarPreceptorModal','${id}')" class="btn btn-warning btn-sm"><i class="bi bi-pencil-square"></i></button>
                        <button onclick="window.miModal('eliminarPreceptorModal','${id}')" class="btn btn-danger btn-sm"><i class="bi bi-trash"></i></button>
                    </td>`;
                tabla.appendChild(fila);
            });
        }
    } catch (error) { console.error("Error Preceptores:", error); }
   
}


async function cargarPreceptoresEnModal() {
    const select = document.getElementById("selectPreceptorModal");
    if (!select) return;
    const snap = await getPreceptoresCollection();
    select.innerHTML = '<option selected value="">Seleccione Preceptor</option>';
    if (snap.exists()) {
        snap.forEach(doc => {
            select.innerHTML += `<option value="${doc.key}">${doc.val().nombre}</option>`;
        });
    }
}




/**
 * 2. GESTIÓN DE MODALES UNIFICADA
 */

window.miModal = async function (idModal, idRef = "") {
    try {
        // Limpieza previa
        const existing = document.getElementById(idModal);
        if (existing) {
            const ins = bootstrap.Modal.getInstance(existing);
            if (ins) ins.hide();
            existing.remove();
        }
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

        // Selección de URL
        const rutas = {

            "agregarPreceptorModal": "modales/modalAddPreceptor.php",
            "detallePreceptorModal": "modales/modalDetallesPreceptor.php",
            "editarPreceptorModal": "modales/modalEditarPreceptor.php",
            "eliminarPreceptorModal": "modales/modalDeletePreceptor.php"
        };

        if (!rutas[idModal]) return;

        const response = await fetch(rutas[idModal]);
        const text = await response.text();
        const parser = new DOMParser();
        const htmlDoc = parser.parseFromString(text, 'text/html');
        const modalElement = htmlDoc.querySelector('.modal');

        document.body.appendChild(modalElement);
        const myModal = new bootstrap.Modal(modalElement);
        myModal.show();

        // Carga de datos específicos post-apertura

        if (idModal === "agregarPreceptorModal") await cargarPreceptoresEnModal();
        if (idModal === "detallePreceptorModal") await cargarDetallePreceptor(idRef);
        if (idModal === "editarPreceptorModal") await getPreceptorUpdateCollection(idRef);
        
        if (idModal.includes("eliminar")) {
            const btn = modalElement.querySelector("#confirmDeleteBtn");
            if (btn) btn.onclick = async () => {
                idModal.includes("preceptor") ? await eliminarpreceptor(idRef) : await eliminarpreceptor(idRef);
                myModal.hide();
            };
        }
    } catch (error) { console.error("Error Modal:", error); }
};



/**
 * 4. EVENTOS DE CREACIÓN Y ACTUALIZACIÓN
 */

window.addNuevopreceptor = async function (event) {
    event.preventDefault();
    const fd = new FormData(document.querySelector("#formularioPreceptor"));
    try {
        await addPreceptor(fd.get("preceptor"), fd.get("preceptor"), fd.get("turno"), fd.get("obs"));
        bootstrap.Modal.getInstance(document.getElementById("agregarPreceptorModal")).hide();
        await refrescarTablas();
        window.mostrarAlerta({ tipoToast: "success", mensaje: "¡Preceptor registrado!" });
    } catch (e) { console.error(e); }
};


async function cargarDetallePreceptor(id) {
    try {
        const preceptorDoc = await getPreceptoresCollection(id);
        if (preceptorDoc.exists()) {
            const data = preceptorDoc.val();
            const contenedor = document.querySelector("#detallePreceptorContenido ul");
            if (!contenedor) return;

            contenedor.innerHTML = ` 
                <li class="list-group-item"><b>Apellido y Nombre:</b> ${data.nombre || "N/A"}</li>
                <li class="list-group-item"><b>Turno:</b> ${data.turno || "N/A"}</li>
                <li class="list-group-item"><b>Obs:</b> ${data.obs || "N/A"}</li>
            `;
        }
    } catch (error) {
        console.error("Error al cargar detalles Preceptor:", error);
    }
}



/**
 * Carga los datos del CURSO en el formulario de edición
 */
async function getPreceptorUpdateCollection(id) {
    try {
        const preceptorDoc = await getPreceptorCollection(id);
        if (preceptorDoc.exists()) {
            const data = preceptorDoc.val();
            // Buscamos por ID o Name según lo tengas en tu modalEditarCurso.php
            if (document.querySelector("#idPreceptor")) document.querySelector("#idPreceptor").value = id;
            if (document.querySelector("#nombre")) document.querySelector("#nombre").value = data.nombre || "";
            if (document.querySelector("#turno")) document.querySelector("#turno").value = data.turno || "";
            if (document.querySelector("#obs")) document.querySelector("#obs").value = data.obs || "";
        }
    } catch (error) {
        console.error("Error al cargar datos del Preceptor para editar:", error);
    }
}
/**
 * Procesa la actualización del Preceptor
 */

window.actualizarPreceptor = async function (event) {
    event.preventDefault();
    const formulario = document.querySelector("#formularioPreceptorEdit");
    const formData = new FormData(formulario);
    const data = Object.fromEntries(formData.entries());

    try {
        // Ajustamos los campos para que coincidan con tu estructura de Firebase
        const camposUpdate = {
            nombre: data.nombre,
            turno: data.turno,
            obs: data.obs 
        };
        await updatePreceptorCollection(data.idPreceptor, camposUpdate);
        bootstrap.Modal.getInstance(document.getElementById("editarPreceptorModal")).hide();
        window.mostrarAlerta({ tipoToast: "success", mensaje: "¡Preceptor actualizado!" });
        await refrescarTablas();
    } catch (error) {
        console.error("Error al actualizar Preceptor:", error);
    }
};

/**
 * Lógica de borrado de Preceptor
 */
async function eliminarPreceptor(id) {
    try {
        await deletePreceptorCollection(id);
        // Eliminación visual inmediata de la fila
        const fila = document.getElementById(id);
        if (fila) fila.remove();
        
        window.mostrarAlerta({ tipoToast: "success", mensaje: "Preceptor eliminado correctamente" });
        await refrescarTablas();
    } catch (error) {
        console.error("Error al borrar el Preceptor:", error);
        window.mostrarAlerta({ tipoToast: "error", mensaje: "Error al eliminar el Preceptor" });
    }
}


window.addNuevopreceptor = addNuevopreceptor;
window.actualizarPreceptor = actualizarPreceptor;
window.eliminarPreceptor = eliminarPreceptor;
window.cargarDetallePreceptor = cargarDetallePreceptor;
 refrescarTablas(); 