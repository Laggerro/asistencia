<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Control de Asistencia</title>
    <link href="https://jsdelivr.net" rel="stylesheet">
    <link rel="stylesheet" href="reportemes.css"> <!-- Aquí guardas el CSS verde -->
</head>
<body class="bg-light">

    <div class="container my-4">
        <!-- Panel de Filtros -->
        <div class="card p-3 mb-4 shadow-sm">
            <div class="row g-3 align-items-end">
                <div class="col-md-4">
                    <label class="form-label fw-bold">Seleccionar Mes:</label>
                    <input type="month" id="mesFiltro" class="form-control" value="2026-05">
                </div>
                <div class="col-md-4">
                    <label class="form-label fw-bold">Seleccionar Curso:</label>
                    <select id="cursoFiltro" class="form-select">
                        <!-- Se llena dinámicamente con cargarCursosEnSelect() -->
                    </select>
                </div>
                <div class="col-md-4">
                    <button id="btnGenerarMensual" class="btn btn-success w-100 fw-bold">
                        🔍 Generar Reporte Mensual
                    </button>
                </div>
            </div>
        </div>

        <!-- Contenedor donde se inyecta la tabla -->
        <div id="contenedorTabla" class="card p-4 shadow-sm bg-white">
            <div class="text-center text-muted py-5">
                Selecciona los filtros superiores para desplegar el control de asistencia.
            </div>
        </div>
    </div>
 <script type="module" src="reportemes.js"></script>
</body>
</html>
