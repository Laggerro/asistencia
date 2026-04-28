<?php
// Obtiene el nombre del archivo actual (ej: index.php, listado.php)
$pagina_actual = basename($_SERVER['PHP_SELF']);
?>

<nav class="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm fixed-top">
  <div class="container-fluid px-5">
    <a class="navbar-brand fw-bold" href="index.php">
      <i class="bi bi-person-check-fill me-2"></i>Asistencias
    </a>
    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav me-auto mb-2 mb-lg-0">
        
        <li class="nav-item">
          <a class="nav-link <?php echo ($pagina_actual == 'index.php') ? 'active' : ''; ?>" href="index.php">Estado</a>
        </li>
        
        <li class="nav-item">
          <a class="nav-link <?php echo ($pagina_actual == 'listado.php') ? 'active' : ''; ?>" href="listado.php">Listado</a>
        </li>
        
        <li class="nav-item">
          <a class="nav-link <?php echo ($pagina_actual == 'Registrar.php') ? 'active' : ''; ?>" href="Registrar.php">Registrar</a>
        </li>
        
        <li class="nav-item">
          <a class="nav-link <?php echo ($pagina_actual == 'cursos.php') ? 'active' : ''; ?>" href="cursos.php">Preceptores/Cursos</a>
        </li>
        
        <li class="nav-item">
          <a class="nav-link <?php echo ($pagina_actual == 'ayuda.php') ? 'active' : ''; ?>" href="ayuda.php">Ayuda</a>
        </li>

      </ul>
      <span class="navbar-text text-white">
        <i class="bi bi-person-circle"></i> Admin
      </span>
    </div>
  </div>
</nav>
