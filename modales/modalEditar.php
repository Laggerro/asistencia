    <div class="modal fade" id="editarEmpleadoModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" >
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5 titulo_modal">Editar datos del Alumno</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="formularioEmpleadoEdit" action="" method="POST" autocomplete="off">
                        <input type="hidden" name="idEmpleado" id="idEmpleado" />
                        
                        <div class="mb-3">
                            <label class="form-label">Seleccione el Curso</label>
                            <select name="curso" class="form-select" required>
                                <option selected value="">Seleccione</option>
                                <?php
                                $curso = array(
                                    "1ro A",
                                    "1ro B",
                                    "1ro C",
                                    "2do A",
                                    "2do B",
                                    "2do C"
                                );
                                foreach ($curso as $curso) {
                                    echo "<option value='$curso'>$curso</option>";
                                }
                                ?>
                            </select>
                        </div>


                        <div class="mb-3">
                            <label class="form-label">Apellido y Nombre</label>
                            <input type="text" name="nombre" class="form-control" required />
                        </div>


                        <div class="mb-3">
                            <label class="form-label">DNI</label>
                            <input type="text" name="dni" class="form-control" required />
                        </div>

                       <div class="mb-3">
                            <label class="form-label">Obs</label>
                            <input type="text" name="obs" class="form-control" required />
                        </div>


                        <div class="d-grid gap-2">
                            <button type="submit" class="btn btn-primary btn_add" onclick="window.actualizarEmpleado(event)">
                                Actualizar datos del empleado
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>