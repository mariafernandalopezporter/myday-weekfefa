import express from 'express';
import { createServer as createViteServer } from 'vite';
import { google } from 'googleapis';
import path from 'path';
import session from 'express-session';
import dotenv from 'dotenv';
import Database from 'better-sqlite3';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Database
const db_local = new Database('data.db');
db_local.pragma('journal_mode = WAL');

// Create tables if they don't exist
db_local.exec(`
  CREATE TABLE IF NOT EXISTS work_tasks (
    id TEXT PRIMARY KEY,
    date TEXT,
    task TEXT,
    category TEXT,
    deadline TEXT,
    priority TEXT,
    responsible TEXT,
    status TEXT,
    isUrgent INTEGER,
    isImportant INTEGER,
    description TEXT
  );
  
  CREATE TABLE IF NOT EXISTS fefa_tasks (
    id TEXT PRIMARY KEY,
    item TEXT,
    description TEXT,
    completed INTEGER,
    comments TEXT,
    completedAt TEXT
  );
  
  CREATE TABLE IF NOT EXISTS budget (
    id TEXT PRIMARY KEY,
    date TEXT,
    description TEXT,
    amount REAL,
    category TEXT,
    type TEXT
  );
  
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    date TEXT,
    name TEXT,
    startTime TEXT,
    endTime TEXT,
    isAllDay INTEGER,
    recurring TEXT,
    location TEXT
  );
`);

// Drop old ifn_data if it has the wrong columns (we detect this by checking if 'indicador' exists)
try {
  const tableInfo = db_local.pragma("table_info(ifn_data)");
  if (Array.isArray(tableInfo) && tableInfo.some((col: any) => col.name === 'indicador')) {
    console.log('Migrating ifn_data table...');
    db_local.exec('DROP TABLE ifn_data');
  }
} catch (e) {
  // Table might not exist yet, that's fine
}

