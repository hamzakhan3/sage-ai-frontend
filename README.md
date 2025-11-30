# MQTT OT Network - Industrial Monitoring & AI Platform

A comprehensive industrial IoT platform for real-time monitoring, data visualization, and AI-powered maintenance recommendations for PLC-based manufacturing systems. Supports bottle filler and CNC lathe machines with MQTT pub/sub architecture, time-series data storage, and intelligent workflow automation.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OT Network (Operational Technology)              │
│                                                                           │
│  ┌──────────────┐      ┌──────────────┐      ┌──────────────┐          │
│  │ Mock PLC     │      │ CNC Lathe    │      │ Modbus      │          │
│  │ Agent        │      │ Simulator    │      │ Server      │          │
│  │ (Bottle      │      │              │      │             │          │
│  │  Filler)     │      │              │      │             │          │
│  └──────┬───────┘      └──────┬───────┘      └──────┬───────┘          │
│         │                      │                     │                   │
│         └──────────────────────┼─────────────────────┘                   │
│                                 │                                         │
│                          ┌──────▼───────┐                                │
│                          │ MQTT Broker  │                                │
│                          │ (Mosquitto)  │                                │
│                          │ Port: 1883   │                                │
│                          │ Port: 9001   │                                │
│                          └──────┬───────┘                                │
└─────────────────────────────────┼─────────────────────────────────────────┘
                                  │
┌─────────────────────────────────┼─────────────────────────────────────────┐
│                         IT Network (Information Technology)               │
│                                  │                                         │
│                          ┌──────▼───────┐                                │
│                          │ InfluxDB     │                                │
│                          │ Writer       │                                │
│                          │ (Python)     │                                │
│                          └──────┬───────┘                                │
│                                  │                                         │
│                          ┌──────▼───────┐                                │
│                          │ InfluxDB 2.7 │                                │
│                          │ (Time-Series)│                                │
│                          │ Port: 8086   │                                │
│                          └──────┬───────┘                                │
│                                  │                                         │
│  ┌───────────────────────────────┼───────────────────────────────┐      │
│  │                               │                               │      │
│  ┌──────▼───────┐      ┌─────────▼────────┐      ┌──────────────▼──┐  │
│  │ Next.js      │      │ Alarm Monitor    │      │ Grafana         │  │
│  │ Frontend     │      │ (Real-time)      │      │ (Dashboards)    │  │
│  │ Port: 3005   │      │                  │      │ Port: 3003      │  │
│  └──────┬───────┘      └──────────────────┘      └──────────────────┘  │
│         │                                                               │
│  ┌──────▼──────────────────────────────────────────────────────────┐  │
│  │ AI Services                                                       │  │
│  │  - Pinecone (Vector DB) - RAG for maintenance docs              │  │
│  │  - OpenAI GPT - Chat interface & workflow automation            │  │
│  │  - LangGraph - Visual workflow builder                          │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

## 🚀 Key Features

- **Real-time Monitoring**: Live PLC data visualization with charts, gauges, and status panels
- **Time-Series Storage**: Historical data storage in InfluxDB with queryable time ranges
- **Multi-Machine Support**: Monitor multiple bottle filler and CNC lathe machines simultaneously
- **AI-Powered Chat**: RAG-based chat assistant for alarm response and maintenance procedures
- **Work Order Management**: Generate, track, and manage maintenance work orders with calendar view
- **Alarm Management**: Real-time alarm monitoring with AI-powered analysis and recommendations
- **Workflow Automation**: Visual workflow builder using LangGraph for automated processes
- **Alarm Events History**: Track and analyze alarm events over time
- **Vibration Analysis**: Monitor CNC lathe vibration data with anomaly detection

## 📋 Prerequisites

- **Docker & Docker Compose** - For running MQTT broker, InfluxDB, and Grafana
- **Python 3.7+** - For Python services (InfluxDB writer, mock PLC agents, alarm monitor)
- **Node.js 18+** - For Next.js frontend
- **npm or yarn** - Package manager for frontend dependencies

