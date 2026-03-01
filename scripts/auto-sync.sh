#!/bin/bash
# Dashboard Auto-Sync — watches tasks.json and pushes changes every 5 seconds
# Start: nohup bash scripts/auto-sync.sh > /tmp/auto-sync.log 2>&1 &
# Stop:  kill $(cat /tmp/auto-sync.pid)

REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"
TASKS_FILE="$REPO_DIR/public/data/tasks.json"
echo $$ > /tmp/auto-sync.pid
echo "[$(date)] 👀 Auto-sync started (PID $$), watching $TASKS_FILE"

LAST_HASH=""

while true; do
    sleep 5
    
    CURRENT_HASH=$(md5 -q "$TASKS_FILE" 2>/dev/null || md5sum "$TASKS_FILE" | cut -d' ' -f1)
    
    if [ "$CURRENT_HASH" != "$LAST_HASH" ] && [ -n "$LAST_HASH" ]; then
        echo "[$(date)] 📝 Change detected, syncing..."
        
        cd "$REPO_DIR"
        git add public/data/tasks.json 2>/dev/null
        git commit -m "[auto-sync] Dashboard update" 2>/dev/null
        
        if git push 2>/dev/null; then
            echo "[$(date)] ✅ Pushed to GitHub"
        else
            git pull --rebase 2>/dev/null
            if git push 2>/dev/null; then
                echo "[$(date)] ✅ Pushed (after rebase)"
            else
                echo "[$(date)] ⚠️  Push failed"
            fi
        fi
    fi
    
    LAST_HASH="$CURRENT_HASH"
done
