<!DOCTYPE html>
<html lang="es">

<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Sistema de Asistencia de Alumnos</title>
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet"
    integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous" />
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" />
  <link rel="stylesheet" href="assets/css/listado.css" />

  <!--Libreria para alertas-->
  <link rel="stylesheet" href="assets/alerts/css/iziToast.min.css" />
</head>


  <body>
  <?php include 'navbar.php'; ?>

  <h1 class="text-center mt-5 mb-5 fw-bold">
   Listado de Cursos
    <img src="assets/imgs/Cursos.png" alt="Cursos" style="width: 50px" />
    <hr />
  </h1>

    <div class="container mb-5">
      <div class="row justify-content-md-center">
        <div class="col-md-12">
          <h1 class="text-center">
            <span class="float-start">
              <a
                href="#"
                onclick="window.miModal('agregarCursoModal','')"
                class="btn btn-success"
                title="Agregar Nuevo Curso">
                <i class="bi bi-plus-square"></i>
              </a>
            </span>
            Agregar nuevo Curso
            <hr />
          </h1>

          <div class="table-responsive">
            <table class="table table-hover" id="tablaCursos">
              <thead>
                <tr>
                  <th>Designación del curso</th>
                  <th>Preceptor asignado</th>
                  <th>Ubicación</th>
                  <th>Capacidad</th>
                  <th>Obs</th>
                </tr>
              </thead>
              <tbody></tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <script src="https://code.jquery.com/jquery-3.7.1.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

    <script type="module" src="assets/js/todoCrud.js"></script>
    <script src="assets/alerts/js/iziToast.min.js"></script>
  </body>
</html>
