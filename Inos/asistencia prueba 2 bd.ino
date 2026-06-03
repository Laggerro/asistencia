#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <Adafruit_Fingerprint.h>
#include "LittleFS.h"
#include "RTClib.h"
#include "BluetoothSerial.h"
#include <Preferences.h>
#include <ArduinoJson.h>
#include <LiquidCrystal.h>  // <-- NUEVA: Librería estándar para LCD nativo

// CONFIGURACIÓN DE PINES ORIGINALES
#define RXD2 16
#define TXD2 17
#define LED_ROJO 26
#define LED_VERDE 18
#define LED_AZUL 5
#define BUZZER 25

// NUEVA: CONFIGURACIÓN DE PINES DIGITALES PARA EL LCD 16X2
#define LCD_RS 4
#define LCD_E 22
#define LCD_D4 21
#define LCD_D5 19
#define LCD_D6 23
#define LCD_D7 13

// CONFIGURACIÓN FIREBASE ORIGINAL
const char* FB_BASE_URL = "https://firebaseio.com";
const char* FB_ASISTENCIA = "https://firebaseio.com/asistencia.json";

// OBJETOS ORIGINALES + NUEVO OBJETO LCD
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&Serial2);
RTC_DS3231 rtc;
BluetoothSerial SerialBT;
WebServer server(80);
Preferences prefs;
LiquidCrystal lcd(LCD_RS, LCD_E, LCD_D4, LCD_D5, LCD_D6, LCD_D7);  // <-- NUEVO

struct AlumnoRegistro {
  char nombre[30]; // 30 bytes fijos para el nombre (Corregido el tamaño)
};
// VARIABLES GLOBALES ORIGINALES + NUEVO TEMPORIZADOR ASÍNCRONO DISPLAY
String ssid, pass;
String ipGuardada = "0.0.0.0";
unsigned long lastSync = 0;
unsigned long btTimer = 0;
unsigned long lastWifiRetry = 0;
unsigned long lastFichadaTime = 0;
bool btActivo = true;
bool btAutenticado = false;
bool ventanaAbierta = true;
bool wifiIniciado = false;

unsigned long lcdTimer = 0;     // <-- NUEVO: Temporizador para limpiar pantalla
bool lcdMensajeActivo = false;  // <-- NUEVO: Bandera de control de pantalla

// ENUMERACIÓN DE ALERTAS ORIGINAL
enum TipoAlerta {
  FICHADA_OK,
  FICHADA_ERROR,
  OFFLINE_ALERTA,
  ENROL_ESPERA,
  ENROL_OK,
  ENROL_ERROR
};

// PROTOTIPOS ORIGINALES + NUEVOS PROTOTIPOS BINARIOS
void activarModoWifi();
void verificarConexion();
void procesarWifiBT(String msg);
void procesarFechaBT(String msg);
void realizarResetTotal();
void syncTempToFirebase();
void verificarHuellaAsistencia();
void handleGetUsers();
void handleEnrol();
void handleDelete();
int findFreeID();
bool captureStep(int step);
void mostrarFechaHoraRTC();
void notificarSistema(TipoAlerta alerta);

void guardarAlumnoBinario(int id, String nombreOriginal);  // <-- NUEVO
String obtenerNombreAlumnoBinario(int id);                 // <-- NUEVO

