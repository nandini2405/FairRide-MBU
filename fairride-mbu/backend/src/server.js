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

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '1mb' }));

const staticRoot = path.resolve(__dirname, process.env.STATIC_ROOT || '..');
app.use(express.static(staticRoot));

const jwtSecret = process.env.JWT_SECRET || 'dev-secret';

// -- Auth Middleware --
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

// -- Schemas --
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

// -- Auth Routes --
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
    res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email, phone: user.phone, studentId: user.studentId, gender: user.gender, avatarUrl: user.avatarUrl } });
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: e.errors[0]?.message || 'Invalid input' });
    res.status(500).json({ error: 'Server error' });
  }
});

// -- User Routes --
app.get('/api/users/me', auth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: { id: true, name: true, email: true, phone: true, studentId: true, gender: true, role: true, avatarUrl: true }
  });
  res.json(user);
});

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

// Get user by ID (must be after /me routes)
app.get('/api/users/:id(\\d+)', auth, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(req.params.id) },
      select: { id: true, name: true, phone: true, role: true }
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// -- Driver Profile Routes --
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

// -- File Uploads --
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

// -- Admin Routes --
app.get('/api/admin/drivers', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { status, q } = req.query;
  try {
    const where = {
      role: 'DRIVER',
      ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { phone: { contains: q, mode: 'insensitive' } }] } : {}),
      driverProfile: status ? { is: { status } } : { isNot: null },
    };
    const drivers = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, phone: true, createdAt: true, driverProfile: { select: { vehicleNumber: true, status: true, licenseFileUrl: true, insuranceFileUrl: true, updatedAt: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ drivers });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/admin/drivers/:id/verify', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  try {
    const profile = await prisma.driverProfile.update({ where: { userId: parseInt(req.params.id, 10) }, data: { status: 'VERIFIED' } });
    res.json(profile);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/admin/drivers/:id/reject', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  try {
    const profile = await prisma.driverProfile.update({ where: { userId: parseInt(req.params.id, 10) }, data: { status: 'REJECTED' } });
    res.json(profile);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/admin/drivers/:id', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  try {
    await prisma.driverProfile.delete({ where: { userId: parseInt(req.params.id, 10) } }).catch(() => {});
    await prisma.user.delete({ where: { id: parseInt(req.params.id, 10) } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/admin/notify', auth, async (req, res) => {
  if (req.user.role !== 'ADMIN') return res.status(403).json({ error: 'Forbidden' });
  const { userId, message } = req.body || {};
  res.json({ ok: true, delivered: !!userId, message });
});

