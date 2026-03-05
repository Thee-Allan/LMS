// ============================================================
// Nanyuki Law Firm - Express / MySQL Backend
// Usage:  cd server && npm install && npm start
// ============================================================

require('dotenv').config();
const express  = require('express');
const mysql    = require('mysql2/promise');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const cors     = require('cors');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const multer   = require('multer');
const { body, validationResult } = require('express-validator');

const app  = express();
const PORT = process.env.PORT || 4000;
const SECRET = process.env.JWT_SECRET || 'nlf_secret_key';

// ── Middleware ────────────────────────────────────────────────
app.use(cors({ origin: '*', credentials: false }));
app.use(express.json());

// Validation error handler middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: 'File upload error: ' + err.message });
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
  }
  next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Database Pool ─────────────────────────────────────────────
const pool = mysql.createPool({
  host:     process.env.DB_HOST || 'localhost',
  port:     process.env.DB_PORT || 3306,
  user:     process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Allan254',
  database: process.env.DB_NAME || 'nanyuki_law_firm',
});

// ── Document Upload Setup ─────────────────────────────────────
const upload = multer({
  dest: 'uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx|txt|jpg|jpeg|png|gif/;
    const extname = allowedTypes.test(file.originalname.toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, TXT, and image files are allowed.'));
    }
  }
});

// ── Role Permissions Map ──────────────────────────────────────
const ROLE_PERMISSIONS = {
  super_admin:      ['*'],
  managing_partner: ['dashboard.view','clients.view','clients.create','clients.edit','clients.delete','clients.export','matters.view','matters.create','matters.edit','matters.delete','matters.approve','matters.export','tasks.view','tasks.create','tasks.edit','tasks.delete','tasks.assign','calendar.view','calendar.create','calendar.edit','calendar.delete','documents.view','documents.create','documents.edit','documents.delete','documents.export','billing.view','billing.create','billing.edit','billing.delete','billing.approve','billing.export','time.view','time.create','time.edit','time.approve','time.export','reports.view','reports.export','users.view','users.create','users.edit','settings.view','settings.edit'],
  advocate:         ['dashboard.view','clients.view','clients.create','clients.edit','matters.view','matters.create','matters.edit','tasks.view','tasks.create','tasks.edit','calendar.view','calendar.create','calendar.edit','documents.view','documents.create','documents.edit','billing.view','billing.create','time.view','time.create','time.edit','reports.view'],
  paralegal:        ['dashboard.view','clients.view','clients.create','matters.view','tasks.view','tasks.create','tasks.edit','calendar.view','calendar.create','documents.view','documents.create','time.view','time.create'],
  accountant:       ['dashboard.view','clients.view','matters.view','billing.view','billing.create','billing.edit','billing.approve','billing.export','time.view','time.approve','time.export','reports.view','reports.export'],
  reception:        ['dashboard.view','clients.view','clients.create','matters.view','calendar.view','calendar.create','tasks.view'],
  client:           ['dashboard.view','matters.view','documents.view','billing.view'],
};

// ── OTP & Email Helpers ───────────────────────────────────────
const otpStore = new Map(); // email -> { otp, expires, userData }
let transporter = null;

if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: false, // 587 uses STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  transporter.verify((err) => {
    if (err) console.log("❌ Email transporter verify failed:", err.message);
    else console.log("✅ Email server ready — OTPs will be sent to real emails");
  });
} else {
  console.log('⚠️  Email not configured; OTPs will be printed to the console.');
}

function sendOtpEmail(email, otp) {
  if (transporter) {
    transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Your NLF Registration OTP',
      text: `Your verification code is: ${otp}`
    }).catch(e => console.log('Failed to send OTP email:', e));
  } else {
    console.log(`OTP for ${email}: ${otp}`);
  }
}

// ── Auth Middleware ───────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ── Helper ────────────────────────────────────────────────────
async function logAudit(userId, userName, action, module, details) {
  try {
    await pool.execute(
      'INSERT INTO audit_logs (user_id, user_name, action, module, details, ip_address) VALUES (?,?,?,?,?,?)',
      [userId, userName, action, module, details, '127.0.0.1']
    );
  } catch (_) {}
}

// ============================================================
// AUTH ROUTES
// ============================================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email and password required' });

  const [rows] = await pool.execute('SELECT * FROM users WHERE email = ? AND is_active = 1', [email]);
  if (!rows.length) return res.status(401).json({ error: 'Invalid credentials' });

  const user = rows[0];
  // Accept plain "password123" OR a proper bcrypt hash
  const valid = password === 'password123' ||
    await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const permissions = ROLE_PERMISSIONS[user.role] || [];
  const payload = {
    id:          user.id,
    email:       user.email,
    name:        user.name,
    role:        user.role,
    title:       user.title,
    avatar:      user.avatar,
    billingRate: parseFloat(user.billing_rate),
    phone:       user.phone,
    permissions,
  };
  const token = jwt.sign(payload, SECRET, { expiresIn: '8h' });

  await logAudit(user.id, user.name, 'LOGIN', 'Auth', `User ${user.name} logged in`);
  res.json({ token, user: payload });
});

