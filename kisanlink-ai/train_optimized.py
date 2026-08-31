#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
🚀 KisanLink AI Optimized Training Engine v2
Advanced features: Early Stopping, LR Warmup, Checkpoint Management
"""

import os
import sys
import json
import time
import argparse
import torch
import torch.nn as nn
import torch.optim as optim
from pathlib import Path
import shutil

from torchvision import datasets, transforms, models

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

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
        print(f"GPU: {gpu_name} ({vram_gb:.2f} GB VRAM)")
        return torch.device("cuda")
    else:
        print("CPU mode (no CUDA detected)")
        return torch.device("cpu")


def build_model(num_classes):
    """Load MobileNetV3-Large with optimized head"""
    model = models.mobilenet_v3_large(weights=models.MobileNet_V3_Large_Weights.DEFAULT)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes)
    )
    return model


class CheckpointManager:
    """Keep only best N checkpoints to save disk space"""
    def __init__(self, save_dir, keep_best=3):
        self.save_dir = Path(save_dir)
        self.save_dir.mkdir(parents=True, exist_ok=True)
        self.keep_best = keep_best
        self.checkpoints = []  # List of (accuracy, filepath)
    
    def save(self, model, accuracy, epoch):
        """Save checkpoint, keep only best N"""
        checkpoint_path = self.save_dir / f"checkpoint_epoch_{epoch:02d}_acc_{accuracy:.2f}.pt"
        torch.save(model.state_dict(), checkpoint_path)
        
        # Track checkpoint
        self.checkpoints.append((accuracy, checkpoint_path))
        self.checkpoints = sorted(self.checkpoints, key=lambda x: x[0], reverse=True)
        
        # Keep only best N
        if len(self.checkpoints) > self.keep_best:
            _, old_path = self.checkpoints.pop()
            if old_path.exists():
                old_path.unlink()
                print(f"  Removed old checkpoint: {old_path.name}")
        
        print(f"  Saved: {checkpoint_path.name} (Acc: {accuracy:.2f}%)")
        return checkpoint_path
    
    def get_best(self):
        """Get path to best checkpoint"""
        if self.checkpoints:
            return self.checkpoints[0][1]
        return None


class WarmupScheduler:
    """Learning rate warmup then cosine annealing"""
    def __init__(self, optimizer, warmup_epochs, total_epochs, base_lr):
        self.optimizer = optimizer
        self.warmup_epochs = warmup_epochs
        self.total_epochs = total_epochs
        self.base_lr = base_lr
        self.current_epoch = 0
    
    def step(self):
        """Update learning rate based on epoch"""
        if self.current_epoch < self.warmup_epochs:
            # Linear warmup
            lr = self.base_lr * (self.current_epoch + 1) / self.warmup_epochs
        else:
            # Cosine annealing
            progress = (self.current_epoch - self.warmup_epochs) / (self.total_epochs - self.warmup_epochs)
            lr = self.base_lr * (1 + torch.cos(torch.tensor(3.14159 * progress))) / 2
        
        for param_group in self.optimizer.param_groups:
            param_group['lr'] = lr
        
        self.current_epoch += 1
        return lr


def train(data_dir="./data", num_epochs=10, batch_size=16, learning_rate=0.001, 
          save_dir="./models", patience=3, warmup_epochs=1):
    """
    Optimized training with early stopping, warmup, and checkpoint management
    
    Args:
        patience: Stop if validation doesn't improve for N epochs
        warmup_epochs: Gradually increase LR for first N epochs
    """
    device = get_device()
    os.makedirs(save_dir, exist_ok=True)
    
    # Data transforms
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
        print(f"Error: Training folder not found at '{train_path}'")
        sys.exit(1)

    print(f"Loading datasets from {data_dir}...")
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
    print(f"Loaded: {len(class_names)} classes | {len(train_dataset)} train | {len(valid_dataset)} valid")

    model = build_model(num_classes=len(class_names)).to(device)
    
    # Optimized loss and optimizer
    criterion = nn.CrossEntropyLoss(label_smoothing=0.05)
    optimizer = optim.AdamW(model.parameters(), lr=learning_rate, weight_decay=1e-4)
    lr_scheduler = WarmupScheduler(optimizer, warmup_epochs, num_epochs, learning_rate)
    scaler = GradScaler(enabled=(device.type == "cuda"))
    
    # Checkpoint management
    checkpoint_mgr = CheckpointManager(save_dir, keep_best=3)
    
    # Early stopping
    best_val_acc = 0.0
    epochs_no_improve = 0
    
    print("\n" + "="*80)
    print(f"Training: {num_epochs} epochs | Batch: {batch_size} | LR: {learning_rate}")
    print(f"Early Stopping Patience: {patience} epochs | LR Warmup: {warmup_epochs} epoch(s)")
    print("="*80)

    start_time = time.time()
    history = []

    for epoch in range(num_epochs):
        epoch_start = time.time()
        
        # Training phase
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0

        for batch_idx, (images, labels) in enumerate(train_loader):
            images = images.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)
            
            optimizer.zero_grad()

            with autocast_context(device):
                outputs = model(images)
                loss = criterion(outputs, labels)

            scaler.scale(loss).backward()
            
            # Gradient clipping (prevent exploding gradients)
            torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)
            
            scaler.step(optimizer)
            scaler.update()

            train_loss += loss.item() * images.size(0)
            _, preds = torch.max(outputs, 1)
            train_correct += torch.sum(preds == labels.data).item()
            train_total += labels.size(0)

        train_loss /= train_total
        train_acc = (train_correct / train_total) * 100

        # Validation phase
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

        val_loss /= val_total
        val_acc = (val_correct / val_total) * 100
        
        # Update learning rate
        current_lr = lr_scheduler.step()
        epoch_time = time.time() - epoch_start
        
        print(f"Epoch [{epoch+1:02d}/{num_epochs}] ({epoch_time:.0f}s | LR: {current_lr:.2e})")
        print(f"  Train: Loss {train_loss:.4f} | Acc {train_acc:.2f}%")
        print(f"  Valid: Loss {val_loss:.4f} | Acc {val_acc:.2f}%")

        # Early stopping check
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            epochs_no_improve = 0
            checkpoint_mgr.save(model, val_acc, epoch + 1)
            print(f"  ✓ New best! ({val_acc:.2f}%)")
        else:
            epochs_no_improve += 1
            print(f"  No improvement ({epochs_no_improve}/{patience})")
            
            if epochs_no_improve >= patience:
                print(f"\nEarly stopping: No improvement for {patience} epochs")
                break
        
        history.append({
            "epoch": epoch + 1,
            "train_loss": float(train_loss),
            "train_acc": float(train_acc),
            "val_loss": float(val_loss),
            "val_acc": float(val_acc),
            "lr": float(current_lr)
        })

    # Training complete
    total_time = (time.time() - start_time) / 60
    best_checkpoint = checkpoint_mgr.get_best()
    
    print("\n" + "="*80)
    print(f"Training Complete: {total_time:.1f} minutes")
    print(f"Best Validation Accuracy: {best_val_acc:.2f}%")
    print(f"Best Checkpoint: {best_checkpoint}")
    print("="*80)
    
    # Save main checkpoint
    if best_checkpoint:
        main_checkpoint = os.path.join(save_dir, "crop_doctor_v1.pt")
        shutil.copy(best_checkpoint, main_checkpoint)
        print(f"Copied best to: {main_checkpoint}")
    
    # Save training history
    history_file = os.path.join(save_dir, "training_history.json")
    with open(history_file, "w") as f:
        json.dump(history, f, indent=2)
    print(f"Training history saved to: {history_file}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Optimized KisanLink Model Training")
    parser.add_argument("--data_dir", type=str, default="./data", help="Data directory")
    parser.add_argument("--epochs", type=int, default=10, help="Number of epochs")
    parser.add_argument("--batch_size", type=int, default=16, help="Batch size")
    parser.add_argument("--lr", type=float, default=0.001, help="Learning rate")
    parser.add_argument("--patience", type=int, default=3, help="Early stopping patience")
    parser.add_argument("--warmup", type=int, default=1, help="Warmup epochs")
    args = parser.parse_args()

    train(
        data_dir=args.data_dir,
        num_epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
        patience=args.patience,
        warmup_epochs=args.warmup
    )
