#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <WebServer.h>
#include <LittleFS.h>
#include <RTClib.h>
#include <Adafruit_Fingerprint.h>
#include <BluetoothSerial.h>
#include <HTTPClient.h>

// --- CONFIGURACIÓN DE PINES ---
#define LED_VERDE 14
#define LED_ROJO  27
#define BUZZER    26  // Pin asignado para el Buzzer (Modificable si usas otro pin)
#define RX_D2     16
#define TX_D3     17

// --- INSTANCIAS Y VARIABLES GLOBALES ---
const char* FB_BASE_URL = "https://asistencia-93328-default-rtdb.firebaseio.com"; 

HardwareSerial mySerial(2);
Adafruit_Fingerprint finger = Adafruit_Fingerprint(&mySerial);
RTC_DS3231 rtc;
BluetoothSerial SerialBT;
WebServer server(80);

// Variables de estado de Red y Configuración
bool wifiIniciado = false;
bool btConectado = false;
bool autenticado = false;
String ssid = "Vilers-2";
String pass = "Pabada686";

// Variables de sincronización y temporizadores
unsigned long lastSync = 0;
unsigned long ultimoFichajeTime = 0;
unsigned long ultimoIntentoSincroTime = 0;

// --- FUNCIONES AUXILIARES DE AUDIO Y LEDS ---
// Emite un pitido y puede encender un LED en simultáneo si se le pasa el pin
void sonarBuzzer(int duracionMs, int pinLed = -1) {
  if (pinLed != -1) digitalWrite(pinLed, HIGH);
  digitalWrite(BUZZER, HIGH);
  delay(duracionMs);
  digitalWrite(BUZZER, LOW);
  if (pinLed != -1) digitalWrite(pinLed, LOW);
}

void blinkLED(int pin, int veces) {
  for (int i = 0; i < veces; i++) {
    digitalWrite(pin, HIGH);
    delay(200);
    digitalWrite(pin, LOW);
    delay(200);
  }
}

// Parpadeo simultáneo asíncrono para indicar proceso de red ocupado
void parpadearLedsOcupado() {
  digitalWrite(LED_VERDE, HIGH);
  digitalWrite(LED_ROJO, HIGH);
  delay(150);
  digitalWrite(LED_VERDE, LOW);
  digitalWrite(LED_ROJO, LOW);
  delay(150);
}

// --- MANEJO DE ARCHIVOS OFFLINE (LITTLEFS) ---
void syncTempToFirebase() {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;

  File root = LittleFS.open("/");
  if (!root || !root.isDirectory()) return;

  bool algunArchivoPendiente = false;
  bool huboFalloEnvio = false;

  File file = root.openNextFile();
  while (file) {
    String fileName = String(file.name());
    
    if (fileName.startsWith("/") && fileName.endsWith(".csv") && fileName != "/fichadas.csv" && fileName != "/temp.csv") {
      algunArchivoPendiente = true;
      String fechaLimpia = fileName.substring(1, fileName.length() - 4); 
      
      File fOffline = LittleFS.open(fileName, "r");
      bool archivoSubidoOk = true;

      while (fOffline.available()) {
        String line = fOffline.readStringUntil('\n');
        line.trim();
        
        if (line.length() > 0) {
          parpadearLedsOcupado(); // Destello visual de transmisión

          unsigned long idVariable = 1770000000000ULL + (millis() % 9192516961ULL);
          String urlDestino = String(FB_BASE_URL) + "/asistencia/" + fechaLimpia + "/" + String(idVariable) + ".json";
          
          http.begin(client, urlDestino);
          http.addHeader("Content-Type", "application/json");
          
          String jsonPayload = "\"{\\\"fichada\\\":\\\"" + line + "\\\"}\"";
          int code = http.PUT(jsonPayload);
          
          if (code != 200 && code != 201) {
            archivoSubidoOk = false;
            huboFalloEnvio = true;
          }
          http.end();
        }
      }
      fOffline.close();

      if (archivoSubidoOk) {
        LittleFS.remove(fileName);
        Serial.printf("[SINCRO] Archivo %s procesado y eliminado.\n", fileName.c_str());
      }
    }
    file = root.openNextFile();
  }

  // ALERTA OCIO FALLIDO: Si intentó sincronizar archivos y falló la red
  if (algunArchivoPendiente && huboFalloEnvio) {
    Serial.println("[ALERTA] Error al subir archivos offline en momento ocio. Activando 3 pitidos largos.");
    for (int i = 0; i < 3; i++) {
      sonarBuzzer(600, LED_ROJO); // Pitido largo (600ms) acompañado de LED Rojo
      delay(200);
    }
  }
}