db_local.exec(`
  CREATE TABLE IF NOT EXISTS ifn_data (
    id TEXT PRIMARY KEY,
    number TEXT,
    short_description TEXT,
    state TEXT,
    opened_at TEXT,
    priority TEXT,
    u_module TEXT,
    assigned_to TEXT,
    data_json TEXT
  );

  CREATE TABLE IF NOT EXISTS links_data (
    id TEXT PRIMARY KEY,
    nombre TEXT,
    link TEXT,
    descripcion TEXT,
    tipo TEXT,
    seccion TEXT,
    status TEXT
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// API Routes for Local Persistence
app.get('/api/config', (req, res) => {
  const webhookRow = db_local.prepare('SELECT value FROM config WHERE key = ?').get('webhook_url');
  const linksWebhookRow = db_local.prepare('SELECT value FROM config WHERE key = ?').get('links_webhook_url');
  const sheetRow = db_local.prepare('SELECT value FROM config WHERE key = ?').get('sheet_id');
  res.json({ 
    webhookUrl: webhookRow ? (webhookRow as any).value : '',
    linksWebhookUrl: linksWebhookRow ? (linksWebhookRow as any).value : 'https://script.google.com/macros/s/AKfycbxcF1hO4f1TAw2CfaTI6ORqX3rqugJSMw11REsuZc0egBKRStJ9lwu0mvy679zcatdSag/exec',
    sheetId: sheetRow ? (sheetRow as any).value : (process.env.GOOGLE_SHEET_ID || '1W6Y_gKXIxu3xTiiHbFiYffswasxXdEVmdG_JLq838T8')
  });
});

app.post('/api/config', (req, res) => {
  const { webhookUrl, linksWebhookUrl, sheetId } = req.body;
  if (webhookUrl !== undefined) {
    db_local.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run('webhook_url', webhookUrl);
  }
  if (linksWebhookUrl !== undefined) {
    db_local.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run('links_webhook_url', linksWebhookUrl);
  }
  if (sheetId !== undefined) {
    db_local.prepare('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)').run('sheet_id', sheetId);
  }
  res.json({ success: true });
});
app.use(session({
  secret: 'latam-focus-secret',
  resave: false,
  saveUninitialized: true,
  cookie: { 
    secure: true, 
    sameSite: 'none',
    httpOnly: true 
  }
}));

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  `${process.env.APP_URL}/auth/callback`
);

const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/userinfo.email'
];

// Auth Endpoints
app.get('/api/auth/url', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.json({ url });
});

app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code as string);
    (req.session as any).tokens = tokens;
    
    // Get user info to verify latam account
    oauth2Client.setCredentials(tokens);
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    (req.session as any).user = userInfo.data;

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS', user: ${JSON.stringify(userInfo.data)} }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. You can close this window.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/api/auth/status', (req, res) => {
  res.json({ 
    isAuthenticated: !!(req.session as any).tokens,
    user: (req.session as any).user || null
  });
});

app.post('/api/auth/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true });
  });
});

// Helper to get Sheet ID from DB or fallback
function getSpreadsheetId() {
  const row = db_local.prepare('SELECT value FROM config WHERE key = ?').get('sheet_id');
  return row ? (row as any).value : (process.env.GOOGLE_SHEET_ID || '1W6Y_gKXIxu3xTiiHbFiYffswasxXdEVmdG_JLq838T8');
}

async function getAuthClient(req: express.Request) {
  const tokens = (req.session as any).tokens;
  if (!tokens) throw new Error('Not authenticated');
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  client.setCredentials(tokens);
  return client;
}

app.get('/api/sheets/data', async (req, res) => {
  try {
    const authRequest = await getAuthClient(req);
    const sheets = google.sheets({ version: 'v4', auth: authRequest });
    const sheetId = getSpreadsheetId();
    
    // Fetch data from multiple sheets
    const ranges = ['Trabajo!A:J', 'Budget!A:F', 'Personal!A:F', 'Eventos!A:G'];
    const dataResponse = await sheets.spreadsheets.values.batchGet({
      spreadsheetId: sheetId,
      ranges,
    });

    res.json({
      values: dataResponse.data.valueRanges
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/sheets/sync', async (req, res) => {
  const { workTasks, fefaTasks, budget, importantEvents } = req.body;
  try {
    const authRequest = await getAuthClient(req);
    const sheets = google.sheets({ version: 'v4', auth: authRequest });
    const sheetId = getSpreadsheetId();

    // 1. Verificar y Crear Hojas si faltan
    const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const existingSheets = spreadsheet.data.sheets?.map(s => s.properties?.title) || [];
    
    const requiredSheets = ['Trabajo', 'Budget', 'Personal', 'Eventos', 'LOGS'];
    const missingSheets = requiredSheets.filter(s => !existingSheets.includes(s));

    if (missingSheets.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: {
          requests: missingSheets.map(title => ({
            addSheet: { properties: { title } }
          }))
        }
      });
    }

    // 2. Preparar Datos
    const data = [
      {
        range: 'Trabajo!A1:J',
        values: [
          ['Fecha', 'Tarea', 'Categoría', 'Deadline', 'Prioridad', 'Responsable', 'Estado', 'Urgente', 'Importante', 'Descripción'],
          ...workTasks.map((t: any) => [t.date || '', t.task || '', t.category || '', t.deadline || '', t.priority || '', t.responsible || '', t.status || '', t.isUrgent ? 'SÍ' : 'NO', t.isImportant ? 'SÍ' : 'NO', t.description || ''])
        ]
      },
      {
        range: 'Personal!A1:F',
        values: [
          ['Item', 'Descripción', 'Completado', 'Comentarios', 'Completado En', 'ID'],
          ...fefaTasks.map((t: any) => [t.item || '', t.description || '', t.completed ? 'SÍ' : 'NO', t.comments || '', t.completedAt || '', t.id || ''])
        ]
      },
      {
        range: 'Budget!A1:F',
        values: [
          ['Fecha', 'Descripción', 'Monto', 'Categoría', 'Tipo', 'ID'],
          ...budget.map((b: any) => [b.date || '', b.description || '', b.amount || 0, b.category || '', b.type || '', b.id || ''])
        ]
      },
      {
        range: 'Eventos!A1:G',
        values: [
          ['Fecha', 'Nombre', 'Inicio', 'Fin', 'Día Completo', 'Recurrencia', 'Ubicación'],
          ...importantEvents.map((e: any) => [e.date || '', e.name || '', e.startTime || '', e.endTime || '', e.isAllDay ? 'SÍ' : 'NO', e.recurring || '', e.location || ''])
        ]
      }
    ];

    // 3. Batch Update de Valores
    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        valueInputOption: 'RAW',
        data
      },
    });

    // 4. Registrar Log (Como en tu script)
    const userEmail = (req.session as any).user?.email || 'Sistema';
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'LOGS!A:F',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[new Date().toISOString(), 'GLOBAL', 'SYNC_APP', userEmail, 'BATCH_UPDATE', `Sincronizados ${workTasks.length} tareas Latam`]]
      }
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('Sync error details:', error.response?.data || error.message);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint para ver los logs desde la app
app.get('/api/sheets/logs', async (req, res) => {
  try {
    const authRequest = await getAuthClient(req);
    const sheets = google.sheets({ version: 'v4', auth: authRequest });
    const sheetId = getSpreadsheetId();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'LOGS!A:F',
    });
    
    res.json({ logs: response.data.values || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.toString() });
  }
});

// Endpoint para emular el doPost(e) de tu script
app.post('/api/webhook', async (req, res) => {
  const data = req.body;
  try {
    const authRequest = await getAuthClient(req);
    const sheets = google.sheets({ version: 'v4', auth: authRequest });
    const sheetId = getSpreadsheetId();
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'LOGS!A:F',
      valueInputOption: 'RAW',
      requestBody: {
        values: [[data.time || new Date().toISOString(), data.reg || 'N/A', data.area || 'N/A', data.user || 'External', data.action || 'API_CALL', JSON.stringify(data.extra || {})]]
      }
    });
    
    res.json({ status: "success" });
  } catch (err: any) {
    res.status(500).json({ status: "error", message: err.toString() });
  }
});

// Calendar Logic
app.get('/api/calendar/events', async (req, res) => {
  try {
    const authRequest = await getAuthClient(req);
    const calendar = google.calendar({ version: 'v3', auth: authRequest });
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: new Date().toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    });
    res.json(response.data.items);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API Routes for Local Persistence
app.get('/api/data/load', (req, res) => {
  try {
    const workTasks = db_local.prepare('SELECT * FROM work_tasks').all();
    const fefaTasks = db_local.prepare('SELECT * FROM fefa_tasks').all();
    const budget = db_local.prepare('SELECT * FROM budget').all();
    const events = db_local.prepare('SELECT * FROM events').all();
    const ifnRaw = db_local.prepare('SELECT * FROM ifn_data').all();
    const links = db_local.prepare('SELECT * FROM links_data').all();
    const ifn = ifnRaw.map((r: any) => {
      try {
        if (r.data_json) return JSON.parse(r.data_json);
        return r;
      } catch (e) {
        return r;
      }
    });

    res.json({
      workTasks: workTasks.map((t: any) => ({ ...t, isUrgent: !!t.isUrgent, isImportant: !!t.isImportant })),
      fefaTasks: fefaTasks.map((t: any) => ({ ...t, completed: !!t.completed })),
      budget,
      importantEvents: events.map((e: any) => ({ ...e, isAllDay: !!e.isAllDay })),
      ifnData: ifn,
      linkData: links
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/data/save', async (req, res) => {
  const { workTasks, fefaTasks, budget, importantEvents, ifnData, linkData } = req.body;
  
  const transaction = db_local.transaction(() => {
    db_local.prepare('DELETE FROM work_tasks').run();
    db_local.prepare('DELETE FROM fefa_tasks').run();
    db_local.prepare('DELETE FROM budget').run();
    db_local.prepare('DELETE FROM events').run();
    db_local.prepare('DELETE FROM ifn_data').run();
    db_local.prepare('DELETE FROM links_data').run();

    const insertWork = db_local.prepare(`
      INSERT INTO work_tasks (id, date, task, category, deadline, priority, responsible, status, isUrgent, isImportant, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    workTasks.forEach((t: any) => insertWork.run(t.id, t.date, t.task, t.category, t.deadline, t.priority, t.responsible, t.status, t.isUrgent ? 1 : 0, t.isImportant ? 1 : 0, t.description));

    const insertFefa = db_local.prepare(`
      INSERT INTO fefa_tasks (id, item, description, completed, comments, completedAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    fefaTasks.forEach((t: any) => insertFefa.run(t.id, t.item, t.description, t.completed ? 1 : 0, t.comments, t.completedAt));

    const insertBudget = db_local.prepare(`
      INSERT INTO budget (id, date, description, amount, category, type)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    budget.forEach((b: any) => insertBudget.run(b.id, b.date, b.description, b.amount, b.category, b.type));

    const insertEvent = db_local.prepare(`
      INSERT INTO events (id, date, name, startTime, endTime, isAllDay, recurring, location)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    importantEvents.forEach((e: any) => insertEvent.run(e.id, e.date, e.name, e.startTime, e.endTime, e.isAllDay ? 1 : 0, e.recurring, e.location));

    const insertIFN = db_local.prepare(`
      INSERT INTO ifn_data (id, number, short_description, state, opened_at, priority, u_module, assigned_to, data_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    if (ifnData && Array.isArray(ifnData)) {
      ifnData.forEach((i: any) => {
        insertIFN.run(
          i.id, 
          i.number || '', 
          i.short_description || '', 
          i.state || '', 
          i.opened_at || '', 
          i.priority || '', 
          i.u_module || '', 
          i.assigned_to || '', 
          JSON.stringify(i)
        );
      });
    }

    const insertLink = db_local.prepare(`
      INSERT INTO links_data (id, nombre, link, descripcion, tipo, seccion, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    if (linkData && Array.isArray(linkData)) {
      linkData.forEach((l: any) => {
        insertLink.run(l.id || Math.random().toString(36).substr(2, 9), l.nombre || '', l.link || '', l.descripcion || '', l.tipo || '', l.seccion || '', l.status || '');
      });
    }
  });

  try {
    transaction();
    
    // Background Sync to Webhook (if configured)
    const webhookRow = db_local.prepare('SELECT value FROM config WHERE key = ?').get('webhook_url');
    if (webhookRow) {
      const webhookUrl = (webhookRow as any).value;
      if (webhookUrl && webhookUrl.startsWith('http')) {
        console.log('Starting background sync to:', webhookUrl);
        axios.post(webhookUrl, {
          workTasks,
          fefaTasks,
          budget,
          importantEvents,
          ifnData,
          user: 'Regional System',
          timestamp: new Date().toISOString()
        }, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 60000 // Aumentado a 60s para Google Apps Script
        }).then((response) => {
          console.log('Sync exitoso a Google Sheets:', response.status);
        }).catch(err => {
          console.error('Error de sincronización:', err.message);
          if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', err.response.data);
          }
        });
      }
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const buildPath = path.join(process.cwd(), 'build');
    app.use(express.static(buildPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(buildPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
