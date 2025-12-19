import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();

// CORS: allow same origin and local development
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

// Serve static UI from project root (one level up from backend)
const staticRoot = path.resolve(__dirname, process.env.STATIC_ROOT || '..');
app.use(express.static(staticRoot));

const jwtSecret = process.env.JWT_SECRET || 'dev-secret';

// Auth middleware
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });
  try {
    req.user = jwt.verify(token, jwtSecret);
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Schemas
const signupStudentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  studentId: z.string().min(3),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  password: z.string().min(6)
});

const signupDriverSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(8),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  vehicleNumber: z.string().min(4),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email().optional(),
  phone: z.string().optional(),
  studentId: z.string().optional(),
  password: z.string().min(6)
}).refine((d) => !!(d.email || d.phone || d.studentId), {
  message: 'Provide email, phone or studentId'
});

// Auth routes
app.post('/api/auth/signup/student', async (req, res) => {
  try {
    const data = signupStudentSchema.parse(req.body);
    const hash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { name: data.name, email: data.email, phone: data.phone, studentId: data.studentId, gender: data.gender, passwordHash: hash, role: 'RIDER' }
    });
    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email, phone: user.phone, studentId: user.studentId, gender: user.gender } });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email/Phone/Student ID already in use' });
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0]?.message || 'Invalid input' });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/signup/driver', async (req, res) => {
  try {
    const data = signupDriverSchema.parse(req.body);
    const hash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({
      data: { name: data.name, phone: data.phone, gender: data.gender, passwordHash: hash, role: 'DRIVER' }
    });
    await prisma.driverProfile.create({ data: { userId: user.id, vehicleNumber: data.vehicleNumber } });
    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, phone: user.phone, gender: user.gender } });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Phone already in use' });
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0]?.message || 'Invalid input' });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, phone, studentId, password } = loginSchema.parse(req.body);
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          email ? { email } : undefined,
          phone ? { phone } : undefined,
          studentId ? { studentId } : undefined
        ].filter(Boolean)
      }
    });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, { expiresIn: '7d' });
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        phone: user.phone,
        studentId: user.studentId,
        gender: user.gender,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0]?.message || 'Invalid input' });
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/users/me', auth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.id }, select: { id: true, name: true, email: true, phone: true, studentId: true, gender: true, role: true, avatarUrl: true } });
  res.json(user);
});

// Update current user profile (name/email/phone/gender)
app.put('/api/users/me', auth, async (req, res) => {
  const schema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional().nullable(),
    phone: z.string().min(7).optional().nullable(),
    gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional().nullable()
  });
  try {
    const data = schema.parse(req.body);
    const user = await prisma.user.update({ where: { id: req.user.id }, data });
    res.json({ id: user.id, name: user.name, email: user.email, phone: user.phone, studentId: user.studentId, gender: user.gender, role: user.role, avatarUrl: user.avatarUrl });
  } catch (e) {
    if (e.code === 'P2002') return res.status(409).json({ error: 'Email or phone already in use' });
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0]?.message || 'Invalid input' });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Driver profile routes
app.get('/api/driver/profile', auth, async (req, res) => {
  if (req.user.role !== 'DRIVER') return res.status(403).json({ error: 'Forbidden' });
  const profile = await prisma.driverProfile.findUnique({ where: { userId: req.user.id } });
  res.json(profile);
});

app.put('/api/driver/profile', auth, async (req, res) => {
  if (req.user.role !== 'DRIVER') return res.status(403).json({ error: 'Forbidden' });
  const schema = z.object({ vehicleNumber: z.string().min(3).optional(), licenseNumber: z.string().optional(), insuranceNumber: z.string().optional() });
  try {
    const data = schema.parse(req.body);
    const profile = await prisma.driverProfile.update({ where: { userId: req.user.id }, data });
    res.json(profile);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0]?.message || 'Invalid input' });
    res.status(500).json({ error: 'Server error' });
  }
});

// Uploads
const uploadDir = path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    cb(null, `${Date.now()}_${safe}`);
  }
});
const upload = multer({ storage });
app.use('/uploads', express.static(uploadDir));

app.post('/api/driver/documents', auth, upload.fields([{ name: 'license', maxCount: 1 }, { name: 'insurance', maxCount: 1 }]), async (req, res) => {
  if (req.user.role !== 'DRIVER') return res.status(403).json({ error: 'Forbidden' });
  const files = req.files || {};
  const license = files.license?.[0];
  const insurance = files.insurance?.[0];
  try {
    const data = {};
    if (license) data.licenseFileUrl = `/uploads/${license.filename}`;
    if (insurance) data.insuranceFileUrl = `/uploads/${insurance.filename}`;
    const profile = await prisma.driverProfile.update({ where: { userId: req.user.id }, data });
    res.json(profile);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ---------- Admin Endpoints ----------
// List drivers with optional status filter
app.get('/api/admin/drivers', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { status, q } = req.query;
  try {
    const where = {
      role: 'DRIVER',
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' } },
              { email: { contains: q, mode: 'insensitive' } },
              { phone: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
      driverProfile: status ? { is: { status } } : { isNot: null },
    };
    const drivers = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        driverProfile: {
          select: {
            vehicleNumber: true,
            status: true,
            licenseFileUrl: true,
            insuranceFileUrl: true,
            updatedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ drivers });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Verify driver
app.post('/api/admin/drivers/:id/verify', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const id = parseInt(req.params.id, 10);
  try {
    const profile = await prisma.driverProfile.update({ where: { userId: id }, data: { status: 'VERIFIED' } });
    res.json(profile);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Reject driver
app.post('/api/admin/drivers/:id/reject', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const id = parseInt(req.params.id, 10);
  try {
    const profile = await prisma.driverProfile.update({ where: { userId: id }, data: { status: 'REJECTED' } });
    res.json(profile);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Remove driver (delete both profile and user)
app.delete('/api/admin/drivers/:id', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const id = parseInt(req.params.id, 10);
  try {
    // Delete profile first, then user to satisfy FK constraint
    await prisma.driverProfile.delete({ where: { userId: id } }).catch(() => {});
    await prisma.user.delete({ where: { id } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// Send notification (placeholder)
app.post('/api/admin/notify', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { userId, message } = req.body || {};
  // Placeholder: In real system, integrate SMS/Push provider
  res.json({ ok: true, delivered: !!userId, message });
});

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`FairRide API listening on http://localhost:${port}`);
  console.log(`Serving static from: ${staticRoot}`);
});
