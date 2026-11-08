/* ==========================================================================
   AI RESUME ANALYZER - DASHBOARD LOGIC (dashboard.js)
   SaaS Upgrade: Glider Tabs, Circular Gauge, Confetti, Search/Filter, Modals, Toasts
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. Session Verification & Authentication
    // ----------------------------------------------------------------------
    const token = localStorage.getItem('auth_token');
    const storedUser = localStorage.getItem('user');

    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    // ----------------------------------------------------------------------
    // 2. Global Toast Notification Helper
    // ----------------------------------------------------------------------
    const toastContainer = document.getElementById('toastContainer');

    function showToast(title, message, type = 'info', duration = 4000) {
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        const iconMap = {
            success: '✨',
            error: '⚠️',
            info: 'ℹ️'
        };

        toast.innerHTML = `
            <span class="toast-icon">${iconMap[type] || 'ℹ️'}</span>
            <div class="toast-content">
                <div class="toast-title">${escapeHtml(title)}</div>
                <div class="toast-message">${escapeHtml(message)}</div>
            </div>
            <button class="toast-close-btn" aria-label="Close notification">&times;</button>
            <div class="toast-progress" style="animation-duration: ${duration}ms;"></div>
        `;

        const closeBtn = toast.querySelector('.toast-close-btn');
        closeBtn.addEventListener('click', () => removeToast(toast));

        toastContainer.appendChild(toast);

        const timer = setTimeout(() => removeToast(toast), duration);

        function removeToast(t) {
            clearTimeout(timer);
            t.classList.add('hide');
            setTimeout(() => {
                if (t.parentNode) t.parentNode.removeChild(t);
            }, 300);
        }
    }

    function showAlert(alertEl, message, type) {
        if (!alertEl) return;
        alertEl.className = `alert-box show ${type}`;
        alertEl.textContent = message;
        setTimeout(() => {
            alertEl.className = 'alert-box';
        }, 5000);
    }

    // ----------------------------------------------------------------------
    // 3. Theme Toggle & Persistence
    // ----------------------------------------------------------------------
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const themeToggleBtn = document.getElementById('themeToggleBtn');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const current = document.documentElement.getAttribute('data-theme') || 'dark';
            const next = current === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', next);
            localStorage.setItem('theme', next);
            showToast('Theme Changed', `Switched to ${next} mode`, 'info', 2500);
        });
    }

    // ----------------------------------------------------------------------
    // 4. Sticky Navbar Scroll State
    // ----------------------------------------------------------------------
    const topNavbar = document.getElementById('topNavbar');
    window.addEventListener('scroll', () => {
        if (!topNavbar) return;
        if (window.scrollY > 20) {
            topNavbar.classList.add('scrolled');
        } else {
            topNavbar.classList.remove('scrolled');
        }
    }, { passive: true });

    // ----------------------------------------------------------------------
    // 5. Selectors & DOM Bindings
    // ----------------------------------------------------------------------
    const userNameEl = document.getElementById('userName');
    const userEmailEl = document.getElementById('userEmail');
    const userAvatarEl = document.getElementById('userAvatar');
    const userProfileBtn = document.getElementById('userProfileBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const recordCountEl = document.getElementById('recordCount');

    // Modals
    const personalModal = document.getElementById('personalModal');
    const closePersonalModalBtn = document.getElementById('closePersonalModalBtn');
    const cancelPersonalBtn = document.getElementById('cancelPersonalBtn');
    const onboardingBanner = document.getElementById('onboardingBanner');
    const personalDetailsForm = document.getElementById('personalDetailsForm');
    const personalAlert = document.getElementById('personalAlert');
    const savePersonalBtn = document.getElementById('savePersonalBtn');

    // Delete Confirmation Modal
    const deleteConfirmModal = document.getElementById('deleteConfirmModal');
    const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
    const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
    let itemPendingDeletionId = null;
    let cardPendingDeletionEl = null;

    // Tabs & Glider
    const tabsNav = document.getElementById('tabsNav');
    const tabPillGlider = document.getElementById('tabPillGlider');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabPanels = document.querySelectorAll('.tab-panel');
    const tabBtnUpload = document.getElementById('tabBtnUpload');
    const tabBtnAnalysis = document.getElementById('tabBtnAnalysis');
    const tabBtnHistory = document.getElementById('tabBtnHistory');
    const analysisActiveDot = document.getElementById('analysisActiveDot');

    // Upload Form Elements
    const resumeUploadForm = document.getElementById('resumeUploadForm');
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('resumeFileInput');
    const selectedFileName = document.getElementById('selectedFileName');
    const previewFileName = document.getElementById('previewFileName');
    const previewFileSize = document.getElementById('previewFileSize');
    const removeFileBtn = document.getElementById('removeFileBtn');
    const uploadSubmitBtn = document.getElementById('uploadSubmitBtn');
    const uploadAlert = document.getElementById('uploadAlert');
    const uploadProgress = document.getElementById('uploadProgress');
    const uploadProgressBar = document.getElementById('uploadProgressBar');
    const uploadProgressText = document.getElementById('uploadProgressText');

    // Analysis View Elements
    const analysisEmptyState = document.getElementById('analysisEmptyState');
    const analysisContent = document.getElementById('analysisContent');
    const emptyGoUploadBtn = document.getElementById('emptyGoUploadBtn');
    const emptyGoHistoryBtn = document.getElementById('emptyGoHistoryBtn');

    const analysisTypeBadge = document.getElementById('analysisTypeBadge');
    const analysisResumeTitle = document.getElementById('analysisResumeTitle');
    const analysisCandidateName = document.getElementById('analysisCandidateName');
    const analysisCandidateEmail = document.getElementById('analysisCandidateEmail');
    const analysisDate = document.getElementById('analysisDate');
    const analysisReanalyzeBtn = document.getElementById('analysisReanalyzeBtn');
    const analysisViewDocBtn = document.getElementById('analysisViewDocBtn');

    const scoreCircleProgress = document.getElementById('scoreCircleProgress');
    const analysisOverallScore = document.getElementById('analysisOverallScore');
    const analysisRatingBadge = document.getElementById('analysisRatingBadge');
    const analysisScoreSummary = document.getElementById('analysisScoreSummary');
    const gaugeGlow = document.getElementById('gaugeGlow');

    const statActionVerbs = document.getElementById('statActionVerbs');
    const statSkillsCount = document.getElementById('statSkillsCount');
    const statMetricsCount = document.getElementById('statMetricsCount');
    const statWordCount = document.getElementById('statWordCount');

    const catScoreImpact = document.getElementById('catScoreImpact');
    const catFillImpact = document.getElementById('catFillImpact');
    const catScoreSkills = document.getElementById('catScoreSkills');
    const catFillSkills = document.getElementById('catFillSkills');
    const catScoreCompleteness = document.getElementById('catScoreCompleteness');
    const catFillCompleteness = document.getElementById('catFillCompleteness');
    const catScoreStructure = document.getElementById('catScoreStructure');
    const catFillStructure = document.getElementById('catFillStructure');

    const analysisStrengthsList = document.getElementById('analysisStrengthsList');
    const analysisWeaknessesList = document.getElementById('analysisWeaknessesList');
    const analysisSuggestionsList = document.getElementById('analysisSuggestionsList');
    const analysisSkillsContainer = document.getElementById('analysisSkillsContainer');
    const keywordsCountBadge = document.getElementById('keywordsCountBadge');

    const toggleExtractedTextBtn = document.getElementById('toggleExtractedTextBtn');
    const extractedTextBody = document.getElementById('extractedTextBody');
    const extractedTextContent = document.getElementById('extractedTextContent');
    const copyExtractedTextBtn = document.getElementById('copyExtractedTextBtn');

    // History & Records Elements
    const recordsContainer = document.getElementById('recordsContainer');
    const refreshRecordsBtn = document.getElementById('refreshRecordsBtn');
    const historySearchInput = document.getElementById('historySearchInput');
    const clearHistorySearchBtn = document.getElementById('clearHistorySearchBtn');
    const historyFilterPills = document.getElementById('historyFilterPills');
    const historySortSelect = document.getElementById('historySortSelect');

    // State Variables
    let currentActiveResume = null;
    let cachedResumesList = [];
    let currentFilterTier = 'all';
    let currentSortOption = 'newest';
    let currentSearchTerm = '';

    // ----------------------------------------------------------------------
    // 6. User Verification with Backend (/api/auth/me)
    // ----------------------------------------------------------------------
    if (storedUser) {
        try {
            const userObj = JSON.parse(storedUser);
            if (userObj.fullName) {
                userNameEl.textContent = userObj.fullName;
                userAvatarEl.textContent = userObj.fullName.charAt(0).toUpperCase();
                document.getElementById('fullName').value = userObj.fullName;
                document.getElementById('uploadFullName').value = userObj.fullName;
            }
            if (userObj.email) {
                userEmailEl.textContent = userObj.email;
                document.getElementById('email').value = userObj.email;
            }
        } catch (e) {
            console.error('Failed to parse cached user:', e);
        }
    }

    async function verifyUser() {
        try {
            const res = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!res.ok) {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('user');
                window.location.href = 'index.html';
                return;
            }
            const data = await res.json();
            if (data.user) {
                userNameEl.textContent = data.user.fullName;
                userEmailEl.textContent = data.user.email;
                userAvatarEl.textContent = data.user.fullName.charAt(0).toUpperCase();
                if (!document.getElementById('fullName').value) {
                    document.getElementById('fullName').value = data.user.fullName;
                }
                if (!document.getElementById('uploadFullName').value) {
                    document.getElementById('uploadFullName').value = data.user.fullName;
                }
                if (!document.getElementById('email').value) {
                    document.getElementById('email').value = data.user.email;
                }
            }
        } catch (err) {
            console.error('Failed to verify session:', err);
        }
    }
    verifyUser();

    // ----------------------------------------------------------------------
    // 7. Onboarding Modal Check
    // ----------------------------------------------------------------------
    const urlParams = new URLSearchParams(window.location.search);
    const isOnboarding = urlParams.get('onboarding') === 'true' || localStorage.getItem('is_new_signup') === 'true';

    if (isOnboarding) {
        personalModal.classList.add('open');
        onboardingBanner.style.display = 'block';
        localStorage.removeItem('is_new_signup');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (userProfileBtn) {
        userProfileBtn.addEventListener('click', () => {
            onboardingBanner.style.display = 'none';
            personalModal.classList.add('open');
        });
    }

    // Modal Close Triggers
    function closePersonalModal() {
        personalModal.classList.remove('open');
    }

    if (closePersonalModalBtn) closePersonalModalBtn.addEventListener('click', closePersonalModal);
    if (cancelPersonalBtn) cancelPersonalBtn.addEventListener('click', closePersonalModal);

    personalModal.addEventListener('click', (e) => {
        if (e.target === personalModal) closePersonalModal();
    });

    // ESC key closes modals
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closePersonalModal();
            closeDeleteModal();
        }
    });

    // Sign Out Handler
    logoutBtn.addEventListener('click', () => {
        showToast('Signing Out', 'Session ended successfully. See you soon!', 'info', 2000);
        setTimeout(() => {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('user');
            localStorage.removeItem('is_new_signup');
            window.location.href = 'index.html';
        }, 600);
    });

    // ----------------------------------------------------------------------
    // 8. Sliding Tab Glider & Tab Switching
    // ----------------------------------------------------------------------
    function updateTabGlider(activeBtn) {
        if (!tabPillGlider || !activeBtn) return;
        const navRect = tabsNav.getBoundingClientRect();
        const btnRect = activeBtn.getBoundingClientRect();

        const offsetLeft = btnRect.left - navRect.left;
        tabPillGlider.style.left = `${offsetLeft}px`;
        tabPillGlider.style.width = `${btnRect.width}px`;
    }

    function switchTab(targetTabId) {
        tabButtons.forEach(b => {
            b.classList.remove('active');
            b.setAttribute('aria-selected', 'false');
        });
        tabPanels.forEach(p => p.classList.remove('active'));

        const targetBtn = document.querySelector(`.tab-btn[data-tab="${targetTabId}"]`);
        const targetPanel = document.getElementById(targetTabId);

        if (targetBtn) {
            targetBtn.classList.add('active');
            targetBtn.setAttribute('aria-selected', 'true');
            updateTabGlider(targetBtn);
        }
        if (targetPanel) {
            targetPanel.classList.add('active');
        }

        if (targetTabId === 'records-tab') {
            loadRecords();
        }
    }

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.getAttribute('data-tab');
            switchTab(target);
        });
    });

    if (emptyGoUploadBtn) emptyGoUploadBtn.addEventListener('click', () => switchTab('upload-tab'));
    if (emptyGoHistoryBtn) emptyGoHistoryBtn.addEventListener('click', () => switchTab('records-tab'));

    // Recalculate glider on resize
    window.addEventListener('resize', () => {
        const activeBtn = document.querySelector('.tab-btn.active');
        if (activeBtn) updateTabGlider(activeBtn);
    }, { passive: true });

    // Initial glider alignment
    setTimeout(() => {
        const activeBtn = document.querySelector('.tab-btn.active');
        if (activeBtn) updateTabGlider(activeBtn);
    }, 100);

    // ----------------------------------------------------------------------
    // 9. File Drag & Drop + Preview Card
    // ----------------------------------------------------------------------
    function handleFileSelection(file) {
        if (!file) return;

        const ext = file.name.split('.').pop().toLowerCase();
        const allowedExts = ['pdf', 'doc', 'docx', 'txt'];

        if (!allowedExts.includes(ext)) {
            showAlert(uploadAlert, 'Unsupported file type. Please upload a PDF, DOCX, DOC, or TXT file.', 'error');
            showToast('Invalid File', 'Only PDF, DOCX, DOC, or TXT files are accepted.', 'error');
            fileInput.value = '';
            selectedFileName.style.display = 'none';
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            showAlert(uploadAlert, 'File size exceeds 10MB limit.', 'error');
            showToast('File Too Large', 'Maximum allowed file size is 10MB.', 'error');
            fileInput.value = '';
            selectedFileName.style.display = 'none';
            return;
        }

        previewFileName.textContent = file.name;
        previewFileSize.textContent = `${(file.size / 1024).toFixed(1)} KB`;
        selectedFileName.style.display = 'inline-block';
        showToast('File Attached', `${file.name} ready for evaluation.`, 'info', 2500);
    }

    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) {
            handleFileSelection(fileInput.files[0]);
        } else {
            selectedFileName.style.display = 'none';
        }
    });

    if (removeFileBtn) {
        removeFileBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileInput.value = '';
            selectedFileName.style.display = 'none';
            showToast('File Removed', 'Selection cleared.', 'info', 2000);
        });
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.add('drag-over');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            dropzone.classList.remove('drag-over');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        if (dt.files && dt.files.length > 0) {
            fileInput.files = dt.files;
            handleFileSelection(dt.files[0]);
        }
    });

    // ----------------------------------------------------------------------
    // 10. Upload Resume Document (POST /api/resume/upload)
    // ----------------------------------------------------------------------
    resumeUploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        if (!fileInput.files.length) {
            showAlert(uploadAlert, 'Please select a resume file first.', 'error');
            showToast('File Required', 'Please drag & drop or browse a resume file.', 'error');
            return;
        }

        uploadSubmitBtn.disabled = true;
        uploadSubmitBtn.innerHTML = '<span class="btn-icon">⏳</span><span class="btn-text">Analyzing Resume...</span>';
        uploadProgress.style.display = 'block';

        const stepNodes = [
            document.getElementById('stepNode1'),
            document.getElementById('stepNode2'),
            document.getElementById('stepNode3'),
            document.getElementById('stepNode4')
        ];
        const stepLines = [
            document.getElementById('stepLine1'),
            document.getElementById('stepLine2'),
            document.getElementById('stepLine3')
        ];

        const stages = [
            'Uploading document to server...',
            'Extracting text and identifying document sections...',
            'Evaluating technical depth and action verbs...',
            'Computing ATS score and generating improvement suggestions...'
        ];

        let currentStage = 0;
        const progressInterval = setInterval(() => {
            currentStage = (currentStage + 1) % stages.length;
            uploadProgressText.textContent = stages[currentStage];

            stepNodes.forEach((node, i) => {
                if (i <= currentStage) node.classList.add('active');
                else node.classList.remove('active');
            });

            stepLines.forEach((line, i) => {
                if (i < currentStage) line.classList.add('active');
                else line.classList.remove('active');
            });
        }, 1100);

        const formData = new FormData();
        formData.append('resumeFile', fileInput.files[0]);
        formData.append('fullName', document.getElementById('uploadFullName').value.trim());
        formData.append('phone', document.getElementById('uploadPhone').value.trim());
        formData.append('skills', document.getElementById('uploadSkills').value.trim());

        try {
            const res = await fetch('/api/resume/upload', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const data = await res.json();
            clearInterval(progressInterval);

            if (res.ok && data.success) {
                showAlert(uploadAlert, 'Resume uploaded and analyzed successfully!', 'success');
                showToast('Evaluation Complete', 'Your resume has been scored and analyzed.', 'success', 3500);

                resumeUploadForm.reset();
                selectedFileName.style.display = 'none';

                if (data.resume) {
                    renderAnalysis(data.resume);
                    switchTab('analysis-tab');
                }
                loadRecords();
            } else {
                showAlert(uploadAlert, data.message || 'Failed to upload and analyze resume.', 'error');
                showToast('Upload Failed', data.message || 'Error parsing resume.', 'error');
            }
        } catch (err) {
            clearInterval(progressInterval);
            showAlert(uploadAlert, 'Connection error while uploading resume.', 'error');
            showToast('Connection Error', 'Server did not respond.', 'error');
        } finally {
            uploadProgress.style.display = 'none';
            uploadSubmitBtn.disabled = false;
            uploadSubmitBtn.innerHTML = '<span class="btn-icon">⚡</span><span class="btn-text">Upload & Run AI Analysis</span>';
        }
    });

    // ----------------------------------------------------------------------
    // 11. Save Personal Details (POST /api/resume/save)
    // ----------------------------------------------------------------------
    personalDetailsForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        savePersonalBtn.disabled = true;
        savePersonalBtn.innerHTML = '<span class="btn-icon">⏳</span> Saving & Analyzing...';

        const payload = {
            personalDetails: {
                fullName: document.getElementById('fullName').value.trim(),
                email: document.getElementById('email').value.trim(),
                phone: document.getElementById('phone').value.trim(),
                location: document.getElementById('location').value.trim(),
                linkedin: document.getElementById('linkedin').value.trim(),
                github: document.getElementById('github').value.trim(),
                summary: document.getElementById('summary').value.trim()
            },
            skills: document.getElementById('skills').value
                .split(',')
                .map(s => s.trim())
                .filter(Boolean),
            experience: [],
            education: []
        };

        const expRole = document.getElementById('expRole').value.trim();
        const expCompany = document.getElementById('expCompany').value.trim();
        const expDuration = document.getElementById('expDuration').value.trim();
        const expDesc = document.getElementById('expDesc').value.trim();

        if (expRole || expCompany) {
            payload.experience.push({
                role: expRole,
                company: expCompany,
                duration: expDuration,
                description: expDesc
            });
        }

        const eduDegree = document.getElementById('eduDegree').value.trim();
        const eduInst = document.getElementById('eduInst').value.trim();
        const eduYear = document.getElementById('eduYear').value.trim();

        if (eduDegree || eduInst) {
            payload.education.push({
                degree: eduDegree,
                institution: eduInst,
                year: eduYear
            });
        }

        try {
            const res = await fetch('/api/resume/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (res.ok && data.success) {
                showAlert(personalAlert, 'Profile details saved and analyzed successfully!', 'success');
                showToast('Profile Saved', 'Profile evaluated and score calculated.', 'success', 3000);

                if (payload.personalDetails.fullName) {
                    userNameEl.textContent = payload.personalDetails.fullName;
                    userAvatarEl.textContent = payload.personalDetails.fullName.charAt(0).toUpperCase();
                }

                loadRecords();
                if (data.resume) {
                    renderAnalysis(data.resume);
                }

                setTimeout(() => {
                    closePersonalModal();
                    switchTab('analysis-tab');
                }, 800);
            } else {
                showAlert(personalAlert, data.message || 'Failed to save details.', 'error');
                showToast('Save Failed', data.message || 'Failed to save profile.', 'error');
            }
        } catch (err) {
            showAlert(personalAlert, 'Connection error while saving details.', 'error');
            showToast('Connection Error', 'Server did not respond.', 'error');
        } finally {
            savePersonalBtn.disabled = false;
            savePersonalBtn.innerHTML = '<span class="btn-icon">💾</span> Save & Run AI Analysis';
        }
    });

    // ----------------------------------------------------------------------
    // 12. Render Analysis View (Circular Gauge, Stats, Checklist, Badges)
    // ----------------------------------------------------------------------
    function renderAnalysis(resume) {
        if (!resume) return;
        currentActiveResume = resume;

        const analysis = resume.analysis || {};
        const score = analysis.score || 0;
        const ratingLabel = analysis.ratingLabel || getScoreLabel(score);
        const ratingColor = analysis.ratingColor || getScoreColor(score);
        const categoryScores = analysis.categoryScores || { impact: 40, skills: 40, completeness: 40, structure: 40 };

        // Toggle empty state vs active content
        analysisEmptyState.style.display = 'none';
        analysisContent.style.display = 'block';
        analysisActiveDot.style.display = 'inline-block';

        // Title and Meta
        const isFile = !!(resume.fileDetails && resume.fileDetails.originalName);
        analysisTypeBadge.textContent = isFile ? `Document File (${pathExt(resume.fileDetails.originalName)})` : 'Profile Form';
        analysisResumeTitle.textContent = isFile ? resume.fileDetails.originalName : (resume.personalDetails?.fullName ? `${resume.personalDetails.fullName}'s Profile` : 'Resume Record');

        analysisCandidateName.textContent = resume.personalDetails?.fullName || 'Candidate';
        analysisCandidateEmail.textContent = resume.personalDetails?.email || 'No email provided';

        const analyzedDateObj = analysis.analyzedAt ? new Date(analysis.analyzedAt) : new Date(resume.createdAt || Date.now());
        analysisDate.textContent = analyzedDateObj.toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        });

        // View File Link
        if (resume.fileDetails && resume.fileDetails.filePath) {
            analysisViewDocBtn.href = resume.fileDetails.filePath;
            analysisViewDocBtn.style.display = 'inline-flex';
        } else {
            analysisViewDocBtn.style.display = 'none';
        }

        // Animate circular score gauge
        animateScore(score, ratingColor);

        // Rating Badge
        analysisRatingBadge.textContent = ratingLabel;
        analysisRatingBadge.style.background = hexToRgba(ratingColor, 0.15);
        analysisRatingBadge.style.color = ratingColor;
        analysisRatingBadge.style.borderColor = hexToRgba(ratingColor, 0.4);

        if (gaugeGlow) {
            gaugeGlow.style.background = hexToRgba(ratingColor, 0.35);
        }

        // Confetti celebration for top tier (>=85)
        if (score >= 85) {
            fireConfetti();
        }

        // Score summary description
        if (score >= 85) {
            analysisScoreSummary.textContent = 'Outstanding resume! Your resume features rich skill keywords, impact action verbs, and clear quantifiable achievements ready for top-tier ATS screening.';
        } else if (score >= 70) {
            analysisScoreSummary.textContent = 'Competitive resume with a strong technical foundation. Minor additions of measurable business metrics and leadership power verbs will elevate it to top percentile.';
        } else if (score >= 55) {
            analysisScoreSummary.textContent = 'Solid baseline. To stand out in ATS filters, incorporate more technical keywords, add measurable outcomes (e.g. percentages), and add an executive summary.';
        } else {
            analysisScoreSummary.textContent = 'Requires key improvements. Enhance depth by adding strong action verbs, quantifiable metrics, LinkedIn/GitHub links, and comprehensive project descriptions.';
        }

        // Quick Stats count-up
        animateCountUp(statActionVerbs, analysis.actionVerbsCount !== undefined ? analysis.actionVerbsCount : countActionVerbs(resume));
        const skillsList = resume.skills || analysis.matchedKeywords || [];
        animateCountUp(statSkillsCount, skillsList.length);
        statMetricsCount.textContent = (analysis.metricsDetected && analysis.metricsDetected.length) || (hasMetrics(resume) ? 'Yes' : '0');
        animateCountUp(statWordCount, analysis.wordCount || estimateWords(resume));

        // 4 Category Progress Bars
        setCategoryScore('Impact', categoryScores.impact || 40);
        setCategoryScore('Skills', categoryScores.skills || 40);
        setCategoryScore('Completeness', categoryScores.completeness || 40);
        setCategoryScore('Structure', categoryScores.structure || 40);

        // Strengths
        const strengths = (analysis.strengths && analysis.strengths.length > 0)
            ? analysis.strengths
            : ['Core professional competencies detected.', 'Standard essential resume sections present.'];
        analysisStrengthsList.innerHTML = strengths.map(s => `<li>${escapeHtml(s)}</li>`).join('');

        // Weaknesses
        const weaknesses = (analysis.weaknesses && analysis.weaknesses.length > 0)
            ? analysis.weaknesses
            : ['Minor optimizations in quantifiable results could further enhance recruiter engagement.'];
        analysisWeaknessesList.innerHTML = weaknesses.map(w => `<li>${escapeHtml(w)}</li>`).join('');

        // Suggestions (Interactive Checklist)
        const suggestions = (analysis.improvements && analysis.improvements.length > 0)
            ? analysis.improvements
            : [
                'Quantify your accomplishments using the formula: "Accomplished [X] as measured by [Y] by doing [Z]".',
                'Incorporate verified profile URLs like LinkedIn and GitHub to showcase public repositories.',
                'Organize technical skills into distinct categories (Languages, Frameworks, Cloud, Databases).'
            ];

        analysisSuggestionsList.innerHTML = suggestions.map((sug, idx) => `
            <div class="suggestion-item" data-index="${idx}" role="checkbox" aria-checked="false" tabindex="0">
                <span class="suggestion-num">${idx + 1}</span>
                <span class="suggestion-text">${escapeHtml(sug)}</span>
            </div>
        `).join('');

        // Attach checklist toggle interaction
        analysisSuggestionsList.querySelectorAll('.suggestion-item').forEach(item => {
            item.addEventListener('click', () => {
                const isChecked = item.classList.toggle('completed');
                item.setAttribute('aria-checked', isChecked ? 'true' : 'false');
                const num = item.querySelector('.suggestion-num');
                if (num) {
                    num.textContent = isChecked ? '✓' : (parseInt(item.getAttribute('data-index'), 10) + 1);
                }
            });
        });

        // Detected Skills & Keywords
        if (skillsList.length > 0) {
            keywordsCountBadge.textContent = `${skillsList.length} Detected`;
            analysisSkillsContainer.innerHTML = skillsList.map(s => `
                <span class="skill-tag-pill" title="Detected Skill Keyword">⚡ ${escapeHtml(s)}</span>
            `).join('');
        } else {
            keywordsCountBadge.textContent = '0 Detected';
            analysisSkillsContainer.innerHTML = '<span class="empty-tag">No skills detected.</span>';
        }

        // Extracted Text Preview
        const extractedText = analysis.extractedText || '';
        extractedTextContent.textContent = extractedText || 'No extracted text available for this entry.';
    }

    // Helper: Category score bar
    function setCategoryScore(catName, value) {
        const scoreEl = document.getElementById(`catScore${catName}`);
        const fillEl = document.getElementById(`catFill${catName}`);
        if (scoreEl) scoreEl.textContent = `${value}%`;
        if (fillEl) fillEl.style.width = `${value}%`;
    }

    // Animate Circular Gauge & Score Counter
    function animateScore(targetScore, color) {
        const circumference = 427.26; // 2 * Math.PI * 68
        const targetOffset = circumference - (circumference * targetScore / 100);

        scoreCircleProgress.style.stroke = color;
        scoreCircleProgress.style.strokeDashoffset = targetOffset;

        // Counter count-up
        let current = 0;
        const duration = 1000;
        const stepTime = 16;
        const increment = targetScore / (duration / stepTime);

        const counter = setInterval(() => {
            current += increment;
            if (current >= targetScore) {
                analysisOverallScore.textContent = targetScore;
                clearInterval(counter);
            } else {
                analysisOverallScore.textContent = Math.round(current);
            }
        }, stepTime);
    }

    // Animate count-up for quick stat numbers
    function animateCountUp(element, target) {
        if (!element || isNaN(target)) return;
        const targetNum = parseInt(target, 10);
        if (targetNum === 0) {
            element.textContent = '0';
            return;
        }

        let current = 0;
        const duration = 800;
        const stepTime = 20;
        const increment = Math.max(1, Math.ceil(targetNum / (duration / stepTime)));

        const timer = setInterval(() => {
            current += increment;
            if (current >= targetNum) {
                element.textContent = targetNum;
                clearInterval(timer);
            } else {
                element.textContent = current;
            }
        }, stepTime);
    }

    // Canvas Confetti Celebration
    function fireConfetti() {
        if (typeof window.confetti === 'function') {
            window.confetti({
                particleCount: 80,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b']
            });
        }
    }

    // Re-Analyze Current Active Resume
    if (analysisReanalyzeBtn) {
        analysisReanalyzeBtn.addEventListener('click', async () => {
            if (!currentActiveResume) return;
            analysisReanalyzeBtn.disabled = true;
            analysisReanalyzeBtn.innerHTML = '<span class="btn-icon">⏳</span> Analyzing...';

            try {
                const res = await fetch(`/api/resume/${currentActiveResume._id}/analyze`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (res.ok && data.success && data.resume) {
                    renderAnalysis(data.resume);
                    loadRecords();
                    showToast('Re-Analysis Complete', 'Resume evaluation refreshed.', 'success', 3000);
                } else {
                    showToast('Re-Analyze Failed', data.message || 'Could not re-evaluate.', 'error');
                }
            } catch (e) {
                showToast('Connection Error', 'Failed to reach server.', 'error');
            } finally {
                analysisReanalyzeBtn.disabled = false;
                analysisReanalyzeBtn.innerHTML = '<span class="btn-icon">🔄</span> Re-Analyze';
            }
        });
    }

    // Extracted Text Accordion Toggle
    if (toggleExtractedTextBtn) {
        toggleExtractedTextBtn.addEventListener('click', (e) => {
            if (e.target.closest('#copyExtractedTextBtn')) return; // ignore if copy button clicked
            const isOpen = extractedTextBody.style.display !== 'none';
            extractedTextBody.style.display = isOpen ? 'none' : 'block';
            toggleExtractedTextBtn.classList.toggle('open', !isOpen);
        });
    }

    // Copy Extracted Text Button
    if (copyExtractedTextBtn) {
        copyExtractedTextBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const textToCopy = extractedTextContent.textContent;
            if (!textToCopy || textToCopy.startsWith('No extracted text')) {
                showToast('No Text', 'No extracted content available to copy.', 'info', 2000);
                return;
            }

            try {
                await navigator.clipboard.writeText(textToCopy);
                copyExtractedTextBtn.textContent = '✓ Copied!';
                showToast('Copied', 'Extracted text copied to clipboard.', 'success', 2500);
                setTimeout(() => {
                    copyExtractedTextBtn.textContent = '📋 Copy Text';
                }, 2000);
            } catch (err) {
                showToast('Copy Failed', 'Clipboard access not permitted.', 'error');
            }
        });
    }

    // ----------------------------------------------------------------------
    // 13. Resume History & Filtering System
    // ----------------------------------------------------------------------
    if (refreshRecordsBtn) {
        refreshRecordsBtn.addEventListener('click', () => {
            loadRecords();
            showToast('Refreshed', 'Resume records synchronized.', 'info', 2000);
        });
    }

    async function loadRecords() {
        recordsContainer.innerHTML = '<div class="loading-spinner">Fetching saved records...</div>';

        try {
            const res = await fetch('/api/resume/my-resumes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                recordsContainer.innerHTML = `<div class="empty-records">Error: ${escapeHtml(data.message || 'Could not fetch records.')}</div>`;
                return;
            }

            const resumes = data.resumes || [];
            cachedResumesList = resumes;
            recordCountEl.textContent = resumes.length;

            if (!currentActiveResume && resumes.length > 0) {
                renderAnalysis(resumes[0]);
            }

            renderFilteredRecords();
        } catch (err) {
            recordsContainer.innerHTML = '<div class="empty-records">Failed to connect to server.</div>';
        }
    }

    // History Search Handler
    if (historySearchInput) {
        historySearchInput.addEventListener('input', () => {
            currentSearchTerm = historySearchInput.value.trim().toLowerCase();
            if (clearHistorySearchBtn) {
                clearHistorySearchBtn.style.display = currentSearchTerm ? 'block' : 'none';
            }
            renderFilteredRecords();
        });
    }

    if (clearHistorySearchBtn) {
        clearHistorySearchBtn.addEventListener('click', () => {
            historySearchInput.value = '';
            currentSearchTerm = '';
            clearHistorySearchBtn.style.display = 'none';
            renderFilteredRecords();
        });
    }

    // History Tier Filter Pills
    if (historyFilterPills) {
        historyFilterPills.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                historyFilterPills.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                currentFilterTier = pill.getAttribute('data-filter') || 'all';
                renderFilteredRecords();
            });
        });
    }

    // History Sort Select
    if (historySortSelect) {
        historySortSelect.addEventListener('change', () => {
            currentSortOption = historySortSelect.value;
            renderFilteredRecords();
        });
    }

    // Render Filtered & Sorted History Cards
    function renderFilteredRecords() {
        if (!cachedResumesList) return;

        let list = [...cachedResumesList];

        // 1. Search Filter
        if (currentSearchTerm) {
            list = list.filter(item => {
                const fileName = (item.fileDetails?.originalName || '').toLowerCase();
                const candidateName = (item.personalDetails?.fullName || '').toLowerCase();
                const skills = (item.skills || []).join(' ').toLowerCase();
                return fileName.includes(currentSearchTerm) ||
                    candidateName.includes(currentSearchTerm) ||
                    skills.includes(currentSearchTerm);
            });
        }

        // 2. Score Tier Filter
        if (currentFilterTier !== 'all') {
            list = list.filter(item => {
                const score = item.analysis?.score || 0;
                if (currentFilterTier === 'excellent') return score >= 85;
                if (currentFilterTier === 'strong') return score >= 70 && score < 85;
                if (currentFilterTier === 'average') return score >= 55 && score < 70;
                if (currentFilterTier === 'poor') return score < 55;
                return true;
            });
        }

        // 3. Sorting
        list.sort((a, b) => {
            if (currentSortOption === 'oldest') {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }
            if (currentSortOption === 'score-high') {
                return (b.analysis?.score || 0) - (a.analysis?.score || 0);
            }
            if (currentSortOption === 'score-low') {
                return (a.analysis?.score || 0) - (b.analysis?.score || 0);
            }
            // default 'newest'
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        // 4. Render output
        if (list.length === 0) {
            recordsContainer.innerHTML = `
                <div class="empty-records">
                    <p style="font-size: 40px; margin-bottom: 12px;">📭</p>
                    <h4 style="color: var(--text-primary); margin-bottom: 6px;">No matching resume records found</h4>
                    <p style="color: var(--text-secondary); max-width: 440px; margin: 0 auto 16px;">
                        ${currentSearchTerm || currentFilterTier !== 'all' ? 'Try adjusting your search query or tier filters.' : 'Upload a resume file in the Upload tab or enter your profile details to generate your first ATS score.'}
                    </p>
                    <button class="primary-btn" onclick="document.getElementById('tabBtnUpload').click()">
                        <span>📤</span> Upload Resume Now
                    </button>
                </div>
            `;
            return;
        }

        recordsContainer.innerHTML = '';

        list.forEach(item => {
            const card = document.createElement('div');
            card.className = 'record-card';
            card.setAttribute('data-id', item._id);

            const dateStr = new Date(item.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            const name = (item.fileDetails && item.fileDetails.originalName)
                ? item.fileDetails.originalName
                : ((item.personalDetails && item.personalDetails.fullName) || 'Untitled Resume');

            const candidateName = (item.personalDetails && item.personalDetails.fullName) || 'Candidate';
            const email = (item.personalDetails && item.personalDetails.email) || 'No email';
            const location = (item.personalDetails && item.personalDetails.location) || '';
            const summary = (item.personalDetails && item.personalDetails.summary) || '';

            const score = (item.analysis && item.analysis.score) || 0;
            const scoreBadgeClass = getScoreBadgeClass(score);

            const skillsList = item.skills || (item.analysis && item.analysis.matchedKeywords) || [];
            const skillsHtml = skillsList.slice(0, 4).map(s => `<span class="skill-tag">${escapeHtml(s)}</span>`).join('') +
                (skillsList.length > 4 ? `<span class="skill-tag" style="background: rgba(255,255,255,0.08);">+${skillsList.length - 4} more</span>` : '');

            let fileInfoHtml = '';
            if (item.fileDetails && item.fileDetails.originalName) {
                fileInfoHtml = `
                    <div class="record-file-info">
                        <span>📄</span>
                        <strong>${escapeHtml(item.fileDetails.originalName)}</strong>
                        <small style="color: var(--text-muted);">(${(item.fileDetails.size / 1024).toFixed(1)} KB)</small>
                    </div>
                `;
            }

            card.innerHTML = `
                <div>
                    <div class="record-header">
                        <div>
                            <span class="record-title">${escapeHtml(name)}</span>
                            <div style="font-size: 12px; color: var(--text-muted); margin-top: 2px;">👤 ${escapeHtml(candidateName)}</div>
                        </div>
                        <span class="score-badge-pill ${scoreBadgeClass}">
                            ⚡ ${score}/100
                        </span>
                    </div>
                    <div class="record-meta">📧 ${escapeHtml(email)} ${location ? `| 📍 ${escapeHtml(location)}` : ''}</div>
                    <div class="record-meta"><small>Saved: ${dateStr}</small></div>
                    ${summary ? `<p style="font-size: 13px; color: var(--text-secondary); margin: 8px 0; line-height: 1.4;">${escapeHtml(summary)}</p>` : ''}
                    ${skillsHtml ? `<div class="record-skills">${skillsHtml}</div>` : ''}
                    ${fileInfoHtml}
                </div>
                <div class="record-actions">
                    <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                        <button class="history-view-analysis-btn" data-id="${item._id}">
                            📊 View Analysis
                        </button>
                        <button class="history-reanalyze-btn" data-id="${item._id}" title="Re-run AI evaluation">
                            🔄 Re-Analyze
                        </button>
                        ${item.fileDetails && item.fileDetails.filePath ? `<a href="${item.fileDetails.filePath}" target="_blank" class="download-link">⬇️ File</a>` : ''}
                    </div>
                    <button class="delete-btn" data-id="${item._id}" title="Delete record">🗑️ Delete</button>
                </div>
            `;

            // View Analysis Event
            const viewBtn = card.querySelector('.history-view-analysis-btn');
            viewBtn.addEventListener('click', () => {
                renderAnalysis(item);
                switchTab('analysis-tab');
                showToast('Loaded', `Analysis for "${name}" opened.`, 'info', 2000);
            });

            // Re-Analyze Event
            const reanalyzeBtn = card.querySelector('.history-reanalyze-btn');
            reanalyzeBtn.addEventListener('click', async () => {
                reanalyzeBtn.disabled = true;
                reanalyzeBtn.textContent = 'Analyzing...';
                try {
                    const reRes = await fetch(`/api/resume/${item._id}/analyze`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const reData = await reRes.json();
                    if (reRes.ok && reData.success && reData.resume) {
                        renderAnalysis(reData.resume);
                        loadRecords();
                        switchTab('analysis-tab');
                        showToast('Re-Analyzed', 'Resume updated with latest AI score.', 'success', 3000);
                    } else {
                        showToast('Re-Analyze Failed', reData.message || 'Error evaluating.', 'error');
                        reanalyzeBtn.disabled = false;
                        reanalyzeBtn.textContent = '🔄 Re-Analyze';
                    }
                } catch (e) {
                    showToast('Connection Error', 'Server did not respond.', 'error');
                    reanalyzeBtn.disabled = false;
                    reanalyzeBtn.textContent = '🔄 Re-Analyze';
                }
            });

            // Delete Event (Opens confirmation modal)
            const deleteBtn = card.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', () => {
                openDeleteModal(item._id, card);
            });

            recordsContainer.appendChild(card);
        });
    }

    // ----------------------------------------------------------------------
    // 14. Delete Confirmation Modal
    // ----------------------------------------------------------------------
    function openDeleteModal(itemId, cardEl) {
        itemPendingDeletionId = itemId;
        cardPendingDeletionEl = cardEl;
        deleteConfirmModal.classList.add('open');
    }

    function closeDeleteModal() {
        deleteConfirmModal.classList.remove('open');
        itemPendingDeletionId = null;
        cardPendingDeletionEl = null;
    }

    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeDeleteModal);

    deleteConfirmModal.addEventListener('click', (e) => {
        if (e.target === deleteConfirmModal) closeDeleteModal();
    });

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async () => {
            if (!itemPendingDeletionId) return;

            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.textContent = 'Deleting...';

            try {
                const delRes = await fetch(`/api/resume/${itemPendingDeletionId}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const delData = await delRes.json();

                if (delRes.ok && delData.success) {
                    showToast('Record Deleted', 'Resume record was removed.', 'info', 2500);

                    // Card collapse animation
                    if (cardPendingDeletionEl) {
                        cardPendingDeletionEl.classList.add('deleting');
                        setTimeout(() => {
                            if (cardPendingDeletionEl && cardPendingDeletionEl.parentNode) {
                                cardPendingDeletionEl.parentNode.removeChild(cardPendingDeletionEl);
                            }
                        }, 350);
                    }

                    // Reset active analysis if deleted resume was active
                    if (currentActiveResume && currentActiveResume._id === itemPendingDeletionId) {
                        currentActiveResume = null;
                        analysisContent.style.display = 'none';
                        analysisEmptyState.style.display = 'block';
                        analysisActiveDot.style.display = 'none';
                    }

                    // Reload cache
                    loadRecords();
                } else {
                    showToast('Delete Failed', delData.message || 'Could not delete record.', 'error');
                }
            } catch (e) {
                showToast('Connection Error', 'Server did not respond.', 'error');
            } finally {
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.textContent = '🗑️ Delete Record';
                closeDeleteModal();
            }
        });
    }

    // ----------------------------------------------------------------------
    // 15. Helper Functions
    // ----------------------------------------------------------------------
    function getScoreLabel(score) {
        if (score >= 85) return 'Excellent (ATS Ready)';
        if (score >= 70) return 'Strong (Competitive)';
        if (score >= 55) return 'Average (Good Foundation)';
        return 'Needs Improvement';
    }

    function getScoreColor(score) {
        if (score >= 85) return '#10b981';
        if (score >= 70) return '#06b6d4';
        if (score >= 55) return '#f59e0b';
        return '#f43f5e';
    }

    function getScoreBadgeClass(score) {
        if (score >= 85) return 'excellent';
        if (score >= 70) return 'strong';
        if (score >= 55) return 'average';
        return 'poor';
    }

    function hexToRgba(hex, alpha) {
        let c;
        if (/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
            c = hex.substring(1).split('');
            if (c.length === 3) {
                c = [c[0], c[0], c[1], c[1], c[2], c[2]];
            }
            c = '0x' + c.join('');
            return 'rgba(' + [(c >> 16) & 255, (c >> 8) & 255, c & 255].join(',') + `,${alpha})`;
        }
        return hex;
    }

    function pathExt(filename) {
        if (!filename) return 'DOC';
        const parts = filename.split('.');
        return parts.length > 1 ? parts.pop().toUpperCase() : 'DOC';
    }

    function countActionVerbs(resume) {
        return (resume.analysis && resume.analysis.actionVerbsCount) || 0;
    }

    function hasMetrics(resume) {
        return !!(resume.analysis && resume.analysis.metricsDetected && resume.analysis.metricsDetected.length > 0);
    }

    function estimateWords(resume) {
        if (resume.analysis && resume.analysis.wordCount) return resume.analysis.wordCount;
        let text = '';
        if (resume.personalDetails?.summary) text += ' ' + resume.personalDetails.summary;
        return text ? text.split(/\s+/).filter(Boolean).length : 0;
    }

    function escapeHtml(text) {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ----------------------------------------------------------------------
    // 16. Initial Records Fetch
    // ----------------------------------------------------------------------
    loadRecords();
});
