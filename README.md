# My PushUp Fitness Tracker

A real-time multiplayer push-up tracking application built with Next.js and FastAPI.

## 🏋️‍♂️ Features

- **Real-time Multiplayer**: Create or join rooms to work out with friends
- **Live Push-up Tracking**: AI-powered pose detection for accurate counting
- **Interactive UI**: Modern, responsive design with real-time updates
- **WebSocket Communication**: Instant synchronization between participants
- **Leaderboards**: Track progress and compete with friends

## 🚀 Live Demo

- **Frontend**: [Deployed on Vercel/Netlify]
- **Backend**: [Deployed on Railway]

## 🛠️ Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Modern styling
- **Lucide Icons** - Beautiful icons
- **WebSocket Client** - Real-time communication

### Backend

- **FastAPI** - High-performance Python web framework
- **WebSocket** - Real-time bidirectional communication
- **YOLO11 Pose Detection** - AI-powered movement tracking
- **Uvicorn** - ASGI server

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Git

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn server:app --reload
```

## 🌐 Deployment

### Backend (Railway)

1. Connect your GitHub repo to Railway
2. Select the `backend` folder
3. Railway auto-deploys with nixpacks

### Frontend (Vercel)

1. Connect your GitHub repo to Vercel
2. Set base directory to `frontend`
3. Add environment variable: `NEXT_PUBLIC_BACKEND_URL`

## 📁 Project Structure

```
├── frontend/          # Next.js application
│   ├── src/
│   │   ├── app/       # App Router pages
│   │   ├── components/ # Reusable UI components
│   │   └── hooks/     # Custom React hooks
│   └── public/        # Static assets
└── backend/           # FastAPI server
    ├── server.py      # Main application
    ├── requirements.txt
    └── nixpacks.toml  # Deployment config
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Original concept inspired by fitness tracking applications
- YOLO11 for pose detection capabilities
- FastAPI and Next.js communities for excellent documentation

---

**Made with ❤️ for fitness enthusiasts**
