// PreceptorCrud.js
import { 
    addPreceptor, getOtrosPreceptoresCollection, deletePreceptorCollection, updatePreceptorCollection, getPreceptorCollection
} from "./firebase.js";

/**
 * 1. INICIALIZACIÓN Y TABLA
 */
document.addEventListener("DOMContentLoaded", async () => {
    await mostrarPreceptorsEnHTML();
});

async function mostrarPreceptorsEnHTML() {
    try {
        const tabla = document.querySelector("#tablaPreceptor tbody");
        if (!tabla) return;

        const snapshot = await getOtrosPreceptoresCollection();
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
                     
                        <button onclick="window.miModal('eliminarPreceptorModal','${id}')" class="btn btn-danger btn-sm"><i class="bi bi-trash"></i></button>
                    </td>`;
                tabla.appendChild(fila);
            });
        }
    } catch (error) { 
        console.error("Error al cargar preceptor:", error); 
    }
}

/**
 * 2. GESTIÓN DE MODALES PARA PRECEPTORES
 */
window.miModal = async function (idModal, idRef = "") {
    try {
        // Limpieza de modales previos
        const existing = document.getElementById(idModal);
        if (existing) {
            const ins = bootstrap.Modal.getInstance(existing);
            if (ins) ins.hide();
            existing.remove();
        }
        document.querySelectorAll('.modal-backdrop').forEach(el => el.remove());

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

        // Cargas específicas según el modal
        if (idModal === "agregarPreceptorModal") await cargarPreceptoresEnModal();
        if (idModal === "detallePreceptorModal") await cargarDetallePreceptor(idRef);
        if (idModal === "editarPreceptorModal") await getPreceptorUpdateCollection(idRef);
        
        if (idModal === "eliminarPreceptorModal") {
            const btn = modalElement.querySelector("#confirmDeleteBtn");
            if (btn) btn.onclick = async () => {
                await eliminarPreceptor(idRef);
                myModal.hide();
            };
        }
    } catch (error) { console.error("Error Modal Preceptor:", error); }
};

/**
 * 3. FUNCIONES DE APOYO
 */
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

async function cargarDetallePreceptor(id) {
    try {
        const snapshot = await getPreceptorCollection(id);
        if (snapshot.exists()) {
            const data = snapshot.val();
            const contenedor = document.querySelector("#detallePreceptorContenido ul");
            if (!contenedor) return;
            contenedor.innerHTML = ` 
                <li class="list-group-item"><b>Apellido y Nombre: </b> ${data.nombre || "N/A"}</li>
                <li class="list-group-item"><b>Turno:</b> ${data.turno || "N/A"}</li>
                <li class="list-group-item"><b>Obs: </b> ${data.obs || "N/A"}</li>`;
        }
    } catch (error) { console.error("Error detalles preceptor:", error); }
}

async function getPreceptorUpdateCollection(id) {
    try {
        const preceptorDoc = await getPreceptorCollection(id);
        if (preceptorDoc.exists()) {
            const data = preceptorDoc.val();
            if (document.querySelector("#nombre")) document.querySelector("#nombre").value = data.nombre || "";
            if (document.querySelector("#turno")) document.querySelector("#turno").value = data.turno || "";
            if (document.querySelector("#obs")) document.querySelector("#obs").value = data.obs || "";
        }
    } catch (error) { console.error("Error precarga edición:", error); }
}

/**
 * 4. ACCIONES (CREAR, ACTUALIZAR, ELIMINAR)
 */
window.addPreceptor = async function (event) {
    event.preventDefault();
  const form = document.querySelector("#formularioPreceptor"); 
    const fd = new FormData(form);
 
    try {
        await addPreceptor(fd.get("nombre"), fd.get("turno"), fd.get("obs"));
        bootstrap.Modal.getInstance(form.closest('.modal')).hide();
        await mostrarPreceptorsEnHTML();
        window.mostrarAlerta({ tipoToast: "success", mensaje: "¡Preceptor creado!" });
    } catch (e) { console.error(e); }
};

window.actualizarPreceptor = async function (event) {
    event.preventDefault();
    const formulario = document.querySelector("#formularioPreceptorEdit");
    const formData = new FormData(formulario);
    const data = Object.fromEntries(formData.entries());
    try {
        const camposUpdate = {
            preceptor: data.nombre,
            turno: data.turno,
            obs: data.obs 
        };
        await updatePreceptorCollection(data.idPreceptor, camposUpdate);
        bootstrap.Modal.getInstance(document.getElementById("editarPreceptorModal")).hide();
        window.mostrarAlerta({ tipoToast: "success", mensaje: "¡Preceptor actualizado!" });
        await mostrarPreceptorsEnHTML();
    } catch (error) { console.error("Error al actualizar preceptor:", error); }
};

async function eliminarPreceptor(id) {
    try {
        await deletePreceptorCollection(id);
        window.mostrarAlerta({ tipoToast: "success", mensaje: "Preceptor eliminado correctamente" });
        await mostrarPreceptorsEnHTML();
    } catch (error) { console.error("Error al borrar preceptor:", error); }
}

// Función de Alerta Global
window.mostrarAlerta = function ({ tipoToast, mensaje }) {
    if (typeof iziToast === 'undefined') return alert(mensaje);
    iziToast[tipoToast === "error" ? "error" : "success"]({
        title: tipoToast === "success" ? "¡Éxito!" : "¡Error!",
        message: mensaje,
        position: "topRight"
    });
};