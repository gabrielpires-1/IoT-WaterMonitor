# IoT-WaterMonitor

Sistema completo de monitoramento de consumo de água em tempo real utilizando ESP8266, sensor de vazão YF-S201, Node-RED, backend em Go e frontend React. O sistema detecta vazamentos automaticamente e envia alertas por email.

## **Autores:**

- Gabriel Pires(gpac@cesar.school)
- Luis Mingati (locm@cesar.school)
- João Ventura (jvpv@cesar.school)

## 📋 Descrição do Projeto

O IoT-WaterMonitor é uma solução IoT para monitoramento inteligente do consumo de água que integra:

- **Hardware**: ESP8266 + Sensor YF-S201 para coleta de dados de vazão
- **Comunicação**: Protocolo MQTT via Wi-Fi para transmissão em tempo real
- **Processamento**: Node-RED para orquestração e detecção de anomalias
- **Backend**: API REST em Golang para persistência e análise de dados
- **Frontend**: Dashboard React para visualização e relatórios
- **Alertas**: Sistema automatizado de notificação por email via Resend

## 🛠️ Requisitos Técnicos

### Hardware
- ESP8266 (NodeMCU ou similar)
- Sensor de vazão YF-S201
- Roteador Wi-Fi 2.4GHz

### Software
- **Node.js** >= 18.0
- **Go** >= 1.24
- **PostgreSQL** >= 13
- **Docker** e **Docker Compose**
- **Visual Studio Code** com **PlatformIO** (para ESP8266)
- **pnpm** (gerenciador de pacotes Node.js)

### Dependências Principais
- **ESP8266**: ESP8266WiFi, PubSubClient
- **Backend**: Gin, GORM, PostgreSQL driver
- **Frontend**: React, Recharts, Tailwind CSS
- **Node-RED**: Módulos MQTT, HTTP request, Email

## 🚀 Como Rodar

### 1. Backend (Golang)

```bash
# 1. Clone o repositório
git clone <repository-url>
cd IoT-WaterMonitor

# 2. Instale as dependências
go mod tidy

# 3. Configure o banco de dados PostgreSQL
docker compose up -d

# 4. Configure a variável de ambiente do banco
export DATABASE_URL=postgres://user:password@localhost:5444/postgres

# 5. Execute as migrações do banco
tern migrate --migrations ./db/migrations

# 6. Instale o Air para hot reload (opcional)
go install github.com/air-verse/air@latest

# 7. Execute o backend
air
# OU simplesmente: go run main.go
```

O backend estará rodando em `http://localhost:8080`

### 2. Frontend (React)

```bash
# 1. Navegue para o diretório do frontend
cd frontend

# 2. Instale as dependências
pnpm install

# 3. Execute o servidor de desenvolvimento
pnpm dev
```

O frontend estará disponível em `http://localhost:3000`

### 3. MQTT Broker e Node-RED

```bash
# 1. Instale o Node-RED globalmente
npm install -g node-red

# 2. Execute o Node-RED
node-red

# 3. Acesse a interface web
# Abra: http://localhost:1880

# 4. Importe o fluxo
# - Vá em Menu > Import
# - Cole o conteúdo do arquivo: application/node-red/flows.json
# - Clique em Deploy
```

**Configurações necessárias no Node-RED:**
- Configure o MQTT Broker (localhost:1883)
- Configure o node de email com suas credenciais Resend
- Ajuste os limites de vazão conforme necessário

### 4. Firmware ESP8266

```bash
# 1. Abra o VS Code na pasta do firmware
cd firmware-esp8266

# 2. Instale a extensão PlatformIO no VS Code

# 3. Abra o projeto no PlatformIO

# 4. Configure suas credenciais Wi-Fi no arquivo src/main.cpp:
# - WIFI_SSID: "Seu_WiFi"
# - WIFI_PASSWORD: "Sua_Senha"
# - MQTT_BROKER: "IP_do_seu_computador" (ex: 192.168.1.100)

# 5. Conecte a ESP8266 via USB

# 6. Compile e faça upload:
# - Ctrl+Shift+P → "PlatformIO: Upload"
# OU use os botões da interface do PlatformIO
```

**Conexões Hardware:**
- Sensor YF-S201 → Pino D4 (GPIO 2) da ESP8266
- VCC do sensor → 5V
- GND do sensor → GND
- Signal do sensor → D4

## 📊 Funcionalidades

- **Monitoramento em tempo real** de consumo de água (atualizações a cada 250ms)
- **Detecção automática de vazamentos** com alertas por email
- **Dashboard interativo** com gráficos e estatísticas
- **Histórico de consumo** com análises temporais
- **API REST** para integração com outros sistemas
- **Arquitetura escalável** e modular

## 📡 Tópicos MQTT

- `sensors/flow/volume_received`: Volume do período atual (ml)
- `sensors/flow/volume_total`: Volume total acumulado (ml)

## 🔧 Configurações Adicionais

### Calibração do Sensor
O sensor está configurado para **2.25 ml por pulso**. Ajuste a constante `ML_POR_PULSO` no firmware se necessário.

### Intervalo de Medição
Por padrão, as leituras são enviadas a cada **250ms**. Modifique `INTERVALO_MEDICAO` para alterar a frequência.

### Alertas de Vazamento
Configure os limites no Node-RED conforme o perfil de consumo da instalação.
