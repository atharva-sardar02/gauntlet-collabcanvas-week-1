# CollabCanvas MVP

A real-time collaborative canvas application built with React, TypeScript, Firebase, and Konva. Multiple users can create, move, and delete shapes on a shared canvas with live cursor tracking and presence awareness.

## 🚀 Features

- **Real-time Collaboration**: Multiple users can edit the canvas simultaneously
- **Shape Management**: Create, move, and delete rectangular shapes
- **Object Locking**: Shapes are automatically locked when a user is editing them
- **Multiplayer Cursors**: See other users' cursors with name labels in real-time
- **Presence Awareness**: Know who's currently online and active
- **Infinite Canvas**: Pan and zoom on a 5000x5000px canvas
- **User Authentication**: Sign up/login with email/password or Google

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Canvas Rendering**: Konva + React Konva
- **Styling**: Tailwind CSS 4
- **Backend**: Firebase
  - Authentication (Email/Password + Google)
  - Firestore (shape data persistence)
  - Realtime Database (cursor positions & presence)
- **Hosting**: Firebase Hosting (coming soon)

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)
- **Git**
- A **Firebase account** (free tier is sufficient)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd gauntlet-collabcanvas-week-1
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required dependencies including:
- React and React DOM
- Firebase SDK
- Konva and React Konva
- Tailwind CSS and PostCSS
- TypeScript and development tools

### 3. Set Up Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable the following services:
   - **Authentication**: Enable Email/Password and Google sign-in methods
   - **Firestore Database**: Create in test mode
   - **Realtime Database**: Create in test mode
4. Register a web app in your Firebase project
5. Copy the Firebase configuration values

### 4. Configure Environment Variables

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then edit `.env` and fill in your Firebase configuration values:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=https://your_project_id-default-rtdb.firebaseio.com
```

**Important**: Never commit your `.env` file to version control. It's already included in `.gitignore`.

### 5. Run the Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173/`

## 📦 Available Scripts

### Development

```bash
npm run dev
```
Starts the Vite development server with hot module replacement (HMR).

### Build

```bash
npm run build
```
Compiles TypeScript and builds the production-ready application to the `dist/` folder.

### Preview

```bash
npm run preview
```
Locally preview the production build before deploying.

### Lint

```bash
npm run lint
```
Runs ESLint to check for code quality issues.

## 🌐 Environment Variables

The application requires the following environment variables (all prefixed with `VITE_` to be accessible in the browser):

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API key | `AIzaSyC...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | `my-app.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | `my-app-12345` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | `my-app.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | `1:123456789:web:abc123` |
| `VITE_FIREBASE_DATABASE_URL` | Realtime Database URL | `https://my-app-default-rtdb.firebaseio.com` |

**Note**: In Vite, environment variables must be prefixed with `VITE_` to be exposed to the client-side code.

## 📁 Project Structure

```
gauntlet-collabcanvas-week-1/
├── public/              # Static assets
├── src/
│   ├── components/      # React components (coming soon)
│   │   ├── Auth/       # Authentication components
│   │   ├── Canvas/     # Canvas and shape components
│   │   ├── Collaboration/ # Cursors and presence
│   │   └── Layout/     # Navbar and layout
│   ├── contexts/       # React contexts (coming soon)
│   ├── hooks/          # Custom React hooks (coming soon)
│   ├── services/       # Firebase services (coming soon)
│   ├── utils/          # Utility functions (coming soon)
│   ├── App.tsx         # Main app component
│   ├── main.tsx        # App entry point
│   └── index.css       # Global styles with Tailwind
├── .env                # Environment variables (create from .env.example)
├── .env.example        # Example environment variables
├── .gitignore          # Git ignore rules
├── index.html          # HTML template
├── package.json        # Dependencies and scripts
├── tailwind.config.js  # Tailwind CSS configuration
├── postcss.config.js   # PostCSS configuration
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── README.md           # This file
```

## 🧪 Testing the Setup

After running `npm run dev`, you should see:

1. A styled page with Tailwind CSS working
2. No console errors
3. The ability to interact with the test counter button

Once Firebase is integrated (upcoming tasks), you'll be able to:
- Sign up and log in with email/password or Google
- Create and manipulate shapes on the canvas
- See other users' cursors in real-time
- View who's currently online

## 🔒 Security Notes

- **Never commit your `.env` file** - it contains sensitive API keys
- The `.env` file is already in `.gitignore` to prevent accidental commits
- Firebase security rules will be configured in later development phases
- For production, ensure proper security rules are set for Firestore and Realtime Database

## 🚧 Development Roadmap

### ✅ Completed
- [x] Project setup with React + Vite + TypeScript
- [x] Core dependencies installed (Firebase, Konva, Tailwind)
- [x] Tailwind CSS configured
- [x] Firebase project created
- [x] Git and environment configuration

### 🔄 In Progress / Coming Soon
- [ ] Firebase service integration
- [ ] Authentication system (email/password + Google)
- [ ] Canvas component with pan/zoom
- [ ] Shape creation and manipulation
- [ ] Real-time synchronization
- [ ] Multiplayer cursors
- [ ] Presence system
- [ ] Deployment to Firebase Hosting

## 🤝 Contributing

This is an MVP project. For major changes, please open an issue first to discuss what you would like to change.

## 📄 License

[MIT](https://choosealicense.com/licenses/mit/)

## 🐛 Troubleshooting

### Port 5173 is already in use
If you see an error that port 5173 is already in use:
```bash
# Kill the process using the port (Windows)
taskkill /F /IM node.exe

# Or change the port in vite.config.ts
```

### Firebase configuration errors
- Ensure all environment variables are properly set in `.env`
- Verify that your Firebase project has Authentication, Firestore, and Realtime Database enabled
- Check that your environment variable names are prefixed with `VITE_`

### Tailwind styles not applying
- Ensure `src/index.css` has the Tailwind directives at the top
- Check that `tailwind.config.js` includes the correct content paths
- Restart the dev server after making configuration changes

### Module resolution errors
- Try deleting `node_modules` and `package-lock.json`, then run `npm install` again
- Clear Vite cache: delete the `node_modules/.vite` folder

## 📞 Support

For issues and questions, please open an issue in the GitHub repository.

---

**Built with ❤️ as part of the Gauntlet AI CollabCanvas Challenge**
