# zen-kAI - Mental Wellness Gamified App

A React Native mobile application that gamifies mental wellness through daily check-ins, AI-powered insights, and a Duolingo-inspired scoring system. Built with Expo, featuring a Node.js/Express backend with MongoDB.

## Features

| Feature         | Description                                     |
|----------------|-------------------------------------------------|
| MindScore       | AI-powered mental wellness scoring              |
| Level Progress  | Gamified progress tracking                      |
| Score Circle    | Visual progress indicators                      |
| XP Levels       | Experience point leveling system                |
| Daily Check-ins | Mood, clarity, energy, and reflection tracking  |
| AI Insights     | Personalized GPT-4o reflections                 |
| Reward System   | Unlockable rewards and achievements             |


## 🚀 Quick Start

### Prerequisites

- Node.js
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- MongoDB (local or cloud)
- OpenAI API key

### Frontend Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/zen-kai.git
   cd zen-kai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` and add your OpenAI API key:
   ```
   OPENAI_API_KEY=your_openai_api_key_here
   API_BASE_URL=http://localhost:4000/api
   ```

4. **Start the development server**
   ```bash
   npm start
   ```

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd zenkai-backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your configuration:
   ```
   MONGO_URI=mongodb://localhost:27017/zenkai
   JWT_SECRET=your_secure_jwt_secret_here
   PORT=4000
   ```

4. **Start the backend server**
   ```bash
   npm start
   ```

## 📱 Running the App

### Development
```bash
# Start Expo development server
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android

# Run on web
npm run web
```

### Production Build

The project uses [EAS Build](https://docs.expo.dev/build/introduction/) for production builds:

```bash
# Install EAS CLI
npm install -g @eas-cli

# Login to Expo
eas login

# Build for production
eas build --platform ios
eas build --platform android
```

## 🏗️ Project Structure

```
zen-kai/
├── assets/                 # Images, icons, animations
├── utils/                  # Utility functions
│   ├── scoring.js         # Gamification logic
│   ├── mindMirror.js      # AI insights
│   └── decodeToken.js     # JWT handling
├── zenkai-backend/        # Node.js/Express API
│   ├── controllers/       # Route handlers
│   ├── models/           # MongoDB schemas
│   ├── middleware/       # Auth & rate limiting
│   └── routes/           # API endpoints
├── android/              # Android native code
├── ios/                  # iOS native code
└── App.js               # Main app component
```

## 🔧 Configuration

### Environment Variables

**Frontend (.env)**
- `OPENAI_API_KEY`: OpenAI API key for AI features
- `API_BASE_URL`: Backend API endpoint

**Backend (.env)**
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret for JWT token signing
- `PORT`: Server port (default: 4000)

### Build Profiles

The project uses EAS Build profiles for environment-specific behavior:

- `development` – Debug tools and experimental features
- `preview` – Internal QA with moderate logging  
- `production` – Optimized for real users

## 🧪 Testing

```bash
# Run tests (placeholder)
npm test

# Backend tests
cd zenkai-backend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all environment variables are properly configured

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- AI features powered by [OpenAI](https://openai.com/)
- Icons from [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons)
- Animations from [Lottie](https://lottiefiles.com/)

## 📞 Support

For support, email support@zenkai.app or create an issue in this repository.

---

**Note**: This is an experimental project. Use at your own risk and ensure proper security measures in production.
