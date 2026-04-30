    <div class="modal fade" id="agregarPreceptorModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5 titulo_modal">Agregar Nuevo Preceptor</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
               
                <div class="modal-body">
                    <form id="formularioPreceptorEdit" action="" method="POST" autocomplete="off">
                        <input type="hidden" name="idPreceptor" id="idPreceptor" />
                        <div class="mb-3">
                            <label class="form-label">Apellido y Nombre</label>
                            <input type="text" name="preceptor" id="preceptor" class="form-control" required />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Turno</label>
                            
                            
                          <select name="turno" class="form-select" required>
<option selected value="">Seleccione</option>
<?php
$turno = array(
"Mañana",
"Tarde"
);
foreach ($turno as $turno) {
echo "<option value='$turno'>$turno</option>";
}
?>
</select>
                        
                        
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Obs</label>
                            <input type="text" name="obsPreceptor" id="obsPreceptor" class="form-control" required />
                        </div>
                       
                        <div class="d-grid gap-2">
                            <button type="submit" class="btn btn-primary btn_add" onclick="window.addNuevopreceptor(event)">
                                Crear Nuevo Preceptor
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>