# VedaAI - AI Assessment Creator

VedaAI is a pixel-perfect, responsive web application that enables teachers to instantly generate high-quality, structured question papers from uploaded documents or text prompts, complete with dynamic answer keys, PDF downloads, and real-time generation feedback.

---

## Architecture Overview

VedaAI is built on a decoupled, event-driven architecture designed for high availability, asynchronous processing, and real-time communication.

```mermaid
graph TD
    %% Define styles
    classDef client fill:#E1F5FE,stroke:#0288D1,stroke-width:2px;
    classDef server fill:#E8F5E9,stroke:#388E3C,stroke-width:2px;
    classDef db fill:#FFFDE7,stroke:#FBC02D,stroke-width:2px;
    classDef ext fill:#FFEBEE,stroke:#D32F2F,stroke-width:2px;

    subgraph FE [Frontend - Next.js / React]
        UI[User Interface / Dashboard]:::client
        Store[Zustand State Store]:::client
        WS_Client[Socket.io Client]:::client
    end

    subgraph BE [Backend - Node.js / Express]
        API[Express REST API]:::server
        WS_Server[Socket.io Server]:::server
        Worker[BullMQ Job Worker]:::server
        PDF[PDFKit Compiler]:::server
    end

    subgraph Infra [Infrastructure]
        DB[(MongoDB)]:::db
        Queue[(Redis / BullMQ Queue)]:::db
    end

    subgraph External [External Services]
        Gemini[Google Gemini AI API]:::ext
    end

    %% Flows
    UI -->|1. Submit Form & Files| API
    API -->|2. Create Queue Job| Queue
    API -->|3. Save Pending Assignment| DB
    Queue -->|4. Process Job| Worker
    Worker -->|5. Request Structure| Gemini
    Gemini -->|6. JSON Schema Response| Worker
    Worker -->|7. Update Assignment Status| DB
    Worker -->|8. Push progress updates| WS_Server
    WS_Server -->|9. WebSockets connection| WS_Client
    WS_Client -->|10. Dispatch state update| Store
    Store -->|11. Render Live Logs & Cards| UI
    UI -->|12. Trigger PDF Download| API
    API -->|13. Compile Layout & Key| PDF
    PDF -->|14. Stream PDF to Client| UI
```

### Components Summary

1. **Frontend (Next.js & React)**: Renders a pixel-perfect UI featuring custom glassmorphism effects, smooth fading grids, interactive state transitions, and responsive layout adaptions. Uses **Zustand** for state management and **Socket.io Client** for live streaming generation logs.
2. **Backend (Express)**: Exposes REST API endpoints for assignment CRUD operations, files upload ingestion (using **Multer**), and triggers compilation streams.
3. **Queue Manager (BullMQ & Redis)**: Offloads heavy AI generation tasks to a background worker queue, ensuring the Express server remains highly responsive.
4. **AI Generation (Gemini API)**: Processes input prompts and files using `gemini-2.5-flash` with strict JSON schemas to guarantee structural formatting.
5. **PDF Generator (PDFKit)**: Dynamic, custom-built Node.js renderer compiling custom layouts, automatic grid spacing, inline markdown bolding (`**`), and dual-role outputs (**Student View** vs. **Teacher View**).

---

## Technical Approach

### 1. Resilient Async Processing
Heavy AI network requests can take up to 30-40 seconds, which exceeds standard HTTP timeouts. To address this, VedaAI uses **BullMQ** back-ended by **Redis**. When a user requests a paper:
- A new task is added to Redis, and a `pending` status response is instantly sent to the frontend.
- A background Worker pulls the task, communicates with the Gemini API, processes the result, and writes it to MongoDB.
- This decoupling prevents HTTP timeout errors and server thread blocking.

### 2. Live Generation Feedback
To provide a premium user experience, the background worker sends live log reports (e.g. *"Parsing input files..."*, *"Querying Gemini AI Model..."*, *"Structuring questions..."*) through a **Socket.io** server room. The client connects to this room using the assignment ID, receiving instantaneous console-like feedback.

