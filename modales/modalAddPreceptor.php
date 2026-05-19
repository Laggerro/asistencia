<div class="modal fade" id="agregarPreceptorModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1"
    aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h1 class="modal-title fs-5 titulo_modal">Agregar Nuevo Preceptor</h1>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div class="modal-body">
                <form id="formularioPreceptor" action="" method="POST" autocomplete="off">
                    <input type="hidden" name="idPreceptor" id="idPreceptor" />
                    <div class="mb-3">
                        <label class="form-label">Apellido y Nombre</label>
                        <input type="text" name="nombre" id="nombre" class="form-control" required />
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Turno</label>

                        <select name="turno" id="turno" class="form-select" required>
                            <option selected value="">Seleccione</option>
                            <option value="Mañana">Mañana</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Ambos">Mañana y Tarde</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Usuario</label>
                        <input type="text" name="usuarioApp" id="usuarioApp" class="form-control" required />
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Contraseña</label>
                        <input type="text" name="passApp" id="passApp" class="form-control" required />
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Cargo "Preceptor" Administrador es solo para la APP</label>

                        <select name="cargo" id="cargo" class="form-select" required>
                            <option selected value="">Seleccione</option>
                            <option value="Preceptor">Preceptor</option>
                            <option value="Administrador">Administrador</option>
                        </select>
                    </div>

                    <div class="mb-3">
                        <label class="form-label">Obs</label>
                        <input type="text" name="obs" id="obs" class="form-control" required />
                    </div>

                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-primary btn_add" onclick="window.addPreceptor(event)">
                            Crear Nuevo Preceptor
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</div>