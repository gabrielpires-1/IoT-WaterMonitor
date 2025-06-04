#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <PubSubClient.h>

// Configurações de WiFi
const char *WIFI_SSID = "VIRUS_ATTACK";
const char *WIFI_PASSWORD = "99954888#";

// Configurações de MQTT
const char *MQTT_BROKER = "192.168.1.100"; // IP do seu notebook
const int MQTT_PORT = 1883;
const char *MQTT_CLIENT_ID = "ESP8266_FlowSensor";
const char *MQTT_TOPIC_VOLUME_PERIODO = "sensors/flow/volume_received"; // Volume do período
const char *MQTT_TOPIC_VOLUME_TOTAL = "sensors/flow/volume_total";      // Volume total acumulado

// Constantes e variáveis do sensor
volatile int contador = 0;
double volumeTotal = 0;
unsigned long tempoUltimaVazao = 0;
const int INTERVALO_MEDICAO = 250; // 250ms
const int PIN_SENSOR = 2;
const double ML_POR_PULSO = 2.25; // ml por pulso do sensor

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

  // Inicializa o tempo
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

  mqttClient.loop(); // Manter a conexão MQTT ativa

  unsigned long tempoAtual = millis();

  // Verifica se passou o intervalo de medição (250ms)
  if (tempoAtual - tempoUltimaVazao >= INTERVALO_MEDICAO)
  {
    int pulsosNesteIntervalo;

    // Captura os pulsos de forma segura
    noInterrupts();
    pulsosNesteIntervalo = contador;
    contador = 0; // Zera para o próximo período
    interrupts();

    // Calcula o volume que passou neste período de 250ms
    double volumePeriodo = pulsosNesteIntervalo * ML_POR_PULSO;

    // Atualiza o volume total acumulado
    volumeTotal += volumePeriodo;

    // Atualiza o tempo da última medição
    tempoUltimaVazao = tempoAtual;

    // Converte para strings para envio MQTT
    char volumePeriodoStr[10];
    char volumeTotalStr[10];
    dtostrf(volumePeriodo, 4, 2, volumePeriodoStr);
    dtostrf(volumeTotal, 4, 2, volumeTotalStr);

    // Verifica conexão MQTT antes de publicar
    if (!mqttClient.connected())
    {
      Serial.println("MQTT desconectado, tentando reconectar...");
      reconnectMQTT();
    }

    // Publica os dados se conectado
    if (mqttClient.connected())
    {
      bool pubVolumePeriodo = mqttClient.publish(MQTT_TOPIC_VOLUME_PERIODO, volumePeriodoStr);
      bool pubVolumeTotal = mqttClient.publish(MQTT_TOPIC_VOLUME_TOTAL, volumeTotalStr);

      if (!pubVolumePeriodo || !pubVolumeTotal)
      {
        Serial.println("Falha ao publicar no MQTT.");
      }
      else
      {
        Serial.print("Publicado - Volume Período: ");
        Serial.print(volumePeriodo);
        Serial.print(" ml | Volume Total: ");
        Serial.print(volumeTotal);
        Serial.println(" ml");
      }
    }
    else
    {
      Serial.println("MQTT desconectado, publicação falhou.");
    }

    // Debug no Serial Monitor
    Serial.print("Pulsos no período: ");
    Serial.print(pulsosNesteIntervalo);
    Serial.print(" | Volume adicionado: ");
    Serial.print(volumePeriodo);
    Serial.print(" ml | Volume Total: ");
    Serial.print(volumeTotal);
    Serial.println(" ml");
  }

  yield(); // Evita problemas com o watchdog
}