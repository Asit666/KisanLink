"""
🌿 KisanLink AI Crop Doctor — Standalone Visual Diagnostic Workbench
Interactive Streamlit interface for farmers, researchers, and agronomists.
"""

import streamlit as st
import requests
import io
from PIL import Image

st.set_page_config(
    page_title="KisanLink AI Crop Doctor",
    page_icon="🌿",
    layout="wide",
    initial_sidebar_state="expanded"
)

st.markdown("""
<style>
    .main-title { font-size: 2.2rem; font-weight: 800; color: #16a34a; margin-bottom: 0.2rem; }
    .sub-title { font-size: 1.05rem; color: #64748b; margin-bottom: 1.5rem; }
    .stMetric { background: #f8fafc; border-radius: 8px; padding: 10px; border: 1px solid #e2e8f0; }
</style>
""", unsafe_allow_html=True)

st.markdown('<div class="main-title">🌿 KisanLink AI Crop Doctor Engine</div>', unsafe_allow_html=True)
st.markdown('<div class="sub-title">Neural Vision Leaf Disease Classification · 38 Classes · MobileNetV3-Large on NVIDIA RTX GPU</div>', unsafe_allow_html=True)

with st.sidebar:
    st.header("⚙️ Diagnostics Config")
    api_url = st.text_input("FastAPI Endpoint", value="http://localhost:8000")
    
    try:
        health_res = requests.get(f"{api_url}/health", timeout=2)
        if health_res.status_code == 200:
            info = health_res.json()
            st.success("🟢 AI Vision Microservice Online")
            st.info(f"**Compute Device:** {info.get('device')}\n\n**Total Classes:** {info.get('total_classes')}")
        else:
            st.warning("🟡 AI Microservice returned unexpected status.")
    except Exception:
        st.error("🔴 AI Microservice Offline\n\nRun: `python app.py` in `kisanlink-ai/`")

    st.markdown("---")
    st.markdown("### 🌾 Supported Staple Crops")
    st.markdown("• Tomato (10 conditions)\n• Potato (3 conditions)\n• Corn / Maize (4 conditions)\n• Apple (4 conditions)\n• Grape (4 conditions)\n• Bell Pepper, Cherry, Squash, etc.")

col1, col2 = st.columns([1.1, 1.3])

with col1:
    st.subheader("📸 Leaf Specimen Upload")
    uploaded_file = st.file_uploader("Upload leaf photo (JPEG / PNG)", type=["jpg", "jpeg", "png"])
    
    if uploaded_file is not None:
        image = Image.open(uploaded_file)
        st.image(image, caption=f"Uploaded Specimen ({uploaded_file.name})", use_container_width=True)

with col2:
    st.subheader("🔍 AI Disease Diagnosis & Treatment")
    
    if uploaded_file is not None:
        if st.button("🚀 Analyze Leaf Specimen", type="primary", use_container_width=True):
            with st.spinner("Analyzing leaf pathology via Deep Neural Network..."):
                try:
                    uploaded_file.seek(0)
                    files = {"file": (uploaded_file.name, uploaded_file.getvalue(), uploaded_file.type)}
                    res = requests.post(f"{api_url}/predict", files=files, timeout=10)
                    
                    if res.status_code == 200:
                        data = res.json()
                        
                        if data["is_healthy"]:
                            st.balloons()
                            st.success(f"### ✅ **{data['crop']} — Healthy Crop**")
                        else:
                            st.error(f"### ⚠️ **{data['crop']} — {data['condition']}**")

                        m1, m2, m3 = st.columns(3)
                        with m1:
                            st.metric("Confidence Score", f"{data['confidence_score']}%")
                        with m2:
                            st.metric("Pathogen Type", data['pathogen_type'])
                        with m3:
                            st.metric("Severity Rating", data['severity'])

                        st.markdown("---")
                        st.markdown("#### 💊 Recommended Treatment Protocol")
                        st.info(data["treatment_plan"])

                        st.markdown("#### 🛒 Recommended Agri-Inputs (Available on KisanLink)")
                        st.success(f"**Products:** {data['recommended_inputs']}")

                        with st.expander("📊 Top 3 Candidate Probabilities"):
                            for cand in data["top_candidates"]:
                                st.write(f"**{cand['crop']} — {cand['condition']}**: `{cand['confidence']}%`")
                                st.progress(cand['confidence'] / 100)

                    else:
                        st.error(f"Prediction failed with status {res.status_code}: {res.text}")
                except Exception as e:
                    st.error(f"Could not connect to AI microservice: {str(e)}")
    else:
        st.info("👆 Please upload a crop leaf image to start the neural diagnostic scan.")
