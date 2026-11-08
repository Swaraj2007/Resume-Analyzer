const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const os = require('os');
const multer = require('multer');

dotenv.config();

const User = require('./models/User');
const Resume = require('./models/Resume');
const aiAnalyzer = require('./aiAnalyzer');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/resume_analyzer';
const JWT_SECRET = process.env.JWT_SECRET || 'resume_analyzer_super_secret_jwt_key_2026';

// Ensure uploads directory exists (use os.tmpdir() on Vercel serverless environment)
const uploadsDir = process.env.VERCEL
    ? path.join(os.tmpdir(), 'uploads')
    : path.join(__dirname, 'uploads');

if (!fs.existsSync(uploadsDir)) {
    try {
        fs.mkdirSync(uploadsDir, { recursive: true });
    } catch (e) {
        console.warn('Uploads directory warning:', e.message);
    }
}

// Multer Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'resume-' + uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['.pdf', '.doc', '.docx', '.txt'];
        const ext = path.extname(file.originalname).toLowerCase();
        if (allowedTypes.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Only PDF, DOC, DOCX, and TXT files are allowed'));
        }
    }
});

// Database connection helper for local and serverless execution
let dbPromise = null;
async function connectDB() {
    if (mongoose.connection.readyState === 1) {
        return;
    }
    if (!dbPromise) {
        dbPromise = mongoose.connect(MONGO_URI)
            .then(() => {
                console.log('Database connected successfully.');
            })
            .catch((err) => {
                dbPromise = null;
                console.error('Database connection error:', err);
                throw err;
            });
    }
    return dbPromise;
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Automatically ensure DB connection before handling API requests
app.use('/api', async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: 'Database connection failed. Please check your MONGO_URI configuration.'
        });
    }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname)));
app.use('/uploads', express.static(uploadsDir));

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Invalid or expired session token.' });
    }
};

// ========================
// API ROUTES
// ========================

// 1. Health & Connection Status
app.get('/api/health', (req, res) => {
    const isDbConnected = mongoose.connection.readyState === 1;
    res.json({
        status: 'ok',
        database: isDbConnected ? 'Connected' : 'Disconnected',
        readyState: mongoose.connection.readyState
    });
});

// 2. Sign Up Route
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { fullName, email, password } = req.body;

        if (!fullName || !email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide full name, email, and password.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long.' });
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
        }

        const newUser = new User({
            fullName,
            email: email.toLowerCase(),
            password
        });

        await newUser.save();

        const token = jwt.sign(
            { id: newUser._id, email: newUser.email, fullName: newUser.fullName },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            message: 'Account created successfully!',
            token,
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                hasCompletedProfile: false
            }
        });
    } catch (error) {
        console.error('Sign up error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error during sign up.' });
    }
});

// 3. Login Route
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide email and password.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user._id, email: user.email, fullName: user.fullName },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: 'Signed in successfully!',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                hasCompletedProfile: !!user.hasCompletedProfile
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error during sign in.' });
    }
});

// 4. Current User Profile
app.get('/api/auth/me', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found.' });
        }
        res.json({ success: true, user });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error retrieving user data.' });
    }
});

// 5. Store / Update Personal Details and Resume Data
app.post('/api/resume/save', authenticateToken, async (req, res) => {
    try {
        const {
            personalDetails,
            skills,
            experience,
            education,
            projects
        } = req.body;

        // Perform AI Analysis on provided profile data
        const analysisResult = aiAnalyzer.analyzeResumeContent({
            personalDetails: personalDetails || {},
            skills: skills || [],
            experience: experience || [],
            education: education || [],
            projects: projects || []
        }, '');

        const newResume = new Resume({
            user: req.user.id,
            personalDetails: personalDetails || {},
            skills: (skills && skills.length > 0) ? skills : (analysisResult.matchedKeywords || []),
            experience: experience || [],
            education: education || [],
            projects: projects || [],
            analysis: {
                ...analysisResult,
                extractedText: ''
            }
        });

        await newResume.save();

        await User.findByIdAndUpdate(req.user.id, { hasCompletedProfile: true });

        res.status(201).json({
            success: true,
            message: 'Personal details and resume saved & analyzed successfully!',
            resume: newResume
        });
    } catch (error) {
        console.error('Save resume error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to save resume details.' });
    }
});

