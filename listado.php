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
    Listado General de Alumnos registrados
    <img src="assets/imgs/Planilla.png" alt="Listado" style="width: 50px" />
    <hr />
  </h1>

  <div class="container mb-5">
    <div class="row justify-content-md-center">
      <div class="col-md-12">
    <h5 class="text-center mb-3">Seleccione filtro</h5>

    <!-- Todo dentro de este ROW se alineará horizontalmente -->
    <div class="row mb-3 align-items-center">
        <!-- Buscador -->
        <div class="col-md-4">
            <input type="text" id="buscarAlumno" class="form-control" placeholder="Buscar por Apellido o DNI...">
        </div>

        <!-- Filtro Curso -->
        <div class="col-md-4">
            <select id="filtroCurso" class="form-select">
                <option value="">Todos los cursos</option>
            </select>
        </div>

        <!-- Contador alineado a la derecha -->
        <div class="col-md-4 text-end">
          <h5>
            <span class="badge bg-primary p-3">
                Total coincidencias: <span id="contadorAlumnos">0</span>
            </span>
          </h5>
        </div>
    </div>

    
    <hr />

    <div class="table-responsive">
        <table class="table table-hover" id="tablaalumnos">
            <thead>
                <tr>
                    <th>Curso</th>
                    <th>Apellido y Nombre</th>
                    <th>DNI</th>
                    <th>Obs</th>
                    <th>Acciones</th>
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