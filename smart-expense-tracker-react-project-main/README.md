# 💰 Smart Expense Tracker

A full-stack MERN (MongoDB, Express, React, Node.js) expense tracking application.

## Project Structure

```
smart-expense-tracker/
├── client/                 # React frontend (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Expenses.jsx
│   │   │   └── AddExpense.jsx
│   │   ├── App.jsx         # Root component with routing
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── package.json
│   └── vite.config.js
│
├── server/                 # Express backend
│   ├── config/
│   │   └── db.js           # MongoDB connection
│   ├── models/
│   │   └── Expense.js      # Mongoose schema
│   ├── routes/
│   │   └── expenseRoutes.js # CRUD API routes
│   ├── server.js           # Express entry point
│   ├── .env                # Environment variables
│   └── package.json
│
└── README.md
```

## Getting Started

### Prerequisites

- **Node.js** (v18+)
- **MongoDB** (local or Atlas cloud)

### 1. Setup Server

```bash
cd server
npm install
```

Create a `.env` file (already provided):
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/smart-expense-tracker
NODE_ENV=development
```

Start the server:
```bash
npm run dev
```

### 2. Setup Client

```bash
cd client
npm install
npm run dev
```

The React app will run at `http://localhost:5173` and the API at `http://localhost:5000`.

## API Endpoints

| Method | Endpoint             | Description         |
|--------|----------------------|---------------------|
| GET    | `/api/health`        | Health check        |
| GET    | `/api/expenses`      | Get all expenses    |
| POST   | `/api/expenses`      | Create new expense  |
| GET    | `/api/expenses/:id`  | Get single expense  |
| PUT    | `/api/expenses/:id`  | Update an expense   |
| DELETE | `/api/expenses/:id`  | Delete an expense   |

## Tech Stack

- **Frontend:** React 19, React Router v7, Axios, Vite
- **Backend:** Node.js, Express.js, Mongoose
- **Database:** MongoDB
- **Styling:** Vanilla CSS (dark theme with glassmorphism)
