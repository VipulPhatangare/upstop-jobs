# 🚀 Unstop Job & Internship Scraper Platform

A high-performance, real-time MERN Stack Web Platform and Automated Scraper Engine that harvests live Full-Time Jobs and Internships from Unstop, complete with compensation details, work functions, interview round roadmaps, and eligibility criteria.

---

## ✨ Features

- 💼 **Dual Opportunity Harvesting**: Scrapes both Full-Time Jobs and Internships concurrently in parallel.
- ⚡ **High-Speed Concurrency Engine**: Slices queries dynamically across official Unstop workfunctions under pagination ceilings.
- 🛡️ **3-Layer Real-Time Deduplication**: Real-time batch filtering + MongoDB multi-field `$or` upserts + compound unique database indexes ensure zero duplicate records.
- ⏰ **Automated Daily 3:00 AM IST Auto-Scrape**: Scheduled daily cron fetches fresh listings updated within the last 36 hours.
- 🎛️ **Admin Hub Scraper Controls**: Instant manual triggers for **12 Hours**, **36 Hours**, **3 Days**, **5 Days**, or **Full 189 Workfunctions Sweep**.
- 📊 **Execution Audit History**: Records detailed execution logs into MongoDB with Jobs vs Internships breakdown for new insertions (+N) and updates.
- 🎨 **Modern Glassmorphism UI**: Built with React, Vite, and Tailwind CSS featuring dark mode aesthetics, interactive modal popups, category filters, and saved job bookmarks.
- 🖥️ **VPS Ready Deployment**: Includes `ecosystem.config.cjs` (PM2) and automated `deploy-vps.sh` tuned for 2 vCPU / 8 GB RAM VPS servers.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Tailwind CSS, Lucide React, Axios
- **Backend**: Node.js, Express.js, Mongoose (MongoDB)
- **Database**: MongoDB 7.0 (with compound unique indexes)
- **Process Manager**: PM2
- **Web Server Proxy**: Nginx

---

## 🚀 Quick Start (Local Development)

### 1. Clone the repository
```bash
git clone https://github.com/VipulPhatangare/upstop-jobs.git
cd upstop-jobs
```

### 2. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 3. Start Backend Server
```bash
cd backend
node server.js
# Backend runs on http://localhost:5000
```

### 4. Start Frontend Dev Server
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

---

## 🌐 API Endpoints

- `GET /api/jobs` - Search and filter live jobs and internships
- `GET /api/jobs/admin/stats` - Fetch aggregate metrics (total jobs, active live, internships breakdown)
- `POST /api/jobs/scrape/trigger` - Trigger manual scraper for time window (`12h`, `36h`, `3d`, `5d`, `full`)
- `GET /api/jobs/scrape/status` - Live scraper running status and streaming logs
- `GET /api/jobs/scrape/logs` - Fetch historical scraper execution audit logs
- `DELETE /api/jobs/scrape/logs` - Clear historical audit logs

---

## ⚡ VPS Production Deployment (1-Click)

Target Specifications: **2 vCPU Cores | 8 GB RAM | 100 GB NVMe**

```bash
chmod +x deploy-vps.sh
./deploy-vps.sh
```

---

## 📄 License

MIT License © 2026 Vipul Phatangare