// GET /api/auth/me
app.get('/api/auth/me', auth, (req, res) => {
  res.json(req.user);
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, role, phone, title } = req.body;
  if (!email || !password || !name || !role) {
    return res.status(400).json({ error: 'Missing registration fields' });
  }
  // check if existing user
  const [existing] = await pool.execute('SELECT id FROM users WHERE email=?', [email]);
  if (existing.length) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expires = Date.now() + 10 * 60 * 1000;
  otpStore.set(email, { otp, expires, userData: { name, email, password, role, phone, title } });
  sendOtpEmail(email, otp);
  res.json({ message: 'OTP sent', email });
});

// POST /api/auth/verify-otp
app.post('/api/auth/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const record = otpStore.get(email);
  if (!record || record.otp !== otp || record.expires < Date.now()) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }
  const { name, password, role, phone, title } = record.userData;
  const id = uuidv4();
  const hash = await bcrypt.hash(password, 10);
  await pool.execute(
    'INSERT INTO users (id,email,password_hash,name,role,title,avatar,billing_rate,phone) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, email, hash, name, role, title || '', name.split(' ').map(n=>n[0]).join('').toUpperCase(), 0, phone || '']
  );
  otpStore.delete(email);
  const permissions = ROLE_PERMISSIONS[role] || [];
  const payload = { id, email, name, role, title, avatar: name.split(' ').map(n=>n[0]).join('').toUpperCase(), billingRate:0, phone, permissions };
  const token = jwt.sign(payload, SECRET, { expiresIn: '8h' });
  await logAudit(id, name, 'CREATE', 'Users', `Registered via OTP`);
  res.json({ token, user: payload });
});

// POST /api/auth/resend-otp
app.post('/api/auth/resend-otp', async (req, res) => {
  const { email } = req.body;
  const record = otpStore.get(email);
  if (!record) return res.status(400).json({ error: 'No pending registration for that email' });
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  record.otp = otp;
  record.expires = Date.now() + 10 * 60 * 1000;
  otpStore.set(email, record);
  sendOtpEmail(email, otp);
  res.json({ message: 'OTP resent', email });
});

// ============================================================
// CLIENTS
// ============================================================

app.get('/api/clients', auth, async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM clients ORDER BY created_at DESC');
  res.json(rows.map(r => ({ ...r, kraPin: r.kra_pin, mattersCount: r.matters_count, idNumber: r.id_number, contactPerson: r.contact_person, createdAt: r.created_at })));
});

app.get('/api/clients/:id', auth, async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM clients WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  const r = rows[0];
  res.json({ ...r, kraPin: r.kra_pin, mattersCount: r.matters_count, idNumber: r.id_number, contactPerson: r.contact_person, createdAt: r.created_at });
});

app.post('/api/clients', auth, async (req, res) => {
  const { name, type, email, phone, kraPin, address, idNumber, contactPerson, notes } = req.body;
  const id = `c${uuidv4().replace(/-/g,'').slice(0,8)}`;
  await pool.execute(
    'INSERT INTO clients (id,name,type,email,phone,kra_pin,address,id_number,contact_person,notes,status,matters_count,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,\'active\',0,CURDATE())',
    [id, name, type, email, phone, kraPin, address, idNumber, contactPerson, notes]
  );
  await logAudit(req.user.id, req.user.name, 'CREATE', 'Clients', `Created client: ${name}`);
  res.json({ id });
});

app.put('/api/clients/:id', auth, async (req, res) => {
  const { name, type, email, phone, kraPin, address, idNumber, contactPerson, notes, status } = req.body;
  await pool.execute(
    'UPDATE clients SET name=?,type=?,email=?,phone=?,kra_pin=?,address=?,id_number=?,contact_person=?,notes=?,status=? WHERE id=?',
    [name, type, email, phone, kraPin, address, idNumber, contactPerson, notes, status, req.params.id]
  );
  await logAudit(req.user.id, req.user.name, 'UPDATE', 'Clients', `Updated client: ${name}`);
  res.json({ success: true });
});

app.delete('/api/clients/:id', auth, async (req, res) => {
  const [rows] = await pool.execute('SELECT name FROM clients WHERE id=?', [req.params.id]);
  await pool.execute('DELETE FROM clients WHERE id=?', [req.params.id]);
  await logAudit(req.user.id, req.user.name, 'DELETE', 'Clients', `Deleted client: ${rows[0]?.name}`);
  res.json({ success: true });
});

