#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
📊 Dataset Quality Check — Lightweight Analysis (No GPU needed)
Checks class balance, image properties, and flags potential issues
"""

import os
import sys
import json
from pathlib import Path
from collections import defaultdict
import hashlib

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")


def check_class_balance(data_dir="./data"):
    """Check if classes are balanced"""
    print("📊 Analyzing Class Balance...\n")
    
    train_path = os.path.join(data_dir, "train")
    valid_path = os.path.join(data_dir, "valid")
    
    # Count samples per class
    class_counts = defaultdict(lambda: {"train": 0, "valid": 0})
    
    for split, split_path in [("train", train_path), ("valid", valid_path)]:
        for class_dir in os.listdir(split_path):
            class_path = os.path.join(split_path, class_dir)
            if os.path.isdir(class_path):
                n_images = len([f for f in os.listdir(class_path) if f.lower().endswith(('.jpg', '.jpeg', '.png'))])
                class_counts[class_dir][split] = n_images
    
    # Print balance report
    print(f"{'Class Name':<35} | {'Train':>7} | {'Valid':>7} | {'Ratio':>6}")
    print("="*65)
    
    train_counts = []
    valid_counts = []
    
    for class_name in sorted(class_counts.keys()):
        train_n = class_counts[class_name]["train"]
        valid_n = class_counts[class_name]["valid"]
        ratio = valid_n / train_n if train_n > 0 else 0
        
        train_counts.append(train_n)
        valid_counts.append(valid_n)
        
        print(f"{class_name:<35} | {train_n:>7} | {valid_n:>7} | {ratio:>6.3f}")
    
    print("="*65)
    
    # Statistics
    train_counts = [c for c in train_counts if c > 0]
    valid_counts = [c for c in valid_counts if c > 0]
    
    print(f"\n📈 Training Set:")
    print(f"  Total classes: {len(train_counts)}")
    print(f"  Total samples: {sum(train_counts):,}")
    print(f"  Min samples/class: {min(train_counts)}")
    print(f"  Max samples/class: {max(train_counts)}")
    print(f"  Imbalance ratio: {max(train_counts) / min(train_counts):.2f}x")
    
    print(f"\n✅ Validation Set:")
    print(f"  Total classes: {len(valid_counts)}")
    print(f"  Total samples: {sum(valid_counts):,}")
    print(f"  Min samples/class: {min(valid_counts)}")
    print(f"  Max samples/class: {max(valid_counts)}")
    print(f"  Imbalance ratio: {max(valid_counts) / min(valid_counts):.2f}x")
    
    # Recommendations
    print(f"\n💡 Recommendations:")
    imbalance = max(train_counts) / min(train_counts)
    if imbalance > 2:
        print(f"  ⚠️ High imbalance ({imbalance:.2f}x). Consider class-weighted loss or augmentation.")
    else:
        print(f"  ✅ Good balance ({imbalance:.2f}x) - classes well represented")
    
    # Train/Valid split
    train_split = sum(train_counts) / (sum(train_counts) + sum(valid_counts))
    print(f"  Train/Valid split: {train_split:.1%} / {1-train_split:.1%}")


def check_file_hashes(data_dir="./data", sample_size=1000):
    """Quick check for potential duplicate images (samples only)"""
    print("\n\n🔍 Checking for Potential Duplicates (sample)...\n")
    
    train_path = os.path.join(data_dir, "train")
    hashes = {}
    duplicates = []
    file_count = 0
    
    # Sample files for speed
    for root, dirs, files in os.walk(train_path):
        for file in files[:sample_size] if sample_size else files:
            if file.lower().endswith(('.jpg', '.jpeg', '.png')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'rb') as f:
                        file_hash = hashlib.md5(f.read()).hexdigest()
                        if file_hash in hashes:
                            duplicates.append({
                                "file1": hashes[file_hash],
                                "file2": file_path
                            })
                        else:
                            hashes[file_hash] = file_path
                    file_count += 1
                except Exception as e:
                    print(f"  Error reading {file_path}: {e}")
    
    print(f"  Scanned {file_count} files")
    if duplicates:
        print(f"  ⚠️ Found {len(duplicates)} potential duplicates!")
        for dup in duplicates[:5]:
            print(f"    - {Path(dup['file1']).name} ≈ {Path(dup['file2']).name}")
    else:
        print(f"  ✅ No duplicates detected (among sampled files)")


def generate_report(data_dir="./data"):
    """Generate complete dataset quality report"""
    print("\n" + "="*65)
    print("🎯 DATASET QUALITY REPORT")
    print("="*65)
    
    check_class_balance(data_dir)
    check_file_hashes(data_dir)
    
    print("\n" + "="*65)
    print("✅ Dataset check complete")
    print("="*65)


if __name__ == "__main__":
    generate_report()
