import os

import torch
from torchvision import models

out_dir = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(out_dir, exist_ok=True)

model = models.mobilenet_v3_large(weights=None)
num_classes = 38
in_features = model.classifier[3].in_features
model.classifier[3] = torch.nn.Sequential(
    torch.nn.Dropout(p=0.3),
    torch.nn.Linear(in_features, num_classes),
)

out_path = os.path.join(out_dir, "crop_doctor_v1.pt")
torch.save(model.state_dict(), out_path)
print(f"Saved placeholder KisanLink crop-doctor model to: {out_path}")
