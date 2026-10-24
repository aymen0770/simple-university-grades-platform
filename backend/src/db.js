import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';

const dbFile = process.env.DATABASE_FILE || './data/university.sqlite';
fs.mkdirSync(path.dirname(path.resolve(dbFile)), { recursive: true });
export const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 name TEXT NOT NULL,
 email TEXT NOT NULL UNIQUE COLLATE NOCASE,
 password_hash TEXT NOT NULL,
 role TEXT NOT NULL CHECK(role IN ('admin','teacher','student')),
 student_number TEXT UNIQUE,
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS courses (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 code TEXT NOT NULL UNIQUE,
 name TEXT NOT NULL,
 semester TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS course_teachers (
 course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
 teacher_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 PRIMARY KEY(course_id, teacher_id)
);
CREATE TABLE IF NOT EXISTS enrollments (
 course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
 student_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 PRIMARY KEY(course_id, student_id)
);
CREATE TABLE IF NOT EXISTS grades (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 course_id INTEGER NOT NULL REFERENCES courses(id),
 student_id INTEGER NOT NULL REFERENCES users(id),
 teacher_id INTEGER NOT NULL REFERENCES users(id),
 assessment TEXT NOT NULL,
 score REAL NOT NULL CHECK(score >= 0),
 max_score REAL NOT NULL CHECK(max_score > 0),
 note TEXT NOT NULL DEFAULT '',
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
 updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`);

const count = db.prepare("SELECT COUNT(*) AS n FROM users WHERE role='admin'").get().n;
if (count === 0) {
 const name = process.env.ADMIN_NAME || 'University Administrator';
 const email = process.env.ADMIN_EMAIL || 'admin@university.local';
 const password = process.env.ADMIN_PASSWORD || 'ChangeMe123!';
 const hash = bcrypt.hashSync(password, 12);
 db.prepare('INSERT INTO users(name,email,password_hash,role) VALUES(?,?,?,?)').run(name,email,hash,'admin');
 console.log(`Seeded demo admin: ${email} (change password in .env before real use)`);
}
