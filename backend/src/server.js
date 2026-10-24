import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { auditGrade } from './audit.js';

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173' }));
app.use(express.json({ limit: '50kb' }));

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.includes('replace-this')) {
  console.warn('WARNING: Set a strong unique JWT_SECRET in backend/.env before real use.');
}

function auth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  try {
    if (!token) throw new Error('Missing token');
    req.user = jwt.verify(token, JWT_SECRET || 'development-only-secret');
    next();
  } catch { res.status(401).json({ error: 'يرجى تسجيل الدخول من جديد.' }); }
}
const only = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'ليس لديك صلاحية لتنفيذ هذه العملية.' });
const safeUser = u => ({ id: u.id, name: u.name, email: u.email, role: u.role, studentNumber: u.student_number || null });

app.get('/api/health', (_req,res) => res.json({ ok:true }));
app.post('/api/auth/login', (req,res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') return res.status(400).json({ error:'أدخل البريد وكلمة المرور.' });
  const user = db.prepare('SELECT * FROM users WHERE email=?').get(email.trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) return res.status(401).json({ error:'بيانات الدخول غير صحيحة.' });
  const token = jwt.sign({ id:user.id, role:user.role, email:user.email }, JWT_SECRET || 'development-only-secret', { expiresIn:'4h' });
  res.json({ token, user:safeUser(user) });
});
app.get('/api/me', auth, (req,res) => {
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(req.user.id);
  if (!user) return res.status(401).json({ error:'الحساب غير موجود.' });
  res.json({ user:safeUser(user) });
});

// Admin creates all accounts; there is deliberately no public registration.
app.post('/api/admin/users', auth, only('admin'), (req,res) => {
  const { name, email, password, role, studentNumber } = req.body || {};
  if (!name?.trim() || !email?.trim() || typeof password !== 'string' || password.length < 10 || !['teacher','student','admin'].includes(role))
    return res.status(400).json({ error:'تحقق من الاسم والبريد والدور. كلمة المرور يجب أن تكون 10 أحرف على الأقل.' });
  try {
    const info = db.prepare('INSERT INTO users(name,email,password_hash,role,student_number) VALUES(?,?,?,?,?)')
      .run(name.trim(), email.trim(), bcrypt.hashSync(password,12), role, role === 'student' ? (studentNumber?.trim() || null) : null);
    res.status(201).json({ user:safeUser(db.prepare('SELECT * FROM users WHERE id=?').get(info.lastInsertRowid)) });
  } catch (e) { res.status(400).json({ error: e.message.includes('UNIQUE') ? 'البريد أو رقم الطالب مستخدم مسبقًا.' : 'تعذر إنشاء الحساب.' }); }
});
app.get('/api/admin/users', auth, only('admin'), (_req,res) => {
  res.json({ users: db.prepare('SELECT id,name,email,role,student_number FROM users ORDER BY role,name').all().map(safeUser) });
});
app.post('/api/admin/courses', auth, only('admin'), (req,res) => {
  const { code, name, semester } = req.body || {};
  if (!code?.trim() || !name?.trim() || !semester?.trim()) return res.status(400).json({error:'أدخل رمز المادة واسمها والفصل الدراسي.'});
  try {
    const result = db.prepare('INSERT INTO courses(code,name,semester) VALUES(?,?,?)').run(code.trim(),name.trim(),semester.trim());
    res.status(201).json({ course: db.prepare('SELECT * FROM courses WHERE id=?').get(result.lastInsertRowid) });
  } catch { res.status(400).json({error:'رمز المادة مستخدم مسبقًا.'}); }
});
app.get('/api/courses', auth, (req,res) => {
  let courses;
  if (req.user.role === 'admin') courses = db.prepare('SELECT * FROM courses ORDER BY code').all();
  else if (req.user.role === 'teacher') courses = db.prepare('SELECT c.* FROM courses c JOIN course_teachers t ON t.course_id=c.id WHERE t.teacher_id=? ORDER BY c.code').all(req.user.id);
  else courses = db.prepare('SELECT c.* FROM courses c JOIN enrollments e ON e.course_id=c.id WHERE e.student_id=? ORDER BY c.code').all(req.user.id);
  res.json({courses});
});
app.post('/api/admin/courses/:id/teachers', auth, only('admin'), (req,res) => {
  const teacherId = Number(req.body?.teacherId), courseId = Number(req.params.id);
  const teacher = db.prepare("SELECT id FROM users WHERE id=? AND role='teacher'").get(teacherId);
  const course = db.prepare('SELECT id FROM courses WHERE id=?').get(courseId);
  if (!teacher || !course) return res.status(400).json({error:'تحقق من رقم الأستاذ والمادة.'});
  db.prepare('INSERT OR IGNORE INTO course_teachers(course_id,teacher_id) VALUES(?,?)').run(courseId,teacherId);
  res.json({ok:true});
});
app.post('/api/admin/courses/:id/students', auth, only('admin'), (req,res) => {
  const studentId = Number(req.body?.studentId), courseId = Number(req.params.id);
  const student = db.prepare("SELECT id FROM users WHERE id=? AND role='student'").get(studentId);
  const course = db.prepare('SELECT id FROM courses WHERE id=?').get(courseId);
  if (!student || !course) return res.status(400).json({error:'تحقق من رقم الطالب والمادة.'});
  db.prepare('INSERT OR IGNORE INTO enrollments(course_id,student_id) VALUES(?,?)').run(courseId,studentId);
  res.json({ok:true});
});

