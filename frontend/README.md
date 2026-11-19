# FlagForge Frontend

Modern, high-density B2B SaaS dashboard for FlagForge built with **React 18**, **Vite**, **TypeScript**, **Tailwind CSS**, **TanStack Query**, and **Lucide React**.

## 🚀 Quick Start (Local Development)

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default content:
```env
VITE_API_URL=http://localhost:4000
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Build for Production
```bash
npm run build
```
The output will be generated in the `dist/` directory.

---

## 🌐 Deploy to Vercel (1-Click)

1. Push this folder to a GitHub repository (e.g. `flagforge-frontend`).
2. Go to [vercel.com](https://vercel.com/) and click **Add New Project**.
3. Import your `flagforge-frontend` repository.
4. Framework Preset: **Vite**
5. Add Environment Variable:
   - **`VITE_API_URL`**: `https://your-backend-api.onrender.com`
6. Click **Deploy**! Your frontend will be live in 30 seconds.
