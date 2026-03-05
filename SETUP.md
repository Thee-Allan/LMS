# Nanyuki Law Firm – Full Stack Setup Guide

## 📁 Project Structure
```
law-secure-manage/
├── database.sql          ← Run this in MySQL first
├── server/               ← Node.js / Express backend
│   ├── index.js
│   ├── package.json
│   └── .env              ← Edit your DB password here
├── src/
│   ├── lib/api.ts        ← NEW: Frontend API client
│   └── contexts/AuthContext.tsx  ← UPDATED: Uses MySQL auth
└── (all other existing files unchanged)
```

---

## Step 1 – Set up MySQL Database

Open MySQL Workbench (or terminal) and run:

```sql
-- In MySQL Workbench: File → Open SQL Script → database.sql → Run
-- Or in terminal:
mysql -u root -p < database.sql
```

This creates the `nanyuki_law_firm` database with all tables and seed data.

---

## Step 2 – Configure the Backend

Edit **`server/.env`** with your MySQL password:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE
DB_NAME=nanyuki_law_firm
JWT_SECRET=nanyuki_law_firm_super_secret_key_2024
PORT=4000
```

---

## Step 3 – Start the Backend

Open a terminal in VS Code:

```bash
cd server
npm install
npm start
```

You should see:
```
✅  NLF Server running on http://localhost:4000 (or via tunnel https://highlights-doctors-winds-sporting.trycloudflare.com)
```

---

## Step 4 – Start the Frontend

Open a **second terminal** in VS Code:

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## 🔑 Login Credentials

| Role              | Email                   | Password    |
|-------------------|-------------------------|-------------|
| Super Admin       | admin@gmail.com         | password123 |
| Managing Partner  | owner@gmail.com         | password123 |
| Advocate          | advocate@gmail.com      | password123 |
| Client            | customer@gmail.com      | password123 |

---

## 🗄️ Database Tables

| Table              | Description                        |
|--------------------|------------------------------------|
| `users`            | Staff accounts with roles          |
| `clients`          | Law firm clients                   |
| `matters`          | Legal cases / matters              |
| `tasks`            | Task management                    |
| `task_comments`    | Comments on tasks                  |
| `calendar_events`  | Hearings, meetings, deadlines      |
| `event_attendees`  | Attendees per event                |
| `documents`        | Document metadata                  |
| `document_tags`    | Tags per document                  |
| `invoices`         | Client invoices                    |
| `invoice_items`    | Line items per invoice             |
| `time_entries`     | Billable hours tracking            |
| `notifications`    | System notifications               |
| `audit_logs`       | Full audit trail                   |

---

## 🔌 API Endpoints

| Method | Endpoint                      | Description          |
|--------|-------------------------------|----------------------|
| POST   | /api/auth/login               | Login → JWT token    |
| GET    | /api/clients                  | List clients         |
| POST   | /api/clients                  | Create client        |
| PUT    | /api/clients/:id              | Update client        |
| DELETE | /api/clients/:id              | Delete client        |
| GET    | /api/matters                  | List matters         |
| GET    | /api/tasks                    | List tasks           |
| POST   | /api/tasks/:id/comments       | Add task comment     |
| GET    | /api/events                   | Calendar events      |
| GET    | /api/documents                | List documents       |
| GET    | /api/invoices                 | List invoices        |
| GET    | /api/time-entries             | Time entries         |
| GET    | /api/notifications            | Notifications        |
| GET    | /api/users                    | All users            |
| GET    | /api/audit-logs               | Audit trail          |
| GET    | /api/dashboard/stats          | Dashboard KPIs       |

---

## ⚠️ Troubleshooting

**"Access denied for user 'root'"**  
→ Check DB_PASSWORD in `server/.env`

**Frontend shows blank / can't connect**  
→ Make sure backend is running on port 4000 first

**"Cannot find module"**  
→ Run `npm install` inside the `server/` folder
