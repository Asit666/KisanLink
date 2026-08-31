#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
🛡️ Uncertainty Filter — Production Safety for AI Predictions
Rejects low-confidence predictions to prevent false diagnoses
Lightweight confidence thresholding (no GPU needed)
"""

import json
from pathlib import Path


class UncertaintyFilter:
    """
    Filters predictions based on confidence threshold
    Prevents high-risk misclassifications
    """
    
    def __init__(self, confidence_threshold=0.85, enable_logging=False):
        """
        Args:
            confidence_threshold: Reject predictions below this confidence (0-1)
            enable_logging: Log uncertain predictions
        """
        self.threshold = confidence_threshold
        self.enable_logging = enable_logging
        self.uncertain_predictions = []
    
    def filter_prediction(self, predicted_class, confidence, class_names):
        """
        Filter a single prediction
        
        Returns:
            {
                "valid": bool,
                "prediction": str,
                "confidence": float,
                "reason": str
            }
        """
        result = {
            "valid": True,
            "prediction": class_names[predicted_class] if predicted_class < len(class_names) else "unknown",
            "confidence": float(confidence),
            "reason": "Confident prediction ✅"
        }
        
        if confidence < self.threshold:
            result["valid"] = False
            result["reason"] = f"Low confidence ({confidence:.2%}) - ask farmer to retake photo with better lighting/angle"
            
            if self.enable_logging:
                self.uncertain_predictions.append({
                    "prediction": result["prediction"],
                    "confidence": result["confidence"],
                    "reason": result["reason"]
                })
        
        # Additional safety checks
        if confidence < 0.5:
            result["valid"] = False
            result["reason"] = "⚠️ Model very uncertain - photo quality issue or unknown disease"
        
        return result
    
    def get_report(self):
        """Return summary of uncertain predictions"""
        return {
            "total_uncertain": len(self.uncertain_predictions),
            "samples": self.uncertain_predictions[:10]  # Last 10 for review
        }


# Integration with app.py (example usage)
UNCERTAINTY_FILTER = UncertaintyFilter(confidence_threshold=0.85)

# Example in FastAPI endpoint:
# @app.post("/predict-url")
# async def predict_url(url: str):
#     # ... existing prediction code ...
#     prediction_class = torch.argmax(outputs, dim=1).item()
#     confidence = torch.softmax(outputs, dim=1)[0, prediction_class].item()
#     
#     # NEW: Apply uncertainty filter
#     filtered_result = UNCERTAINTY_FILTER.filter_prediction(
#         prediction_class, 
#         confidence, 
#         dataset_classes
#     )
#     
#     if not filtered_result["valid"]:
#         return {
#             "disease": "UNCERTAIN",
#             "confidence": filtered_result["confidence"],
#             "message": filtered_result["reason"],
#             "recommendation": "Please retake the photo with better lighting and clearer leaf view"
#         }
#     
#     return {"disease": filtered_result["prediction"], "confidence": filtered_result["confidence"]}
