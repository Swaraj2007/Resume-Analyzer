const fs = require('fs');
const path = require('path');
const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');

// Dictionary of Technical & Professional Skills
const SKILL_KEYWORDS = [
    // Languages
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'golang', 'go', 'rust',
    'php', 'ruby', 'swift', 'kotlin', 'scala', 'dart', 'r', 'sql', 'html', 'css', 'sass',
    // Frontend
    'react', 'react.js', 'vue', 'vue.js', 'angular', 'next.js', 'nuxt.js', 'svelte',
    'redux', 'tailwind', 'tailwindcss', 'bootstrap', 'material ui', 'webpack', 'vite',
    // Backend
    'node.js', 'nodejs', 'express', 'express.js', 'nest.js', 'nestjs', 'django',
    'flask', 'fastapi', 'spring', 'spring boot', 'laravel', 'asp.net', 'graphql', 'rest api', 'restful',
    // Databases
    'mongodb', 'postgresql', 'postgres', 'mysql', 'sqlite', 'redis', 'elasticsearch',
    'cassandra', 'dynamodb', 'firebase', 'supabase', 'oracle', 'prisma', 'mongoose',
    // Cloud & DevOps
    'aws', 'amazon web services', 'azure', 'google cloud', 'gcp', 'docker', 'kubernetes',
    'ci/cd', 'jenkins', 'github actions', 'gitlab ci', 'terraform', 'ansible', 'linux',
    'nginx', 'apache', 'serverless', 'microservices',
    // Data & AI
    'machine learning', 'deep learning', 'artificial intelligence', 'ai', 'data science',
    'pandas', 'numpy', 'scikit-learn', 'tensorflow', 'pytorch', 'nlp', 'data analysis',
    'power bi', 'tableau',
    // Tools & Methods
    'git', 'github', 'gitlab', 'jira', 'agile', 'scrum', 'kanban', 'unit testing',
    'jest', 'cypress', 'postman', 'figma'
];

// Powerful Action Verbs
const ACTION_VERBS = [
    'spearheaded', 'architected', 'developed', 'engineered', 'implemented', 'optimized',
    'designed', 'launched', 'delivered', 'orchestrated', 'built', 'led', 'directed',
    'increased', 'reduced', 'saved', 'automated', 'streamlined', 'transformed',
    'mentored', 'collaborated', 'scaled', 'refactored', 'accelerated', 'resolved',
    'integrated', 'managed', 'created', 'supervised', 'pioneered', 'championed'
];

// Passive or Weak Verbs/Phrases
const WEAK_PHRASES = [
    'responsible for', 'assisted with', 'helped to', 'worked on', 'duties included',
    'familiar with', 'participated in', 'attempted', 'supported'
];

/**
 * Extracts plain text from an uploaded file (PDF, DOCX, TXT)
 * @param {string} filePath - Absolute path to the file on disk
 * @param {string} originalName - Original uploaded filename
 * @returns {Promise<string>} Extracted text
 */
async function extractTextFromFile(filePath, originalName) {
    if (!fs.existsSync(filePath)) {
        return '';
    }

    const ext = path.extname(originalName || filePath).toLowerCase();

    try {
        if (ext === '.pdf') {
            const buffer = fs.readFileSync(filePath);
            const parser = new PDFParse({ data: buffer });
            const result = await parser.getText();
            if (typeof parser.destroy === 'function') {
                parser.destroy();
            }
            return (result && result.text) ? result.text : '';
        } else if (ext === '.docx' || ext === '.doc') {
            const result = await mammoth.extractRawText({ path: filePath });
            return result.value || '';
        } else if (ext === '.txt') {
            return fs.readFileSync(filePath, 'utf8') || '';
        }
    } catch (err) {
        console.error(`Error extracting text from ${originalName}:`, err.message);
    }

    return '';
}

/**
 * Analyzes resume content and generates score, strengths, weaknesses, and improvement suggestions
 * @param {Object} resumeData - Structured or parsed resume data
 * @param {string} rawText - Raw text extracted from file or forms
 * @returns {Object} Comprehensive analysis results
 */
