# Nanyuki Law Firm Management System

Full‑stack law firm management portal built with React, TypeScript, Vite and a custom Node/Express + MySQL backend.

## Getting Started

1. **Database** – run the SQL in `database.sql` against your MySQL server. This creates `nanyuki_law_firm` with all tables and seed data.

2. **Backend**
   ```bash
   cd server
   npm install
   node index.js     # or npm run dev for nodemon
   ```
   Ensure `server/.env` has the correct credentials (DB and email OTP settings).

3. **Frontend**
   ```bash
   cd ..             # back to project root
   npm install
   npm run dev       # start Vite dev server (port 5173 by default)
   ```

4. **Access**
   Open http://localhost:5173 in your browser.  Use the landing page to sign in or register.

### Test Accounts

| Email              | Password     | Role             |
|-------------------|--------------|------------------|
| admin@gmail.com   | password123  | Super Admin      |
| owner@gmail.com   | password123  | Managing Partner |
| advocate@gmail.com| password123  | Advocate         |
| customer@gmail.com| password123  | Client           |

> If email is not configured in `server/.env`, OTP codes appear in the server console.

---

Feel free to delete this README when deploying.

