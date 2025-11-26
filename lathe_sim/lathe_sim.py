#!/usr/bin/env python3
"""
Lathe Simulator - Simulates CNC Lathe telemetry and publishes to MQTT
Publishes to: plc/{machine-id}/lathe/data
"""
import paho.mqtt.client as mqtt
import json
import time
import random
from datetime import datetime, timezone
import sys
import os
import ssl
import uuid

# Add parent directory to path for config import
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from lathe_sim.config import (
    MQTT_BROKER, MQTT_PORT,
    PUBLISH_INTERVAL, CLIENT_ID, MACHINE_ID
)

# Store MQTT_BROKER for TLS detection
_MQTT_BROKER_HOST = MQTT_BROKER

# Debug/Output options
PRINT_JSON_DATA = os.getenv("PRINT_JSON_DATA", "false").lower() == "true"
SAVE_JSON_DATA = os.getenv("SAVE_JSON_DATA", "false").lower() == "true"
JSON_OUTPUT_FILE = os.getenv("JSON_OUTPUT_FILE", f"/tmp/lathe_sim_data_{MACHINE_ID}.json")

# Lathe State
class LatheState:
    def __init__(self):
        self.parts_completed = 0
        self.start_time = time.time()
        
    def generate_mock_data(self):
        """Generate realistic mock CNC Lathe telemetry"""
        # Increment parts completed every publish
        self.parts_completed += 1
        
        # Generate random values within specified ranges
        load_percent = random.uniform(20, 80)
        speed_actual = random.uniform(1400, 1600)  # Around 1500 ± 100
        
        # Safety: door_closed = 95% true
        door_closed = random.random() > 0.05  # 95% chance of true
        estop_ok = True  # Always true
        
        # Axis positions (random in ranges)
        axis_x_position = random.uniform(0, 200)  # 0-200 mm
        axis_z_position = random.uniform(0, 300)  # 0-300 mm
        
        # Production cycle time
        cycle_time_seconds = random.uniform(20, 50)
        
        # Alarms
        spindle_overload = load_percent > 90
        chuck_not_clamped = False  # Always false for now
        
        data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "machine_id": MACHINE_ID,
            "safety": {
                "door_closed": door_closed,
                "estop_ok": estop_ok,
            },
            "spindle": {
                "speed_actual": round(speed_actual, 1),  # 0-2500 rpm
                "load_percent": round(load_percent, 1),  # 0-100
            },
            "axis_x": {
                "position": round(axis_x_position, 2),  # 0-200 mm
            },
            "axis_z": {
                "position": round(axis_z_position, 2),  # 0-300 mm
            },
            "production": {
                "cycle_time_seconds": round(cycle_time_seconds, 1),  # 20-50
                "parts_completed": self.parts_completed,
            },
            "alarms": {
                "spindle_overload": spindle_overload,
                "chuck_not_clamped": chuck_not_clamped,
            }
        }
        
        return data

# MQTT Client Setup
connected = False
reconnect_count = 0

def on_connect(client, userdata, flags, rc):
    global connected, reconnect_count
    if rc == 0:
        connected = True
        if reconnect_count > 0:
            print(f"✅ Reconnected to MQTT broker (reconnect #{reconnect_count})")
            reconnect_count = 0
        else:
            print(f"✅ Connected to MQTT broker at {MQTT_BROKER}:{MQTT_PORT}")
    else:
        connected = False
        print(f"❌ Failed to connect, return code {rc}")

def on_publish(client, userdata, mid):
    # Suppress verbose publish messages
    pass

def on_disconnect(client, userdata, rc):
    global connected, reconnect_count
    connected = False
    if rc != 0:
        reconnect_count += 1
        print(f"⚠️  Unexpected disconnection (rc={rc}). Reconnecting...")
    else:
        print("ℹ️  Disconnected from broker")

def on_log(client, userdata, level, buf):
    # Only log warnings and errors
    if level <= mqtt.MQTT_LOG_WARNING:
        print(f"MQTT Log: {buf}")

# Initialize MQTT client with unique client ID
client = mqtt.Client(client_id=f"{CLIENT_ID}_{MACHINE_ID}_{uuid.uuid4().hex[:8]}", clean_session=True)
client.on_connect = on_connect
client.on_publish = on_publish
client.on_disconnect = on_disconnect
client.on_log = on_log

# Enable automatic reconnection
client.reconnect_delay_set(min_delay=1, max_delay=120)

# Check if TLS is enabled
MQTT_TLS_ENABLED = os.getenv("MQTT_TLS_ENABLED", "false").lower() == "true"
# Use mock_plc_agent credentials (same as bottle filler mock agent)
MQTT_USERNAME = os.getenv("MQTT_USERNAME", "mock_plc_agent")
MQTT_PASSWORD = os.getenv("MQTT_PASSWORD", "mock_plc_agent_pass")
CA_CERT_PATH = os.getenv("CA_CERT_PATH", "")

# Configure TLS if enabled
if MQTT_TLS_ENABLED:
    print(f"🔐 Configuring TLS connection...")
    # Check if connecting to cloud broker (HiveMQ Cloud, etc.)
    is_cloud_broker = "hivemq.cloud" in _MQTT_BROKER_HOST.lower() or "cloud" in _MQTT_BROKER_HOST.lower()
    is_localhost = "localhost" in _MQTT_BROKER_HOST.lower() or "127.0.0.1" in _MQTT_BROKER_HOST
    
    if CA_CERT_PATH and os.path.exists(CA_CERT_PATH) and not is_cloud_broker:
        # Use CA cert for local/self-hosted brokers
        client.tls_set(ca_certs=CA_CERT_PATH, cert_reqs=ssl.CERT_REQUIRED)
        # Disable hostname verification for localhost
        if is_localhost:
            client.tls_insecure_set(True)
            print(f"   ⚠️  Hostname verification disabled for localhost")
        else:
            client.tls_insecure_set(False)
        print(f"   ✅ Using CA certificate: {CA_CERT_PATH}")
    else:
        # For cloud brokers or when cert not found, disable certificate verification
        if is_cloud_broker:
            print(f"   ℹ️  Cloud MQTT broker detected, disabling certificate verification")
        else:
            print(f"   ⚠️  CA cert not found, running without TLS verification")
        client.tls_set(cert_reqs=ssl.CERT_NONE)
        client.tls_insecure_set(True)

# Set username and password if provided
if MQTT_USERNAME and MQTT_PASSWORD:
    client.username_pw_set(MQTT_USERNAME, MQTT_PASSWORD)
    print(f"   🔑 Using authentication: {MQTT_USERNAME}")

def connect_broker():
    global connected
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
        client.loop_start()
        # Wait for connection
        timeout = 10
        while not connected and timeout > 0:
            time.sleep(0.5)
            timeout -= 0.5
        if not connected:
            print(f"❌ Connection timeout after 10 seconds")
            return False
        return True
    except Exception as e:
        print(f"❌ Connection error: {e}")
        print(f"   Make sure the MQTT broker is running at {MQTT_BROKER}:{MQTT_PORT}")
        return False

connect_broker()

# Initialize lathe state
lathe = LatheState()

print("🚀 Lathe Simulator started. Publishing data every {} seconds...".format(PUBLISH_INTERVAL))
print(f"🏭 Machine ID: {MACHINE_ID}")
print(f"📡 Topic: plc/{MACHINE_ID}/lathe/data")
print("Press Ctrl+C to stop\n")

def startLatheMock():
    """Main function to start the lathe mock simulator"""
    global connected
    try:
        while True:
            # Check connection status before publishing
            if not connected:
                print("⏳ Waiting for connection...")
                time.sleep(1)
                continue
            
            # Generate mock data
            data = lathe.generate_mock_data()
            
            try:
                # Publish to MQTT
                topic = f"plc/{MACHINE_ID}/lathe/data"
                payload = json.dumps(data, indent=2)
                result = client.publish(topic, payload, qos=1, retain=False)
                
                # Print telemetry to console
                print(f"📤 [{MACHINE_ID}] Published to MQTT:")
                print(f"   ⏰ Time: {data['timestamp']}")
                print(f"   🔒 Safety: Door={data['safety']['door_closed']} | EStop={data['safety']['estop_ok']}")
                print(f"   ⚙️  Spindle: Speed={data['spindle']['speed_actual']:.1f} RPM | Load={data['spindle']['load_percent']:.1f}%")
                print(f"   📍 Axis X: {data['axis_x']['position']:.2f} mm | Axis Z: {data['axis_z']['position']:.2f} mm")
                print(f"   📊 Production: Cycle={data['production']['cycle_time_seconds']:.1f}s | Parts={data['production']['parts_completed']}")
                print(f"   ⚠️  Alarms: SpindleOverload={data['alarms']['spindle_overload']} | ChuckNotClamped={data['alarms']['chuck_not_clamped']}")
                print(f"   📡 Topic: {topic}")
                
                # Print full JSON if enabled
                if PRINT_JSON_DATA:
                    print(f"\n📄 Full JSON Data:")
                    print("=" * 60)
                    print(payload)
                    print("=" * 60)
                
                # Save to JSON file if enabled
                if SAVE_JSON_DATA:
                    try:
                        # Read existing data if file exists
                        json_data = []
                        if os.path.exists(JSON_OUTPUT_FILE):
                            try:
                                with open(JSON_OUTPUT_FILE, 'r') as f:
                                    json_data = json.load(f)
                                    if not isinstance(json_data, list):
                                        json_data = [json_data]
                            except (json.JSONDecodeError, ValueError):
                                json_data = []
                        
                        # Append new data with timestamp
                        json_data.append({
                            "timestamp": data['timestamp'],
                            "machine_id": MACHINE_ID,
                            "topic": topic,
                            "data": data
                        })
                        
                        # Write back to file
                        with open(JSON_OUTPUT_FILE, 'w') as f:
                            json.dump(json_data, f, indent=2)
                        
                        print(f"💾 Saved to: {JSON_OUTPUT_FILE} ({len(json_data)} entries)")
                    except Exception as e:
                        print(f"⚠️  Error saving JSON: {e}")
                
                print()
            except Exception as e:
                print(f"⚠️  Error publishing: {e}")
                connected = False
            
            time.sleep(PUBLISH_INTERVAL)
            
    except KeyboardInterrupt:
        print("\n🛑 Stopping lathe simulator...")
        client.loop_stop()
        client.disconnect()
        print("✅ Lathe simulator stopped")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        client.loop_stop()
        client.disconnect()
        exit(1)

# Run if executed directly
if __name__ == "__main__":
    startLatheMock()