// ============================================================
// MATTERS
// ============================================================

app.get('/api/matters', auth, async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM matters ORDER BY created_at DESC');
  res.json(rows.map(r => ({
    ...r, matterNumber: r.matter_number, clientId: r.client_id, clientName: r.client_name,
    practiceArea: r.practice_area, assignedAdvocate: r.assigned_advocate, assignedAdvocateId: r.assigned_advocate_id,
    filingDate: r.filing_date, nextHearing: r.next_hearing, opposingParty: r.opposing_party,
    opposingCounsel: r.opposing_counsel, createdAt: r.created_at,
  })));
});

app.post('/api/matters', auth, async (req, res) => {
  const { matterNumber, title, clientId, clientName, practiceArea, status, assignedAdvocate, assignedAdvocateId,
          court, registry, filingDate, nextHearing, description, opposingParty, opposingCounsel, value } = req.body;
  const id = `m${uuidv4().replace(/-/g,'').slice(0,8)}`;
  await pool.execute(
    `INSERT INTO matters (id,matter_number,title,client_id,client_name,practice_area,status,assigned_advocate,assigned_advocate_id,court,registry,filing_date,next_hearing,description,opposing_party,opposing_counsel,value,created_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,CURDATE())`,
    [id, matterNumber, title, clientId, clientName, practiceArea, status, assignedAdvocate, assignedAdvocateId,
     court, registry, filingDate || null, nextHearing || null, description, opposingParty, opposingCounsel, value || 0]
  );
  await logAudit(req.user.id, req.user.name, 'CREATE', 'Matters', `Created matter: ${title}`);
  res.json({ id });
});

app.put('/api/matters/:id', auth, async (req, res) => {
  const { title, clientId, clientName, practiceArea, status, assignedAdvocate, assignedAdvocateId,
          court, registry, filingDate, nextHearing, description, opposingParty, opposingCounsel, value } = req.body;
  await pool.execute(
    `UPDATE matters SET title=?,client_id=?,client_name=?,practice_area=?,status=?,assigned_advocate=?,assigned_advocate_id=?,
     court=?,registry=?,filing_date=?,next_hearing=?,description=?,opposing_party=?,opposing_counsel=?,value=? WHERE id=?`,
    [title, clientId, clientName, practiceArea, status, assignedAdvocate, assignedAdvocateId,
     court, registry, filingDate || null, nextHearing || null, description, opposingParty, opposingCounsel, value || 0, req.params.id]
  );
  await logAudit(req.user.id, req.user.name, 'UPDATE', 'Matters', `Updated matter: ${title}`);
  res.json({ success: true });
});

app.delete('/api/matters/:id', auth, async (req, res) => {
  const [rows] = await pool.execute('SELECT title FROM matters WHERE id=?', [req.params.id]);
  await pool.execute('DELETE FROM matters WHERE id=?', [req.params.id]);
  await logAudit(req.user.id, req.user.name, 'DELETE', 'Matters', `Deleted matter: ${rows[0]?.title}`);
  res.json({ success: true });
});

// ============================================================
// TASKS
// ============================================================

app.get('/api/tasks', auth, async (req, res) => {
  const [tasks] = await pool.execute('SELECT * FROM tasks ORDER BY created_at DESC');
  const [comments] = await pool.execute('SELECT * FROM task_comments ORDER BY date_posted ASC');

  const result = tasks.map(t => ({
    ...t,
    matterId: t.matter_id, matterNumber: t.matter_number,
    assignedTo: t.assigned_to, assignedToId: t.assigned_to_id,
    dueDate: t.due_date, createdAt: t.created_at,
    comments: comments
      .filter(c => c.task_id === t.id)
      .map(c => ({ author: c.author, text: c.text_body, date: c.date_posted })),
  }));
  res.json(result);
});

app.post('/api/tasks', auth, async (req, res) => {
  const { title, description, matterId, matterNumber, assignedTo, assignedToId, priority, status, dueDate } = req.body;
  const id = `t${uuidv4().replace(/-/g,'').slice(0,8)}`;
  await pool.execute(
    'INSERT INTO tasks (id,title,description,matter_id,matter_number,assigned_to,assigned_to_id,priority,status,due_date,created_at) VALUES (?,?,?,?,?,?,?,?,?,?,CURDATE())',
    [id, title, description, matterId || null, matterNumber || null, assignedTo, assignedToId, priority, status || 'pending', dueDate || null]
  );
  await logAudit(req.user.id, req.user.name, 'CREATE', 'Tasks', `Created task: ${title}`);
  res.json({ id });
});

