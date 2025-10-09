# 🏥 NEET-PG Mock Test Platform (medsPG)

A comprehensive **NEET-PG (National Eligibility cum Entrance Test for Postgraduate)** mock test platform designed to help medical students prepare for their postgraduate entrance examinations. Built with modern web technologies and featuring an intuitive user interface.

## 🌐 Live Demo

**🚀 [Visit the Live Application](https://medspg.vercel.app)**

Experience the full NEET-PG Mock Test Platform with all features including authentication, subject-wise tests, analytics, and both light/dark themes.

## 🌟 Project Overview

**medsPG** is a full-stack web application that provides medical students with:
- **Subject-wise practice tests** across multiple medical disciplines
- **Full-length mock examinations** with realistic timing
- **Comprehensive analytics** and performance tracking
- **Real-time test taking** with automatic submission
- **Detailed result analysis** with explanations

## 📸 Project Screenshots

### 🏠 Landing Page
<div align="center">
  <img src="git images/landing light mode.png" alt="Landing Page - Light Mode" width="45%" />
  <img src="git images/landing dark mode.png" alt="Landing Page - Dark Mode" width="45%" />
  <p><em>Professional landing page with feature highlights in both light and dark themes</em></p>
</div>

### 📊 Dashboard
<div align="center">
  <img src="git images/dashboard light mode.png" alt="Dashboard - Light Mode" width="45%" />
  <img src="git images/dark mode dashboard.png" alt="Dashboard - Dark Mode" width="45%" />
  <p><em>Subject selection interface with progress tracking and performance metrics</em></p>
</div>

### 📝 Test Interface
<div align="center">
  <img src="git images/test page light mode.png" alt="Test Interface - Light Mode" width="80%" />
  <p><em>Interactive test taking interface with real-time timer and question navigation</em></p>
</div>

### 📈 Analytics Dashboard
<div align="center">
  <img src="git images/analytics darkmode.png" alt="Analytics Dashboard - Dark Mode" width="80%" />
  <p><em>Comprehensive performance analytics with charts and subject-wise insights</em></p>
</div>

## 🚀 Core Features

### 🔐 Authentication & Authorization
- **Secure user registration** and login system
- **Email verification** for new accounts
- **Session management** with persistent login
- **Protected routes** and user-specific data access
- **Modal-based authentication** (no page redirects)

### 📚 Subject-Wise Test System
- **Multiple medical subjects**: Anatomy, Physiology, Pathology, Pharmacology, Microbiology, Medicine, etc.
- **Randomized question selection** (up to 20 questions per test)
- **Subject-specific filtering** and search functionality
- **Dynamic question loading** from database

### ⏱️ Interactive Test Interface
- **Real-time countdown timer** (~63 seconds per question)
- **Progress tracking** and navigation between questions
- **Answer selection** with radio button interface
- **Skip functionality** for unanswered questions
- **Auto-submission** when time expires
- **Keyboard shortcuts** (Ctrl+1-9 for question navigation)

### 📊 Comprehensive Results & Analytics
- **Detailed score breakdown** (correct, incorrect, skipped)
- **Percentage-based scoring** system
- **Question-by-question review** with explanations
- **Performance analytics dashboard**
- **Subject-wise performance tracking**
- **Historical test result storage**
- **Time analysis** per question

### 🎨 Modern User Interface
- **Responsive design** for all device sizes
- **Medical-themed color scheme** with professional aesthetics
- **Smooth animations** and transitions using Framer Motion
- **Intuitive navigation** and user experience
- **Dark/Light theme support**
- **Accessibility features** with semantic HTML

## 🛠️ Technology Stack

### Frontend Framework
- **Vite** - Build tool and development server
- **React 18.3.1** - UI library with hooks
- **TypeScript** - Type safety and development experience
- **React Router DOM 6.30.1** - Client-side routing

### UI Components & Styling
- **TailwindCSS 3.4.17** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible component library
- **Radix UI primitives** - Headless UI components
- **Framer Motion 12.23.12** - Animation library
- **Lucide React** - Icon library
- **Next Themes** - Theme management

### State Management & Data Fetching
- **TanStack Query 5.83.0** - Server state management and caching
- **React Hook Form 7.61.1** - Form handling and validation
- **Zod 3.25.76** - Schema validation
- **Context API** - Authentication state management

### Backend & Database
- **Supabase** - Backend-as-a-Service
  - **PostgreSQL database** with Row Level Security (RLS)
  - **Real-time subscriptions** for live updates
  - **Authentication system** with JWT tokens
  - **Auto-generated TypeScript types**
  - **RESTful API** with automatic generation

### Charts & Visualization
- **Recharts 2.15.4** - Data visualization library
- **Custom SVG progress indicators**
- **Performance trend charts**

### Development Tools
- **ESLint** - Code linting and quality
- **TypeScript ESLint** - TypeScript-specific linting
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing

## 🏗️ Project Architecture

### 📁 Folder Structure
```
src/
├── components/
│   ├── ui/                 # Reusable UI components (shadcn/ui)
│   └── ThemeToggle.tsx     # Theme switching component
├── hooks/
│   ├── useAuth.tsx         # Authentication context and logic
│   ├── use-toast.ts        # Toast notification hook
│   └── use-mobile.tsx      # Mobile detection hook
├── integrations/
│   └── supabase/
│       ├── client.ts       # Supabase client setup
│       └── types.ts         # Database type definitions
├── lib/
│   └── utils.ts            # Common utility functions
├── pages/
│   ├── Landing.tsx         # Homepage/landing page
│   ├── Auth.tsx            # Authentication page
│   ├── Dashboard.tsx       # Main dashboard with subjects
│   ├── Test.tsx            # Test taking interface
│   ├── Results.tsx         # Test results and review
│   ├── Analytics.tsx       # Performance analytics
│   ├── Terms.tsx           # Terms of service
│   └── NotFound.tsx        # 404 error page
├── App.tsx                 # Main application component
├── main.tsx                # Application entry point
└── index.css               # Global styles
```

### 🗄️ Database Schema

#### Questions Table
```sql
CREATE TABLE "Questions" (
  id SERIAL PRIMARY KEY,
  question_text TEXT,
  options JSON,
  correct_answer TEXT,
  subject TEXT NOT NULL,
  explanation TEXT
);
```

#### TestResults Table
```sql
CREATE TABLE "TestResults" (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  score_percent INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  wrong_count INTEGER NOT NULL,
  skipped_count INTEGER DEFAULT 0,
  total_questions INTEGER NOT NULL,
  time_per_question INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔄 User Flow & State Management

### 1. **Authentication Flow**
```typescript
// User registration/login
const { signUp, signIn, signOut, user, session } = useAuth();

// Protected routes
if (!user) return <Navigate to="/" replace />;
```

### 2. **Test Taking Workflow**
```typescript
// State management for test taking
const [questions, setQuestions] = useState<Question[]>([]);
const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
const [answers, setAnswers] = useState<{ [key: number]: string }>({});
const [timeLeft, setTimeLeft] = useState<number>(0);
const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
```

### 3. **Answer Tracking System**
- **Real-time answer storage** in local state
- **Time tracking** per question
- **Progress persistence** during test session
- **Automatic result calculation** on submission

### 4. **Results Processing**
```typescript
// Automatic result saving to database
const resultData = {
  user_id: user.id,
  subject: subject,
  score_percent: Math.round((score / total) * 100),
  correct_count: score,
  wrong_count: wrongCount,
  skipped_count: skippedCount,
  total_questions: total,
  time_per_question: timePerQuestion
};
```

## 🚀 Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **Supabase account** for backend services

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/medsPG.git
cd medsPG
```

2. **Install dependencies**
```bash
npm install
# or
yarn install
```

3. **Environment Setup**
Create a `.env.local` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Database Setup**
Run the SQL scripts in your Supabase dashboard:
- `create-testresults-table.sql`
- `deployment-security.sql`

5. **Start development server**
```bash
npm run dev
# or
yarn dev
```

6. **Build for production**
```bash
npm run build
# or
yarn build
```

## 🔧 Development Scripts

```json
{
  "dev": "vite",                    // Start development server
  "build": "vite build",           // Build for production
  "build:dev": "vite build --mode development", // Build in dev mode
  "lint": "eslint .",              // Run ESLint
  "preview": "vite preview"        // Preview production build
}
```

## 🔒 Security Features

- **Row Level Security (RLS)** enabled on all tables
- **User-specific data access** policies
- **JWT token authentication** with automatic refresh
- **Secure API endpoints** with Supabase
- **Input validation** with Zod schemas
- **XSS protection** with React's built-in sanitization

## 📊 Performance Optimizations

- **React Query** for efficient data fetching and caching
- **Lazy loading** of components
- **Optimized bundle size** with Vite
- **Database indexing** for faster queries
- **Real-time updates** with Supabase subscriptions

## 🧪 Code Quality

- **TypeScript** for type safety
- **ESLint** for code linting
- **Component-based architecture** for reusability
- **Custom hooks** for logic separation
- **Error boundaries** for graceful error handling
- **Accessibility** with ARIA attributes

## 🚀 Deployment

### 🌐 Live Application
**🚀 [medsPG Live Demo](https://medspg.vercel.app)** - Experience the full platform with all features!

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Netlify
1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Configure environment variables

### Manual Deployment
1. Build the project: `npm run build`
2. Upload the `dist` folder to your hosting provider
3. Configure environment variables

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Developer

**Jalaj Balodi**
- Email: jalajbalodi264@gmail.com
- Project: NEET-PG Mock Test Platform (medsPG)

## 🔮 Future Enhancements

- **Bulk question bank upload** functionality
- **Payment integration** (Stripe + Razorpay)
- **Advanced analytics** with machine learning insights
- **Mobile app** development
- **Offline test taking** capability
- **Social features** for study groups
- **AI-powered question recommendations**

## 📞 Support

For support, email jalajbalodi264@gmail.com or create an issue in the repository.

---

**Built with ❤️ for medical students preparing for NEET-PG examinations**