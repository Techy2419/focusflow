# 🎯 FocusFlow

> AI study buddy that stops you from getting distracted

Built for **Student HackPad 2025** – a focus tracking app with camera AI that catches you when you pick up your phone.

## What it does

- **Camera AI** detects when you pick up your phone or look away
- **AI Coach** gives you friendly nudges when you lose focus (powered by Gemini)
- **Session tracking** with focus scores and stats
- **Privacy-first** – all video processing happens locally on your machine

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
Backend runs on `localhost:8000`

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

## 📖 Full Project Story

### 💡 Inspiration

I kept failing my study sessions. Like, every single time I'd sit down to study, my phone would somehow end up in my hand 10 minutes later. I'd be scrolling Instagram, checking Discord, replying to texts... and before I knew it, an hour was gone.

I tried all the usual tricks - putting my phone in another room, using forest apps, even gave my friend my phone. Nothing worked long-term. Then I realized: what if my webcam could just... catch me in the act? Like having a study buddy who calls you out when you're slacking.

That's how FocusFlow was born.

### 🚧 Challenges I Ran Into

**1. Phone Detection Accuracy**

The hardest part was making phone detection actually work. Initially, I tried using TensorFlow.js in the browser, but it was super laggy and kept crashing. After hours of debugging WebGL issues, I decided to scrap it and build a Python backend instead.

The MediaPipe object detector can identify "cell phone" objects, but that wasn't enough - I needed to know if the phone was near the user's face. My solution:
- Track face landmarks (nose, ears, eyes)
- Track wrist positions from pose detection
- Calculate distance between phone center and face landmarks
- If phone within 140px of ear + wrist raised = "phone near ear"

It took a lot of trial and error with different distance thresholds to get it feeling natural.

**2. User Profile Names Not Saving**

For some reason, when users signed up with their first/last name, it would show up in the console but wouldn't save to the database. After 2 hours of debugging, I found the issue:

The Supabase trigger that creates user profiles was running BEFORE the profile had `first_name`/`last_name` columns. I had to:
1. Add the columns to the database schema
2. Update the trigger to read from user metadata
3. Pass names as metadata during signup
4. Fix RLS policies to allow the trigger to insert data

Total facepalm moment when I realized the columns just didn't exist yet.

**3. FPS Counter Showing 0**

The camera feed had an FPS overlay that kept showing "0 FPS" even though detections were working. Turns out I was calling `setStats()` twice in the same function, causing a race condition. Fixed by combining both calls into one update.

**4. Real-time Performance**

Getting smooth 20-30 FPS on CPU-only processing was tough. Had to optimize:
- Reduced frame resolution to 640x480
- Used EfficientDet Lite0 (lightest model)
- Implemented frame skipping (500ms interval instead of every frame)
- Added temporal smoothing to prevent flickering

### 📚 What I Learned

**Technical Skills:**
- How to use MediaPipe for real-time pose/object detection
- Building a Python FastAPI backend from scratch
- Managing WebRTC video streams in React
- Implementing RLS policies in PostgreSQL
- Working with Google's Gemini API for AI chat

**Soft Skills:**
- When to pivot (ditching TensorFlow.js for Python backend)
- Debugging systematically (console.log is your best friend)
- Time management (spent too long on TensorFlow.js, should've switched earlier)
- Reading error messages carefully (that RLS policy error saved me hours)

**Biggest Lesson:** Don't over-engineer. My first attempt had fancy pose analysis, multiple ML models, complex state management. The version that actually works is way simpler - just phone detection + face tracking. Simple wins.

### 🚀 What's Next for FocusFlow

If I keep working on this, I want to add:

1. **Better detection models** - Currently using EfficientDet Lite0, could upgrade to Lite2 for better accuracy
2. **Desktop app detection** - Track if user switches to YouTube/Twitter tabs
3. **Social features** - Study sessions with friends, see who focuses longest
4. **Mobile app** - React Native version for phone-based studying
5. **Posture tracking** - Alert when slouching (I have the keypoints already!)

But honestly? Right now I'm just happy it works. If even one person uses this to actually finish their homework, I'll call it a success.

---

## Deployment

### Frontend (Vercel)
```bash
npm run build
# Deploy dist/ folder to Vercel
```

### Backend (Render)
- Push to GitHub
- Connect to Render
- Deploy as Web Service
- Update frontend API URL

## Known Issues

- Backend must be running for camera AI
- Requires camera permission
- Works best in good lighting

## 🙏 Acknowledgments

Huge thanks to:
- **Student HackPad** for organizing this awesome event
- **Supabase** for the generous free tier (saved my broke student wallet)
- **Google** for Gemini API access
- **MediaPipe team** for making ML accessible on CPU
- **Stack Overflow** for debugging my dumb mistakes at 3am

---

Built with ☕ and determination over 48 hours by [@Techy2419](https://github.com/Techy2419)

⭐ Star this repo if you like it!

**GitHub:** https://github.com/Techy2419/Focus-Flow