function analyzeResumeContent(resumeData = {}, rawText = '') {
    // Combine all available text from structured fields and raw document text
    const textPieces = [
        rawText,
        resumeData.personalDetails ? Object.values(resumeData.personalDetails).filter(Boolean).join(' ') : '',
        Array.isArray(resumeData.skills) ? resumeData.skills.join(' ') : '',
        Array.isArray(resumeData.experience)
            ? resumeData.experience.map(e => `${e.role || ''} ${e.company || ''} ${e.description || ''}`).join(' ')
            : '',
        Array.isArray(resumeData.education)
            ? resumeData.education.map(e => `${e.degree || ''} ${e.institution || ''} ${e.grade || ''}`).join(' ')
            : '',
        Array.isArray(resumeData.projects)
            ? resumeData.projects.map(p => `${p.title || ''} ${p.technologies || ''} ${p.description || ''}`).join(' ')
            : ''
    ];

    const fullContent = textPieces.join('\n').toLowerCase();
    const wordCount = fullContent.split(/\s+/).filter(Boolean).length;

    // 1. Matched Skills Detection
    const detectedSkills = [];
    SKILL_KEYWORDS.forEach(skill => {
        const regex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(fullContent)) {
            // Capitalize display name
            const formatted = skill
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1))
                .join(' ');
            detectedSkills.push(formatted);
        }
    });

    // Also include manually specified skills if available
    if (Array.isArray(resumeData.skills)) {
        resumeData.skills.forEach(s => {
            const trimmed = s.trim();
            if (trimmed && !detectedSkills.some(d => d.toLowerCase() === trimmed.toLowerCase())) {
                detectedSkills.push(trimmed);
            }
        });
    }

    // 2. Action Verbs Count
    const foundActionVerbs = [];
    ACTION_VERBS.forEach(verb => {
        const regex = new RegExp(`\\b${verb}\\b`, 'i');
        if (regex.test(fullContent)) {
            foundActionVerbs.push(verb);
        }
    });

    // 3. Weak Phrases Count
    const foundWeakPhrases = [];
    WEAK_PHRASES.forEach(phrase => {
        if (fullContent.includes(phrase)) {
            foundWeakPhrases.push(phrase);
        }
    });

    // 4. Quantifiable Metrics Detection (e.g. 25%, $50K, 10x, 100+ users, 5+ years)
    const metricMatches = fullContent.match(/(\d+%\s*|\$\d+[\w]*|\b\d+x\b|\b\d+\+\s*(years|clients|users|projects|team|members|downloads)\b|\b\d+\s*(percent|growth|increase|decrease)\b)/gi) || [];
    const hasQuantifiableMetrics = metricMatches.length > 0;

    // 5. Contact & Links Detection
    const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(fullContent) || !!(resumeData.personalDetails && resumeData.personalDetails.email);
    const hasPhone = /(\+?\d{1,4}?[-.\s]?\(?\d{1,4}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9})/.test(fullContent) || !!(resumeData.personalDetails && resumeData.personalDetails.phone);
    const hasLinkedIn = /linkedin\.com/.test(fullContent) || !!(resumeData.personalDetails && resumeData.personalDetails.linkedin);
    const hasGitHub = /github\.com/.test(fullContent) || !!(resumeData.personalDetails && resumeData.personalDetails.github);
    const hasPortfolio = /(portfolio|website|https?:\/\/)/.test(fullContent) || !!(resumeData.personalDetails && resumeData.personalDetails.portfolio);

    // 6. Section Detection
    const hasSummary = fullContent.includes('summary') || fullContent.includes('objective') || fullContent.includes('about me') || !!(resumeData.personalDetails && resumeData.personalDetails.summary && resumeData.personalDetails.summary.length > 20);
    const hasExperience = fullContent.includes('experience') || fullContent.includes('employment') || fullContent.includes('work history') || (Array.isArray(resumeData.experience) && resumeData.experience.length > 0);
    const hasEducation = fullContent.includes('education') || fullContent.includes('university') || fullContent.includes('college') || fullContent.includes('bachelor') || fullContent.includes('degree') || (Array.isArray(resumeData.education) && resumeData.education.length > 0);
    const hasProjects = fullContent.includes('project') || fullContent.includes('portfolio') || (Array.isArray(resumeData.projects) && resumeData.projects.length > 0);

    // ----------------------------------------------------
    // Category Scoring (Each 0 - 100)
    // ----------------------------------------------------

    // A. Impact & Action Verbs (25%)
    let impactScore = 40;
    if (foundActionVerbs.length >= 6) impactScore += 30;
    else if (foundActionVerbs.length >= 3) impactScore += 20;
    else if (foundActionVerbs.length >= 1) impactScore += 10;

    if (metricMatches.length >= 4) impactScore += 30;
    else if (metricMatches.length >= 1) impactScore += 20;

    if (foundWeakPhrases.length > 0) impactScore = Math.max(20, impactScore - (foundWeakPhrases.length * 5));
    impactScore = Math.min(100, Math.max(30, impactScore));

    // B. Technical Depth & Skills (25%)
    let skillsScore = 30;
    if (detectedSkills.length >= 12) skillsScore += 65;
    else if (detectedSkills.length >= 8) skillsScore += 50;
    else if (detectedSkills.length >= 4) skillsScore += 35;
    else if (detectedSkills.length >= 1) skillsScore += 20;
    skillsScore = Math.min(100, Math.max(25, skillsScore));

    // C. Completeness & Contact Details (25%)
    let completenessScore = 30;
    if (hasEmail) completenessScore += 15;
    if (hasPhone) completenessScore += 15;
    if (hasLinkedIn || hasGitHub) completenessScore += 20;
    if (hasExperience) completenessScore += 10;
    if (hasEducation) completenessScore += 10;
    completenessScore = Math.min(100, Math.max(35, completenessScore));

    // D. Structure, Sections & Readability (25%)
    let structureScore = 40;
    if (hasSummary) structureScore += 20;
    if (hasProjects) structureScore += 20;
    if (wordCount >= 200 && wordCount <= 1200) structureScore += 20;
    else if (wordCount > 80) structureScore += 10;
    structureScore = Math.min(100, Math.max(30, structureScore));

    // Overall Score Calculation (Weighted)
    const overallScore = Math.round(
        (impactScore * 0.25) +
        (skillsScore * 0.25) +
        (completenessScore * 0.25) +
        (structureScore * 0.25)
    );

    // Qualitative Rating Label
    let ratingLabel = 'Needs Improvement';
    let ratingColor = '#ef4444'; // Red
    if (overallScore >= 85) {
        ratingLabel = 'Excellent (ATS Ready)';
        ratingColor = '#10b981'; // Emerald Green
    } else if (overallScore >= 70) {
        ratingLabel = 'Strong (Competitive)';
        ratingColor = '#06b6d4'; // Cyan
    } else if (overallScore >= 55) {
        ratingLabel = 'Average (Good Foundation)';
        ratingColor = '#f59e0b'; // Amber
    }

    // ----------------------------------------------------
    // Strengths Generation
    // ----------------------------------------------------
    const strengths = [];

    if (detectedSkills.length >= 5) {
        strengths.push(`Rich technical skill set with ${detectedSkills.length} relevant technologies identified (${detectedSkills.slice(0, 5).join(', ')}).`);
    } else if (detectedSkills.length > 0) {
        strengths.push(`Core competencies detected including ${detectedSkills.slice(0, 3).join(', ')}.`);
    }

    if (foundActionVerbs.length >= 3) {
        strengths.push(`Dynamic impact-driven wording utilizing powerful action verbs (${foundActionVerbs.slice(0, 4).join(', ')}).`);
    }

    if (hasQuantifiableMetrics) {
        strengths.push(`Includes measurable metrics and achievements (${metricMatches.slice(0, 2).join(', ')}), demonstrating clear business or engineering value.`);
    }

    if (hasLinkedIn && hasGitHub) {
        strengths.push('Complete modern professional online footprint with both LinkedIn and GitHub links provided.');
    } else if (hasLinkedIn || hasGitHub || hasPortfolio) {
        strengths.push('Good inclusion of verified professional profile links for recruiters to inspect your work.');
    }

    if (hasSummary) {
        strengths.push('Clear executive summary / objective statement establishing professional identity.');
    }

    if (hasExperience && hasEducation) {
        strengths.push('Well-structured layout featuring standard essential sections (Experience, Education, and Skills).');
    }

    if (strengths.length === 0) {
        strengths.push('Document contains baseline professional content ready for optimization.');
    }

    // ----------------------------------------------------
    // Weaknesses Generation
    // ----------------------------------------------------
    const weaknesses = [];

    if (!hasQuantifiableMetrics) {
        weaknesses.push('Absence of quantifiable metrics: Bullet points lack numbers, percentages, or concrete project outcomes to prove impact.');
    }

    if (foundActionVerbs.length < 3) {
        weaknesses.push('Low frequency of strong action verbs: Experiences read as passive task lists rather than proactive achievements.');
    }

    if (foundWeakPhrases.length > 0) {
        weaknesses.push(`Contains passive or generic phrasing (${foundWeakPhrases.slice(0, 2).map(p => `"${p}"`).join(', ')}), which reduces recruiter enthusiasm.`);
    }

    if (!hasLinkedIn && !hasGitHub) {
        weaknesses.push('Missing professional links: No LinkedIn or GitHub profile link found; modern tech recruiters expect online verification.');
    }

    if (!hasSummary) {
        weaknesses.push('Missing professional summary: Lacks an introductory summary highlighting your core specialization and career focus.');
    }

    if (detectedSkills.length < 5) {
        weaknesses.push(`Low keyword density: Only ${detectedSkills.length} industry keywords detected, which may cause ATS filters to discard the resume.`);
    }

    if (!hasProjects && (!resumeData.projects || resumeData.projects.length === 0)) {
        weaknesses.push('Missing dedicated projects section: Hands-on personal or client projects help validate applied skills.');
    }

    if (wordCount < 100 && wordCount > 0) {
        weaknesses.push('Resume content is very brief; insufficient depth to effectively evaluate your background.');
    }

    if (weaknesses.length === 0) {
        weaknesses.push('Minor formatting optimizations could further enhance readability.');
    }

    // ----------------------------------------------------
    // Basic Improvement Suggestions
    // ----------------------------------------------------
    const suggestions = [];

    if (!hasQuantifiableMetrics) {
        suggestions.push('Apply the Google "X-Y-Z" formula: "Accomplished [X], as measured by [Y], by doing [Z]" (e.g. "Increased database query speed by 40% by indexing frequently accessed MongoDB collections").');
    }

    if (foundActionVerbs.length < 4 || foundWeakPhrases.length > 0) {
        suggestions.push('Swap passive phrases like "responsible for" or "helped with" with high-impact power verbs like "Spearheaded", "Architected", "Automated", and "Scaled".');
    }

    if (!hasLinkedIn || !hasGitHub) {
        suggestions.push('Add clickable links to your LinkedIn profile and GitHub / portfolio at the very top of your resume header.');
    }

    if (!hasSummary) {
        suggestions.push('Add a concise 2-3 sentence Professional Summary at the top emphasizing your role, key technologies, and standout accomplishment.');
    }

    if (detectedSkills.length < 8) {
        suggestions.push('Group skills into clean categories (e.g., Languages, Frameworks, Cloud & DevOps, Databases) to maximize ATS readability.');
    }

    suggestions.push('Keep formatting consistent: Use standardized dates (e.g., "Jan 2023 - Present"), clean bullet points, and high-contrast typography.');

    return {
        score: overallScore,
        ratingLabel,
        ratingColor,
        categoryScores: {
            impact: impactScore,
            skills: skillsScore,
            completeness: completenessScore,
            structure: structureScore
        },
        strengths,
        weaknesses,
        improvements: suggestions,
        matchedKeywords: detectedSkills,
        metricsDetected: metricMatches,
        actionVerbsCount: foundActionVerbs.length,
        wordCount,
        hasSummary,
        hasExperience,
        hasEducation,
        hasProjects,
        analyzedAt: new Date()
    };
}

module.exports = {
    extractTextFromFile,
    analyzeResumeContent,
    SKILL_KEYWORDS,
    ACTION_VERBS
};