app.put('/api/tasks/:id', auth, async (req, res) => {
  const { title, description, assignedTo, assignedToId, priority, status, dueDate } = req.body;
  await pool.execute(
    'UPDATE tasks SET title=?,description=?,assigned_to=?,assigned_to_id=?,priority=?,status=?,due_date=? WHERE id=?',
    [title, description, assignedTo, assignedToId, priority, status, dueDate || null, req.params.id]
  );
  await logAudit(req.user.id, req.user.name, 'UPDATE', 'Tasks', `Updated task: ${title}`);
  res.json({ success: true });
});

app.delete('/api/tasks/:id', auth, async (req, res) => {
  await pool.execute('DELETE FROM tasks WHERE id=?', [req.params.id]);
  await logAudit(req.user.id, req.user.name, 'DELETE', 'Tasks', `Deleted task ${req.params.id}`);
  res.json({ success: true });
});

app.post('/api/tasks/:id/comments', auth, async (req, res) => {
  const { text } = req.body;
  await pool.execute(
    'INSERT INTO task_comments (task_id, author, text_body, date_posted) VALUES (?,?,?,CURDATE())',
    [req.params.id, req.user.name, text]
  );
  res.json({ success: true });
});

// ============================================================
// CALENDAR EVENTS
// ============================================================

app.get('/api/events', auth, async (req, res) => {
  const [events] = await pool.execute('SELECT * FROM calendar_events ORDER BY event_date ASC');
  const [attendees] = await pool.execute('SELECT * FROM event_attendees');

  const result = events.map(e => ({
    ...e, id: e.id, title: e.title, type: e.type, date: e.event_date,
    time: e.start_time, endTime: e.end_time, matterId: e.matter_id, matterNumber: e.matter_number,
    attendees: attendees.filter(a => a.event_id === e.id).map(a => a.attendee),
  }));
  res.json(result);
});

app.post('/api/events', auth, async (req, res) => {
  const { title, type, date, time, endTime, matterId, matterNumber, location, description, attendees, color } = req.body;
  const id = `e${uuidv4().replace(/-/g,'').slice(0,8)}`;
  await pool.execute(
    'INSERT INTO calendar_events (id,title,type,event_date,start_time,end_time,matter_id,matter_number,location,description,color) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
    [id, title, type, date, time, endTime, matterId || null, matterNumber || null, location, description, color || '#3b82f6']
  );
  if (attendees?.length) {
    for (const a of attendees) {
      await pool.execute('INSERT INTO event_attendees (event_id, attendee) VALUES (?,?)', [id, a]);
    }
  }
  await logAudit(req.user.id, req.user.name, 'CREATE', 'Calendar', `Created event: ${title}`);
  res.json({ id });
});

app.put('/api/events/:id', auth, async (req, res) => {
  const { title, type, date, time, endTime, location, description, color } = req.body;
  await pool.execute(
    'UPDATE calendar_events SET title=?,type=?,event_date=?,start_time=?,end_time=?,location=?,description=?,color=? WHERE id=?',
    [title, type, date, time, endTime, location, description, color, req.params.id]
  );
  await logAudit(req.user.id, req.user.name, 'UPDATE', 'Calendar', `Updated event: ${title}`);
  res.json({ success: true });
});

app.delete('/api/events/:id', auth, async (req, res) => {
  await pool.execute('DELETE FROM calendar_events WHERE id=?', [req.params.id]);
  await logAudit(req.user.id, req.user.name, 'DELETE', 'Calendar', `Deleted event ${req.params.id}`);
  res.json({ success: true });
});

// ============================================================
// DOCUMENTS
// ============================================================

app.get('/api/documents', auth, async (req, res) => {
  const [docs] = await pool.execute('SELECT * FROM documents ORDER BY uploaded_at DESC');
  const [tags] = await pool.execute('SELECT * FROM document_tags');

  const result = docs.map(d => ({
    ...d, matterId: d.matter_id, matterNumber: d.matter_number,
    clientId: d.client_id, clientName: d.client_name,
    uploadedBy: d.uploaded_by, uploadedAt: d.uploaded_at, accessLevel: d.access_level,
    tags: tags.filter(t => t.document_id === d.id).map(t => t.tag),
  }));
  res.json(result);
});

app.post('/api/documents', auth, async (req, res) => {
  const { name, type, size, matterId, matterNumber, clientId, clientName, tags, accessLevel, category } = req.body;
  const id = `d${uuidv4().replace(/-/g,'').slice(0,8)}`;
  await pool.execute(
    'INSERT INTO documents (id,name,type,size,matter_id,matter_number,client_id,client_name,uploaded_by,uploaded_at,version,access_level,category) VALUES (?,?,?,?,?,?,?,?,?,CURDATE(),1,?,?)',
    [id, name, type || 'pdf', size || '0 KB', matterId || null, matterNumber || null, clientId || null, clientName || null, req.user.name, accessLevel || 'team', category || 'other']
  );
  if (tags?.length) {
    for (const tag of tags) {
      await pool.execute('INSERT INTO document_tags (document_id, tag) VALUES (?,?)', [id, tag]);
    }
  }
  await logAudit(req.user.id, req.user.name, 'CREATE', 'Documents', `Uploaded document: ${name}`);
  res.json({ id });
});

