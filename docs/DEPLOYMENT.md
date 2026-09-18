# Backend Hosting Guide (Render)

This repository is configured to deploy the FastAPI backend onto **[Render](https://render.com)** as a Web Service.

---

## 1. Prerequisites
- A free account on [render.com](https://render.com)
- Your GitHub account linked to Render
- Access to your environment variables (`DATABASE_URL`, `GROQ_API_KEY`, `JWT_SECRET`)

---

## 2. Deploy Option A: Blueprint Deployment (Recommended & Fastest)

Because this repository contains [`render.yaml`](file:///c:/Users/ASUS/Desktop/sih26154/render.yaml), Render can automatically configure the service:

1. Log in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** in the top navigation bar and choose **Blueprint**.
3. Connect your repository: `KundanTPrasad/sih26154`.
4. Render will read `render.yaml` and prompt you for the required environment variables:
   - **`DATABASE_URL`**: Your PostgreSQL connection URI (e.g., Supabase / Neon connection string)
   - **`JWT_SECRET`**: A secret key used to sign authentication tokens
   - **`GROQ_API_KEY`**: Your API key from [console.groq.com](https://console.groq.com)
   - **`FRONTEND_URL`**: (Optional) URL of your frontend on Vercel (e.g. `https://your-app.vercel.app`)
5. Click **Apply**. Render will automatically build the service and deploy it.

---

## 3. Deploy Option B: Manual Web Service Setup

If you prefer creating a Web Service manually:

1. On the [Render Dashboard](https://dashboard.render.com), click **New +** -> **Web Service**.
2. Select **Build and deploy from a Git repository** and pick `KundanTPrasad/sih26154`.
3. Configure the settings:
   - **Name**: `sih26154-backend`
   - **Region**: Closest to your users (e.g., Singapore or Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: `Free`
4. Expand **Advanced** -> **Health Check Path** and set it to:
   ```
   /health
   ```
5. Add the **Environment Variables**:
   | Key | Value |
   |---|---|
   | `PYTHON_VERSION` | `3.11.9` |
   | `DATABASE_URL` | *Your Supabase PostgreSQL URI* |
   | `JWT_SECRET` | *Your JWT secret* |
   | `GROQ_API_KEY` | *Your Groq API key* |
   | `FRONTEND_URL` | *Your frontend Vercel URL (e.g., `https://*.vercel.app`)* |
6. Click **Create Web Service**.

---

## 4. Connect the Vercel Frontend to the Hosted Backend

Once Render finishes deploying, it gives you a public HTTPS URL:
`https://sih26154.onrender.com`

1. Open your frontend project settings on [Vercel](https://vercel.com).
2. Go to **Settings** -> **Environment Variables**.
3. Verify / update:
   - **Key**: `VITE_API_BASE_URL`
   - **Value**: `https://sih26154.onrender.com` (configured on Vercel)
4. Both Vercel and Render auto-deploy on every push to branch `main`.

---

## 5. Verify the Deployment

1. Visit your Render URL root in the browser:
   ```
   https://<your-service-name>.onrender.com/
   ```
   You should see:
   ```json
   {"message": "SIH26154 backend is running"}
   ```

2. Visit the interactive API documentation:
   ```
   https://<your-service-name>.onrender.com/docs
   ```

3. Health check status:
   ```
   https://<your-service-name>.onrender.com/health
   ```
   Output:
   ```json
   {"status": "healthy"}
   ```
