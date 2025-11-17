# 🎯 FocusFlow

> AI study buddy that stops you from getting distracted

Built for **Student HackPad 2025** – a focus tracking app with camera AI that catches you when you pick up your phone.

## What it does

- **Camera AI** detects when you pick up your phone or look away
- **AI Coach** gives you friendly nudges when you lose focus (powered by Gemini)
- **Session tracking** with focus scores and stats
- **Privacy-first** – all video processing happens locally on your machine

- DEMO: https://focusflow-dev.vercel.app/

## Quick Start

> ⚠️ **Critical testing requirement:** The camera AI currently relies on experimental WebGL2+GPU features. Always run the app in **Chrome Canary** with the following flags enabled, otherwise detection will fail:
>
> 1. Install Chrome Canary: https://www.google.com/chrome/canary/
> 2. Open `chrome://flags`
> 3. Search each flag below, set to **Enabled**, then relaunch Canary:
>    - `#enable-webgl2-compute-context`
>    - `#enable-gpu-rasterization`
>    - `#ignore-gpu-blocklist`
>    - `#enable-zero-copy`
>
> 💡 Tip: keep a dedicated Canary profile just for FocusFlow testing so the flags stay on.

### 1. Clone & Install
```bash
git clone https://github.com/Techy2419/Focus-Flow.git
cd Focus-Flow
npm install
```

### 2. Setup Environment
Create `.env` file:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_DETECTION_API_URL=https://focusflow-backend-962980262153.us-central1.run.app
```

Get keys:
- **Supabase**: [supabase.com](https://supabase.com) → Create project → Settings → API
- **Gemini**: [ai.google.dev](https://ai.google.dev) → Get API Key

### 3. Setup Database
- Go to Supabase Dashboard → SQL Editor
- Copy/paste everything from `supabase/setup.sql`
- Click Run
- Done!

### 4. Setup Backend (for camera AI)
```bash
cd backend
pip install -r requirements.txt
python main.py
```
Backend runs on `https://focusflow-backend-962980262153.us-central1.run.app` (local fallback: `http://localhost:8000`)

If you deploy your own frontend, add its URL to `ALLOWED_ORIGINS` in `backend/main.py` so CORS permits browser calls.

### 5. Run the App
```bash
npm run dev
```
Open [localhost:5173](http://localhost:5173)

## How it Works

1. **Sign up** with your name and email
2. **Start a focus session** – camera turns on automatically
3. **Study** – AI watches for distractions
4. **Get nudged** if you pick up your phone
5. **End session** – see your focus score and stats

## Testing the Demo

**For best performance, use Chrome Canary with GPU acceleration enabled:**

### 1. Download Chrome Canary
- Download from [google.com/chrome/canary](https://www.google.com/chrome/canary/)
- Install and open Chrome Canary

### 2. Enable GPU Flags
1. Open Chrome Canary
2. Go to `chrome://flags` in the address bar
3. Enable these flags:
   - `#enable-webgl2-compute-context` → **Enabled**
   - `#enable-gpu-rasterization` → **Enabled**
   - `#ignore-gpu-blocklist` → **Enabled**
   - `#enable-zero-copy` → **Enabled**
4. Click **Relaunch** at the bottom

### 3. Open the Demo
- Visit the deployed URL in Chrome Canary
- Allow camera permissions when prompted
- Enjoy smooth 20-30 FPS camera detection!

**Why Chrome Canary?** These GPU flags significantly improve camera performance and are not available in regular Chrome.

## Tech Stack

- **Frontend**: React + Vite + Tailwind
- **Backend**: Python FastAPI + MediaPipe
- **Database**: Supabase (PostgreSQL)
- **AI**: Google Gemini 2.0 Flash
- **Camera AI**: MediaPipe (CPU-only, runs locally)

## Project Structure
```
Focus-Flow/
├── src/
│   ├── components/     # UI components
│   ├── hooks/          # Custom React hooks
│   ├── contexts/       # Session management
│   ├── lib/            # Supabase, Gemini, utils
│   └── api/            # Backend API client
├── backend/            # Python FastAPI server
│   ├── main.py         # API server
│   └── detection.py    # MediaPipe detection
├── supabase/
│   └── setup.sql       # Database schema
└── package.json
```

## Features Explained

### Camera AI Detection
- Uses MediaPipe Pose Detection
- Detects phone near face/ear
- Detects when you look away
- Runs locally (privacy-first)
- Works on CPU (no GPU needed)

### AI Coaching
- Powered by Gemini 2.0 Flash
- Warm-up before sessions
- Reflection after sessions
- Friendly interventions during distractions

### Session Tracking
- Real-time focus score
- Distraction logging
- Study time tracking
- Session history

---
