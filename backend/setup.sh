#!/bin/bash

# FocusFlow Detection Backend Setup Script

echo "🚀 Setting up FocusFlow Detection Backend..."
echo ""

# Check Python version
echo "Checking Python version..."
python --version
echo ""

# Create virtual environment
echo "Creating virtual environment..."
python -m venv venv
echo "✅ Virtual environment created"
echo ""

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate
echo "✅ Virtual environment activated"
echo ""

# Install dependencies
echo "Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Create models directory
mkdir -p models
echo "✅ Models directory created"
echo ""

# Download models
echo "📦 Downloading MediaPipe models..."
echo ""

cd models

# Object Detector
echo "Downloading EfficientDet Lite0 (13 MB)..."
wget -q --show-progress https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float32/1/efficientdet_lite0.tflite
echo "✅ Object detector downloaded"
echo ""

# Pose Landmarker
echo "Downloading Pose Landmarker Heavy (26 MB)..."
wget -q --show-progress https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/1/pose_landmarker_heavy.task
echo "✅ Pose landmarker downloaded"
echo ""

cd ..

echo "🎉 Setup complete!"
echo ""
echo "To start the server:"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
echo "Cloud deployment: https://focusflow-production-b939.up.railway.app"
echo "Server will run locally at: http://localhost:8000"
echo "API docs (cloud): https://focusflow-production-b939.up.railway.app/docs"
