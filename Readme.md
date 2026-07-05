# SBI AI Banking Assistant — Full Stack Project

**Theme:** Agentic AI & Emerging Tech  
**Problem Statement:** Digital Engagement  
**Stack:** React + Vite · Node.js · Express · MySQL · JWT

---

## Project Structure

```
sbi-ai-banking-assistant/
├── frontend/          ← React + Vite (port 5173)
│   ├── src/
│   │   ├── pages/     ← Login, Register, Dashboard, Transactions, Agents,
│   │   │              ← Recommendations, Notifications, Feedback, Profile
│   │   ├── components/← Layout (Sidebar + Navbar)
│   │   ├── context/   ← AuthContext (global auth state)
│   │   ├── routes/    ← AppRoutes (protected routing)
│   │   └── services/  ← authService, apiService (axios calls)
│   └── package.json
│
└── backend/           ← Express API (port 5000)
    ├── server.js
    ├── config/        ← db.js (MySQL pool), schema.sql
    ├── controllers/   ← auth, user, transaction, recommendation,
    │                  ← notification, feedback
    ├── middleware/    ← authMiddleware (JWT), errorMiddleware
    ├── routes/        ← 7 route files
    ├── services/      ← aiAgentService (orchestrator) + 5 agents
    └── utils/         ← jwtToken, emailSender
```

---

## Quick Start

### 1. Database setup
```bash
mysql -u root -p < backend/config/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env        # fill in DB_PASSWORD, JWT_SECRET
npm install
npm run dev
# → http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
# → http://localhost:5173
```

---

## Demo Login

```
CIF Number : CIF12345726
Password   : Demo@123
```

---

## AI Agent Flow

```
Login → Fetch Transactions → AI Agent Service
          ↓           ↓         ↓         ↓         ↓
     Spending    Savings     Loan    Bill Rem.  Investment
       Agent      Agent     Agent     Agent      Agent
          ↓           ↓         ↓         ↓         ↓
                 Generate Recommendations
                          ↓
                  Store in MySQL
                          ↓
                 Send Notifications
                          ↓
                   User Feedback
                          ↓
               Improve Future Suggestions
```

## API Endpoints Summary

| Route | Method | Auth | Description |
|-------|--------|------|-------------|
| /api/auth/register | POST | — | Register |
| /api/auth/login | POST | — | Login |
| /api/auth/send-otp | POST | — | Send OTP |
| /api/auth/verify-otp | POST | — | Verify OTP |
| /api/auth/me | GET | ✅ | Current user |
| /api/transactions | GET | ✅ | List (paginated) |
| /api/transactions/summary | GET | ✅ | Monthly summary |
| /api/transactions/categories | GET | ✅ | Category breakdown |
| /api/recommendations | GET | ✅ | AI suggestions |
| /api/recommendations/run | POST | ✅ | Trigger agents |
| /api/notifications | GET | ✅ | Notifications |
| /api/feedback | POST | ✅ | Submit rating |
| /api/agents/status | GET | ✅ | Agent run log |
| /api/agents/run | POST | ✅ | Run all agents |
