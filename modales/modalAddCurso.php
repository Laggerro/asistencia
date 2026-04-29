    <div class="modal fade" id="agregarCursoModal" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h1 class="modal-title fs-5 titulo_modal">Agregar Nuevo Curso</h1>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
               

<div class="modal-body">
                    <form id="formularioCursoEdit" action="" method="POST" autocomplete="off">
                        <input type="hidden" name="idCurso" id="idCurso" />
                        <div class="mb-3">
                            <label class="form-label">Curso</label>
                            <input type="text" name="curso" id="curso" class="form-control" required />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Seleccione Preceptor</label>
                            <select name="preceptorID" id="selectPreceptorModal" class="form-select" required>
                                <option selected value="">Seleccione</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label class="form-label">Ubicación</label>
                            <input type="text" name="ubicacion" id="ubicacion" class="form-control" required />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Capacidad</label>
                            <input type="text" name="capacidad" id="capacidad" class="form-control" required />
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Obs</label>
                            <input type="text" name="obsCurso" id="obsCurso" class="form-control" required />
                        </div>
                       
                        <div class="d-grid gap-2">
                            <button type="submit" class="btn btn-primary btn_add" onclick="window.addNuevoCurso(event)">
                                Crear Nuevo Curso
                            </button>
                        </div>
                    </form>
                </div>






            </div>
        </div>
    </div>