// ============================================================================
// SETUP ORIGINAL CON INYECCIÓN DE FACHADA VISUAL LCD
// ============================================================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  // 🟢 NUEVO: Mensaje de Inicio de Sistema en Display
  lcd.begin(16, 2);
  lcd.clear();
  lcd.print("   INICIANDO   ");
  lcd.setCursor(0, 1);
  lcd.print("   SISTEMA...   ");
  delay(1500);

  Serial.println("\n[SISTEMA] --- INICIANDO SISTEMA INTEGRADO ---");

  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_ROJO, OUTPUT);
  pinMode(LED_AZUL, OUTPUT);
  pinMode(BUZZER, OUTPUT);
  digitalWrite(LED_VERDE, LOW);
  digitalWrite(LED_ROJO, LOW);
  digitalWrite(LED_AZUL, LOW);
  digitalWrite(BUZZER, LOW);

  WiFi.persistent(false);
  WiFi.disconnect(true);
  WiFi.mode(WIFI_OFF);
  delay(200);

  if (!LittleFS.begin(true)) Serial.println("[ERR] Fallo LittleFS");
  if (!rtc.begin()) {
    Serial.println("[ERR] Fallo RTC");
  } else {
    Serial.println("[OK] Módulo RTC DS3231 detectado.");
    mostrarFechaHoraRTC();
  }

  prefs.begin("wifi-config", true);
  ssid = prefs.getString("ssid", "Vilers-2");
  pass = prefs.getString("pass", "Pabada686");
  ipGuardada = prefs.getString("ip_local", "0.0.0.0");
  prefs.end();

  Serial2.begin(57600, SERIAL_8N1, RXD2, TXD2);
  finger.begin(57600);
  if (finger.verifyPassword()) {
    Serial.println("[OK] Sensor de huella en línea.");
  } else {
    Serial.println("[ERR] No se encontró el sensor de huella.");
  }

  // 🟢 NUEVO: Mensaje esperando conexión Bluetooth (Kodular) antes de iniciar el objeto
  lcd.clear();
  lcd.print("ESPERANDO CONN");
  lcd.setCursor(0, 1);
  lcd.print("BLUETOOTH (BT)...");

  Serial.println("[BT] Modo Configuración Activado. Esperando comandos...");
  SerialBT.begin("Laggersoft");
  btTimer = millis();
  lastFichadaTime = millis();

  server.serveStatic("/style.css", LittleFS, "/style.css");
  server.serveStatic("/script.js", LittleFS, "/script.js");
  server.on("/", []() {
    File file = LittleFS.open("/index.html", "r");
    if (!file) {
      Serial.println("[ERR] index.html no encontrado en LittleFS");
      server.send(404, "text/plain", "Falta index.html en memoria");
      return;
    }
    server.streamFile(file, "text/html");
    file.close();
  });

  server.on("/get_users", handleGetUsers);
  server.on("/enrol", handleEnrol);
  server.on("/delete", handleDelete);

  // 🟢 NUEVO: Mostrar la IP guardada inicialmente por si arranca directo en una red recordada
  if (ipGuardada != "0.0.0.0") {
    lcd.clear();
    lcd.print("IP DISPONIBLE:");
    lcd.setCursor(0, 1);
    lcd.print(ipGuardada);
    delay(2500);
  }
}
// ============================================================================
// NUEVO: MOTOR DE ALMACENAMIENTO INDEXADO LOCAL DE ACCESO DIRECTO
// ============================================================================
void guardarAlumnoBinario(int id, String nombreOriginal) {
  if (id < 1 || id > 1000) return;
  File file = LittleFS.open("/usuarios.bin", FILE_WRITE);
  if (!file) return;

  AlumnoRegistro registro;
  memset(&registro, 0, sizeof(AlumnoRegistro));
  strncpy(registro.nombre, nombreOriginal.c_str(), sizeof(registro.nombre) - 1);

  unsigned long posicion = (id - 1) * sizeof(AlumnoRegistro);
  if (file.seek(posicion)) {
    file.write((uint8_t*)&registro, sizeof(AlumnoRegistro));
    Serial.printf("[LOCAL BIN] Indexado ID %d con nombre: %s\n", id, registro.nombre);
  }
  file.close();
}

String obtenerNombreAlumnoBinario(int id) {
  if (id < 1 || id > 1000) return "DESCONOCIDO";
  File file = LittleFS.open("/usuarios.bin", FILE_READ);
  if (!file) return "DESCONOCIDO";

  unsigned long posicion = (id - 1) * sizeof(AlumnoRegistro);
  if (posicion >= file.size()) {
    file.close();
    return "USUARIO NUEVO";
  }

  AlumnoRegistro registro;
  String nombreResultado = "DESCONOCIDO";
  if (file.seek(posicion)) {
    file.read((uint8_t*)&registro, sizeof(AlumnoRegistro));
    if (registro.nombre[0] != '\0') {
      nombreResultado = String(registro.nombre);
    }
  }
  file.close();
  return nombreResultado;
}

