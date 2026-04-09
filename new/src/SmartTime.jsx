import { useState, useEffect, useCallback, useRef } from "react";

// ─── DATABASE LAYER (IndexedDB) ───────────────────────────────────────────────
const DB_NAME = "SmartTimeDB";
const DB_VERSION = 1;
const STORES = ["teachers", "subjects", "classes", "rooms", "timetables", "settings"];

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      STORES.forEach((s) => {
        if (!db.objectStoreNames.contains(s)) {
          db.createObjectStore(s, { keyPath: "id", autoIncrement: true });
        }
      });
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function dbGetAll(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readonly");
    const req = tx.objectStore(store).getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbAdd(store, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).add({ ...data, createdAt: Date.now() });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbDelete(store, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function dbClear(store) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).clear();
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

async function dbPut(store, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, "readwrite");
    const req = tx.objectStore(store).put(data);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ─── SCHEDULING ENGINE ─────────────────────────────────────────────────────────
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const PERIODS = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];

function generateTimetable(teachers, subjects, classes, rooms) {
  // slots[day][period] = { classId, teacherId, subjectId, roomId } | null
  const slots = {};
  DAYS.forEach((d) => {
    slots[d] = {};
    PERIODS.forEach((p) => { slots[d][p] = null; });
  });

  // Per-class schedule
  const classSchedules = {};
  classes.forEach((c) => {
    classSchedules[c.id] = {};
    DAYS.forEach((d) => {
      classSchedules[c.id][d] = {};
      PERIODS.forEach((p) => { classSchedules[c.id][d][p] = null; });
    });
  });

  const teacherOccupied = {}; // teacherId -> Set of "day-period"
  const roomOccupied = {};    // roomId -> Set of "day-period"
  const classOccupied = {};   // classId -> Set of "day-period"

  teachers.forEach((t) => (teacherOccupied[t.id] = new Set()));
  rooms.forEach((r) => (roomOccupied[r.id] = new Set()));
  classes.forEach((c) => (classOccupied[c.id] = new Set()));

  const errors = [];
  const assignments = [];

  // Build subject demand: for each class, schedule subjects per week
  for (const cls of classes) {
    const subjectIds = cls.subjects || [];
    for (const subjectId of subjectIds) {
      const subject = subjects.find((s) => s.id === subjectId);
      if (!subject) continue;

      const periodsPerWeek = parseInt(subject.periodsPerWeek) || 3;
      const eligibleTeachers = teachers.filter(
        (t) => t.subjects && t.subjects.includes(subjectId)
      );

      if (eligibleTeachers.length === 0) {
        errors.push(`No teacher available for "${subject.name}" in class "${cls.name}"`);
        continue;
      }

      let scheduled = 0;
      let attempts = 0;

      while (scheduled < periodsPerWeek && attempts < 200) {
        attempts++;
        const day = DAYS[Math.floor(Math.random() * DAYS.length)];
        const period = PERIODS[Math.floor(Math.random() * PERIODS.length)];
        const key = `${day}-${period}`;

        if (classOccupied[cls.id]?.has(key)) continue;

        // Pick a free teacher
        const freeTeacher = eligibleTeachers.find((t) => !teacherOccupied[t.id]?.has(key));
        if (!freeTeacher) continue;

        // Pick a free room
        const freeRoom = rooms.find((r) => !roomOccupied[r.id]?.has(key));
        if (!freeRoom) continue;

        // Assign
        teacherOccupied[freeTeacher.id].add(key);
        roomOccupied[freeRoom.id].add(key);
        classOccupied[cls.id].add(key);

        classSchedules[cls.id][day][period] = {
          subjectId,
          subjectName: subject.name,
          teacherId: freeTeacher.id,
          teacherName: freeTeacher.name,
          roomId: freeRoom.id,
          roomName: freeRoom.name,
          classId: cls.id,
          className: cls.name,
        };

        assignments.push({ day, period, classId: cls.id, subjectName: subject.name });
        scheduled++;
      }

      if (scheduled < periodsPerWeek) {
        errors.push(
          `Only scheduled ${scheduled}/${periodsPerWeek} periods for "${subject.name}" in "${cls.name}"`
        );
      }
    }
  }

  return { classSchedules, errors, totalAssignments: assignments.length };
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #0a0e1a;
    --surface: #111827;
    --surface2: #1a2235;
    --border: #1e2d45;
    --accent: #00d4aa;
    --accent2: #4f8ef7;
    --accent3: #f7c94f;
    --danger: #ff5757;
    --text: #e8edf5;
    --muted: #6b7a99;
    --font-head: 'Syne', sans-serif;
    --font-mono: 'Space Mono', monospace;
    --radius: 12px;
    --shadow: 0 8px 32px rgba(0,0,0,0.4);
  }

  body { background: var(--bg); color: var(--text); font-family: var(--font-head); min-height: 100vh; }

  .app { display: flex; min-height: 100vh; }

  /* SIDEBAR */
  .sidebar {
    width: 240px; min-width: 240px; background: var(--surface);
    border-right: 1px solid var(--border); display: flex; flex-direction: column;
    padding: 0; position: sticky; top: 0; height: 100vh; overflow-y: auto;
    z-index: 10;
  }
  .sidebar-logo {
    padding: 28px 24px 20px;
    border-bottom: 1px solid var(--border);
  }
  .logo-mark {
    font-family: var(--font-mono); font-size: 11px; color: var(--accent);
    letter-spacing: 4px; text-transform: uppercase; margin-bottom: 4px;
  }
  .logo-name {
    font-family: var(--font-head); font-size: 22px; font-weight: 800;
    color: var(--text); letter-spacing: -0.5px;
  }
  .logo-sub { font-size: 11px; color: var(--muted); margin-top: 2px; }

  .nav { padding: 16px 12px; flex: 1; }
  .nav-section { margin-bottom: 24px; }
  .nav-label {
    font-size: 10px; font-family: var(--font-mono); color: var(--muted);
    letter-spacing: 3px; text-transform: uppercase; padding: 0 12px; margin-bottom: 8px;
  }
  .nav-item {
    display: flex; align-items: center; gap: 10px; padding: 10px 12px;
    border-radius: 8px; cursor: pointer; transition: all 0.15s;
    color: var(--muted); font-size: 14px; font-weight: 600; user-select: none;
    border: 1px solid transparent;
  }
  .nav-item:hover { background: var(--surface2); color: var(--text); }
  .nav-item.active {
    background: rgba(0,212,170,0.1); color: var(--accent);
    border-color: rgba(0,212,170,0.2);
  }
  .nav-icon { font-size: 16px; width: 20px; text-align: center; }

  .sidebar-footer {
    padding: 16px 24px; border-top: 1px solid var(--border);
    font-size: 11px; color: var(--muted); font-family: var(--font-mono);
  }

  /* MAIN */
  .main { flex: 1; display: flex; flex-direction: column; overflow: hidden; }

  .topbar {
    background: var(--surface); border-bottom: 1px solid var(--border);
    padding: 18px 32px; display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 5;
  }
  .page-title { font-size: 20px; font-weight: 800; color: var(--text); }
  .page-subtitle { font-size: 12px; color: var(--muted); margin-top: 2px; font-family: var(--font-mono); }
  .topbar-actions { display: flex; gap: 10px; }

  .content { padding: 32px; flex: 1; overflow-y: auto; }

  /* CARDS */
  .card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 24px;
    box-shadow: var(--shadow);
  }
  .card-title {
    font-size: 15px; font-weight: 700; color: var(--text);
    margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
  }

  /* GRID */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }
  .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }

  /* STAT CARDS */
  .stat-card {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: var(--radius); padding: 20px 24px;
    position: relative; overflow: hidden;
  }
  .stat-card::before {
    content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  }
  .stat-card.green::before { background: var(--accent); }
  .stat-card.blue::before { background: var(--accent2); }
  .stat-card.yellow::before { background: var(--accent3); }
  .stat-card.red::before { background: var(--danger); }
  .stat-value { font-size: 36px; font-weight: 800; line-height: 1; margin-bottom: 6px; font-family: var(--font-mono); }
  .stat-card.green .stat-value { color: var(--accent); }
  .stat-card.blue .stat-value { color: var(--accent2); }
  .stat-card.yellow .stat-value { color: var(--accent3); }
  .stat-card.red .stat-value { color: var(--danger); }
  .stat-label { font-size: 12px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }

  /* BUTTONS */
  .btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 18px; border-radius: 8px; border: none;
    font-family: var(--font-head); font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all 0.15s; white-space: nowrap;
  }
  .btn-primary { background: var(--accent); color: #000; }
  .btn-primary:hover { background: #00b894; transform: translateY(-1px); }
  .btn-secondary {
    background: transparent; color: var(--text);
    border: 1px solid var(--border);
  }
  .btn-secondary:hover { background: var(--surface2); border-color: var(--accent); color: var(--accent); }
  .btn-danger { background: transparent; color: var(--danger); border: 1px solid rgba(255,87,87,0.3); }
  .btn-danger:hover { background: rgba(255,87,87,0.1); }
  .btn-blue { background: var(--accent2); color: #fff; }
  .btn-blue:hover { background: #3a7de8; transform: translateY(-1px); }
  .btn-sm { padding: 6px 12px; font-size: 12px; }
  .btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }

  /* FORMS */
  .form-group { margin-bottom: 16px; }
  .form-label { font-size: 12px; font-weight: 700; color: var(--muted); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px; display: block; }
  .form-input, .form-select {
    width: 100%; padding: 10px 14px; background: var(--bg);
    border: 1px solid var(--border); border-radius: 8px;
    color: var(--text); font-family: var(--font-head); font-size: 14px;
    transition: border-color 0.15s; outline: none;
  }
  .form-input:focus, .form-select:focus { border-color: var(--accent); box-shadow: 0 0 0 3px rgba(0,212,170,0.1); }
  .form-select option { background: var(--surface); }

  /* TAG INPUT */
  .tag-container {
    display: flex; flex-wrap: wrap; gap: 6px; padding: 8px;
    background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
    min-height: 44px; cursor: text;
  }
  .tag {
    display: inline-flex; align-items: center; gap: 4px;
    background: rgba(0,212,170,0.15); color: var(--accent);
    border: 1px solid rgba(0,212,170,0.3); border-radius: 4px;
    padding: 3px 8px; font-size: 12px; font-weight: 600;
  }
  .tag-remove { cursor: pointer; opacity: 0.7; }
  .tag-remove:hover { opacity: 1; }

  /* TABLE */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    font-size: 11px; font-family: var(--font-mono); color: var(--muted);
    text-transform: uppercase; letter-spacing: 2px; padding: 12px 16px;
    border-bottom: 1px solid var(--border); text-align: left; white-space: nowrap;
  }
  tbody tr { border-bottom: 1px solid var(--border); transition: background 0.1s; }
  tbody tr:hover { background: var(--surface2); }
  tbody td { padding: 12px 16px; font-size: 14px; }
  .td-muted { color: var(--muted); font-size: 12px; }

  /* BADGE */
  .badge {
    display: inline-block; padding: 2px 8px; border-radius: 4px;
    font-size: 11px; font-weight: 700; font-family: var(--font-mono);
  }
  .badge-green { background: rgba(0,212,170,0.15); color: var(--accent); }
  .badge-blue { background: rgba(79,142,247,0.15); color: var(--accent2); }
  .badge-yellow { background: rgba(247,201,79,0.15); color: var(--accent3); }
  .badge-red { background: rgba(255,87,87,0.15); color: var(--danger); }

  /* TIMETABLE GRID */
  .tt-wrap { overflow-x: auto; }
  .tt-grid {
    display: grid; gap: 2px;
    background: var(--border); border-radius: var(--radius); overflow: hidden;
    min-width: 700px;
  }
  .tt-header {
    background: var(--surface2); padding: 10px 16px;
    font-size: 11px; font-family: var(--font-mono); color: var(--muted);
    text-transform: uppercase; letter-spacing: 2px; text-align: center;
  }
  .tt-time {
    background: var(--surface); padding: 10px 12px;
    font-size: 11px; font-family: var(--font-mono); color: var(--accent);
    display: flex; align-items: center; justify-content: center;
  }
  .tt-cell {
    background: var(--surface); padding: 10px 12px; min-height: 72px;
    display: flex; flex-direction: column; justify-content: center;
    font-size: 12px; transition: background 0.15s;
  }
  .tt-cell:hover { background: var(--surface2); }
  .tt-cell.filled {
    background: rgba(0,212,170,0.06); border-left: 3px solid var(--accent);
  }
  .tt-cell.filled:hover { background: rgba(0,212,170,0.12); }
  .tt-subject { font-weight: 700; color: var(--text); margin-bottom: 3px; font-size: 13px; }
  .tt-teacher { color: var(--accent2); font-size: 11px; }
  .tt-room { color: var(--muted); font-size: 11px; }
  .tt-empty { color: var(--border); font-size: 11px; text-align: center; font-family: var(--font-mono); }

  /* MODAL */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 100; backdrop-filter: blur(4px);
    animation: fadeIn 0.15s ease;
  }
  .modal {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 16px; padding: 32px; width: 480px; max-width: 95vw;
    box-shadow: 0 24px 64px rgba(0,0,0,0.6);
    animation: slideUp 0.2s ease;
  }
  .modal-title { font-size: 18px; font-weight: 800; margin-bottom: 24px; }
  .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; }

  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }

  /* ALERTS */
  .alert {
    padding: 12px 16px; border-radius: 8px; font-size: 13px;
    display: flex; gap: 10px; align-items: flex-start; margin-bottom: 12px;
  }
  .alert-error { background: rgba(255,87,87,0.1); border: 1px solid rgba(255,87,87,0.2); color: var(--danger); }
  .alert-success { background: rgba(0,212,170,0.1); border: 1px solid rgba(0,212,170,0.2); color: var(--accent); }
  .alert-warn { background: rgba(247,201,79,0.1); border: 1px solid rgba(247,201,79,0.2); color: var(--accent3); }

  /* EMPTY STATE */
  .empty-state { text-align: center; padding: 48px 24px; color: var(--muted); }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
  .empty-title { font-size: 16px; font-weight: 700; color: var(--text); margin-bottom: 8px; }
  .empty-desc { font-size: 13px; }

  /* MULTI SELECT */
  .multi-select {
    background: var(--bg); border: 1px solid var(--border); border-radius: 8px;
    max-height: 160px; overflow-y: auto; padding: 4px;
  }
  .multi-option {
    padding: 8px 12px; border-radius: 6px; cursor: pointer;
    display: flex; align-items: center; gap: 8px; font-size: 13px;
    transition: background 0.1s;
  }
  .multi-option:hover { background: var(--surface2); }
  .multi-option.selected { background: rgba(0,212,170,0.1); color: var(--accent); }
  .check { width: 16px; height: 16px; border: 2px solid var(--border); border-radius: 4px; flex-shrink: 0; display:flex; align-items:center; justify-content:center; font-size:10px;}
  .multi-option.selected .check { background: var(--accent); border-color: var(--accent); color:#000; }

  /* PRINT */
  @media print {
    .sidebar, .topbar, .topbar-actions, .btn, .nav { display: none !important; }
    .content { padding: 0; }
    .tt-grid { background: #eee; }
  }

  /* SCROLLBAR */
  ::-webkit-scrollbar { width: 6px; height: 6px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
  ::-webkit-scrollbar-thumb:hover { background: var(--muted); }

  .divider { height: 1px; background: var(--border); margin: 20px 0; }
  .flex { display: flex; }
  .flex-col { flex-direction: column; }
  .items-center { align-items: center; }
  .justify-between { justify-content: space-between; }
  .gap-2 { gap: 8px; }
  .gap-3 { gap: 12px; }
  .mb-4 { margin-bottom: 16px; }
  .mb-6 { margin-bottom: 24px; }
  .mt-4 { margin-top: 16px; }
  .text-accent { color: var(--accent); }
  .text-muted { color: var(--muted); font-size: 13px; }
  .spinner {
    width: 20px; height: 20px; border: 2px solid rgba(0,212,170,0.3);
    border-top-color: var(--accent); border-radius: 50%;
    animation: spin 0.6s linear infinite; display: inline-block;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  .tab-bar {
    display: flex; gap: 4px; background: var(--surface2);
    padding: 4px; border-radius: 10px; margin-bottom: 24px;
  }
  .tab {
    flex: 1; padding: 8px 12px; border-radius: 7px; border: none;
    font-family: var(--font-head); font-size: 13px; font-weight: 700;
    cursor: pointer; transition: all 0.15s; color: var(--muted); background: transparent;
  }
  .tab.active { background: var(--surface); color: var(--text); box-shadow: 0 2px 8px rgba(0,0,0,0.3); }
  .tab:hover:not(.active) { color: var(--text); }
`;

// ─── MULTI SELECT COMPONENT ────────────────────────────────────────────────────
function MultiSelect({ options, selected, onChange, placeholder }) {
  return (
    <div className="multi-select">
      {options.length === 0 && (
        <div style={{ padding: "12px", color: "var(--muted)", fontSize: "13px", textAlign: "center" }}>
          No options available
        </div>
      )}
      {options.map((opt) => {
        const isSelected = selected.includes(opt.id);
        return (
          <div
            key={opt.id}
            className={`multi-option ${isSelected ? "selected" : ""}`}
            onClick={() => {
              if (isSelected) onChange(selected.filter((id) => id !== opt.id));
              else onChange([...selected, opt.id]);
            }}
          >
            <div className="check">{isSelected ? "✓" : ""}</div>
            {opt.name}
          </div>
        );
      })}
    </div>
  );
}

// ─── MODAL ─────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children, footer }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="flex items-center justify-between mb-4">
          <div className="modal-title">{title}</div>
          <button className="btn btn-secondary btn-sm" onClick={onClose}>✕</button>
        </div>
        {children}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─── PAGES ────────────────────────────────────────────────────────────────────

// DASHBOARD
function Dashboard({ teachers, subjects, classes, rooms, timetables }) {
  const lastTT = timetables[timetables.length - 1];
  return (
    <div>
      <div className="grid-4 mb-6">
        <div className="stat-card green">
          <div className="stat-value">{teachers.length}</div>
          <div className="stat-label">Teachers</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-value">{subjects.length}</div>
          <div className="stat-label">Subjects</div>
        </div>
        <div className="stat-card yellow">
          <div className="stat-value">{classes.length}</div>
          <div className="stat-label">Classes</div>
        </div>
        <div className="stat-card red">
          <div className="stat-value">{rooms.length}</div>
          <div className="stat-label">Rooms</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-title">🚀 Quick Start</div>
          <div style={{ color: "var(--muted)", fontSize: "13px", lineHeight: "1.8" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                ["1", "Add Subjects", subjects.length > 0],
                ["2", "Add Teachers & assign subjects", teachers.length > 0],
                ["3", "Add Classrooms / Rooms", rooms.length > 0],
                ["4", "Add Classes & assign subjects", classes.length > 0],
                ["5", "Generate Timetable!", timetables.length > 0],
              ].map(([n, text, done]) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                    background: done ? "var(--accent)" : "var(--surface2)",
                    color: done ? "#000" : "var(--muted)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "11px", fontWeight: 700,
                  }}>{done ? "✓" : n}</div>
                  <span style={{ color: done ? "var(--text)" : "var(--muted)" }}>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-title">📊 System Status</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[
              ["Total Timetables Generated", timetables.length, "badge-blue"],
              ["Scheduling Periods / Day", PERIODS.length, "badge-green"],
              ["Working Days / Week", DAYS.length, "badge-yellow"],
              ["Last Generated", lastTT ? new Date(lastTT.createdAt).toLocaleDateString() : "—", "badge-red"],
            ].map(([label, value, badge]) => (
              <div key={label} className="flex items-center justify-between">
                <span style={{ color: "var(--muted)", fontSize: "13px" }}>{label}</span>
                <span className={`badge ${badge}`}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// GENERIC CRUD LIST
function EntityPage({ title, icon, description, items, onAdd, onDelete, renderForm, renderRow, columns }) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  const handleSubmit = async () => {
    await onAdd(formData);
    setFormData({});
    setShowModal(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div style={{ color: "var(--muted)", fontSize: "13px" }}>{description}</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add {title.slice(0, -1)}
        </button>
      </div>

      <div className="card">
        {items.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">{icon}</div>
            <div className="empty-title">No {title} yet</div>
            <div className="empty-desc">Click "Add {title.slice(0, -1)}" to get started</div>
          </div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  {columns.map((c) => <th key={c}>{c}</th>)}
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    {renderRow(item)}
                    <td>
                      <button className="btn btn-danger btn-sm" onClick={() => onDelete(item.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <Modal
          title={`Add ${title.slice(0, -1)}`}
          onClose={() => { setShowModal(false); setFormData({}); }}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => { setShowModal(false); setFormData({}); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit}>Add</button>
            </>
          }
        >
          {renderForm(formData, setFormData)}
        </Modal>
      )}
    </div>
  );
}

// TIMETABLE VIEW
function TimetableView({ timetables, classes, onGenerate, generating }) {
  const [selectedTT, setSelectedTT] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);

  useEffect(() => {
    if (timetables.length > 0) setSelectedTT(timetables[timetables.length - 1]);
  }, [timetables]);

  useEffect(() => {
    if (classes.length > 0 && !selectedClass) setSelectedClass(classes[0]);
  }, [classes]);

  const schedule = selectedTT && selectedClass
    ? selectedTT.data.classSchedules?.[selectedClass.id]
    : null;

  const cols = PERIODS.length + 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-6" style={{ flexWrap: "wrap", gap: "12px" }}>
        <div className="flex gap-2" style={{ flexWrap: "wrap" }}>
          {classes.map((c) => (
            <button
              key={c.id}
              className={`btn btn-sm ${selectedClass?.id === c.id ? "btn-primary" : "btn-secondary"}`}
              onClick={() => setSelectedClass(c)}
            >
              {c.name}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {timetables.length > 1 && (
            <select
              className="form-select"
              style={{ width: "auto" }}
              value={selectedTT?.id || ""}
              onChange={(e) => setSelectedTT(timetables.find((t) => t.id === parseInt(e.target.value)))}
            >
              {timetables.map((t, i) => (
                <option key={t.id} value={t.id}>
                  Version {i + 1} — {new Date(t.createdAt).toLocaleString()}
                </option>
              ))}
            </select>
          )}
          <button className="btn btn-primary" onClick={onGenerate} disabled={generating}>
            {generating ? <><span className="spinner" /> Generating…</> : "⚡ Generate"}
          </button>
          {selectedTT && (
            <button className="btn btn-secondary" onClick={() => window.print()}>🖨 Print</button>
          )}
        </div>
      </div>

      {selectedTT && selectedTT.data.errors?.length > 0 && (
        <div className="mb-4">
          {selectedTT.data.errors.map((e, i) => (
            <div key={i} className="alert alert-warn">⚠ {e}</div>
          ))}
        </div>
      )}

      {!selectedTT ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">📅</div>
            <div className="empty-title">No timetable generated yet</div>
            <div className="empty-desc">Click "⚡ Generate" to create a conflict-free timetable</div>
          </div>
        </div>
      ) : !selectedClass ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-icon">🏫</div>
            <div className="empty-title">No classes added</div>
            <div className="empty-desc">Add classes first before generating a timetable</div>
          </div>
        </div>
      ) : (
        <div className="card" style={{ padding: "0" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)" }}>
            <div style={{ fontWeight: 700, fontSize: "15px" }}>{selectedClass.name} — Weekly Schedule</div>
            <div style={{ color: "var(--muted)", fontSize: "12px", marginTop: "2px", fontFamily: "var(--font-mono)" }}>
              {selectedTT.data.totalAssignments} total assignments
            </div>
          </div>
          <div className="tt-wrap" style={{ padding: "16px" }}>
            <div
              className="tt-grid"
              style={{ gridTemplateColumns: `80px repeat(${DAYS.length}, 1fr)` }}
            >
              <div className="tt-header" />
              {DAYS.map((d) => (
                <div key={d} className="tt-header">{d}</div>
              ))}
              {PERIODS.map((period) => (
                <>
                  <div key={`t-${period}`} className="tt-time">{period}</div>
                  {DAYS.map((day) => {
                    const cell = schedule?.[day]?.[period];
                    return (
                      <div key={`${day}-${period}`} className={`tt-cell ${cell ? "filled" : ""}`}>
                        {cell ? (
                          <>
                            <div className="tt-subject">{cell.subjectName}</div>
                            <div className="tt-teacher">👤 {cell.teacherName}</div>
                            <div className="tt-room">📍 {cell.roomName}</div>
                          </>
                        ) : (
                          <div className="tt-empty">—</div>
                        )}
                      </div>
                    );
                  })}
                </>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("dashboard");
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [classes, setClasses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [timetables, setTimetables] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    const [t, s, c, r, tt] = await Promise.all([
      dbGetAll("teachers"), dbGetAll("subjects"), dbGetAll("classes"),
      dbGetAll("rooms"), dbGetAll("timetables"),
    ]);
    setTeachers(t); setSubjects(s); setClasses(c); setRooms(r); setTimetables(tt);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleGenerate = async () => {
    if (classes.length === 0) { showToast("Add at least one class first", "error"); return; }
    if (subjects.length === 0) { showToast("Add subjects first", "error"); return; }
    if (teachers.length === 0) { showToast("Add teachers first", "error"); return; }
    if (rooms.length === 0) { showToast("Add rooms first", "error"); return; }

    setGenerating(true);
    await new Promise((r) => setTimeout(r, 600)); // UX delay

    const result = generateTimetable(teachers, subjects, classes, rooms);
    const id = await dbAdd("timetables", { data: result });
    await load();
    setGenerating(false);
    setPage("timetable");
    showToast(`Timetable generated! ${result.totalAssignments} periods scheduled.`);
  };

  const nav = [
    { id: "dashboard", icon: "⬛", label: "Dashboard" },
    { id: "subjects", icon: "📚", label: "Subjects" },
    { id: "teachers", icon: "👤", label: "Teachers" },
    { id: "rooms", icon: "🏛", label: "Rooms" },
    { id: "classes", icon: "🏫", label: "Classes" },
    { id: "timetable", icon: "📅", label: "Timetable" },
  ];

  const pageTitles = {
    dashboard: ["Dashboard", "System overview"],
    subjects: ["Subjects", "Manage course subjects"],
    teachers: ["Teachers", "Manage staff & assignments"],
    rooms: ["Rooms", "Manage classrooms & labs"],
    classes: ["Classes", "Manage student groups"],
    timetable: ["Timetable", "Generate & view schedules"],
  };

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">v2.0</div>
            <div className="logo-name">SMART-TIME</div>
            <div className="logo-sub">Intelligent Scheduler</div>
          </div>
          <nav className="nav">
            <div className="nav-section">
              <div className="nav-label">Navigation</div>
              {nav.map((n) => (
                <div
                  key={n.id}
                  className={`nav-item ${page === n.id ? "active" : ""}`}
                  onClick={() => setPage(n.id)}
                >
                  <span className="nav-icon">{n.icon}</span>
                  {n.label}
                </div>
              ))}
            </div>
            <div className="nav-section">
              <div className="nav-label">Actions</div>
              <div className="nav-item" onClick={handleGenerate}>
                <span className="nav-icon">⚡</span>
                Generate Timetable
              </div>
            </div>
          </nav>
          <div className="sidebar-footer">SMART-TIME © 2025</div>
        </aside>

        <div className="main">
          <div className="topbar">
            <div>
              <div className="page-title">{pageTitles[page]?.[0]}</div>
              <div className="page-subtitle">{pageTitles[page]?.[1]}</div>
            </div>
            <div className="topbar-actions">
              <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                {generating ? <><span className="spinner" /> Generating…</> : "⚡ Generate Timetable"}
              </button>
            </div>
          </div>

          <div className="content">
            {toast && (
              <div
                className={`alert ${toast.type === "error" ? "alert-error" : "alert-success"}`}
                style={{ marginBottom: "20px" }}
              >
                {toast.type === "error" ? "✖" : "✔"} {toast.msg}
              </div>
            )}

            {page === "dashboard" && (
              <Dashboard
                teachers={teachers} subjects={subjects}
                classes={classes} rooms={rooms} timetables={timetables}
              />
            )}

            {page === "subjects" && (
              <EntityPage
                title="Subjects" icon="📚"
                description="Define subjects and how many periods per week each requires"
                items={subjects}
                onAdd={async (d) => {
                  if (!d.name) return;
                  await dbAdd("subjects", { name: d.name, periodsPerWeek: d.periodsPerWeek || 3, color: d.color || "#00d4aa" });
                  await load();
                  showToast("Subject added");
                }}
                onDelete={async (id) => { await dbDelete("subjects", id); await load(); showToast("Subject deleted"); }}
                columns={["Name", "Periods/Week"]}
                renderRow={(s) => (
                  <>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: s.color || "var(--accent)" }} />
                        {s.name}
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{s.periodsPerWeek}</span></td>
                  </>
                )}
                renderForm={(d, setD) => (
                  <>
                    <div className="form-group">
                      <label className="form-label">Subject Name</label>
                      <input className="form-input" placeholder="e.g. Mathematics"
                        value={d.name || ""} onChange={(e) => setD({ ...d, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Periods Per Week</label>
                      <input className="form-input" type="number" min={1} max={10}
                        value={d.periodsPerWeek || 3} onChange={(e) => setD({ ...d, periodsPerWeek: parseInt(e.target.value) })} />
                    </div>
                  </>
                )}
              />
            )}

            {page === "teachers" && (
              <EntityPage
                title="Teachers" icon="👤"
                description="Add teachers and assign which subjects they can teach"
                items={teachers}
                onAdd={async (d) => {
                  if (!d.name) return;
                  await dbAdd("teachers", { name: d.name, email: d.email || "", subjects: d.subjects || [] });
                  await load();
                  showToast("Teacher added");
                }}
                onDelete={async (id) => { await dbDelete("teachers", id); await load(); showToast("Teacher deleted"); }}
                columns={["Name", "Email", "Subjects"]}
                renderRow={(t) => (
                  <>
                    <td style={{ fontWeight: 600 }}>{t.name}</td>
                    <td className="td-muted">{t.email || "—"}</td>
                    <td>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {(t.subjects || []).map((sid) => {
                          const s = subjects.find((s) => s.id === sid);
                          return s ? <span key={sid} className="badge badge-green">{s.name}</span> : null;
                        })}
                        {(t.subjects || []).length === 0 && <span className="td-muted">None</span>}
                      </div>
                    </td>
                  </>
                )}
                renderForm={(d, setD) => (
                  <>
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input className="form-input" placeholder="e.g. Dr. Jane Smith"
                        value={d.name || ""} onChange={(e) => setD({ ...d, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email (optional)</label>
                      <input className="form-input" placeholder="jane@school.edu" type="email"
                        value={d.email || ""} onChange={(e) => setD({ ...d, email: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subjects They Can Teach</label>
                      <MultiSelect
                        options={subjects}
                        selected={d.subjects || []}
                        onChange={(v) => setD({ ...d, subjects: v })}
                      />
                    </div>
                  </>
                )}
              />
            )}

            {page === "rooms" && (
              <EntityPage
                title="Rooms" icon="🏛"
                description="Add classrooms, labs, and auditoriums"
                items={rooms}
                onAdd={async (d) => {
                  if (!d.name) return;
                  await dbAdd("rooms", { name: d.name, type: d.type || "Classroom", capacity: d.capacity || 30 });
                  await load();
                  showToast("Room added");
                }}
                onDelete={async (id) => { await dbDelete("rooms", id); await load(); showToast("Room deleted"); }}
                columns={["Name", "Type", "Capacity"]}
                renderRow={(r) => (
                  <>
                    <td style={{ fontWeight: 600 }}>{r.name}</td>
                    <td><span className="badge badge-yellow">{r.type}</span></td>
                    <td className="td-muted">{r.capacity}</td>
                  </>
                )}
                renderForm={(d, setD) => (
                  <>
                    <div className="form-group">
                      <label className="form-label">Room Name / Number</label>
                      <input className="form-input" placeholder="e.g. Room 101 or Lab A"
                        value={d.name || ""} onChange={(e) => setD({ ...d, name: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Type</label>
                      <select className="form-select" value={d.type || "Classroom"}
                        onChange={(e) => setD({ ...d, type: e.target.value })}>
                        <option>Classroom</option>
                        <option>Laboratory</option>
                        <option>Auditorium</option>
                        <option>Seminar Room</option>
                        <option>Computer Lab</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Capacity</label>
                      <input className="form-input" type="number" min={1}
                        value={d.capacity || 30} onChange={(e) => setD({ ...d, capacity: parseInt(e.target.value) })} />
                    </div>
                  </>
                )}
              />
            )}

            {page === "classes" && (
              <EntityPage
                title="Classes" icon="🏫"
                description="Add student groups and assign subjects they need"
                items={classes}
                onAdd={async (d) => {
                  if (!d.name) return;
                  await dbAdd("classes", { name: d.name, grade: d.grade || "", students: d.students || 30, subjects: d.subjects || [] });
                  await load();
                  showToast("Class added");
                }}
                onDelete={async (id) => { await dbDelete("classes", id); await load(); showToast("Class deleted"); }}
                columns={["Name", "Grade", "Students", "Subjects"]}
                renderRow={(c) => (
                  <>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td className="td-muted">{c.grade || "—"}</td>
                    <td className="td-muted">{c.students}</td>
                    <td>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {(c.subjects || []).map((sid) => {
                          const s = subjects.find((s) => s.id === sid);
                          return s ? <span key={sid} className="badge badge-blue">{s.name}</span> : null;
                        })}
                        {(c.subjects || []).length === 0 && <span className="td-muted">None</span>}
                      </div>
                    </td>
                  </>
                )}
                renderForm={(d, setD) => (
                  <>
                    <div className="form-group">
                      <label className="form-label">Class Name</label>
                      <input className="form-input" placeholder="e.g. 10-A or CS-Year2"
                        value={d.name || ""} onChange={(e) => setD({ ...d, name: e.target.value })} />
                    </div>
                    <div className="grid-2">
                      <div className="form-group">
                        <label className="form-label">Grade / Year</label>
                        <input className="form-input" placeholder="e.g. Grade 10"
                          value={d.grade || ""} onChange={(e) => setD({ ...d, grade: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">No. of Students</label>
                        <input className="form-input" type="number" min={1}
                          value={d.students || 30} onChange={(e) => setD({ ...d, students: parseInt(e.target.value) })} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Subjects Required</label>
                      <MultiSelect
                        options={subjects}
                        selected={d.subjects || []}
                        onChange={(v) => setD({ ...d, subjects: v })}
                      />
                    </div>
                  </>
                )}
              />
            )}

            {page === "timetable" && (
              <TimetableView
                timetables={timetables} classes={classes}
                onGenerate={handleGenerate} generating={generating}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