### 3. Strict JSON Structuring
Using the new **Google Gen AI SDK**, we enforce a strict type-schema on Gemini response outputs. This guarantees that the JSON returned contains exact sections, question arrays, difficulty tags, mark allocations, and solutions, removing the risk of parsing failures.

### 4. Pixel-Perfect Layouts
A combination of Vanilla CSS custom properties, grid layouts with responsive overrides, and custom glassmorphism overlays:
- **Card Fading Blur**: A sticky/absolute positioned overlay combining a linear-gradient with a `backdrop-filter: blur(8px)` and a `-webkit-mask-image` gradient mask. This blurs and fades cards progressively as they scroll underneath the floating action button.
- **Unified Font System**: `@import` Bricolage Grotesque, bound directly into CSS variables, ensuring uniform modern typography.

---

## Step-by-Step Backend Deployment on Render

This guide walks you through deploying the Node.js/Express backend, hosting the MongoDB instance, and linking a cloud Redis database.

### Prerequisites
- A GitHub/GitLab account containing your codebase.
- A free [Render](https://render.com/) account.
- A free [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas-database) account.
- A free [Upstash](https://upstash.com/) account (or Render's internal Redis).

---

### Step 1: Set Up MongoDB Atlas
1. Sign in to MongoDB Atlas and create a free Shared Cluster.
2. In **Database Access**, create a user with read/write privileges (note the username and password).
3. In **Network Access**, select **Add IP Address** and choose **Allow Access from Anywhere** (`0.0.0.0/0`) so Render web services can connect.
4. Go to the database cluster dashboard, click **Connect** -> **Drivers**, and copy the connection string:
   `mongodb+srv://<username>:<password>@cluster.xxxx.mongodb.net/veda-ai?retryWrites=true&w=majority`

---

### Step 2: Set Up Redis
#### Option A: Upstash Redis (Recommended & Free)
1. Log into Upstash Console and click **Create Database**.
2. Select a name and region close to where you will deploy Render (e.g., US East / Oregon).
3. Under **Details**, scroll to the **Redis Connect** section and copy the **Redis URL**:
   `rediss://default:xxxxxx@xxxxxx.upstash.io:6379`

#### Option B: Render Managed Redis (Paid tier for long-term production)
1. On your Render Dashboard, click **New** -> **Redis**.
2. Set a name and click **Create Redis**.
3. Once active, copy the **Internal Redis URL** or **External Redis URL**.

---

### Step 3: Deploy Backend on Render
1. On the Render Dashboard, click **New** -> **Web Service**.
2. Connect your Git repository containing the VedaAI codebase.
3. Configure the following Web Service settings:
   - **Name**: `veda-ai-backend`
   - **Region**: Select a region close to your database (e.g., Oregon or Frankfurt).
   - **Branch**: `main` (or your primary branch)
   - **Root Directory**: `backend` (very important!)
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Plan**: `Free`

4. Click on **Advanced** to add **Environment Variables**:

| Key | Value | Description |
|---|---|---|
| `PORT` | `10000` | Render standard port |
| `NODE_ENV` | `production` | Enables production mode optimizations |
| `MONGODB_URI` | `mongodb+srv://...` | Your Atlas string from Step 1 |
| `REDIS_URL` | `rediss://...` | Your Redis Connection string from Step 2 |
| `GEMINI_API_KEY` | `AIzaSy...` | Your Google Gemini API Key |
| `FRONTEND_URL` | `https://your-frontend-domain.com` | Origin URL of your deployed frontend |

5. Click **Create Web Service**. Render will fetch your code, compile the TypeScript files into `dist/`, and boot up the server.

---

### Step 4: Hook Up the Frontend
Once your Render backend is deployed, Render will provide you with a live URL (e.g., `https://veda-ai-backend.onrender.com`).
1. In your **Frontend** host configurations (e.g., Vercel, Netlify, or Render), set the environment variable:
   `NEXT_PUBLIC_API_URL=https://veda-ai-backend.onrender.com`
2. Redeploy or restart your frontend dev server. The client will now communicate directly with your cloud-hosted backend, queues, and database!