// ============================================================================
// TU FUNCIÓN DE ENROLAMIENTO ORIGINAL INTERCEPTANDO EL PARÁMETRO NOMBRE DEL JS
// ============================================================================
void handleEnrol() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String uid = server.arg("uid");

  // 🟢 NUEVO: Atrapamos el parámetro nombre que te manda el nuevo JavaScript modificado
  String nombreAlumno = server.hasArg("nombre") ? server.arg("nombre") : "Sin nombre";

  int id = findFreeID();
  if (id == -1) {
    server.send(200, "text/plain", "No hay espacio para mas huellas");
    return;
  }
  Serial.println("[ENROL] Iniciando proceso responsivo...");

  digitalWrite(LED_AZUL, HIGH);
  unsigned long timeout1 = millis();
  while (finger.getImage() != FINGERPRINT_OK) {
    if (millis() - timeout1 > 10000) {
      server.send(200, "text/plain", "Error: Tiempo de espera agotado");
      digitalWrite(LED_AZUL, LOW);
      notificarSistema(ENROL_ERROR);
      return;
    }
    delay(50);
  }
  digitalWrite(LED_AZUL, LOW);
  if (finger.image2Tz(1) != FINGERPRINT_OK) {
    server.send(200, "text/plain", "Error: No se pudo procesar la imagen 1");
    notificarSistema(ENROL_ERROR);
    return;
  }
  Serial.println("[ENROL] Paso 1 capturado. Esperando que levante el dedo...");
  unsigned long waitTime = millis();
  while (finger.getImage() != FINGERPRINT_NOFINGER) {
    digitalWrite(LED_AZUL, HIGH);
    delay(100);
    digitalWrite(LED_AZUL, LOW);
    delay(100);
    if (millis() - waitTime > 6000) break;
  }
  digitalWrite(LED_AZUL, LOW);
  delay(1000);
  Serial.println("[ENROL] Coloque el mismo dedo nuevamente...");
  digitalWrite(LED_AZUL, HIGH);
  unsigned long timeout2 = millis();
  while (finger.getImage() != FINGERPRINT_OK) {
    if (millis() - timeout2 > 10000) {
      server.send(200, "text/plain", "Error: Tiempo de espera agotado en verificación");
      digitalWrite(LED_AZUL, LOW);
      notificarSistema(ENROL_ERROR);
      return;
    }
    delay(50);
  }
  digitalWrite(LED_AZUL, LOW);
  if (finger.image2Tz(2) == FINGERPRINT_OK && finger.createModel() == FINGERPRINT_OK && finger.storeModel(id) == FINGERPRINT_OK) {
    WiFiClientSecure client;
    client.setInsecure();
    HTTPClient http;
    String url = String(FB_BASE_URL) + "/tbl_alumnos/" + uid + "/huellaId.json";
    http.begin(client, url);
    int httpResponseCode = http.PUT(String(id));
    Serial.printf("[ENROL] Actualizando Firebase. Código HTTP: %d\n", httpResponseCode);
    if (httpResponseCode == 200) {

      // 🟢 NUEVO: Si Firebase responde 200 con éxito total, guardamos en el archivo binario local
      guardarAlumnoBinario(id, nombreAlumno);

      server.send(200, "text/plain", "OK");
      notificarSistema(ENROL_OK);
      Serial.printf("[ENROL] Éxito absoluto. Huella asignada al ID: %d\n", id);
    } else {
      server.send(200, "text/plain", "Error Firebase");
      notificarSistema(ENROL_ERROR);
    }
    http.end();
  } else {
    server.send(200, "text/plain", "Fallo: Las huellas no coinciden");
    notificarSistema(ENROL_ERROR);
  }
}