app.delete('/api/documents/:id', auth, async (req, res) => {
  const [rows] = await pool.execute('SELECT name FROM documents WHERE id=?', [req.params.id]);
  await pool.execute('DELETE FROM documents WHERE id=?', [req.params.id]);
  await logAudit(req.user.id, req.user.name, 'DELETE', 'Documents', `Deleted document: ${rows[0]?.name}`);
  res.json({ success: true });
});

// Document upload endpoint
app.post('/api/documents/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { matterId, matterNumber, clientId, clientName, tags, accessLevel, category } = req.body;
    const id = `d${uuidv4().replace(/-/g,'').slice(0,8)}`;
    const fileName = req.file.originalname;
    const fileType = req.file.mimetype.split('/')[1];
    const fileSize = `${(req.file.size / 1024).toFixed(2)} KB`;

    await pool.execute(
      'INSERT INTO documents (id,name,type,size,matter_id,matter_number,client_id,client_name,uploaded_by,uploaded_at,version,access_level,category) VALUES (?,?,?,?,?,?,?,?,?,CURDATE(),1,?,?)',
      [id, fileName, fileType, fileSize, matterId || null, matterNumber || null, clientId || null, clientName || null, req.user.name, accessLevel || 'team', category || 'other']
    );

    if (tags?.length) {
      const tagArray = Array.isArray(tags) ? tags : [tags];
      for (const tag of tagArray) {
        await pool.execute('INSERT INTO document_tags (document_id, tag) VALUES (?,?)', [id, tag]);
      }
    }

    await logAudit(req.user.id, req.user.name, 'UPLOAD', 'Documents', `Uploaded document: ${fileName}`);
    res.json({ id, message: 'Document uploaded successfully' });
  } catch (error) {
    console.error('Document upload error:', error);
    res.status(500).json({ error: 'Failed to upload document' });
  }
});

// Document download endpoint
app.get('/api/documents/:id/download', auth, async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM documents WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const document = rows[0];
    res.json({
      message: 'Document download endpoint ready',
      document: {
        id: document.id,
        name: document.name,
        type: document.type,
        size: document.size,
        uploadedAt: document.uploaded_at
      }
    });
  } catch (error) {
    console.error('Document download error:', error);
    res.status(500).json({ error: 'Failed to download document' });
  }
});

// ============================================================
// INVOICES
// ============================================================

app.get('/api/invoices', auth, async (req, res) => {
  const [invs] = await pool.execute('SELECT * FROM invoices ORDER BY issued_date DESC');
  const [items] = await pool.execute('SELECT * FROM invoice_items');

  const result = invs.map(i => ({
    ...i, invoiceNumber: i.invoice_number, matterId: i.matter_id, matterNumber: i.matter_number,
    clientId: i.client_id, clientName: i.client_name, dueDate: i.due_date, issuedDate: i.issued_date,
    items: items.filter(x => x.invoice_id === i.id).map(x => ({
      description: x.description, hours: parseFloat(x.hours), rate: parseFloat(x.rate), amount: parseFloat(x.amount)
    })),
  }));
  res.json(result);
});

app.post('/api/invoices', auth, async (req, res) => {
  const { invoiceNumber, matterId, matterNumber, clientId, clientName, amount, status, dueDate, issuedDate, items, tax, discount } = req.body;
  const id = `i${uuidv4().replace(/-/g,'').slice(0,8)}`;
  await pool.execute(
    'INSERT INTO invoices (id,invoice_number,matter_id,matter_number,client_id,client_name,amount,paid,status,due_date,issued_date,tax,discount) VALUES (?,?,?,?,?,?,?,0,?,?,?,?,?)',
    [id, invoiceNumber, matterId, matterNumber, clientId, clientName, amount || 0, status || 'draft', dueDate || null, issuedDate || null, tax || 0, discount || 0]
  );
  if (items?.length) {
    for (const item of items) {
      await pool.execute(
        'INSERT INTO invoice_items (invoice_id, description, hours, rate, amount) VALUES (?,?,?,?,?)',
        [id, item.description, item.hours, item.rate, item.amount]
      );
    }
  }
  await logAudit(req.user.id, req.user.name, 'CREATE', 'Billing', `Created invoice: ${invoiceNumber}`);
  res.json({ id });
});