// --- LOGICA DEL SENSOR DE HUELLAS ---
void verificarHuellaAsistencia() {
  if (finger.getImage() == FINGERPRINT_OK) {
    if (finger.image2Tz() == FINGERPRINT_OK && finger.fingerFastSearch() == FINGERPRINT_OK) {
      
      ultimoFichajeTime = millis(); // Reset de inactividad
      
      DateTime now = rtc.now();
      String data = String(finger.fingerID) + "," + now.timestamp();
      Serial.printf("[HUELLA] Detectado ID: %d\n", finger.fingerID);
      
      // SOLUCIÓN AQUÍ: Declaramos un arreglo de 20 caracteres para guardar el texto correctamente
      char pathDia[20]; 
      sprintf(pathDia, "/%04d_%02d_%02d.csv", now.year(), now.month(), now.day());

      File f1 = LittleFS.open("/fichadas.csv", FILE_APPEND);
      if(f1) { f1.println(data); f1.close(); }
      
      File f2 = LittleFS.open(pathDia, FILE_APPEND); // Ahora compilará perfectamente
      if(f2) { f2.println(data); f2.close(); }

      // ALERTA FICHADA CORRECTA: Pitido corto (150ms) junto con LED Verde
      sonarBuzzer(150, LED_VERDE);
      
    } else {
      Serial.println("[HUELLA] No registrada.");
      // ALERTA FICHADA INCORRECTA: Pitido largo (600ms) junto con LED Rojo
      sonarBuzzer(600, LED_ROJO);
    }
    delay(1000); 
  }
}


// ENROLAMIENTO CON TIMEOUT AMPLIADO
uint8_t enrolarHuella(int id) {
  int p = -1;
  Serial.printf("[ENROLAR] Esperando huella válida para el ID #%d\n", id);
  
  unsigned long timeout = millis();
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    if (millis() - timeout > 20000) { 
      Serial.println("[ERR] Tiempo de espera agotado (Paso 1)");
      sonarBuzzer(600, LED_ROJO);
      return FINGERPRINT_TIMEOUT;
    }
    if (p == FINGERPRINT_NOFINGER) delay(100);
  }

  p = finger.image2Tz(1);
  if (p != FINGERPRINT_OK) return p;
  
  Serial.println("[ENROLAR] Levante el dedo...");
  blinkLED(LED_VERDE, 2);
  delay(2000);
  
  p = 0;
  while (p != FINGERPRINT_NOFINGER) {
    p = finger.getImage();
    delay(100);
  }
  
  Serial.println("[ENROLAR] Coloque el mismo dedo otra vez...");
  
  p = -1;
  timeout = millis();
  while (p != FINGERPRINT_OK) {
    p = finger.getImage();
    if (millis() - timeout > 20000) { 
      Serial.println("[ERR] Tiempo de espera agotado (Paso 2)");
      sonarBuzzer(600, LED_ROJO);
      return FINGERPRINT_TIMEOUT;
    }
    if (p == FINGERPRINT_NOFINGER) delay(100);
  }

  p = finger.image2Tz(2);
  if (p != FINGERPRINT_OK) return p;
  
  p = finger.createModel();
  if (p == FINGERPRINT_OK) {
    p = finger.storeModel(id);
    if (p == FINGERPRINT_OK) {
      Serial.println("[EXITO] Guardado correctamente.");
      blinkLED(LED_VERDE, 3);
      return FINGERPRINT_OK;
    }
  }
  blinkLED(LED_ROJO, 3);
  return p;
}

// --- SERVIDOR WEB LOCAL ---
void handleRoot() {
  server.send(200, "text/html", "<h3>ESP32 Servidor Operativo</h3>");
}