// ============================================================================
// TU FUNCIÓN DE PURGADO ORIGINAL INTERCEPTANDO LA LIMPIEZA LOCAL
// ============================================================================
void handleDelete() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String uid = server.arg("uid");
  if (uid == "") {
    server.send(400, "text/plain", "Falta UID");
    return;
  }
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  String urlUser = String(FB_BASE_URL) + "/tbl_alumnos/" + uid + ".json";
  http.begin(client, urlUser);
  int httpCode = http.GET();
  if (httpCode == 200) {
    String payload = http.getString();
    JsonDocument doc;
    deserializeJson(doc, payload);
    int idSensor = doc["huellaId"];
    if (idSensor > 0 && idSensor <= 1000) {
      if (finger.deleteModel(idSensor) == FINGERPRINT_OK) {
        Serial.printf("[DELETE] Removido ID %d de la memoria física del sensor\n", idSensor);

        // 🟢 NUEVO: Limpiamos el registro binario local escribiendo vacío para que no quede huérfano
        guardarAlumnoBinario(idSensor, "");
      }
    }
    http.end();
    http.begin(client, urlUser);
    int deleteCode = http.sendRequest("DELETE");
    Serial.printf("[DELETE] Borrando en Firebase. Código HTTP: %d\n", deleteCode);
    if (deleteCode == 200 || deleteCode == 204) {
      server.send(200, "text/plain", "OK");
      digitalWrite(LED_VERDE, HIGH);
      delay(400);
      digitalWrite(LED_VERDE, LOW);
      Serial.println("[DELETE] Alumno purgado del ecosistema.");
    } else {
      server.send(500, "text/plain", "Error al eliminar de Firebase");
    }
    http.end();
  } else {
    server.send(404, "text/plain", "Usuario no encontrado");
    http.end();
  }
}
// ============================================================================
// TU FUNCIÓN DE ASISTENCIA CON EXTRACCIÓN BINARIA INDEXADA ULTRA FLUIDA
// ============================================================================
void verificarHuellaAsistencia() {
  if (finger.getImage() == FINGERPRINT_OK) {
    lastFichadaTime = millis();
    if (finger.image2Tz() == FINGERPRINT_OK && finger.fingerFastSearch() == FINGERPRINT_OK) {
      DateTime now = rtc.now();
      String data = String(finger.fingerID) + "," + now.timestamp();
      Serial.printf("[ASISTENCIA] ID de Huella %d detectado correctamente.\n", finger.fingerID);

      // 🟢 NUEVO: Buscamos el nombre de forma instantánea sin recorrer nada en RAM
      String nombreAlumno = obtenerNombreAlumnoBinario(finger.fingerID);

      // Pintamos los datos en el LCD nativo de forma limpia
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("FICHADA EXITOSA");
      lcd.setCursor(0, 1);
      lcd.print(nombreAlumno.substring(0, 16));  // Evita desbordar la fila

      lcdTimer = millis();      // Inicializa el contador del display
      lcdMensajeActivo = true;  // Activa la bandera para refrescar en loop() sin delay

      char filename[32];
      snprintf(filename, sizeof(filename), "/%04d_%02d_%02d.csv", now.year(), now.month(), now.day());
      File f1 = LittleFS.open(filename, FILE_APPEND);
      if (f1) {
        f1.println(data);
        f1.close();
        Serial.printf("[LOCAL] Guardado en ráfaga: %s\n", filename);
      }
      if (WiFi.status() == WL_CONNECTED) {
        notificarSistema(FICHADA_OK);
      } else {
        notificarSistema(OFFLINE_ALERTA);
      }
    } else {
      Serial.println("[ASISTENCIA] Advertencia: Huella dactilar no registrada.");

      // 🟢 NUEVO: Si falla, mostramos el error en pantalla de forma asíncrona
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("FICHADA FALLIDA");
      lcd.setCursor(0, 1);
      lcd.print("NO REGISTRADO");
      lcdTimer = millis();
      lcdMensajeActivo = true;

      notificarSistema(FICHADA_ERROR);
    }
    delay(1000);
  }
}

// ============================================================================
// LAS FUNCIONES DE SOPORTE DE TU ECOSISTEMA COMPLETAMENTE INTACTAS
// ============================================================================
void handleGetUsers() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  String url = String(FB_BASE_URL) + "/tbl_alumnos.json";
  Serial.printf("[WEB SERVER] GET Alumnos -> %s\n", url.c_str());
  http.begin(client, url);
  int code = http.GET();
  Serial.printf("[WEB SERVER] Firebase respondió Código HTTP: %d\n", code);
  server.send(code, "application/json", http.getString());
  http.end();
}

