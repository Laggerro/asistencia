##### Sistema de control de asistencia de alumnos #####

# Basado en un ESP32 conectado a un Lector biométrico (huellas).

# Sistema WEB en Firebase, WEB local para administración y BT para configuración de WIFI

# realizado con CRUD (Create, Read, Update y Delete) completo Firebase y JavaScript

##### Un proyecto que implementa operaciones CRUD Ofrece funcionalidades completas de gestión de alumnos en tiempo real en una aplicación web.

##### Pasos

🔑 El Sistema de Seguridad (Apertura de Ventana)Por seguridad, el ESP32 no procesa ningún comando administrativo 
a menos que rompas la barrera de autenticación dentro de los primeros 20 segundos de encendido.
Paso 1: Al encender, la variable ventanaAbierta es true.Paso 
2: Debes enviar el código secreto desde Kodular.Paso 
3: Si el código es correcto, btAutenticado pasa a true, la ventana se cierra (false), el Bluetooth permanece encendido y la placa se queda esperando tus 
órdenes de configuración sin pasarse a WiFi.

📲 Comandos Bluetooth Disponibles (Desde Kodular hacia el ESP32)

Cada mensaje que envíes desde Kodular debe terminar obligatoriamente con un carácter de nueva línea (\n o usar el bloque 
BluetoothClient.SendText asegurando que la cadena tenga un salto de línea al final).
Comando / Formato - Función Interna - Qué hace el ESP32
OBIWANKENOBI - Validación inicial - Desbloquea el modo administrador. Envía de vuelta el texto "Acceso OK." hacia Kodular.
SSIDPASS:[NombreWiFi][ClaveWiFi] - procesarWifiBT() - Extrae el texto entre los corchetes. Guarda la red en la memoria permanente (Preferences) y reinicia la placa de inmediato.
DATETIME:[AAAA,MM,DD,HH,MM,SS] - procesarFechaBT() - Desglosa los 6 números separados por comas y actualiza la hora del chip DS3231.
CORTARBT - activarModoWifi() - Apaga el Bluetooth por completo y enciende el módulo WiFi para conectar con Firebase.
RESET - realizarResetTotal() - Borra la memoria de huellas, elimina los archivos locales /fichadas.csv y /temp.csv, limpia el WiFi guardado y reinicia de fábrica.

Nota: Los comandos DATETIME, CORTARBT y RESET solo se ejecutarán si primero enviaste OBIWANKENOBI.

🛠️ Endpoints HTTP del Servidor Web (Peticiones de tu App/Web)

Cuando el ESP32 ya apagó el Bluetooth y está conectado a la red WiFi local, levanta un servidor en su dirección IP (ej. http://192.168.0) p
ara responder a tu App Web o Android mediante solicitudes HTTP:
1. GET /get_usersQué hace: El ESP32 actúa como puente. Va a Firebase, descarga toda la lista de tbl_alumnos.json y se la devuelve a tu aplicación en formato JSON limpio.
2. GET /enrol?uid=VALOR_ID
 *Qué hace: Inicia el asistente de grabado de huella para un alumno específico.
 *Flujo: Busca un casillero libre en el sensor (1 a 1000) \(\rightarrow \) Pide poner el 
   dedo \(\rightarrow \) Pide quitarlo \(\rightarrow \) Pide confirmación \(\rightarrow \) Guarda la huella físicamente \(\rightarrow \) 
   Hace un PUT en Firebase escribiendo el número de huella asignado en la ruta tbl_alumnos/UID/huellaId.json.
 3. GET /delete?uid=VALOR_ID 
  * Qué hace: Elimina un alumno del sistema.
  *Flujo: Lee la ruta del alumno en Firebase para averiguar qué huellaId tenía \(\rightarrow \) Borra esa huella de  la memoria física del 
   sensor dactilar \(\rightarrow \) Envía una solicitud DELETE a Firebase para remover al usuario de la base de datos de  manera definitiva.
   
🔄 Funciones del Bucle Principal (loop)

  * verificarHuellaAsistencia(): Se ejecuta en cada milisegundo. Si alguien apoya el  dedo en el lector y la huella existe, genera una 
    cadena de texto con el formato ID,AAAA-MM-DDTHH:MM:SS. Abre LittleFS y la añade al final de  dos archivos: /fichadas.csv (historial local) 
    y /temp.csv (cola de envíos).
  * syncTempToFirebase(): Se ejecuta de fondo cada 30 segundos. Si 
    detecta que existe el archivo /temp.csv, lee línea por línea, empaqueta cada fichada en un JSON y realiza un POST individual hacia tu nodo 
    asistencia.json de Firebase. Si todas las líneas devuelven código HTTP 200 o 201, elimina el archivo temporal automáticamente.   

##### Notas:


