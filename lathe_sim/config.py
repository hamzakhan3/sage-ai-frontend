"""
Configuration file for Lathe Simulator
"""
import os

# Load .env file from project root
try:
    from dotenv import load_dotenv
    # Load from project root (parent of lathe_sim directory)
    env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
    load_dotenv(env_path)
except ImportError:
    pass  # dotenv not installed, skip

# MQTT Configuration
MQTT_BROKER = os.getenv("MQTT_BROKER_HOST", "localhost")
MQTT_PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
MQTT_TOPIC_BASE = "plc/lathe"

# Agent Configuration
PUBLISH_INTERVAL = float(os.getenv("LATHE_PUBLISH_INTERVAL", "1.0"))  # seconds (default 1 second)
CLIENT_ID = "lathe_sim"

# Machine ID
MACHINE_ID = os.getenv("LATHE_MACHINE_ID", "lathe01")