void activarModoWifi() {
  Serial.println("[RADIO] Apagando Bluetooth de forma segura...");
  SerialBT.end();
  btActivo = false;
  Serial.printf("[RADIO] Encendiendo WiFi. Conectando a: %s\n", ssid.c_str());
  WiFi.mode(WIFI_STA);
  delay(100);
  WiFi.begin(ssid.c_str(), pass.c_str());
  lastWifiRetry = millis() + 10000;
  server.begin();
  wifiIniciado = true;
}

void verificarConexion() {
  if (WiFi.status() != WL_CONNECTED) {
    if (millis() - lastWifiRetry > 20000) {
      lastWifiRetry = millis();
      Serial.println("[WIFI] Buscando red, reintentando conexión...");
      WiFi.begin(ssid.c_str(), pass.c_str());
    }
  } else {
    static bool logConexion = false;
    if (!logConexion) {
      String ipActual = WiFi.localIP().toString();
      Serial.print("[WIFI] ¡Conectado con éxito! Dirección IP: ");
      Serial.println(WiFi.localIP());

      // 🟢 NUEVO: Cuando se conecta con éxito, inyectamos la IP en tu display por pantalla
      lcd.clear();
      lcd.print("WIFI CONECTADO");
      lcd.setCursor(0, 1);
      lcd.print(ipActual);
      // Dejamos que corra el flujo asíncrono para limpiarlo en 3.5 segundos
      lcdTimer = millis() + 500;  // Le da un bonus de tiempo visual
      lcdMensajeActivo = true;

      if (ipActual != ipGuardada) {
        ipGuardada = ipActual;
        prefs.begin("wifi-config", false);
        prefs.putString("ip_local", ipGuardada);
        prefs.end();
        Serial.println("[PREFERENCES] Nueva dirección IP respaldada en Flash.");
      }
      logConexion = true;
    }
  }
}

void procesarWifiBT(String msg) {
  int c1 = msg.indexOf('['), c2 = msg.indexOf(']');
  int c3 = msg.lastIndexOf('['), c4 = msg.lastIndexOf(']');
  if (c1 != -1 && c3 != -1) {
    ssid = msg.substring(c1 + 1, c2);
    pass = msg.substring(c3 + 1, c4);
    prefs.begin("wifi-config", false);
    prefs.putString("ssid", ssid);
    prefs.putString("pass", pass);
    prefs.end();
    Serial.println("[OK] Nuevos datos de WiFi guardados. Reiniciando placa...");
    delay(500);
    ESP.restart();
  }
}

void procesarFechaBT(String msg) {
  int start = msg.indexOf('[') + 1;
  int end = msg.lastIndexOf(']');
  String valStr = msg.substring(start, end);
  int v[6];
  int count = 0;
  int lastPos = 0;
  for (int i = 0; i <= valStr.length(); i++) {
    if (i == valStr.length() || valStr[i] == ',') {
      v[count++] = valStr.substring(lastPos, i).toInt();
      lastPos = i + 1;
      if (count == 6) break;
    }
  }
  if (count == 6) {
    rtc.adjust(DateTime(v[0], v[1], v[2], v[3], v[4], v[5]));
    Serial.println("[OK] Hora del módulo RTC sincronizada.");
  }
}

void realizarResetTotal() {
  Serial.println("[SISTEMA] Borrando datos de almacenamiento y memoria...");
  finger.emptyDatabase();
  File root = LittleFS.open("/");
  File file = root.openNextFile();
  while (file) {
    String fileName = String(file.name());
    if (fileName.endsWith(".csv")) {
      LittleFS.remove("/" + fileName);
    }
    file = root.openNextFile();
  }
  prefs.begin("wifi-config", false);
  prefs.clear();
  prefs.end();
  delay(500);
  ESP.restart();
}

bool captureStep(int step) {
  int p = -1;
  unsigned long timeout = millis();
  while (p != FINGERPRINT_OK && (millis() - timeout < 2500)) {
    p = finger.getImage();
  }
  return (p == FINGERPRINT_OK && finger.image2Tz(step) == FINGERPRINT_OK);
}