app.get('/api/grades', auth, (req,res) => {
  let rows;
  if (req.user.role === 'student') {
    rows = db.prepare(`SELECT g.id,g.assessment,g.score,g.max_score,g.note,g.created_at,c.code course_code,c.name course_name
      FROM grades g JOIN courses c ON c.id=g.course_id WHERE g.student_id=? ORDER BY g.created_at DESC`).all(req.user.id);
  } else if (req.user.role === 'teacher') {
    rows = db.prepare(`SELECT g.id,g.assessment,g.score,g.max_score,g.note,g.created_at,c.code course_code,c.name course_name,
      u.name student_name,u.student_number FROM grades g JOIN courses c ON c.id=g.course_id JOIN users u ON u.id=g.student_id
      JOIN course_teachers ct ON ct.course_id=g.course_id WHERE ct.teacher_id=? ORDER BY g.created_at DESC`).all(req.user.id);
  } else {
    rows = db.prepare(`SELECT g.id,g.assessment,g.score,g.max_score,g.note,g.created_at,c.code course_code,c.name course_name,
      u.name student_name,u.student_number FROM grades g JOIN courses c ON c.id=g.course_id JOIN users u ON u.id=g.student_id ORDER BY g.created_at DESC`).all();
  }
  res.json({grades:rows});
});
app.post('/api/grades', auth, only('teacher'), async (req,res) => {
  const { courseId, studentId, assessment, score, maxScore, note='' } = req.body || {};
  const cId = Number(courseId), sId = Number(studentId), val = Number(score), max = Number(maxScore);
  if (!Number.isInteger(cId) || !Number.isInteger(sId) || !assessment?.trim() || !Number.isFinite(val) || !Number.isFinite(max) || max <= 0 || val < 0 || val > max)
    return res.status(400).json({error:'تحقق من المادة والطالب والتقييم والعلامة. يجب أن تكون العلامة بين 0 والحد الأقصى.'});
  const assigned = db.prepare('SELECT 1 FROM course_teachers WHERE course_id=? AND teacher_id=?').get(cId,req.user.id);
  const enrolled = db.prepare('SELECT 1 FROM enrollments WHERE course_id=? AND student_id=?').get(cId,sId);
  if (!assigned) return res.status(403).json({error:'لا يمكنك إدخال علامات في مادة غير مسندة إليك.'});
  if (!enrolled) return res.status(400).json({error:'الطالب غير مسجل في هذه المادة.'});
  const result = db.prepare('INSERT INTO grades(course_id,student_id,teacher_id,assessment,score,max_score,note) VALUES(?,?,?,?,?,?,?)')
    .run(cId,sId,req.user.id,assessment.trim(),val,max,note.trim());
  const grade = db.prepare('SELECT * FROM grades WHERE id=?').get(result.lastInsertRowid);
  const audit = await auditGrade({courseId:cId,studentId:sId,teacherId:req.user.id,assessment:grade.assessment,score:val,maxScore:max,createdAt:grade.created_at});
  res.status(201).json({ok:true, audit: {status:audit.status, transactionHash:audit.transactionHash || null}});
});
app.use((err,_req,res,_next) => { console.error(err); res.status(500).json({error:'حدث خطأ داخلي.'}); });
const port = Number(process.env.PORT || 4000);
app.listen(port, () => console.log(`API ready at http://localhost:${port}`));
