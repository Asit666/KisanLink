#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
⏱️ Training Monitor — Check progress without GPU load
Polls checkpoint file for updates (no computation)
"""

import os
import time
import sys
from pathlib import Path
from datetime import datetime

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

CHECKPOINT_PATH = "./models/crop_doctor_v1.pt"
TRAINED_MODEL_SIZE_MB = 80  # Fully trained model should be ~80-100 MB


def check_training_status():
    """Check if training is complete"""
    if not os.path.exists(CHECKPOINT_PATH):
        return "❌ Model file not found"
    
    file_size_mb = os.path.getsize(CHECKPOINT_PATH) / (1024 * 1024)
    last_modified = os.path.getmtime(CHECKPOINT_PATH)
    last_modified_time = datetime.fromtimestamp(last_modified).strftime("%H:%M:%S")
    
    print(f"📊 Checkpoint Status:")
    print(f"  File: {CHECKPOINT_PATH}")
    print(f"  Size: {file_size_mb:.1f} MB")
    print(f"  Last Updated: {last_modified_time}")
    
    if file_size_mb < 50:
        print(f"\n  ⏳ Training in progress... (currently {file_size_mb:.0f}% of expected size)")
        return "training"
    elif file_size_mb >= TRAINED_MODEL_SIZE_MB:
        print(f"\n  ✅ Training complete! Model fully trained.")
        return "complete"
    else:
        print(f"\n  🔄 Model updated (possibly checkpoint save)")
        return "progress"


def monitor_until_complete(check_interval=60, max_wait_minutes=60):
    """Monitor checkpoint until training completes"""
    print(f"🚀 Monitoring for training completion...")
    print(f"   Checking every {check_interval} seconds")
    print(f"   Max wait: {max_wait_minutes} minutes\n")
    
    start_time = time.time()
    last_size = 0
    
    while True:
        status = check_training_status()
        current_size = os.path.getsize(CHECKPOINT_PATH) / (1024 * 1024) if os.path.exists(CHECKPOINT_PATH) else 0
        
        # Show size change
        if current_size != last_size:
            print(f"\n  📈 Size changed: {last_size:.1f} MB → {current_size:.1f} MB")
            last_size = current_size
        
        if status == "complete":
            print(f"\n" + "="*60)
            print(f"🎉 TRAINING COMPLETE!")
            print(f"="*60)
            print(f"\nNext steps:")
            print(f"1. python evaluate.py       → Get per-class accuracy")
            print(f"2. python dataset_check.py  → Check class balance")
            print(f"3. Restart app.py           → Load trained model")
            print(f"4. Test in browser          → Verify predictions\n")
            break
        
        elapsed = (time.time() - start_time) / 60
        if elapsed > max_wait_minutes:
            print(f"⚠️ Timeout: Waited {max_wait_minutes} minutes")
            break
        
        time.sleep(check_interval)


if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1 and sys.argv[1] == "watch":
        # Continuous monitoring
        check_interval = int(sys.argv[2]) if len(sys.argv) > 2 else 60
        monitor_until_complete(check_interval=check_interval)
    else:
        # Single check
        check_training_status()