## 🛠️ Installation

### 1. Clone the Repository

```bash
git clone https://github.com/hamzakhan3/mqtt-ot-network.git
cd mqtt-ot-network
```

### 2. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 3. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 4. Set Up Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
cd frontend
cat > .env.local << EOF
# InfluxDB Configuration
NEXT_PUBLIC_INFLUXDB_URL=http://localhost:8086
NEXT_PUBLIC_INFLUXDB_TOKEN=my-super-secret-auth-token
NEXT_PUBLIC_INFLUXDB_ORG=myorg
NEXT_PUBLIC_INFLUXDB_BUCKET=plc_data

# Pinecone Configuration (for AI features)
NEXT_PUBLIC_PINECONE_API_KEY=your-pinecone-api-key
NEXT_PUBLIC_PINECONE_ENVIRONMENT=your-pinecone-environment
NEXT_PUBLIC_PINECONE_INDEX=your-index-name

# OpenAI Configuration (for AI features)
OPENAI_API_KEY=your-openai-api-key
EOF
```

## 🚦 Starting the Project

### Step 1: Start Docker Services

Start MQTT broker, InfluxDB, and Grafana:

```bash
docker-compose up -d
```

Verify services are running:
```bash
docker ps
```

You should see:
- `mqtt-broker` (ports 1883, 9001)
- `influxdb` (port 8086)
- `grafana` (port 3003)

### Step 2: Start InfluxDB Writer

The writer subscribes to MQTT and stores data in InfluxDB:

```bash
./start_influxdb_writer.sh
```

Or manually:
```bash
export MQTT_BROKER_HOST=localhost
export MQTT_BROKER_PORT=1883
export INFLUXDB_URL=http://localhost:8086
export INFLUXDB_TOKEN=my-super-secret-auth-token
export INFLUXDB_ORG=myorg
export INFLUXDB_BUCKET=plc_data

python3 influxdb_writer/influxdb_writer_production.py
```

### Step 3: Start Mock PLC Agents

**For Bottle Filler Machines:**

```bash
# Machine 01
./start_mock_plc.sh machine-01

# Machine 02 (in another terminal)
./start_mock_plc.sh machine-02

# Machine 03 (in another terminal)
./start_mock_plc.sh machine-03

# Or start all at once (macOS)
./start_all_machines.sh
```

**For CNC Lathe Machines:**

```bash
./start_lathe_sim.sh lathe01
```

### Step 4: Start Alarm Monitor (Optional)

For real-time alarm monitoring:

```bash
./start_alarm_monitor.sh
```

### Step 5: Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3005`

## 📁 Project Structure

```
mqtt-ot-network/
├── frontend/                    # Next.js frontend application
│   ├── app/                     # Next.js app router pages
│   │   ├── page.tsx            # Main dashboard
│   │   ├── chat/               # AI chat interface
│   │   ├── work-orders/        # Work order management
│   │   ├── alarm-events/       # Alarm events history
│   │   └── workflows/          # Visual workflow builder
│   ├── components/             # React components
│   ├── lib/                    # Utility libraries
│   └── hooks/                  # Custom React hooks
│
├── mock_plc_agent/            # Mock PLC agent (bottle filler)
├── lathe_sim/                  # CNC lathe simulator
├── influxdb_writer/            # MQTT to InfluxDB writer
├── alarm_monitor/             # Real-time alarm monitor
├── modbus_server/             # Modbus TCP server
├── modbus_reader/             # Modbus client
│
├── mosquitto/                  # MQTT broker configuration
├── influxdb/                   # InfluxDB data and config
├── grafana/                    # Grafana dashboards
│
├── docker-compose.yml          # Docker services configuration
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🔧 Configuration

### InfluxDB Setup

Default credentials (change in production):
- **URL**: `http://localhost:8086`
- **Username**: `admin`
- **Password**: `admin123`
- **Organization**: `myorg`
- **Bucket**: `plc_data`
- **Token**: `my-super-secret-auth-token`

