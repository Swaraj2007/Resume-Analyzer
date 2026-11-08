# AI Resume Analyzer 📄✨

An AI-powered web application for evaluating resumes against industry standards and ATS (Applicant Tracking Systems). It calculates an **Overall Score (0-100)**, generates categorized **Strengths**, identifies **Weaknesses**, and provides actionable **Basic Improvement Suggestions**.

---

## 💻 Prerequisites for Running on Any Laptop

Before running this project, ensure the following software is installed on the laptop:

1. **Node.js** (v18 or higher)
   - Download & Install from: [https://nodejs.org](https://nodejs.org)
   - Verify in terminal:
     ```bash
     node -v
     npm -v
     ```

2. **MongoDB** (Local or Cloud Atlas)
   - **Option A (Local)**: Install [MongoDB Community Server](https://www.mongodb.com/try/download/community) & [MongoDB Compass](https://www.mongodb.com/try/download/compass). Make sure the MongoDB Windows Service is running.
   - **Option B (Cloud)**: You can also use a free cloud database from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and paste your connection string into the `.env` file.

---

## 📦 How to Prepare the ZIP File Before Sharing

> ⚠️ **IMPORTANT**: **DO NOT zip the `node_modules` folder!**
> 
> The `node_modules` folder is very large (over 100MB+) and will cause errors across different operating systems.
>
> 1. Right-click or delete the `node_modules` folder inside the project.
> 2. Ensure `.env` or `.env.example` is inside the folder.
> 3. Compress the remaining files into a `.zip` archive.

---

## 🚀 Step-by-Step Instructions for Your Group Member

### Step 1: Unzip the Project
- Download and extract `resume-analyzer.zip` to a folder on your computer (e.g., `Desktop` or `Documents`).

### Step 2: Open Terminal / Command Prompt
- Open **VS Code** (or terminal / Command Prompt).
- Go to **File -> Open Folder...** and select the unzipped project folder.
- Open the integrated terminal (`Ctrl + ~` or `Terminal -> New Terminal`).

### Step 3: Configure Environment Variables (`.env`)
- Check if a `.env` file exists in the root folder.
- If not, create a file named `.env` and paste:
  ```env
  PORT=5000
  MONGO_URI=mongodb://127.0.0.1:27017/resume_analyzer
  JWT_SECRET=resume_analyzer_super_secret_jwt_key_2026
  ```
  *(If using MongoDB Atlas, replace `MONGO_URI` with your Atlas connection string).*

### Step 4: Install Dependencies
Run the following command in the terminal to install all required packages:
```bash
npm install
```
*(This will automatically download and install express, mongoose, bcryptjs, jsonwebtoken, multer, pdf-parse, mammoth, etc.)*

### Step 5: Start MongoDB
- Make sure MongoDB is running on your machine.
- On Windows, you can open **Services** and verify `MongoDB Server` is **Running**, or open **MongoDB Compass** and click **Connect** to `mongodb://127.0.0.1:27017`.

### Step 6: Start the Server
Run the project with:
```bash
npm start
```
*(Alternatively, for development auto-reload, you can run: `npm run dev`)*

You should see:
```text
Database connected successfully.
Resume Analyzer server running on http://localhost:5000
```

### Step 7: Open in Browser
- Open your browser (Chrome, Edge, Brave, Firefox) and navigate to:
  👉 **[http://localhost:5000](http://localhost:5000)**
- Create a new account or Sign In.
- Upload any PDF, DOCX, or TXT resume to see the AI evaluation!

---

## 🛠️ Common Troubleshooting & Fixes

1. **Error: `Database connection error: connect ECONNREFUSED 127.0.0.1:27017`**
   - **Reason**: MongoDB service is not started on the laptop.
   - **Fix**: Open Windows **Start Menu -> Services**, scroll down to **MongoDB Server**, right-click and click **Start**.

2. **Error: `Port 5000 is already in use` (EADDRINUSE)**
   - **Reason**: Another app is using port 5000.
   - **Fix**: Open `.env` and change `PORT=5000` to `PORT=5001`, then run `npm start` and visit `http://localhost:5001`.

3. **PowerShell Script Execution Error (`npm : File ... cannot be loaded because running scripts is disabled`)**
   - **Fix**: Run this command once in PowerShell:
     ```powershell
     Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
     ```
