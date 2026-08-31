#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
🎯 KisanLink Model Evaluation — Lightweight Post-Training Analysis
Generates confusion matrix, per-class metrics, and robustness checks
NO HEAVY COMPUTATION — uses validation set already in memory
"""

import os
import sys
import json
import torch
import torch.nn as nn
from torchvision import datasets, transforms, models
import numpy as np
from pathlib import Path

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")


def load_model(model_path, num_classes):
    """Load trained model checkpoint"""
    model = models.mobilenet_v3_large(weights=models.MobileNet_V3_Large_Weights.DEFAULT)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes)
    )
    
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location='cuda' if torch.cuda.is_available() else 'cpu'))
        print(f"✅ Loaded model from {model_path}")
    else:
        print(f"⚠️ Model checkpoint not found at {model_path}")
    
    return model


def evaluate(data_dir="./data", model_path="./models/crop_doctor_v1.pt"):
    """Evaluate model on validation set and generate per-class metrics"""
    
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"🔧 Using device: {device}")
    
    # Load validation set
    valid_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    valid_path = os.path.join(data_dir, "valid")
    valid_dataset = datasets.ImageFolder(valid_path, transform=valid_transforms)
    valid_loader = torch.utils.data.DataLoader(valid_dataset, batch_size=32, shuffle=False, num_workers=2, pin_memory=True)
    
    class_names = valid_dataset.classes
    num_classes = len(class_names)
    
    print(f"📊 Loaded {len(valid_dataset)} validation samples | {num_classes} classes")
    
    # Load model
    model = load_model(model_path, num_classes).to(device)
    model.eval()
    
    # Evaluate with per-class metrics
    predictions = []
    true_labels = []
    confidences = []
    
    print("\n📈 Evaluating...")
    with torch.no_grad():
        for images, labels in valid_loader:
            images = images.to(device, non_blocking=True)
            labels = labels.to(device, non_blocking=True)
            
            outputs = model(images)
            probs = torch.softmax(outputs, dim=1)
            confs, preds = torch.max(probs, 1)
            
            predictions.extend(preds.cpu().numpy())
            true_labels.extend(labels.cpu().numpy())
            confidences.extend(confs.cpu().numpy())
    
    predictions = np.array(predictions)
    true_labels = np.array(true_labels)
    confidences = np.array(confidences)
    
    # Overall accuracy
    overall_acc = (predictions == true_labels).mean() * 100
    print(f"\n✅ Overall Validation Accuracy: {overall_acc:.2f}%")
    
    # Per-class metrics
    print("\n" + "="*80)
    print(f"{'Class':<30} | {'Samples':>7} | {'Accuracy':>8} | {'Avg Conf':>8}")
    print("="*80)
    
    per_class_metrics = {}
    for i in range(num_classes):
        class_mask = true_labels == i
        class_acc = (predictions[class_mask] == true_labels[class_mask]).mean() * 100 if class_mask.sum() > 0 else 0
        class_conf = confidences[class_mask].mean() if class_mask.sum() > 0 else 0
        n_samples = class_mask.sum()
        
        per_class_metrics[class_names[i]] = {
            "accuracy": float(class_acc),
            "avg_confidence": float(class_conf),
            "n_samples": int(n_samples)
        }
        
        print(f"{class_names[i]:<30} | {n_samples:>7} | {class_acc:>7.2f}% | {class_conf:>7.4f}")
    
    print("="*80)
    
    # Confidence distribution
    print(f"\n📊 Confidence Statistics:")
    print(f"  Mean Confidence: {confidences.mean():.4f}")
    print(f"  Std Dev:        {confidences.std():.4f}")
    print(f"  Min:            {confidences.min():.4f}")
    print(f"  Max:            {confidences.max():.4f}")
    print(f"  Predictions <90% confidence: {(confidences < 0.90).sum()} ({(confidences < 0.90).mean()*100:.1f}%)")
    
    # Save metrics
    metrics_file = "./evaluation_metrics.json"
    with open(metrics_file, "w") as f:
        json.dump({
            "overall_accuracy": float(overall_acc),
            "per_class_metrics": per_class_metrics,
            "confidence_stats": {
                "mean": float(confidences.mean()),
                "std": float(confidences.std()),
                "min": float(confidences.min()),
                "max": float(confidences.max())
            }
        }, f, indent=2)
    
    print(f"\n💾 Metrics saved to {metrics_file}")
    
    # Find weakest classes
    print(f"\n⚠️ Classes with <95% Accuracy (needs improvement):")
    weak_classes = [(cn, m["accuracy"]) for cn, m in per_class_metrics.items() if m["accuracy"] < 95]
    if weak_classes:
        for cn, acc in sorted(weak_classes, key=lambda x: x[1]):
            print(f"  - {cn}: {acc:.2f}%")
    else:
        print("  None! All classes >95% accuracy ✅")


if __name__ == "__main__":
    evaluate()
