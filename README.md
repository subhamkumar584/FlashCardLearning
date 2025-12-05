# 🚀 Flashcard Learning App

A modern, feature-rich flashcard application built with **Next.js 15**, **React 19**, **Firebase**, and **TailwindCSS**. Create, organize, and study flashcards with intelligent features and beautiful animations.

## ✨ Features Completed

### 🔑 Authentication & User Management
- ✅ **Firebase Authentication** - Sign up, login, logout
- ✅ **Multi-device sync** - Access flashcards anywhere
- ✅ **Secure environment variables** - Protected API keys

### 📚 Core Flashcard Features
- ✅ **Create flashcards** - Front/back with rich content
- ✅ **Edit flashcards** - Inline editing with real-time updates
- ✅ **Delete flashcards** - Remove unwanted cards
- ✅ **Category system** - Organize by subjects (Math, Science, etc.)
- ✅ **Mark as completed** - Track learning progress
- ✅ **Search functionality** - Find cards by content or category
- ✅ **Filter by category** - Focus on specific subjects

### 🎨 User Interface & Experience
- ✅ **Glassmorphic design** - Beautiful backdrop blur effects
- ✅ **3D card animations** - Smooth flip transitions
- ✅ **Dark/Light theme toggle** - Adaptive color schemes
- ✅ **Responsive design** - Works on mobile and desktop
- ✅ **Loading states** - Skeleton screens and indicators
- ✅ **Confetti celebrations** - Reward achievements

### 📊 Progress Tracking & Analytics
- ✅ **Progress pie chart** - Visual completion overview
- ✅ **Category progress bars** - Subject-wise tracking
- ✅ **Study statistics dashboard** - Total cards, completion rates
- ✅ **Study streak tracking** - Daily learning motivation
- ✅ **Study time tracking** - Monitor learning sessions

### 🔍 Smart Learning Features
- ✅ **YouTube integration** - Automatic video suggestions
- ✅ **Google Books integration** - Relevant book recommendations
- ✅ **External resource links** - Enhance learning with additional content

### 📤 Data Management
- ✅ **Export to JSON** - Backup your flashcards
- ✅ **Export to CSV** - Spreadsheet compatibility
- ✅ **Import from JSON/CSV** - Restore or migrate data
- ✅ **Real-time sync** - Instant updates across devices

### 🎯 Enhanced User Experience
- ✅ **Celebration effects** - Motivational animations
- ✅ **Intuitive navigation** - Easy-to-use interface
- ✅ **Error handling** - Graceful error recovery
- ✅ **Performance optimized** - Fast loading and smooth interactions

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: TailwindCSS 4, Custom CSS animations
- **Backend**: Firebase Authentication, Firestore Database
- **External APIs**: YouTube Data API, Google Books API
- **Charts**: react-minimal-pie-chart
- **Animations**: canvas-confetti, CSS transforms

## 🚀 Getting Started

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd flashcard-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file with your Firebase and Google API credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
   NEXT_PUBLIC_GOOGLE_API_KEY=your_google_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎮 How to Use

1. **Sign Up/Login** - Create an account or sign in
2. **Create Flashcards** - Add topic and explanation with optional categories
3. **Study** - Click cards to flip and reveal answers
4. **Track Progress** - Watch your completion stats and streaks
5. **Organize** - Use categories and search to find specific cards
6. **Export/Import** - Backup your data or migrate between accounts

## 📁 Project Structure

```
app/
├── components/
│   ├── AuthForm.tsx         # Authentication form
│   ├── Dashboard.tsx        # Main app interface
│   ├── Flashcard.tsx        # Individual flashcard component
│   ├── ThemeToggle.tsx      # Dark/light mode switcher
│   ├── StudyStats.tsx       # Progress tracking dashboard
│   ├── ImportExport.tsx     # Data import/export functionality
│   └── Loading.tsx          # Loading states and skeletons
├── utils/
│   ├── authUtils.ts         # TypeScript interfaces and utilities
│   ├── fetchBooks.ts        # Google Books API integration
│   └── fetchYoutube.ts      # YouTube API integration
├── globals.css              # Global styles and TailwindCSS
├── layout.tsx               # Root layout component
└── page.tsx                 # Main page with auth routing
firebase/
└── config.ts                # Firebase configuration
```

## 🔮 Future Enhancements

- Social login (Google, GitHub)
- Password reset functionality
- Spaced repetition algorithm
- Quiz mode with MCQ
- Deck sharing and collaboration
- Push notifications
- PWA capabilities
- AI-powered content suggestions

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