### MQTT Configuration

- **Port 1883**: Non-TLS MQTT (development)
- **Port 8883**: TLS MQTT (production)
- **Port 9001**: WebSocket

### Frontend Ports

- **Next.js**: `3005`
- **Grafana**: `3003`
- **InfluxDB**: `8086`

## 🎯 Usage

### Dashboard

Access the main dashboard at `http://localhost:3005`:

- **Service Controls**: Start/stop InfluxDB writer and mock PLC agents
- **Machine Selection**: Switch between bottle filler and CNC lathe machines
- **Real-time Charts**: View production rates, spindle speed, vibration data
- **Alarm Events**: Monitor real-time alarms with AI-powered analysis
- **Tag Values**: View all PLC tag values in real-time

### Work Orders

- **Generate Work Orders**: Create maintenance work orders from alarm events
- **Calendar View**: Google Calendar-style view with time slots
- **List View**: Detailed list of all work orders
- **AI Auto-Fill**: Automatically fill work order details from maintenance manuals

### AI Chat

- **Ask Questions**: Get answers about alarm procedures and maintenance
- **Context-Aware**: Maintains conversation history
- **RAG-Powered**: Retrieves information from embedded documentation

### Workflows

- **Visual Builder**: Drag-and-drop workflow creation
- **Node-Based**: Create workflows with agent, monitor, and action nodes
- **LangGraph Integration**: Execute complex workflows automatically

## 🔐 Security Notes

⚠️ **For Production Deployment:**

1. **Change Default Passwords**: Update InfluxDB and Grafana default credentials
2. **Enable MQTT Authentication**: Configure username/password in Mosquitto
3. **Use TLS**: Enable TLS on MQTT port 8883
4. **Secure API Keys**: Store Pinecone and OpenAI keys securely (use environment variables)
5. **Network Isolation**: Deploy OT and IT networks separately

## 🧪 Testing

### Verify MQTT Connection

```bash
# Subscribe to MQTT topics
mosquitto_sub -h localhost -t "plc/+/bottlefiller/data" -v
```

### Check InfluxDB Data

```bash
python3 check_influxdb_data.py
```

### Test API Endpoints

```bash
# Test latest data endpoint
python3 test_api_latest.py machine-01

# Test work orders API
curl http://localhost:3005/api/work-orders
```

## 🐛 Troubleshooting

### MQTT Connection Issues

- **Check broker is running**: `docker ps | grep mqtt`
- **Verify port**: Should be 1883 (dev) or 8883 (prod)
- **Check network**: Ensure services are on the same Docker network

### No Data in Frontend

- **Click Refresh**: Use the refresh button on the dashboard
- **Check InfluxDB writer**: Ensure it's running and connected
- **Verify bucket name**: Should match configuration
- **Check browser console**: Look for API errors

### Frontend Not Loading

- **Check Node.js version**: Requires Node.js 18+
- **Reinstall dependencies**: `cd frontend && rm -rf node_modules && npm install`
- **Check port 3005**: Ensure it's not in use

## 📚 Additional Documentation

- [Architecture Details](./ARCHITECTURE_DETAILED.md)
- [Quick Start Guide](./QUICK_START.md)
- [API Endpoints](./API_ENDPOINTS.md)
- [Work Orders Documentation](./MAINTENANCE_WORK_ORDERS.md)
- [Chat Setup](./CHAT_SETUP.md)
- [Deployment Guides](./CLOUD_DEPLOYMENT.md)

## 🤝 Contributing

This project is actively maintained. For issues or questions, please check the documentation or open an issue on GitHub.

## 📄 License

This project is provided as-is for educational and development purposes.

## 🔗 Related Services

- **InfluxDB UI**: `http://localhost:8086`
- **Grafana**: `http://localhost:3003` (admin/admin)
- **Frontend**: `http://localhost:3005`

---

**Last Updated**: 2025-01-28