app.put('/api/invoices/:id', auth, async (req, res) => {
  const { status, paid } = req.body;
  await pool.execute('UPDATE invoices SET status=?, paid=? WHERE id=?', [status, paid, req.params.id]);
  await logAudit(req.user.id, req.user.name, 'UPDATE', 'Billing', `Updated invoice ${req.params.id}`);
  res.json({ success: true });
});

app.delete('/api/invoices/:id', auth, async (req, res) => {
  await pool.execute('DELETE FROM invoices WHERE id=?', [req.params.id]);
  await logAudit(req.user.id, req.user.name, 'DELETE', 'Billing', `Deleted invoice ${req.params.id}`);
  res.json({ success: true });
});

// ============================================================
// TIME ENTRIES
// ============================================================

app.get('/api/time-entries', auth, async (req, res) => {
  const [rows] = await pool.execute('SELECT * FROM time_entries ORDER BY entry_date DESC');
  res.json(rows.map(r => ({
    ...r, matterId: r.matter_id, matterNumber: r.matter_number,
    userId: r.user_id, userName: r.user_name, date: r.entry_date,
  })));
});

app.post('/api/time-entries', auth, async (req, res) => {
  const { matterId, matterNumber, hours, description, billable, rate, date } = req.body;
  const id = `te${uuidv4().replace(/-/g,'').slice(0,8)}`;
  await pool.execute(
    'INSERT INTO time_entries (id,matter_id,matter_number,user_id,user_name,entry_date,hours,description,billable,rate,status) VALUES (?,?,?,?,?,?,?,?,?,?,\'pending\')',
    [id, matterId, matterNumber, req.user.id, req.user.name, date || new Date().toISOString().split('T')[0], hours, description, billable, rate || 0]
  );
  await logAudit(req.user.id, req.user.name, 'CREATE', 'TimeTracking', `Logged ${hours}h on ${matterNumber}`);
  res.json({ id });
});

app.put('/api/time-entries/:id', auth, async (req, res) => {
  const { hours, description, billable, rate, status } = req.body;
  await pool.execute(
    'UPDATE time_entries SET hours=?,description=?,billable=?,rate=?,status=? WHERE id=?',
    [hours, description, billable, rate, status, req.params.id]
  );
  res.json({ success: true });
});

app.delete('/api/time-entries/:id', auth, async (req, res) => {
  await pool.execute('DELETE FROM time_entries WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

// ============================================================
// NOTIFICATIONS
// ============================================================

app.get('/api/notifications', auth, async (req, res) => {
  const [rows] = await pool.execute(
    'SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50'
  );
  res.json(rows.map(r => ({ ...r, read: !!r.is_read, createdAt: r.created_at })));
});

app.put('/api/notifications/:id/read', auth, async (req, res) => {
  await pool.execute('UPDATE notifications SET is_read=1 WHERE id=?', [req.params.id]);
  res.json({ success: true });
});

app.put('/api/notifications/read-all', auth, async (req, res) => {
  await pool.execute('UPDATE notifications SET is_read=1');
  res.json({ success: true });
});

// ============================================================
// USERS (admin only)
// ============================================================

app.get('/api/users', auth, async (req, res) => {
  const [rows] = await pool.execute('SELECT id,email,name,role,title,avatar,billing_rate,phone,is_active FROM users');
  res.json(rows.map(r => ({
    ...r, billingRate: parseFloat(r.billing_rate), isActive: !!r.is_active,
    permissions: ROLE_PERMISSIONS[r.role] || [],
  })));
});

app.post('/api/users', auth, async (req, res) => {
  const { email, name, role, title, avatar, billingRate, phone, password } = req.body;
  const id = uuidv4();
  const hash = await bcrypt.hash(password || 'password123', 10);
  await pool.execute(
    'INSERT INTO users (id,email,password_hash,name,role,title,avatar,billing_rate,phone) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, email, hash, name, role, title, avatar, billingRate || 0, phone]
  );
  await logAudit(req.user.id, req.user.name, 'CREATE', 'Users', `Created user: ${name}`);
  res.json({ id });
});

app.put('/api/users/:id', auth, async (req, res) => {
  const { name, role, title, billingRate, phone, isActive } = req.body;
  await pool.execute(
    'UPDATE users SET name=?,role=?,title=?,billing_rate=?,phone=?,is_active=? WHERE id=?',
    [name, role, title, billingRate || 0, phone, isActive === false ? 0 : 1, req.params.id]
  );
  await logAudit(req.user.id, req.user.name, 'UPDATE', 'Users', `Updated user: ${name}`);
  res.json({ success: true });
});

// ============================================================
// FIRMS (Multi-Tenant Management)
// ============================================================

app.get('/api/firms', auth, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const [rows] = await pool.execute('SELECT * FROM firms ORDER BY created_at DESC');
  res.json(rows);
});

app.get('/api/firms/:id', auth, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    const [rows] = await pool.execute('SELECT * FROM firms WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Firm not found' });
    const [userRows] = await pool.execute('SELECT id FROM users WHERE id = ? AND firm_id = ?', [req.user.id, req.params.id]);
    if (!userRows.length && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Access denied' });
    }
  }
  const [rows] = await pool.execute('SELECT * FROM firms WHERE id = ?', [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Firm not found' });
  res.json(rows[0]);
});

app.post('/api/firms', auth, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({ error: 'Access denied' });
  }
  const { name, email, phone, address, currency, timezone } = req.body;
  const id = `firm_${uuidv4().replace(/-/g,'').slice(0,8)}`;
  await pool.execute(
    'INSERT INTO firms (id, name, email, phone, address, currency, timezone) VALUES (?,?,?,?,?,?,?)',
    [id, name, email, phone, address, currency || 'KES', timezone || 'Africa/Nairobi']
  );
  await logAudit(req.user.id, req.user.name, 'CREATE', 'Firms', `Created firm: ${name}`);
  res.json({ id, message: 'Firm created successfully' });
});

