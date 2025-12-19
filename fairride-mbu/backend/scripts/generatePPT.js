import PptxGenJS from "pptxgenjs";

const pptx = new PptxGenJS();
pptx.author = "FairRide MBU";
pptx.company = "FairRide";
pptx.subject = "Project Overview";
pptx.title = "FairRide MBU - Project Overview";

// Helper to add a title + bullets slide
function addBulletsSlide(title, bullets) {
  const slide = pptx.addSlide();
  slide.addText(title, { x: 0.5, y: 0.4, w: 9, h: 0.6, fontSize: 28, bold: true, color: "1f2937" });
  const items = bullets.map((t) => ({ text: t }));
  slide.addText(items, {
    x: 0.7,
    y: 1.1,
    w: 8.6,
    fontSize: 18,
    color: "374151",
    bullet: true,
    lineSpacingMultiple: 1.15,
  });
}

// Title slide
{
  const slide = pptx.addSlide();
  slide.background = { color: "111827" };
  slide.addText("FairRide MBU", { x: 0.5, y: 2.2, w: 9, h: 0.8, fontSize: 44, bold: true, color: "FBBF24" });
  slide.addText("Campus ride-hailing platform — Project Overview", { x: 0.5, y: 3.2, w: 9, h: 0.6, fontSize: 22, color: "e5e7eb" });
}

// Tech Stack
addBulletsSlide("Tech Stack", [
  "Frontend: HTML, Tailwind (CDN), Vanilla JS",
  "UI libs: Chart.js, GSAP, Phosphor Icons",
  "Effects: floating autos, SVG live tracking, glow hover",
  "Backend: Node.js (ESM) + Express, Zod, Multer, JWT, Bcrypt, CORS, Dotenv",
  "ORM: Prisma Client",
  "Database: PostgreSQL 16 (Docker Compose)",
  "AI hooks: Gemini API stubs for fare + outing planner",
]);

// Architecture
addBulletsSlide("Architecture", [
  "Express serves static frontend + REST JSON API",
  "Auth: JWT issued on signup/login; passwords hashed (bcrypt)",
  "Prisma data access layer → PostgreSQL",
  "Uploads: Multer stores files under /uploads (exposed statically)",
  "LocalStorage used for light UI state (e.g., OTP, toggles)",
  "Docker Compose spins up Postgres for local dev",
]);

// Key Features
addBulletsSlide("Key Features", [
  "Rider: Signup/Login, booking flow, fare estimate (AI), select ride → payment",
  "Rider: Live tracking embedded (SVG), enhanced SOS, OTP sharing",
  "Driver: Dashboard with requests, Accept → OTP verify flow",
  "Driver: Earnings with College Festival Bonus (toggle, % slider, chart)",
  "Driver: Profile with document uploads and local/offline fallback",
]);

// Database Schema (Prisma)
addBulletsSlide("Database Schema (Prisma)", [
  "User: id, name, email?, phone?, studentId?, gender?, role, passwordHash",
  "DriverProfile: userId (1:1), vehicleNumber?, license/insurance fields",
  "Enums: Role (RIDER/DRIVER/ADMIN), Gender, VerificationStatus",
]);

// Flows
addBulletsSlide("Main Flows", [
  "Rider: Dashboard → Confirm Booking → Select Ride → Payment → Tracking",
  "Driver: Dashboard → Accept → Verify OTP → In-Ride",
  "Earnings: Weekly chart + bonus applied to totals and insights",
]);

// Running Locally
addBulletsSlide("Running Locally", [
  "1) Start DB: docker-compose up -d",
  "2) Backend: cd backend && npm install && npm run dev",
  "3) Open UI: http://localhost:3001 (served by Express static)",
  "Optional: prisma generate/migrate, prisma studio",
]);

// Security & Notes
addBulletsSlide("Security & Notes", [
  "JWT auth; route-level checks for role (driver/rider)",
  "Input validation with Zod",
  "Passwords hashed with bcrypt; tokens via jsonwebtoken",
  "CORS enabled for local dev; .env controls secrets",
]);

// Roadmap
addBulletsSlide("Roadmap", [
  "Replace mock AI calls with production API keys",
  "Integrate live map (e.g., Mapbox/Google Maps) for tracking",
  "Payment gateway integration",
  "Notifications (push/email) and ride history",
  "Automated tests and CI",
]);

const outFile = process.argv[2] || "FairRide_MBU_Project_Overview.pptx";
await pptx.writeFile({ fileName: outFile }).then(() => {
  console.log(`Saved: ${outFile}`);
});
