#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

// Configurações de WiFi
const char *WIFI_SSID = "WIFI";
const char *WIFI_PASSWORD = "PASSWORD#";

// Configurações de MQTT
const char *MQTT_BROKER = "192.168.1.100"; // IP do seu notebook
const int MQTT_PORT = 1883;
const char *MQTT_CLIENT_ID = "ESP8266_FlowSensor";
const char *MQTT_TOPIC_FLOW = "sensors/flow/volume";
const char *MQTT_TOPIC_VAZAO = "sensors/flow/rate";

// Constantes e variáveis do sensor
double calculoVazao;
volatile int contador = 0;
int ultimoContador = 0;
double volumeTotal = 0;
unsigned long tempoUltimaImpressao = 0;
unsigned long tempoUltimaVazao = 0;
const int INTERVALO_MEDICAO = 250;
const int PIN_SENSOR = 2;

// Objetos WiFi e MQTT
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// Função de interrupção
void IRAM_ATTR Vazao()
{
  contador++;
}

// Reconectar ao WiFi
void reconnectWiFi()
{
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println("\nConectado ao WiFi");
  Serial.println("Endereço IP: " + WiFi.localIP().toString());
}

// Reconectar ao MQTT
void reconnectMQTT()
{
  while (!mqttClient.connected())
  {
    Serial.print("Tentando conectar ao MQTT Broker...");

    if (mqttClient.connect(MQTT_CLIENT_ID))
    {
      Serial.println("Conectado!");
    }
    else
    {
      Serial.print("Falha, rc=");
      Serial.print(mqttClient.state());
      Serial.println(" Tentando novamente em 5 segundos");
      delay(5000);
    }
  }
}

void setup()
{
  // Inicialização Serial
  Serial.begin(115200);
  delay(1000);

  // Configuração WiFi
  WiFi.mode(WIFI_STA);
  reconnectWiFi();

  // Configuração MQTT
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);

  // Configuração do sensor
  pinMode(PIN_SENSOR, INPUT);
  attachInterrupt(digitalPinToInterrupt(PIN_SENSOR), Vazao, FALLING);

  // Inicializa os contadores de tempo
  tempoUltimaImpressao = millis();
  tempoUltimaVazao = millis();

  Serial.println("Setup concluído. Aguardando pulsos do sensor...");
}

void loop()
{
  // Verifica conexões
  if (WiFi.status() != WL_CONNECTED)
  {
    reconnectWiFi();
  }

  if (!mqttClient.connected())
  {
    reconnectMQTT();
  }
  // DENTRO DA SUA FUNÇÃO loop()
  // ... (código anterior do loop) ...
  mqttClient.loop(); // Certifique-se que está aqui

  unsigned long tempoAtual = millis();

  if (tempoAtual - tempoUltimaVazao >= INTERVALO_MEDICAO)
  {
    int pulsosNesteIntervalo; // Variável local para guardar os pulsos

    noInterrupts();                  // Desabilita interrupções brevemente
    pulsosNesteIntervalo = contador; // Copia o contador
    contador = 0;                    // Zera o contador para o próximo intervalo
    interrupts();                    // Reabilita interrupções IMEDIATAMENTE

    tempoUltimaVazao = tempoAtual; // Atualiza o tempo da última medição

    // Agora, faça os cálculos e a comunicação MQTT com 'pulsosNesteIntervalo'
    // As interrupções já estão habilitadas aqui.

    calculoVazao = (pulsosNesteIntervalo * 2.25 * (1000.0 / INTERVALO_MEDICAO));
    double volumeIntervalo = pulsosNesteIntervalo * 2.25; // ml por pulso * pulsos
    volumeTotal += volumeIntervalo;

    char vazaoStr[10];
    char volumeStr[10];
    dtostrf(calculoVazao, 4, 2, vazaoStr);
    dtostrf(volumeTotal, 4, 2, volumeStr);

    // Verifique a conexão MQTT antes de publicar
    if (!mqttClient.connected())
    {
      Serial.println("MQTT desconectado, tentando reconectar antes de publicar...");
      reconnectMQTT(); // Tenta reconectar
    }

    // Só publica se estiver conectado
    if (mqttClient.connected())
    {
      bool pubVazao = mqttClient.publish(MQTT_TOPIC_VAZAO, vazaoStr);
      bool pubFlow = mqttClient.publish(MQTT_TOPIC_FLOW, volumeStr);
      if (!pubVazao || !pubFlow)
      {
        Serial.println("Falha ao publicar no MQTT.");
      }
    }
    else
    {
      Serial.println("MQTT ainda desconectado, publicação falhou.");
    }

    Serial.print("Vazão: ");
    Serial.print(calculoVazao);
    Serial.print(" ml/s | Volume Total: ");
    Serial.print(volumeTotal);
    Serial.println(" ml");
  }
  // Adicione yield() para ajudar o watchdog
  yield(); // ou delay(0); ou delay(1);
} // Fim da função loop()