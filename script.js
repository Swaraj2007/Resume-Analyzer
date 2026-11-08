/* ==========================================================================
   AI RESUME ANALYZER - AUTHENTICATION LOGIC (script.js)
   Maintains all API contracts, validation, password meter, and toast alerts.
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------------------------
    // 1. Theme Management (Sync with localStorage 'theme')
    // ----------------------------------------------------------------------
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const authThemeToggle = document.getElementById('authThemeToggle');
    if (authThemeToggle) {
        authThemeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', nextTheme);
            localStorage.setItem('theme', nextTheme);
            showToast('Theme Changed', `Switched to ${nextTheme} mode`, 'info');
        });
    }

    // ----------------------------------------------------------------------
    // 2. Element Selectors
    // ----------------------------------------------------------------------
    const container = document.getElementById('container');
    const signUpButton = document.getElementById('signUp');
    const signInButton = document.getElementById('signIn');
    const mobileSignUpBtn = document.getElementById('mobileSignUpBtn');
    const mobileSignInBtn = document.getElementById('mobileSignInBtn');

    const signupForm = document.getElementById('signupForm');
    const signinForm = document.getElementById('signinForm');

    const signupAlert = document.getElementById('signupAlert');
    const signinAlert = document.getElementById('signinAlert');

    const signupBtn = document.getElementById('signupBtn');
    const signinBtn = document.getElementById('signinBtn');

    const signupNameInput = document.getElementById('signup-name');
    const signupEmailInput = document.getElementById('signup-email');
    const signupPasswordInput = document.getElementById('signup-password');

    const signinEmailInput = document.getElementById('signin-email');
    const signinPasswordInput = document.getElementById('signin-password');

    const signupPasswordMeter = document.getElementById('signupPasswordMeter');
    const signupStrengthText = document.getElementById('signupStrengthText');

    const toggleSignupPassword = document.getElementById('toggleSignupPassword');
    const toggleSigninPassword = document.getElementById('toggleSigninPassword');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');

    // ----------------------------------------------------------------------
    // 3. Elegant Toast Notification System
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

        const autoRemove = setTimeout(() => {
            removeToast(toast);
        }, duration);

        function removeToast(t) {
            clearTimeout(autoRemove);
            t.classList.add('hide');
            setTimeout(() => {
                if (t.parentNode) t.parentNode.removeChild(t);
            }, 300);
        }
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

    // Helper: Display inline form alert feedback
    function showAlert(element, message, type) {
        if (!element) return;
        element.className = `form-alert show ${type}`;
        element.textContent = message;
    }

    function clearAlerts() {
        if (signupAlert) signupAlert.className = 'form-alert';
        if (signinAlert) signinAlert.className = 'form-alert';
    }

    function triggerShake(element) {
        if (!element) return;
        element.classList.remove('shake');
        void element.offsetWidth; // force reflow
        element.classList.add('shake');
    }

    // ----------------------------------------------------------------------
    // 4. Panel Switching (Desktop Overlay & Mobile Toggle)
    // ----------------------------------------------------------------------
    function setSignUpActive() {
        if (container) container.classList.add("right-panel-active");
        clearAlerts();
    }

    function setSignInActive() {
        if (container) container.classList.remove("right-panel-active");
        clearAlerts();
    }

    if (signUpButton) signUpButton.addEventListener('click', setSignUpActive);
    if (signInButton) signInButton.addEventListener('click', setSignInActive);
    if (mobileSignUpBtn) mobileSignUpBtn.addEventListener('click', setSignUpActive);
    if (mobileSignInBtn) mobileSignInBtn.addEventListener('click', setSignInActive);

    // ----------------------------------------------------------------------
    // 5. Password Show / Hide Toggles
    // ----------------------------------------------------------------------
    function setupPasswordToggle(toggleBtn, inputEl) {
        if (!toggleBtn || !inputEl) return;
        toggleBtn.addEventListener('click', () => {
            const isPassword = inputEl.type === 'password';
            inputEl.type = isPassword ? 'text' : 'password';

            const eyeOpen = toggleBtn.querySelector('.eye-open');
            const eyeClosed = toggleBtn.querySelector('.eye-closed');
            if (eyeOpen && eyeClosed) {
                eyeOpen.style.display = isPassword ? 'none' : 'block';
                eyeClosed.style.display = isPassword ? 'block' : 'none';
            }
        });
    }

    setupPasswordToggle(toggleSignupPassword, signupPasswordInput);
    setupPasswordToggle(toggleSigninPassword, signinPasswordInput);

    // ----------------------------------------------------------------------
    // 6. Real-Time Password Strength Meter
    // ----------------------------------------------------------------------
    if (signupPasswordInput && signupPasswordMeter) {
        signupPasswordInput.addEventListener('input', () => {
            const pwd = signupPasswordInput.value;
            let score = 0;

            if (pwd.length >= 6) score++;
            if (pwd.length >= 10) score++;
            if (/[0-9]/.test(pwd)) score++;
            if (/[^A-Za-z0-9]/.test(pwd)) score++;

            signupPasswordMeter.setAttribute('data-strength', score.toString());

            const labels = [
                'Strength: Too short (min 6)',
                'Strength: Weak',
                'Strength: Moderate',
                'Strength: Strong',
                'Strength: Top-grade security ✨'
            ];

            if (pwd.length === 0) {
                signupStrengthText.textContent = 'Strength: Minimum 6 characters';
                signupPasswordMeter.removeAttribute('data-strength');
            } else {
                signupStrengthText.textContent = labels[score] || labels[0];
            }
        });
    }

    // ----------------------------------------------------------------------
    // 7. Forgot Password Simulation with Toast
    // ----------------------------------------------------------------------
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', (e) => {
            e.preventDefault();
            const emailVal = signinEmailInput ? signinEmailInput.value.trim() : '';
            if (emailVal) {
                showToast('Reset Link Sent', `Password reset instructions sent to ${emailVal}`, 'success', 5000);
            } else {
                showToast('Reset Instructions', 'Please enter your email above to receive a reset link.', 'info', 4000);
                if (signinEmailInput) {
                    signinEmailInput.focus();
                    triggerShake(signinEmailInput.closest('.input-group'));
                }
            }
        });
    }

    // ----------------------------------------------------------------------
    // 8. Handle User Sign Up (POST /api/auth/signup)
    // ----------------------------------------------------------------------
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlerts();

            const fullName = signupNameInput ? signupNameInput.value.trim() : '';
            const email = signupEmailInput ? signupEmailInput.value.trim() : '';
            const password = signupPasswordInput ? signupPasswordInput.value : '';

            // Validation
            if (!fullName) {
                showAlert(signupAlert, 'Please enter your full name.', 'error');
                triggerShake(signupNameInput.closest('.input-group'));
                return;
            }

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                showAlert(signupAlert, 'Please enter a valid email address.', 'error');
                triggerShake(signupEmailInput.closest('.input-group'));
                return;
            }

            if (!password || password.length < 6) {
                showAlert(signupAlert, 'Password must be at least 6 characters long.', 'error');
                triggerShake(signupPasswordInput.closest('.input-group'));
                return;
            }

            // Set loading state on button
            setButtonLoading(signupBtn, true, 'Creating Account...');

            try {
                const response = await fetch('/api/auth/signup', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, email, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showAlert(signupAlert, 'Account created! Redirecting to setup your profile...', 'success');
                    showToast('Welcome!', 'Account created successfully. Redirecting...', 'success', 2500);

                    // Required localStorage keys
                    localStorage.setItem('auth_token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.setItem('is_new_signup', 'true');

                    setTimeout(() => {
                        window.location.href = 'dashboard.html?onboarding=true';
                    }, 900);
                } else {
                    showAlert(signupAlert, data.message || 'Registration failed.', 'error');
                    showToast('Sign Up Failed', data.message || 'Registration failed.', 'error');
                    setButtonLoading(signupBtn, false, 'Create Account');
                }
            } catch (err) {
                showAlert(signupAlert, 'Server error. Please verify backend server is active.', 'error');
                showToast('Connection Error', 'Could not reach server. Please try again.', 'error');
                setButtonLoading(signupBtn, false, 'Create Account');
            }
        });
    }

    // ----------------------------------------------------------------------
    // 9. Handle User Sign In (POST /api/auth/login)
    // ----------------------------------------------------------------------
    if (signinForm) {
        signinForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearAlerts();

            const email = signinEmailInput ? signinEmailInput.value.trim() : '';
            const password = signinPasswordInput ? signinPasswordInput.value : '';

            if (!email || !password) {
                showAlert(signinAlert, 'Please enter both email and password.', 'error');
                if (!email) triggerShake(signinEmailInput.closest('.input-group'));
                else triggerShake(signinPasswordInput.closest('.input-group'));
                return;
            }

            setButtonLoading(signinBtn, true, 'Signing In...');

            try {
                const response = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showAlert(signinAlert, 'Welcome back! Redirecting to your dashboard...', 'success');
                    showToast('Signed In', `Welcome back, ${data.user?.fullName || 'User'}!`, 'success', 2000);

                    // Required localStorage keys
                    localStorage.setItem('auth_token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    localStorage.removeItem('is_new_signup');

                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 800);
                } else {
                    showAlert(signinAlert, data.message || 'Invalid credentials.', 'error');
                    showToast('Sign In Failed', data.message || 'Invalid credentials.', 'error');
                    setButtonLoading(signinBtn, false, 'Sign In');
                    triggerShake(signinPasswordInput.closest('.input-group'));
                }
            } catch (err) {
                showAlert(signinAlert, 'Server error. Please verify server connection.', 'error');
                showToast('Connection Error', 'Could not reach server. Please try again.', 'error');
                setButtonLoading(signinBtn, false, 'Sign In');
            }
        });
    }

    // ----------------------------------------------------------------------
    // 10. Button Loading State Helper
    // ----------------------------------------------------------------------
    function setButtonLoading(button, isLoading, text) {
        if (!button) return;
        const btnText = button.querySelector('.btn-text');
        const btnLoader = button.querySelector('.btn-loader');
        const btnArrow = button.querySelector('.btn-arrow');

        button.disabled = isLoading;

        if (btnText) btnText.textContent = text;
        if (btnLoader) btnLoader.style.display = isLoading ? 'inline-block' : 'none';
        if (btnArrow) btnArrow.style.display = isLoading ? 'none' : 'inline-block';
    }
});
