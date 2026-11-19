# FlagForge Backend

High-throughput REST API, Evaluation Engine, and Multi-Tenant Feature Flag Platform built with **Node.js**, **Express**, **TypeScript**, **MongoDB (Mongoose)**, **Redis**, and **MurmurHash3**.

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

Ensure your MongoDB instance is running locally or provide a MongoDB Atlas connection string in `MONGODB_URI`.
*(Note: If you don't have Redis running, leave `REDIS_ENABLED=false` and the server will automatically use in-memory caching).*

### 3. Run Development Server
```bash
npm run dev
```
The server will start on [http://localhost:4000](http://localhost:4000).
- Health check: [http://localhost:4000/health](http://localhost:4000/health)
- Swagger API Docs: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

### 4. Run Automated Tests
```bash
npm test
```

### 5. Build and Run in Production
```bash
npm run build
npm start
```

---

## 🌐 Deploy to Render.com (1-Click)

1. Push this folder to a GitHub repository (e.g. `flagforge-backend`).
2. Go to [render.com](https://render.com/) and click **New +** -> **Web Service**.
3. Connect your `flagforge-backend` repository.
4. Settings:
   - **Environment:** `Node`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
5. Add Environment Variables:
   - **`NODE_ENV`**: `production`
   - **`PORT`**: `4000`
   - **`MONGODB_URI`**: *(Your MongoDB Atlas connection string)*
   - **`REDIS_ENABLED`**: `false` *(or `true` with your Upstash Redis URL)*
   - **`JWT_SECRET`**: `flagforge-super-secure-production-jwt-secret-key-32chars!`
   - **`CORS_ORIGIN`**: `*` *(or your Vercel frontend URL)*
6. Click **Create Web Service**!