// 6. Get All Resumes & Details for the Authenticated User (Auto-analyze legacy un-scored records)
app.get('/api/resume/my-resumes', authenticateToken, async (req, res) => {
    try {
        const resumes = await Resume.find({ user: req.user.id }).sort({ createdAt: -1 });

        // Auto-analyze legacy records if score is 0
        for (let i = 0; i < resumes.length; i++) {
            const item = resumes[i];
            if (!item.analysis || item.analysis.score === 0) {
                let rawText = '';
                if (item.fileDetails && item.fileDetails.fileName) {
                    const filePath = path.join(uploadsDir, item.fileDetails.fileName);
                    rawText = await aiAnalyzer.extractTextFromFile(filePath, item.fileDetails.originalName);
                }
                const analyzed = aiAnalyzer.analyzeResumeContent(item, rawText);
                item.analysis = {
                    ...analyzed,
                    extractedText: rawText ? rawText.substring(0, 5000) : ''
                };
                if ((!item.skills || item.skills.length === 0) && analyzed.matchedKeywords?.length > 0) {
                    item.skills = analyzed.matchedKeywords;
                }
                await item.save();
            }
        }

        res.json({ success: true, resumes });
    } catch (error) {
        console.error('Failed to retrieve resumes:', error);
        res.status(500).json({ success: false, message: 'Failed to retrieve resumes.' });
    }
});

// 7. Upload Resume File, Extract Text & Run AI Analysis
app.post('/api/resume/upload', authenticateToken, upload.single('resumeFile'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please select a resume file to upload.' });
        }

        const { fullName, email, phone, location, summary, skills } = req.body;
        const skillsArray = skills ? skills.split(',').map(s => s.trim()).filter(Boolean) : [];

        // Extract text from the uploaded document
        let extractedText = '';
        try {
            extractedText = await aiAnalyzer.extractTextFromFile(req.file.path, req.file.originalname);
        } catch (textErr) {
            console.warn('Text extraction warning:', textErr.message);
        }

        // Run AI Analysis
        const analysisResult = aiAnalyzer.analyzeResumeContent({
            personalDetails: {
                fullName: fullName || req.user.fullName,
                email: email || req.user.email,
                phone: phone || '',
                location: location || '',
                summary: summary || ''
            },
            skills: skillsArray
        }, extractedText);

        const resumeEntry = new Resume({
            user: req.user.id,
            personalDetails: {
                fullName: fullName || req.user.fullName,
                email: email || req.user.email,
                phone: phone || '',
                location: location || '',
                summary: summary || ''
            },
            skills: skillsArray.length > 0 ? skillsArray : (analysisResult.matchedKeywords || []),
            fileDetails: {
                originalName: req.file.originalname,
                fileName: req.file.filename,
                mimeType: req.file.mimetype,
                size: req.file.size,
                filePath: `/uploads/${req.file.filename}`
            },
            analysis: {
                ...analysisResult,
                extractedText: extractedText ? extractedText.substring(0, 5000) : ''
            }
        });

        await resumeEntry.save();

        res.status(201).json({
            success: true,
            message: 'Resume uploaded and analyzed successfully!',
            resume: resumeEntry
        });
    } catch (error) {
        console.error('File upload error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to upload resume file.' });
    }
});

// 8. Re-Analyze / Force Analyze a Specific Resume
app.post('/api/resume/:id/analyze', authenticateToken, async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found.' });
        }

        let rawText = '';
        if (resume.fileDetails && resume.fileDetails.fileName) {
            const filePath = path.join(uploadsDir, resume.fileDetails.fileName);
            rawText = await aiAnalyzer.extractTextFromFile(filePath, resume.fileDetails.originalName);
        }

        const analysisResult = aiAnalyzer.analyzeResumeContent(resume, rawText);

        resume.analysis = {
            ...analysisResult,
            extractedText: rawText ? rawText.substring(0, 5000) : (resume.analysis?.extractedText || '')
        };

        if ((!resume.skills || resume.skills.length === 0) && analysisResult.matchedKeywords?.length > 0) {
            resume.skills = analysisResult.matchedKeywords;
        }

        await resume.save();

        res.json({
            success: true,
            message: 'Resume re-analyzed successfully!',
            resume
        });
    } catch (error) {
        console.error('Analysis error:', error);
        res.status(500).json({ success: false, message: 'Failed to analyze resume.' });
    }
});

// 9. Get Single Resume Details & Analysis
app.get('/api/resume/:id', authenticateToken, async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, user: req.user.id });
        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found.' });
        }
        res.json({ success: true, resume });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to retrieve resume.' });
    }
});

// 10. Delete a Resume Entry
app.delete('/api/resume/:id', authenticateToken, async (req, res) => {
    try {
        const resume = await Resume.findOneAndDelete({ _id: req.params.id, user: req.user.id });
        if (!resume) {
            return res.status(404).json({ success: false, message: 'Resume not found.' });
        }

        // Remove file if exists
        if (resume.fileDetails && resume.fileDetails.fileName) {
            const filePath = path.join(uploadsDir, resume.fileDetails.fileName);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.json({ success: true, message: 'Resume deleted successfully.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete resume.' });
    }
});

// Connect Database & Start Server for local execution
if (require.main === module || !process.env.VERCEL) {
    connectDB()
        .then(() => {
            app.listen(PORT, () => {
                console.log(`Resume Analyzer server running on http://localhost:${PORT}`);
            });
        })
        .catch((err) => {
            console.error('Database connection error:', err);
        });
}

module.exports = app;
