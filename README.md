<div align="center">

# 🌐 GlobalCollab

### Real-Time Collaboration Platform for Developers

[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4-010101?style=for-the-badge&logo=socket.io)](https://socket.io/)

*A production-grade SaaS platform where developers discover projects, collaborate in real time, and grow their career through a gamified reputation system.*

</div>

---

## 📖 About

**GlobalCollab** is a full-stack collaboration platform built for developers and teams. It combines project management, real-time messaging, AI-powered task generation, a Kanban board, subscription billing, and a gamified leaderboard into one cohesive workspace.

The platform follows a modular, service-oriented architecture with a clear separation between frontend (React + Vite) and backend (Node.js + Express), connected via RESTful APIs and WebSockets.

---

## ✨ Features

| Category | Features |
|---|---|
| **Authentication** | JWT-based login/register, protected routes, session management |
| **Projects** | Create, browse, join projects · Tech-stack tags · Deadline tracking |
| **Kanban Board** | Drag-and-drop task board · Todo → In Progress → Review → Done |
| **Task Management** | Create, assign, update tasks · Priority levels · Deadline alerts |
| **Real-Time Messaging** | Direct messages & project channels · File attachments · Emoji picker |
| **Notifications** | Real-time push via Socket.IO · Unread indicators · Bell badge |
| **AI Integration** | AI task generation · AI team recommendations (via OpenRouter) |
| **Analytics Dashboard** | Bar, pie & doughnut charts · Task stats · Overdue tracking |
| **Subscription & Billing** | Free / Pro / Team plans · Razorpay payment gateway · Plan limits |
| **Reputation & Points** | Earn points for contributions · Monthly leaderboard · Points wallet |
| **Admin Panel** | User management · Role assignment · User deletion (admin-only) |
| **Explore & Discover** | Browse public projects · Search by tech stack · Public portfolios |
| **Profile** | Editable bio, skills, social links · Public portfolio page |
| **Settings** | Subscription management · Plan comparison · Usage stats |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                             │
│              React 19 + Vite + TailwindCSS                  │
│   Pages: Dashboard, Projects, Kanban, Tasks, Messages,      │
│          Analytics, Leaderboard, Profile, Settings, Admin    │
│                     ↕ Axios + Socket.IO                     │
├─────────────────────────────────────────────────────────────┤
│                        BACKEND                              │
│               Node.js + Express REST API                    │
│   Layers: Routes → Controllers → Services → Repositories   │
│   Middleware: Auth (JWT) · Admin · Rate Limit · Plan Limits │
│   Real-Time: Socket.IO (notifications, messages)            │
│   Integrations: Razorpay · SendGrid · OpenRouter AI         │
│                     ↕ pg (node-postgres)                    │
├─────────────────────────────────────────────────────────────┤
│                       DATABASE                              │
│                   PostgreSQL (Neon)                          │
│   15 Tables: users, projects, tasks, messages, plans,       │
│   subscriptions, notifications, reputation, payments, ...   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technologies Used

### Frontend
- **React 19** — Component-based UI
- **Vite 7** — Lightning-fast dev server & build
- **React Router 7** — Client-side routing
- **TailwindCSS 4** — Utility-first CSS
- **Recharts** — Data visualization (charts & graphs)
- **Socket.IO Client** — Real-time communication
- **Lucide React** — Modern icon library
- **@dnd-kit** — Drag-and-drop for Kanban board
- **Axios** — HTTP client

### Backend
- **Node.js 18+** — Server runtime
- **Express 4** — REST API framework
- **PostgreSQL** — Relational database (Neon for cloud)
- **Socket.IO** — WebSocket server for real-time events
- **JWT (jsonwebtoken)** — Authentication tokens
- **bcrypt** — Password hashing
- **Razorpay SDK** — Payment processing
- **SendGrid** — Transactional emails
- **OpenAI SDK** — AI features via OpenRouter
- **Multer** — File upload handling
- **Winston** — Structured logging
- **node-cron** — Scheduled jobs
- **Joi** — Request validation

---

## 📁 Project Structure

```
Global-Collab/
│
├── client/                          # React Frontend
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TopNav.jsx
│   │   │   ├── KanbanColumn.jsx
│   │   │   ├── KanbanCard.jsx
│   │   │   ├── ActivityFeed.jsx
│   │   │   ├── StatsCard.jsx
│   │   │   ├── Modal.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/                   # Application pages
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Projects.jsx
│   │   │   ├── ProjectDetails.jsx
│   │   │   ├── WorkspaceKanban.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── Messages.jsx
│   │   │   ├── Analytics.jsx
│   │   │   ├── Leaderboard.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── AdminPanel.jsx
│   │   │   ├── Explore.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── context/                 # React Context (Auth)
│   │   ├── services/                # API client & utilities
│   │   ├── layouts/                 # Layout wrappers
│   │   ├── styles/                  # Global & component CSS
│   │   ├── App.jsx                  # Root component & routes
│   │   └── main.jsx                 # Entry point
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── server/                          # Node.js Backend
│   ├── routes/                      # Express route definitions
│   ├── controllers/                 # Request handlers
│   ├── services/                    # Business logic layer
│   ├── repositories/                # Database query layer
│   ├── middleware/                   # Auth, admin, rate limiting
│   ├── db/                          # Database connection & migrations
│   │   ├── index.js                 # PostgreSQL pool config
│   │   └── migrations/              # SQL migration files
│   ├── cron/                        # Scheduled jobs
│   ├── workers/                     # Background workers
│   ├── utils/                       # Utility helpers
│   ├── uploads/                     # User-uploaded files
│   ├── index.js                     # Express app entry point
│   └── package.json
│
├── database/
│   └── schema.sql                   # Complete DB schema
│
├── .env.example                     # Environment variable template
├── .gitignore
├── netlify.toml                     # Netlify deployment config
├── render.yaml                      # Render deployment config
├── docker-compose.yml               # Docker setup
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **PostgreSQL** 14+ (local or [Neon](https://neon.tech) cloud)

### 1. Clone the Repository

```bash
git clone https://github.com/bhavesh-99596/Global-Collab.git
cd Global-Collab
```

### 2. Set Up the Database

Create a PostgreSQL database and run the schema:

```bash
psql -U postgres -c "CREATE DATABASE globalcollab;"
psql -U postgres -d globalcollab -f database/schema.sql
```

### 3. Configure Environment Variables

```bash
cp .env.example server/.env
```

Edit `server/.env` and fill in your credentials:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/globalcollab
JWT_SECRET=your_super_secret_key
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxx
SENDGRID_API_KEY=SG.xxxxx
OPENROUTER_API_KEY=sk-or-xxxxx
```

### 4. Install Dependencies & Start

**Backend:**

```bash
cd server
npm install
npm run dev
```

The API server starts at `http://localhost:5000`.

**Frontend:**

```bash
cd client
npm install
npm run dev
```

The React app starts at `http://localhost:5173`.

---

## 🌍 Deployment

| Service | Component | URL |
|---------|-----------|-----|
| **Netlify** | Frontend (React) | [Live Site](https://global-collab.netlify.app) |
| **Render** | Backend (Node.js) | [API Server](https://global-collab-api.onrender.com) |
| **Neon** | Database (PostgreSQL) | Managed cloud DB |

---

## 🔒 Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `RAZORPAY_KEY_ID` | Razorpay API key ID |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret key |
| `SENDGRID_API_KEY` | SendGrid API key for emails |
| `ONESIGNAL_API_KEY` | OneSignal push notification key |
| `OPENROUTER_API_KEY` | OpenRouter API key for AI features |

---

## 👤 Author

**Bhavesh**

- GitHub: [@bhavesh-99596](https://github.com/bhavesh-99596)

---

## 📄 License

This project is built for educational and portfolio purposes.

---

<div align="center">
  <b>⭐ Star this repo if you find it useful!</b>
</div>