int findFreeID() {
  for (int i = 1; i <= 1000; i++) {
    if (finger.loadModel(i) != FINGERPRINT_OK) return i;
  }
  return -1;
}

void mostrarFechaHoraRTC() {
  if (!rtc.begin()) {
    Serial.println("[RTC] Error: El módulo DS3231 no está respondiendo en el bus I2C.");
    return;
  }
  DateTime ahora = rtc.now();
  Serial.println("\n--- [DIAGNÓSTICO RTC] ---");
  Serial.printf("Fecha/Hora Actual (Timestamp): %s\n", ahora.timestamp().c_str());
  Serial.printf("Detalle: %02d/%02d/%04d %02d:%02d:%02d\n", ahora.day(), ahora.month(), ahora.year(), ahora.hour(), ahora.minute(), ahora.second());
  if (ahora.year() < 2020) {
    Serial.println("[ALERTA RTC] La fecha es muy antigua. Es probable que la batería CR2032 esté agotada o falte sincronización.");
  }
  Serial.println("-------------------------------------\n");
}

void notificarSistema(TipoAlerta alerta) {
  switch (alerta) {
    case FICHADA_OK:
      digitalWrite(LED_VERDE, HIGH);
      digitalWrite(BUZZER, HIGH);
      delay(150);
      digitalWrite(BUZZER, LOW);
      delay(350);
      digitalWrite(LED_VERDE, LOW);
      break;
    case FICHADA_ERROR:
      digitalWrite(LED_ROJO, HIGH);
      digitalWrite(BUZZER, HIGH);
      delay(800);
      digitalWrite(BUZZER, LOW);
      digitalWrite(LED_ROJO, LOW);
      break;
    case OFFLINE_ALERTA:
      for (int i = 0; i < 3; i++) {
        digitalWrite(LED_ROJO, HIGH);
        digitalWrite(BUZZER, HIGH);
        delay(600);
        digitalWrite(BUZZER, LOW);
        digitalWrite(LED_ROJO, LOW);
        if (i < 2) delay(200);
      }
      break;
    case ENROL_ESPERA:
      digitalWrite(LED_AZUL, HIGH);
      break;
    case ENROL_OK:
      digitalWrite(LED_VERDE, HIGH);
      digitalWrite(BUZZER, HIGH);
      delay(150);
      digitalWrite(BUZZER, LOW);
      delay(400);
      digitalWrite(LED_VERDE, LOW);
      break;
    case ENROL_ERROR:
      digitalWrite(LED_ROJO, HIGH);
      digitalWrite(BUZZER, HIGH);
      delay(800);
      digitalWrite(BUZZER, LOW);
      digitalWrite(LED_ROJO, LOW);
      break;
  }
}

void syncTempToFirebase() {
  DateTime now = rtc.now();
  char todayFilename[32];
  snprintf(todayFilename, sizeof(todayFilename), "%04d_%02d_%02d.csv", now.year(), now.month(), now.day());
  File root = LittleFS.open("/");
  File file = root.openNextFile();
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  Serial.println("[FIREBASE] Iniciando ciclo de sincronización por lotes...");
  while (file) {
    String fileName = String(file.name());
    if (fileName.startsWith("/")) {
      fileName = fileName.substring(1);
    }
    if (fileName.endsWith(".csv")) {
      String nodeKey = fileName;
      int dotIndex = nodeKey.lastIndexOf('.');
      if (dotIndex != -1) {
        nodeKey = nodeKey.substring(0, dotIndex);
      }
      String fullPath = "/" + fileName;
      File f = LittleFS.open(fullPath, "r");
      if (!f) {
        file = root.openNextFile();
        continue;
      }
      if (f.size() == 0) {
        f.close();
        if (fileName != String(todayFilename)) {
          LittleFS.remove(fullPath);
        }
        file = root.openNextFile();
        continue;
      }
      bool currentFileOk = true;
      Serial.printf("[FIREBASE] Enviando lote de fichadas: %s al nodo /asistencia/%s/\n", fileName.c_str(), nodeKey.c_str());
      while (f.available()) {
        String line = f.readStringUntil('\n');
        line.trim();
        if (line.length() > 0) {
          unsigned long idVariable = 1770000000000ULL + (millis() % 9192516961ULL);
          String urlDestino = String(FB_BASE_URL) + "/asistencia/" + nodeKey + "/" + String(idVariable) + ".json";
          http.begin(client, urlDestino);
          http.addHeader("Content-Type", "application/json");
          String jsonPayload = String("\"{\\\"fichada\\\":\\\"") + line + String("\\\"}\"");
          int code = http.PUT(jsonPayload);
          if (code == 200 || code == 201) {
            Serial.printf("[FIREBASE] %s -> ID %s enviado.\n", nodeKey.c_str(), String(idVariable).c_str());
          } else {
            Serial.printf("[ERR] Error al subir línea en nodo %s. Código: %d\n", nodeKey.c_str(), code);
            currentFileOk = false;
          }
          http.end();
          delay(50);
        }
      }
      f.close();
      if (currentFileOk) {
        if (fileName == String(todayFilename)) {
          File fVaciar = LittleFS.open(fullPath, FILE_WRITE);
          if (fVaciar) {
            fVaciar.close();
            Serial.println("[LOCAL] Archivo de hoy sincronizado y vaciado para nuevas fichadas.");
          }
        } else {
          LittleFS.remove(fullPath);
          Serial.printf("[LOCAL] Archivo histórico %s eliminado definitivamente.\n", fullPath.c_str());
        }
      } else {
        Serial.printf("[ALERTA] Lote %s se subió con errores parciales. Se reintentará el lote completo.\n", fileName.c_str());
      }
    }
    file = root.openNextFile();
  }
}

