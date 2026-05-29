#!/bin/bash
# ============================================================
# Confetti Fetcher — Synology NAS Run Script
# Called by Synology Task Scheduler
# ============================================================

SCRIPT_DIR="/volume1/homes/admin/confetti_fetcher"
PYTHON="/usr/local/bin/python3"
LOG="$SCRIPT_DIR/fetch_log.txt"

echo "[$( date '+%Y-%m-%d %H:%M:%S' )] Starting Confetti fetch..." >> "$LOG"

# Load environment variables
if [ -f "$SCRIPT_DIR/.env" ]; then
    export $(grep -v '^#' "$SCRIPT_DIR/.env" | xargs)
fi

# Run the fetcher
cd "$SCRIPT_DIR"
"$PYTHON" main.py 2>&1 | tee -a "$LOG"

echo "[$( date '+%Y-%m-%d %H:%M:%S' )] Fetch complete." >> "$LOG"
echo "---" >> "$LOG"
