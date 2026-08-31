#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
🌿 KisanLink AI Crop Doctor — PyTorch RTX Training Engine
MobileNetV3-Large Transfer Learning for Plant Disease Classification (38 Classes)
Optimized for NVIDIA RTX Laptops (CUDA 12.x / AMP FP16 / 5GB+ VRAM)
"""

import os
import sys
import io

# Fix Windows console encoding for emoji support
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")
import json
import time
import argparse
import torch
import torch.nn as nn
import torch.optim as optim
import shutil
from pathlib import Path

from torchvision import datasets, transforms, models

try:
    GradScaler = torch.amp.GradScaler
except AttributeError:
    from torch.cuda.amp import GradScaler


def autocast_context(device):
    if hasattr(torch, "autocast"):
        return torch.autocast(
            device_type=device.type,
            dtype=torch.float16 if device.type == "cuda" else torch.bfloat16,
            enabled=(device.type == "cuda"),
        )
    return torch.cuda.amp.autocast(enabled=(device.type == "cuda"))

def get_device():
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        vram_gb = torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
        print(f"🔥 Hardware Acceleration: NVIDIA GPU Detected -> {gpu_name} ({vram_gb:.2f} GB VRAM)")
        return torch.device("cuda")
    else:
        print("⚠️ Warning: CUDA device not detected. Training will run on CPU (slower).")
        return torch.device("cpu")

def build_model(num_classes):
    print("🧠 Loading Pre-trained MobileNetV3-Large Backbone (ImageNet Weights)...")
    model = models.mobilenet_v3_large(weights=models.MobileNet_V3_Large_Weights.DEFAULT)
    in_features = model.classifier[3].in_features
    # Replace final classification head with 38-class plant disease classifier
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes)
    )
    return model

def save_checkpoint_with_backup(model, accuracy, epoch, save_path, keep_best=3):
    """Save checkpoint with backup versioning to prevent data loss"""
    backup_dir = Path(save_path).parent / "backups"
    backup_dir.mkdir(exist_ok=True)
    
    # Save versioned backup
    backup_path = backup_dir / f"checkpoint_e{epoch:02d}_acc{accuracy:.2f}.pt"
    torch.save(model.state_dict(), backup_path)
    
    # Keep only best N backups
    backups = sorted(backup_dir.glob("checkpoint_*.pt"), key=lambda x: x.stat().st_mtime, reverse=True)
    for old_backup in backups[keep_best:]:
        old_backup.unlink()
    
    # Update main checkpoint
    torch.save(model.state_dict(), save_path)
    print(f"  Backed up: {backup_path.name}")
    return backup_path

def train(data_dir="./data", num_epochs=10, batch_size=64, learning_rate=0.001, save_path="./models/crop_doctor_v1.pt"):
    device = get_device()
    os.makedirs(os.path.dirname(save_path), exist_ok=True)

    # High performance image augmentation pipeline
    train_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(p=0.5),
        transforms.RandomVerticalFlip(p=0.2),
        transforms.RandomRotation(degrees=15),
        transforms.ColorJitter(brightness=0.15, contrast=0.15, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    valid_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    train_path = os.path.join(data_dir, "train")
    valid_path = os.path.join(data_dir, "valid")

    if not os.path.exists(train_path):
        print(f"❌ Error: Training folder not found at '{train_path}'.")
        print("Please place the PlantVillage dataset folders inside './data/train/' and './data/valid/'.")
        sys.exit(1)

    print(f"📂 Loading datasets from: {data_dir}")
    train_dataset = datasets.ImageFolder(train_path, transform=train_transforms)
    valid_dataset = datasets.ImageFolder(valid_path, transform=valid_transforms)

    num_workers = min(4, os.cpu_count() or 1)
    train_loader = torch.utils.data.DataLoader(
        train_dataset, batch_size=batch_size, shuffle=True,
        num_workers=num_workers, pin_memory=(device.type == "cuda")
    )
    valid_loader = torch.utils.data.DataLoader(
        valid_dataset, batch_size=batch_size, shuffle=False,
        num_workers=num_workers, pin_memory=(device.type == "cuda")
    )

    class_names = train_dataset.classes
    print(f"✅ Loaded {len(class_names)} classes | {len(train_dataset)} training samples | {len(valid_dataset)} validation samples")

    model = build_model(num_classes=len(class_names)).to(device)

    criterion = nn.CrossEntropyLoss(label_smoothing=0.05)
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=num_epochs, eta_min=1e-6)
    scaler = GradScaler(device=device.type, enabled=(device.type == "cuda")) if hasattr(torch.amp, "GradScaler") else GradScaler(enabled=(device.type == "cuda"))

    best_acc = 0.0
    start_time = time.time()
    history = []  # Track training history

    print("\n" + "=" * 75)
    print(f"🚀 Starting RTX Training ({num_epochs} Epochs | Batch Size: {batch_size} | Mixed Precision: FP16)")
    print("=" * 75)

    for epoch in range(num_epochs):
        epoch_start = time.time()
        model.train()
        running_loss = 0.0
        correct = 0
        total = 0

        for images, labels in train_loader:
            images = images.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)
            optimizer.zero_grad()

            with autocast_context(device):
                outputs = model(images)
                loss = criterion(outputs, labels)

            scaler.scale(loss).backward()
            
            # Gradient clipping (prevent unstable gradients)
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            
            scaler.step(optimizer)
            scaler.update()

            running_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            correct += torch.sum(preds == labels.data).item()
            total += labels.size(0)

        train_loss = running_loss / total
        train_acc = (correct / total) * 100

        # Validation Phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0

        with torch.no_grad():
            for images, labels in valid_loader:
                images = images.to(device, non_blocking=True)
                labels = labels.to(device, non_blocking=True)

                with autocast_context(device):
                    outputs = model(images)
                    loss = criterion(outputs, labels)

                val_loss += loss.item() * images.size(0)
                _, preds = torch.max(outputs, 1)
                val_correct += torch.sum(preds == labels.data).item()
                val_total += labels.size(0)

        val_loss = val_loss / val_total
        val_acc = (val_correct / val_total) * 100
        scheduler.step()
        epoch_sec = time.time() - epoch_start

        print(f"Epoch [{epoch+1:02d}/{num_epochs:02d}] ({epoch_sec:.1f}s) | "
              f"Train Loss: {train_loss:.4f} Acc: {train_acc:.2f}% | "
              f"Val Loss: {val_loss:.4f} Val Acc: {val_acc:.2f}%")

        if val_acc > best_acc:
            best_acc = val_acc
            save_checkpoint_with_backup(model, val_acc, epoch + 1, save_path)
            print(f"  ⭐ Saved Best Model Checkpoint (Accuracy: {val_acc:.2f}%)")
        
        # Track metrics
        history.append({
            "epoch": epoch + 1,
            "train_loss": float(train_loss),
            "train_acc": float(train_acc),
            "val_loss": float(val_loss),
            "val_acc": float(val_acc)
        })

    total_min = (time.time() - start_time) / 60
    print("\n" + "=" * 75)
    print(f"🎉 Training Finished in {total_min:.2f} minutes | Top Validation Accuracy: {best_acc:.2f}%")
    print(f"📦 Model Saved: {save_path}")
    
    # Save training history
    history_file = os.path.join(os.path.dirname(save_path), "training_history.json")
    with open(history_file, "w") as f:
        json.dump(history, f, indent=2)
    print(f"📊 Training history saved: {history_file}")
    print("=" * 75)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train KisanLink Crop Doctor AI Model")
    parser.add_argument("--data_dir", type=str, default="./data", help="Path to data directory containing train/ and valid/")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--batch_size", type=int, default=64, help="Batch size for training")
    parser.add_argument("--lr", type=float, default=0.001, help="Initial learning rate")
    parser.add_argument("--output", type=str, default="./models/crop_doctor_v1.pt", help="Path to save trained weights")
    args = parser.parse_args()

    train(
        data_dir=args.data_dir,
        num_epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
        save_path=args.output
    )