// ============================================================================
// LOOP PRINCIPAL COMPLETAMENTE CONSERVADO CON SU FILOSOFÍA DE TIEMPOS
// ============================================================================
void loop() {
  // 1. GESTIÓN COMUNICACIÓN BLUETOOTH ORIGINAL
  if (btActivo) {
    if (ventanaAbierta || btAutenticado) {
      if (SerialBT.available()) {
        String msg = SerialBT.readStringUntil('\n');
        msg.trim();
        Serial.printf("(BT RX): %s\n", msg.c_str());
        if (msg == "OBIWANKENOBI") {
          btAutenticado = true;
          ventanaAbierta = false;
          SerialBT.printf("IP_LOCAL:(%s)\n", ipGuardada.c_str());
          Serial.printf("(BT TX) Enviando IP guardada a la App: %s\n", ipGuardada.c_str());
        } else if (msg == "CORTARBT" && btAutenticado) {
          activarModoWifi();
        } else if (msg.startsWith("SSIDPASS:")) {
          procesarWifiBT(msg);
        } else if (btAutenticado) {
          if (msg.startsWith("DATETIME:")) procesarFechaBT(msg);
          if (msg == "RESET") realizarResetTotal();
        }
      }
    }
    if (ventanaAbierta && (millis() - btTimer > 20000)) {
      Serial.println("(BT) Tiempo de espera agotado. Iniciando WiFi...");
      activarModoWifi();
    }
  }
  // 2. GESTIÓN COMUNICACIÓN WIFI Y PETICIONES WEB ORIGINAL
  if (wifiIniciado) {
    verificarConexion();
    server.handleClient();
    if (WiFi.status() == WL_CONNECTED && (millis() - lastSync > 30000)) {
      syncTempToFirebase();
      lastSync = millis();
    }
  } else {
    if (millis() - lastFichadaTime > 600000) {
      Serial.println("(SISTEMA) Desborde de 10 min sin fichadas. Intentando conectar a internet para vaciar cola...");
      activarModoWifi();
      lastFichadaTime = millis();
    }
  }
  // 3. GESTIÓN CONSTANTE DEL SENSOR DE HUELLAS ORIGINAL
  verificarHuellaAsistencia();
  // 4. 🟢 NUEVO: CONTROL ASÍNCRONO DEL DISPLAY LCD (Retorna a operativo tras 3 segundos)
  if (lcdMensajeActivo && (millis() - lcdTimer > 3000)) {
    lcd.clear();
    lcd.print("  DISPOSITIVO   ");
    lcd.setCursor(0, 1);
    lcd.print("   OPERATIVO    ");
    lcdMensajeActivo = false;
  }
}