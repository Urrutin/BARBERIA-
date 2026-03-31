// BarberBooks — Backend Node.js + Express + SQLite
// Instalar: npm install
// Correr:   node server.js

const express = require('express');
const Database = require('better-sqlite3');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

/* ── MIDDLEWARE ─────────────────────────────────────── */
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public'))); // sirve el frontend

/* ── BASE DE DATOS SQLite ───────────────────────────── */
const db = new Database(path.join(__dirname, 'barberbooks.db'));

// Crear tablas si no existen
db.exec(`
  CREATE TABLE IF NOT EXISTS records (
    id          TEXT PRIMARY KEY,
    type        TEXT NOT NULL CHECK(type IN ('income','expense')),
    amount      REAL NOT NULL CHECK(amount > 0),
    date        TEXT NOT NULL,
    description TEXT NOT NULL,
    category    TEXT NOT NULL,
    extra       TEXT DEFAULT '',
    notes       TEXT DEFAULT '',
    created_at  TEXT DEFAULT (datetime('now')),
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_date ON records(date);
  CREATE INDEX IF NOT EXISTS idx_type ON records(type);
`);

/* ── HELPERS ────────────────────────────────────────── */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function validateRecord(body) {
  const errors = [];
  if (!body.type || !['income','expense'].includes(body.type)) errors.push('Tipo inválido (income/expense)');
  if (!body.amount || isNaN(body.amount) || Number(body.amount) <= 0) errors.push('Monto debe ser un número positivo');
  if (!body.date || !/^\d{4}-\d{2}-\d{2}$/.test(body.date)) errors.push('Fecha inválida (formato YYYY-MM-DD)');
  if (!body.description || body.description.trim().length < 2) errors.push('Descripción requerida (mínimo 2 caracteres)');
  if (!body.category || body.category.trim().length < 1) errors.push('Categoría requerida');
  return errors;
}

/* ── RUTAS ──────────────────────────────────────────── */

// GET /api/records — listar con filtros opcionales
app.get('/api/records', (req, res) => {
  try {
    const { type, from, to, search, limit = 500, offset = 0 } = req.query;

    let sql = 'SELECT * FROM records WHERE 1=1';
    const params = [];

    if (type && ['income','expense'].includes(type)) { sql += ' AND type = ?'; params.push(type); }
    if (from)   { sql += ' AND date >= ?'; params.push(from); }
    if (to)     { sql += ' AND date <= ?'; params.push(to); }
    if (search) {
      sql += ' AND (description LIKE ? OR category LIKE ? OR extra LIKE ?)';
      const q = `%${search}%`;
      params.push(q, q, q);
    }

    sql += ' ORDER BY date DESC, created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), Number(offset));

    const records = db.prepare(sql).all(...params);

    // Totales para el período filtrado (sin limit/offset)
    let countSql = 'SELECT COUNT(*) as total, SUM(CASE WHEN type="income" THEN amount ELSE 0 END) as total_income, SUM(CASE WHEN type="expense" THEN amount ELSE 0 END) as total_expense FROM records WHERE 1=1';
    const countParams = params.slice(0, -2); // quitar limit y offset
    const summary = db.prepare(countSql + (type ? ' AND type = ?' : '') + (from ? ' AND date >= ?' : '') + (to ? ' AND date <= ?' : '') + (search ? ' AND (description LIKE ? OR category LIKE ? OR extra LIKE ?)' : '')).get(...countParams);

    res.json({ ok: true, data: records, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al obtener registros' });
  }
});

// GET /api/records/:id — obtener uno
app.get('/api/records/:id', (req, res) => {
  try {
    const record = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);
    if (!record) return res.status(404).json({ ok: false, error: 'Registro no encontrado' });
    res.json({ ok: true, data: record });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Error al obtener registro' });
  }
});

// POST /api/records — crear
app.post('/api/records', (req, res) => {
  try {
    const errors = validateRecord(req.body);
    if (errors.length) return res.status(400).json({ ok: false, errors });

    const id = generateId();
    const { type, amount, date, description, category, extra = '', notes = '' } = req.body;

    db.prepare(`
      INSERT INTO records (id, type, amount, date, description, category, extra, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, type, Number(amount), date, description.trim(), category.trim(), extra.trim(), notes.trim());

    const record = db.prepare('SELECT * FROM records WHERE id = ?').get(id);
    res.status(201).json({ ok: true, data: record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al crear registro' });
  }
});

// PUT /api/records/:id — actualizar
app.put('/api/records/:id', (req, res) => {
  try {
    const existing = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ ok: false, error: 'Registro no encontrado' });

    const merged = { ...existing, ...req.body };
    const errors = validateRecord(merged);
    if (errors.length) return res.status(400).json({ ok: false, errors });

    const { type, amount, date, description, category, extra = '', notes = '' } = merged;

    db.prepare(`
      UPDATE records SET type=?, amount=?, date=?, description=?, category=?, extra=?, notes=?, updated_at=datetime('now')
      WHERE id=?
    `).run(type, Number(amount), date, description.trim(), category.trim(), extra.trim(), notes.trim(), req.params.id);

    const updated = db.prepare('SELECT * FROM records WHERE id = ?').get(req.params.id);
    res.json({ ok: true, data: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al actualizar registro' });
  }
});

// DELETE /api/records/:id — eliminar
app.delete('/api/records/:id', (req, res) => {
  try {
    const result = db.prepare('DELETE FROM records WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ ok: false, error: 'Registro no encontrado' });
    res.json({ ok: true, message: 'Registro eliminado' });
  } catch (err) {
    res.status(500).json({ ok: false, error: 'Error al eliminar registro' });
  }
});

// GET /api/stats — estadísticas del dashboard
app.get('/api/stats', (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const monthStart = today.slice(0, 7) + '-01';

    const overall = db.prepare(`
      SELECT
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as total_expense,
        COUNT(*) as total_records
      FROM records
    `).get();

    const todayStats = db.prepare(`
      SELECT
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as today_income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as today_expense,
        COUNT(*) as today_count
      FROM records WHERE date = ?
    `).get(today);

    const monthStats = db.prepare(`
      SELECT
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as month_income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as month_expense
      FROM records WHERE date >= ?
    `).get(monthStart);

    // Últimos 7 días por día
    const last7 = db.prepare(`
      SELECT date,
        SUM(CASE WHEN type='income' THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
      FROM records
      WHERE date >= date('now', '-6 days')
      GROUP BY date ORDER BY date ASC
    `).all();

    // Categorías de gastos
    const expenseByCategory = db.prepare(`
      SELECT category, SUM(amount) as total FROM records
      WHERE type='expense' GROUP BY category ORDER BY total DESC
    `).all();

    res.json({ ok: true, data: { overall, today: todayStats, month: monthStats, last7, expenseByCategory } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: 'Error al obtener estadísticas' });
  }
});

// Ruta catch-all → servir frontend SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

/* ── INICIO ─────────────────────────────────────────── */
app.listen(PORT, () => {
  console.log(`\n✂  BarberBooks corriendo en http://localhost:${PORT}\n`);
});

module.exports = app;
