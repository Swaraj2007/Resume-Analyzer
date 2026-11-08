const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    personalDetails: {
        fullName: { type: String, trim: true },
        email: { type: String, trim: true },
        phone: { type: String, trim: true },
        location: { type: String, trim: true },
        linkedin: { type: String, trim: true },
        github: { type: String, trim: true },
        portfolio: { type: String, trim: true },
        summary: { type: String, trim: true }
    },
    skills: [{
        type: String,
        trim: true
    }],
    experience: [{
        role: String,
        company: String,
        duration: String,
        description: String
    }],
    education: [{
        degree: String,
        institution: String,
        year: String,
        grade: String
    }],
    projects: [{
        title: String,
        technologies: String,
        description: String,
        link: String
    }],
    fileDetails: {
        originalName: String,
        fileName: String,
        mimeType: String,
        size: Number,
        filePath: String
    },
    analysis: {
        score: { type: Number, default: 0 },
        ratingLabel: { type: String, default: '' },
        ratingColor: { type: String, default: '' },
        categoryScores: {
            impact: { type: Number, default: 0 },
            skills: { type: Number, default: 0 },
            completeness: { type: Number, default: 0 },
            structure: { type: Number, default: 0 }
        },
        strengths: [String],
        weaknesses: [String],
        improvements: [String],
        matchedKeywords: [String],
        extractedText: { type: String, default: '' },
        analyzedAt: { type: Date }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt timestamp on save
resumeSchema.pre('save', function () {
    this.updatedAt = Date.now();
});

module.exports = mongoose.model('Resume', resumeSchema);