void handleDescargarFichadas() {
  if (LittleFS.exists("/fichadas.csv")) {
    File f = LittleFS.open("/fichadas.csv", "r");
    server.streamFile(f, "text/csv");
    f.close();
  } else {
    server.send(404, "text/plain", "Archivo no encontrado");
  }
}

// --- FLUJO DE INICIALIZACIÓN (BLUETOOTH / WIFI) ---
void iniciarWiFi() {
  if (ssid == "" || pass == "") return;
  Serial.printf("[WIFI] Conectando a %s...\n", ssid.c_str());
  WiFi.begin(ssid.c_str(), pass.c_str());
  
  int c = 0;
  while (WiFi.status() != WL_CONNECTED && c < 20) {
    delay(500);
    Serial.print(".");
    c++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Conectado exitosamente.");
    wifiIniciado = true;
    server.on("/", handleRoot);
    server.on("/descargar", handleDescargarFichadas);
    server.begin();

    // ALERTA INICIO WIFI EXITOSO: Un pitido largo (500ms) seguido de uno corto (150ms)
    sonarBuzzer(500); // Largo
    delay(100);       // Breve silencio intermedio
    sonarBuzzer(150); // Corto
    
  } else {
    Serial.println("\n[ERR] Falló conexión WiFi.");
    blinkLED(LED_ROJO, 2);
  }
}

void verificarConexion() {
  if (WiFi.status() != WL_CONNECTED && wifiIniciado) {
    Serial.println("[WIFI] Desconectado. Reintentando...");
    WiFi.disconnect();
    WiFi.begin(ssid.c_str(), pass.c_str());
    delay(2000);
  }
}

void procesarComandosBT() {
  if (SerialBT.available()) {
    String msg = SerialBT.readStringUntil('\n');
    msg.trim();
    
    if (msg.startsWith("AUTH:")) {
      String clave = msg.substring(5);
      if (clave == "OBIWANKENOBI") { 
        autenticado = true;
        SerialBT.println("AUTH:OK");
        sonarBuzzer(150, LED_VERDE); // Feedback auditivo de login exitoso
      } else {
        SerialBT.println("AUTH:FAIL");
        sonarBuzzer(600, LED_ROJO);
      }
    }
    else if (autenticado && msg.startsWith("WIFI:")) {
      int idx = msg.indexOf(',');
      if (idx > 0) {
        ssid = msg.substring(5, idx);
        pass = msg.substring(idx + 1);
        SerialBT.println("WIFI:RCVD");
        iniciarWiFi();
      }
    }
    else if (autenticado && msg.startsWith("ENROLL:")) {
      int id = msg.substring(7).toInt();
      uint8_t res = enrolarHuella(id);
      SerialBT.printf("ENROLL:%s\n", (res == FINGERPRINT_OK) ? "OK" : "FAIL");
    }
  }
}

// --- SETUP PRINCIPAL ---
void setup() {
  Serial.begin(115000);
  pinMode(LED_VERDE, OUTPUT);
  pinMode(LED_ROJO, OUTPUT);
  pinMode(BUZZER, OUTPUT); // Declaración del Pin del Buzzer como salida
  
  if (!LittleFS.begin(true)) Serial.println("[ERR] LittleFS");
  if (!rtc.begin()) Serial.println("[ERR] RTC");
  
  finger.begin(57600);
  if (!finger.verifyPassword()) Serial.println("[ERR] Sensor Huellas");

  // Etapa estricta de inicio Bluetooth
  SerialBT.begin("Laggersoft");
  Serial.println("[SETUP] Servidor Bluetooth activo. Esperando autenticacion...");

  ultimoFichajeTime = millis();
}

// --- BUCLE PRINCIPAL (LOOP) ---
void loop() {
  procesarComandosBT();
  verificarHuellaAsistencia();

  if (wifiIniciado) {
    verificarConexion();
    server.handleClient();

    if (WiFi.status() == WL_CONNECTED) {
      if (millis() - ultimoFichajeTime > 600000) { // 10 minutos de inactividad
        if (millis() - ultimoIntentoSincroTime > 600000) {
          Serial.println("[SISTEMA IDLE] Ejecutando sincronización de registros acumulados...");
          syncTempToFirebase();
          ultimoIntentoSincroTime = millis();
        }
      }
    }
  }
}
