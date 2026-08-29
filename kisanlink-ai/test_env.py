import os
import sys

print("Python executable:", sys.executable)
print("Python version:", sys.version)

try:
    import torch
    print("PyTorch Version:", torch.__version__)
    print("CUDA Available:", torch.cuda.is_available())
    if torch.cuda.is_available():
        print("Device Count:", torch.cuda.device_count())
        print("Device Name:", torch.cuda.get_device_name(0))
    else:
        print("Running on CPU.")
except Exception as e:
    print("Torch import error:", e)

try:
    import torchvision
    print("TorchVision Version:", torchvision.__version__)
except Exception as e:
    print("TorchVision import error:", e)

try:
    import fastapi
    import uvicorn
    import streamlit
    print("Web Frameworks: FastAPI", fastapi.__version__, "| Uvicorn", uvicorn.__version__, "| Streamlit", streamlit.__version__)
except Exception as e:
    print("Web frameworks error:", e)
