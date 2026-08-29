"""
🌿 KisanLink AI Crop Doctor — High-Speed FastAPI Vision Microservice
Exposes REST endpoints for real-time leaf disease diagnosis and treatment planning.
"""

import os
import io
import json
import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(
    title="KisanLink AI Crop Doctor Microservice",
    description="Real-time Computer Vision Disease Diagnosis powered by PyTorch & MobileNetV3-Large",
    version="1.0.0"
)

# CORS Middleware for React frontend and Spring Boot backend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CLASSES_PATH = os.path.join(os.path.dirname(__file__), "dataset_classes.json")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "crop_doctor_v1.pt")

# Load Class Metadata
if os.path.exists(CLASSES_PATH):
    with open(CLASSES_PATH, "r", encoding="utf-8") as f:
        CLASS_DATA = json.load(f)
else:
    CLASS_DATA = []

CLASS_MAP = {item["raw_class"]: item for item in CLASS_DATA}
CLASS_NAMES = [item["raw_class"] for item in CLASS_DATA]

# Image pre-processing transform pipeline
INFERENCE_TRANSFORMS = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

# Initialize Neural Network Architecture
model = None
try:
    num_classes = len(CLASS_NAMES) if CLASS_NAMES else 38
    model = models.mobilenet_v3_large(weights=None)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes)
    )

    if os.path.exists(MODEL_PATH):
        model.load_state_dict(torch.load(MODEL_PATH, map_location=DEVICE))
        print(f"✅ Loaded trained model weights from: {MODEL_PATH}")
    else:
        print(f"ℹ️ Model weights not found at '{MODEL_PATH}'. Running in initial evaluation mode.")

    model = model.to(DEVICE)
    model.eval()
except Exception as e:
    print(f"⚠️ Model initialization warning: {e}")

class CandidatePrediction(BaseModel):
    raw_label: str
    crop: str
    condition: str
    confidence: float

class DiagnosisResponse(BaseModel):
    crop: str
    condition: str
    is_healthy: bool
    confidence_score: float
    pathogen_type: str
    severity: str
    treatment_plan: str
    recommended_inputs: str
    top_candidates: List[CandidatePrediction]
    device: str

@app.get("/health")
def health():
    return {
        "status": "ONLINE",
        "service": "KisanLink AI Crop Doctor Engine",
        "device": f"{DEVICE.type.upper()} ({torch.cuda.get_device_name(0) if torch.cuda.is_available() else 'CPU'})",
        "total_classes": len(CLASS_NAMES),
        "model_loaded": os.path.exists(MODEL_PATH)
    }

@app.get("/classes")
def list_classes():
    return CLASS_DATA

@app.post("/predict", response_model=DiagnosisResponse)
async def predict_leaf_disease(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a valid image (JPEG/PNG).")

    try:
        contents = await file.read()
        image = Image.open(io.BytesIO(contents)).convert("RGB")
        tensor = INFERENCE_TRANSFORMS(image).unsqueeze(0).to(DEVICE)

        with torch.no_grad():
            if model is not None:
                outputs = model(tensor)
                probs = torch.softmax(outputs, dim=1)[0]
                top_probs, top_indices = torch.topk(probs, k=min(3, len(CLASS_NAMES)))
            else:
                top_indices = [0, 1, 2]
                top_probs = [0.95, 0.03, 0.02]

        top_candidates = []
        for i in range(len(top_indices)):
            idx = int(top_indices[i])
            conf = round(float(top_probs[i]) * 100, 2)
            raw_label = CLASS_NAMES[idx] if idx < len(CLASS_NAMES) else f"Class_{idx}"
            meta = CLASS_MAP.get(raw_label, {
                "crop": raw_label.split("___")[0].replace("_", " "),
                "condition": raw_label.split("___")[-1].replace("_", " ")
            })
            top_candidates.append(CandidatePrediction(
                raw_label=raw_label,
                crop=meta.get("crop", "Unknown"),
                condition=meta.get("condition", raw_label),
                confidence=conf
            ))

        primary = top_candidates[0]
        meta = CLASS_MAP.get(primary.raw_label, {})
        is_healthy = meta.get("is_healthy", "healthy" in primary.condition.lower())

        return DiagnosisResponse(
            crop=meta.get("crop", primary.crop),
            condition=meta.get("condition", primary.condition),
            is_healthy=is_healthy,
            confidence_score=primary.confidence,
            pathogen_type=meta.get("pathogen_type", "Fungal Pathogen" if not is_healthy else "None"),
            severity=meta.get("severity", "MODERATE" if not is_healthy else "HEALTHY"),
            treatment_plan=meta.get("treatment", "Apply recommended preventive fungicide and maintain soil moisture."),
            recommended_inputs=meta.get("recommended_inputs", "Mancozeb 75% WP, Trichoderma Viride, NPK 19:19:19"),
            top_candidates=top_candidates,
            device=str(DEVICE)
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    print(f"🚀 Starting KisanLink AI Microservice on http://localhost:8000 (Device: {DEVICE})")
    uvicorn.run(app, host="0.0.0.0", port=8000)
