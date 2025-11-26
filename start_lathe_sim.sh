#!/bin/bash
# Start Lathe Simulator
# Usage: start_lathe_sim.sh [lathe01]

MACHINE_ID=${1:-lathe01}

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Set machine ID as environment variable
export LATHE_MACHINE_ID="$MACHINE_ID"

echo "🚀 Starting Lathe Simulator for $MACHINE_ID..."
echo "   Working directory: $(pwd)"
echo "   Machine ID: $MACHINE_ID"
echo ""

# Use python3 or python depending on what's available
if command -v python3 &> /dev/null; then
    PYTHON_CMD=python3
elif command -v python &> /dev/null; then
    PYTHON_CMD=python
else
    echo "❌ Error: Python not found!"
    exit 1
fi

$PYTHON_CMD lathe_sim/lathe_sim.py