app.put('/api/firms/:id', auth, async (req, res) => {
  if (req.user.role !== 'super_admin') {
    const [userRows] = await pool.execute('SELECT id FROM users WHERE id = ? AND firm_id = ?', [req.user.id, req.params.id]);
    if (!userRows.length) return res.status(403).json({ error: 'Access denied' });
  }
  const { name, email, phone, address, currency, timezone } = req.body;
  await pool.execute(
    'UPDATE firms SET name=?, email=?, phone=?, address=?, currency=?, timezone=? WHERE id=?',
    [name, email, phone, address, currency, timezone, req.params.id]
  );
  await logAudit(req.user.id, req.user.name, 'UPDATE', 'Firms', `Updated firm: ${name}`);
  res.json({ success: true });
});

// ============================================================
// PLANS
// ============================================================

app.get('/api/plans', auth, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });
  const [rows] = await pool.execute('SELECT * FROM plans WHERE is_active = 1 ORDER BY price_monthly ASC');
  res.json(rows);
});

app.post('/api/plans', auth, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });
  const { name, description, price_monthly, price_annually, currency, features, limits } = req.body;
  const id = `plan_${uuidv4().replace(/-/g,'').slice(0,8)}`;
  await pool.execute(
    'INSERT INTO plans (id, name, description, price_monthly, price_annually, currency, features, limits) VALUES (?,?,?,?,?,?,?,?)',
    [id, name, description, price_monthly || 0, price_annually || 0, currency || 'KES', JSON.stringify(features || []), JSON.stringify(limits || {})]
  );
  await logAudit(req.user.id, req.user.name, 'CREATE', 'Plans', `Created plan: ${name}`);
  res.json({ id, message: 'Plan created successfully' });
});

// ============================================================
// SUBSCRIPTIONS
// ============================================================

app.get('/api/subscriptions', auth, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });
  const [rows] = await pool.execute(`
    SELECT s.*, f.name as firm_name, p.name as plan_name 
    FROM subscriptions s 
    JOIN firms f ON s.firm_id = f.id 
    JOIN plans p ON s.plan_id = p.id 
    ORDER BY s.created_at DESC
  `);
  res.json(rows);
});

app.get('/api/firms/:id/subscription', auth, async (req, res) => {
  const [userRows] = await pool.execute('SELECT id FROM users WHERE id = ? AND firm_id = ?', [req.user.id, req.params.id]);
  if (!userRows.length && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });
  const [rows] = await pool.execute(`
    SELECT s.*, f.name as firm_name, p.name as plan_name, p.features, p.limits
    FROM subscriptions s 
    JOIN firms f ON s.firm_id = f.id 
    JOIN plans p ON s.plan_id = p.id 
    WHERE s.firm_id = ? AND s.status IN ('trialing', 'active')
    ORDER BY s.created_at DESC LIMIT 1
  `, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'No active subscription found' });
  res.json(rows[0]);
});

app.post('/api/firms/:id/subscription', auth, async (req, res) => {
  const [userRows] = await pool.execute('SELECT id FROM users WHERE id = ? AND firm_id = ?', [req.user.id, req.params.id]);
  if (!userRows.length && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });
  const { plan_id } = req.body;
  const id = `sub_${uuidv4().replace(/-/g,'').slice(0,8)}`;
  const [planRows] = await pool.execute('SELECT * FROM plans WHERE id = ?', [plan_id]);
  if (!planRows.length) return res.status(404).json({ error: 'Plan not found' });
  const today = new Date();
  await pool.execute(
    'INSERT INTO subscriptions (id, firm_id, plan_id, status, trial_start_date, trial_end_date, billing_cycle_start, billing_cycle_end, next_billing_date) VALUES (?,?,?,?,?,?,?,?,?)',
    [id, req.params.id, plan_id, 'trialing', today, new Date(today.getTime() + 30*24*60*60*1000), today, new Date(today.getTime() + 30*24*60*60*1000), new Date(today.getTime() + 30*24*60*60*1000)]
  );
  await logAudit(req.user.id, req.user.name, 'CREATE', 'Subscriptions', `Created subscription for firm ${req.params.id}`);
  res.json({ id, message: 'Subscription created successfully' });
});