// -- Ride APIs --
app.post('/api/rides', auth, async (req, res) => {
  try {
    const { destination, passengers = 1 } = req.body;
    if (!destination) return res.status(400).json({ error: 'Destination required' });

    const routeFares = {
      'tirupati railway station': { shared: 40, full: 100 },
      'railway station': { shared: 40, full: 100 },
      'tirupati bus stand': { shared: 40, full: 100 },
      'bus stand': { shared: 40, full: 100 },
      'mangapuram': { shared: 20, full: 60 },
      'srinivasa mangapuram': { shared: 20, full: 60 },
      'tiruchanur': { shared: 20, full: 60 },
      'padmavathi temple': { shared: 20, full: 60 },
      'tirumala': { shared: 0, full: 200 },
      'tirumala temple': { shared: 0, full: 200 },
      'tirupati airport': { shared: 0, full: 250 },
      'airport': { shared: 0, full: 250 },
      'renigunta': { shared: 0, full: 180 },
      'govindaraja temple': { shared: 30, full: 80 },
      'govindaraja': { shared: 30, full: 80 },
      'kapila theertham': { shared: 20, full: 50 },
      'kapila': { shared: 20, full: 50 },
      'iskcon temple': { shared: 20, full: 50 },
      'iskcon': { shared: 20, full: 50 },
      'sv zoo': { shared: 25, full: 60 },
      'dmart': { shared: 15, full: 40 },
      'psr mall': { shared: 30, full: 80 },
      'pvr': { shared: 30, full: 80 },
      'srikalahasti': { shared: 0, full: 400 },
      'chandragiri': { shared: 0, full: 300 },
    };

    const destKey = destination.toLowerCase().trim();
    let matchedFare = null;
    for (const [key, fares] of Object.entries(routeFares)) {
      if (destKey.includes(key)) { matchedFare = fares; break; }
    }
    if (!matchedFare) matchedFare = { shared: 35, full: 80 };

    const currentHour = new Date().getHours();
    const isNight = currentHour >= 22 || currentHour < 6;
    const multiplier = isNight ? 1.25 : 1;
    const numPassengers = Number(passengers);
    let fare;
    if (numPassengers === 1) {
      fare = matchedFare.shared > 0 ? Math.round(matchedFare.shared * multiplier) : Math.round(matchedFare.full * multiplier);
    } else {
      fare = Math.round(matchedFare.full * multiplier);
    }
    fare = Math.max(20, fare);

    const ride = await prisma.ride.create({
      data: { riderId: req.user.id, destination, passengers: Number(passengers), fare, status: 'REQUESTED' }
    });
    res.json(ride);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/rides/available', auth, async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({ where: { status: 'REQUESTED' }, orderBy: { createdAt: 'desc' } });
    res.json(rides);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/rides/history', auth, async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({ where: { riderId: req.user.id }, orderBy: { createdAt: 'desc' }, take: 10 });
    res.json(rides);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/rides/:id(\\d+)', auth, async (req, res) => {
  try {
    const ride = await prisma.ride.findUnique({ where: { id: Number(req.params.id) } });
    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    res.json(ride);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.get('/api/rides', auth, async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({ where: { riderId: req.user.id }, orderBy: { createdAt: 'desc' } });
    res.json(rides);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.patch('/api/rides/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const ride = await prisma.ride.update({ where: { id: Number(req.params.id) }, data: { status } });
    res.json(ride);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.post('/api/rides/:id/start', auth, async (req, res) => {
  try {
    const ride = await prisma.ride.update({ where: { id: Number(req.params.id) }, data: { status: 'IN_PROGRESS' } });
    res.json(ride);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/rides/:id/accept', auth, async (req, res) => {
  try {
    const ride = await prisma.ride.update({ where: { id: Number(req.params.id) }, data: { driverId: req.user.id, status: 'ACCEPTED' } });
    res.json(ride);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// -- Feedback --
app.post('/api/feedback', auth, async (req, res) => {
  try {
    const { rideId, rating, tags, comment, tip } = req.body;
    if (!rideId) return res.status(400).json({ error: 'rideId required' });
    const feedback = await prisma.feedback.create({
      data: { rideId: Number(rideId), rating: Number(rating) || 0, tags: tags || [], comment: comment || '', tip: Number(tip) || 0 }
    });
    res.json(feedback);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// -- Scheduled Rides --
app.post('/api/scheduled-rides', auth, async (req, res) => {
  try {
    const { destination, origin, scheduledAt, passengers } = req.body;
    if (!destination || !scheduledAt) return res.status(400).json({ error: 'Destination and scheduledAt required' });
    const ride = await prisma.scheduledRide.create({
      data: { riderId: req.user.id, destination, origin: origin || 'MBU Campus', scheduledAt: new Date(scheduledAt), passengers: Number(passengers) || 1, status: 'PENDING' }
    });
    res.json(ride);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/scheduled-rides', auth, async (req, res) => {
  try {
    const rides = await prisma.scheduledRide.findMany({ where: { riderId: req.user.id }, orderBy: { scheduledAt: 'asc' } });
    res.json(rides);
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

app.delete('/api/scheduled-rides/:id', auth, async (req, res) => {
  try {
    await prisma.scheduledRide.delete({ where: { id: Number(req.params.id) } });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: 'Server error' }); }
});

// -- AI Outing Planner --
app.post('/api/ai/outing', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return res.status(400).json({ error: 'Gemini API key not configured' });

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
    const body = { contents: [{ parts: [{ text: `You are helping MBU university students near Tirupati plan outings. Based on this request: "${prompt}", suggest exactly 3 places. Reply ONLY with a valid JSON array like this: [{"name":"Place Name","hint":"Short description"},{"name":"Place 2","hint":"Description"},{"name":"Place 3","hint":"Description"}]` }] }] };

    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const rawText = await response.text();
    const data = JSON.parse(rawText);
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    let places = [];
    try {
      const match = text.match(/\[[\s\S]*?\]/);
      if (match) places = JSON.parse(match[0]);
    } catch (e) {}

    // Fallback if API fails
    if (places.length === 0) {
      const p = prompt.toLowerCase();
      if (p.includes('food') || p.includes('eat') || p.includes('restaurant') || p.includes('dinner') || p.includes('lunch') || p.includes('breakfast') || p.includes('hotel') || p.includes('cafe') || p.includes('coffee')) {
        places = [
          { name: 'Bhimas Hotel', hint: 'Famous for traditional Andhra meals and sweets near Tirupati bus stand' },
          { name: 'Sri Lakshmi Bhavan', hint: 'Popular local restaurant serving authentic South Indian breakfast' },
          { name: 'Minerva Coffee Shop', hint: 'Best filter coffee and tiffin in Tirupati city center' }
        ];
      } else if (p.includes('temple') || p.includes('religious') || p.includes('spiritual') || p.includes('god') || p.includes('worship') || p.includes('pilgrimage')) {
        places = [
          { name: 'Tirumala Venkateswara Temple', hint: 'Most visited temple in the world, located on Tirumala hills' },
          { name: 'Padmavathi Temple Tiruchanur', hint: 'Sacred temple of Goddess Padmavathi, 5km from Tirupati' },
          { name: 'Kapila Theertham', hint: 'Ancient Shiva temple with beautiful waterfall at the foothills' }
        ];
      } else if (p.includes('nature') || p.includes('trek') || p.includes('outdoor') || p.includes('waterfall') || p.includes('hill') || p.includes('forest') || p.includes('park')) {
        places = [
          { name: 'Talakona Waterfall', hint: 'Highest waterfall in Andhra Pradesh, 50km from Tirupati' },
          { name: 'Horsley Hills', hint: 'Scenic hill station perfect for weekend getaway, 150km away' },
          { name: 'Chandragiri Fort', hint: 'Historic fort with light and sound show, 11km from Tirupati' }
        ];
      } else {
        places = [
          { name: 'Chandragiri Fort', hint: 'Historic 11th century fort with museum and light show' },
          { name: 'SV Zoological Park', hint: 'Beautiful zoo with rare species, perfect for family outing' },
          { name: 'Silathoranam', hint: 'Unique natural arch formation on Tirumala hills, great for photography' }
        ];
      }
    }

    res.json({ places });
  } catch (e) {
    console.error('AI error:', e);
    res.json({ places: [
      { name: 'Tirumala Venkateswara Temple', hint: 'Most visited temple in the world on Tirumala hills' },
      { name: 'Chandragiri Fort', hint: 'Historic fort with museum and light show, 11km from Tirupati' },
      { name: 'Talakona Waterfall', hint: 'Highest waterfall in Andhra Pradesh, perfect for nature lovers' }
    ]});
  }
});// -- Stats --
app.get('/api/stats', async (req, res) => {
  try {
    const totalRides = await prisma.ride.count();
    const completedRides = await prisma.ride.count({ where: { status: 'COMPLETED' } });
    const requestedRides = await prisma.ride.count({ where: { status: 'REQUESTED' } });
    const acceptedRides = await prisma.ride.count({ where: { status: 'ACCEPTED' } });
    const totalStudents = await prisma.user.count({ where: { role: 'RIDER' } });
    const totalDrivers = await prisma.user.count({ where: { role: 'DRIVER' } });
    const fareData = await prisma.ride.aggregate({ _avg: { fare: true }, _sum: { fare: true }, where: { status: 'COMPLETED' } });
    const allRides = await prisma.ride.findMany({ select: { destination: true } });
    const destCount = {};
    allRides.forEach(ride => {
      if (!ride.destination) return;
      const key = ride.destination.toLowerCase().trim();
      destCount[key] = (destCount[key] || 0) + 1;
    });
    const popularDestinations = Object.entries(destCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([destination, count]) => ({ destination: destination.charAt(0).toUpperCase() + destination.slice(1), count }));
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const ridesToday = await prisma.ride.count({ where: { createdAt: { gte: today } } });
    const feedbackData = await prisma.feedback.aggregate({ _avg: { rating: true }, _count: { id: true } });
    const onlineDrivers = Math.max(1, totalDrivers);
    const surgeRatio = requestedRides / onlineDrivers;
    let surgePct = 10;
    if (surgeRatio >= 3) surgePct = 90;
    else if (surgeRatio >= 2) surgePct = 70;
    else if (surgeRatio >= 1) surgePct = 50;
    else if (surgeRatio >= 0.5) surgePct = 30;
    res.json({ totalRides, completedRides, requestedRides, acceptedRides, totalStudents, totalDrivers, surgePct, averageFare: fareData._avg.fare || 0, totalRevenue: fareData._sum.fare || 0, popularDestinations, ridesToday, averageRating: feedbackData._avg.rating || 0, totalFeedback: feedbackData._count.id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/stats/hourly', async (req, res) => {
  try {
    const rides = await prisma.ride.findMany({ select: { createdAt: true } });
    const hourlyCount = {};
    for (let h = 5; h <= 21; h++) hourlyCount[h] = 0;
    rides.forEach(ride => {
      const hour = new Date(ride.createdAt).getHours();
      if (hour >= 5 && hour <= 21) hourlyCount[hour] = (hourlyCount[hour] || 0) + 1;
    });
    const data = Object.values(hourlyCount);
    const maxVal = Math.max(...data, 1);
    const normalized = data.map(v => Math.round((v / maxVal) * 100));
    res.json({ hourly: normalized, raw: hourlyCount });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});
// -- Driver Earnings API --
app.get('/api/driver/earnings', auth, async (req, res) => {
  try {
    const driverId = req.user.id;

    // Total earnings from completed rides
    const allRides = await prisma.ride.findMany({
      where: { driverId, status: 'COMPLETED' },
      select: { fare: true, createdAt: true }
    });

    // Today's earnings
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayRides = allRides.filter(r => new Date(r.createdAt) >= today);
    const todayEarnings = todayRides.reduce((sum, r) => sum + (r.fare || 0), 0);
    const todayTrips = todayRides.length;

    // This week's earnings
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 6);
    weekStart.setHours(0, 0, 0, 0);
    const weekRides = allRides.filter(r => new Date(r.createdAt) >= weekStart);
    const weekEarnings = weekRides.reduce((sum, r) => sum + (r.fare || 0), 0);
    const weekTrips = weekRides.length;

    // Total all time
    const totalEarnings = allRides.reduce((sum, r) => sum + (r.fare || 0), 0);
    const totalTrips = allRides.length;

    // Daily breakdown for last 7 days
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const dailyData = [];
    const dailyLabels = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      const nextD = new Date(d);
      nextD.setDate(nextD.getDate() + 1);
      const dayRides = allRides.filter(r => {
        const rd = new Date(r.createdAt);
        return rd >= d && rd < nextD;
      });
      dailyData.push(dayRides.reduce((sum, r) => sum + (r.fare || 0), 0));
      dailyLabels.push(dayNames[d.getDay()]);
    }

    // Recent transactions
    const recentRides = await prisma.ride.findMany({
      where: { driverId, status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: { id: true, destination: true, fare: true, createdAt: true }
    });

    res.json({
      todayEarnings, todayTrips,
 weekEarnings, weekTrips,
      totalEarnings, totalTrips,
      dailyData, dailyLabels,
      recentRides
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

// -- Health --
app.get('/api/health', (req, res) => res.json({ ok: true }));

const port = Number(process.env.PORT || 3001);
app.listen(port, () => {
  console.log(`FairRide API listening on http://localhost:${port}`);
  console.log(`Serving static from: ${staticRoot}`);
});