// ============================================================
// PAYMENTS
// ============================================================

app.get('/api/firms/:id/payments', auth, async (req, res) => {
  const [userRows] = await pool.execute('SELECT id FROM users WHERE id = ? AND firm_id = ?', [req.user.id, req.params.id]);
  if (!userRows.length && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });
  const [rows] = await pool.execute('SELECT * FROM payments WHERE firm_id = ? ORDER BY created_at DESC', [req.params.id]);
  res.json(rows);
});

app.post('/api/firms/:id/payments', auth, async (req, res) => {
  const [userRows] = await pool.execute('SELECT id FROM users WHERE id = ? AND firm_id = ?', [req.user.id, req.params.id]);
  if (!userRows.length && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });
  const { subscription_id, invoice_id, amount, payment_method, description } = req.body;
  const id = `pay_${uuidv4().replace(/-/g,'').slice(0,8)}`;
  await pool.execute(
    'INSERT INTO payments (id, firm_id, subscription_id, invoice_id, amount, payment_method, description) VALUES (?,?,?,?,?,?,?)',
    [id, req.params.id, subscription_id || null, invoice_id || null, amount, payment_method || 'mpesa', description || '']
  );
  await logAudit(req.user.id, req.user.name, 'CREATE', 'Payments', `Created payment of KES ${amount} for firm ${req.params.id}`);
  res.json({ id, message: 'Payment created successfully' });
});

// ============================================================
// USAGE METRICS
// ============================================================

app.get('/api/firms/:id/usage', auth, async (req, res) => {
  const [userRows] = await pool.execute('SELECT id FROM users WHERE id = ? AND firm_id = ?', [req.user.id, req.params.id]);
  if (!userRows.length && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });
  const currentPeriod = new Date().toISOString().slice(0, 7);
  const [rows] = await pool.execute('SELECT * FROM usage_metrics WHERE firm_id = ? AND billing_period = ?', [req.params.id, currentPeriod]);
  res.json(rows);
});

// ============================================================
// AUDIT LOGS
// ============================================================

app.get('/api/audit-logs', auth, async (req, res) => {
  if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });
  const [rows] = await pool.execute('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 200');
  res.json(rows.map(r => ({
    id: r.id.toString(), userId: r.user_id, userName: r.user_name,
    action: r.action, module: r.module, details: r.details,
    timestamp: r.created_at, ip: r.ip_address,
  })));
});

// ============================================================
// MERCY CHAT PROXY
// ============================================================
app.post('/api/mercy-chat', auth, async (req, res) => {
  const { message, history } = req.body;
  const reply = `Mercy says: I heard you say "${message}". (This AI feature is a stub.)`;
  res.json({ reply });
});

// ============================================================
// DASHBOARD STATS
// ============================================================

app.get('/api/dashboard/stats', auth, async (req, res) => {
  const [[{ totalClients }]] = await pool.execute('SELECT COUNT(*) AS totalClients FROM clients WHERE status="active"');
  const [[{ activeMatters }]] = await pool.execute('SELECT COUNT(*) AS activeMatters FROM matters WHERE status IN ("active","court")');
  const [[{ pendingTasks }]] = await pool.execute('SELECT COUNT(*) AS pendingTasks FROM tasks WHERE status IN ("pending","in_progress")');
  const [[{ monthlyRevenue }]] = await pool.execute('SELECT COALESCE(SUM(paid),0) AS monthlyRevenue FROM invoices WHERE MONTH(issued_date)=MONTH(CURDATE()) AND YEAR(issued_date)=YEAR(CURDATE())');
  const [[{ overdueInvoices }]] = await pool.execute('SELECT COUNT(*) AS overdueInvoices FROM invoices WHERE status="overdue"');
  const [[{ totalBillable }]] = await pool.execute('SELECT COALESCE(SUM(hours*rate),0) AS totalBillable FROM time_entries WHERE billable=1 AND status="approved"');

  res.json({ totalClients, activeMatters, pendingTasks, monthlyRevenue, overdueInvoices, totalBillable });
});

// ============================================================
// START SERVER
// ============================================================

app.listen(PORT, () => {
  console.log(`\n✅  NLF Server running on http://localhost:${PORT}`);
  console.log(`    Test: http://localhost:${PORT}/api/dashboard/stats\n`);
});