/* ==========================================================================
   Alcove Login & Signup View Router Module (Beige-Mint Theme)
   ========================================================================== */

import { signInUser, signUpUser } from '../supabase.js';

export const loginView = {
    isSignUp: false, // toggles between login and signup modes

    template() {
        return `
            <div class="login-wrapper" style="display: flex; min-height: calc(100vh - 100px); align-items: center; justify-content: center; background-color: var(--bg-primary);">
                
                <div class="login-card glass-panel" style="max-width: 360px; width: 100%; padding: 28px; background-color: var(--panel-bg); border-radius: var(--border-radius-md); box-shadow: var(--panel-shadow); border: 1px solid var(--border-color);">
                    
                    <!-- Branded Logo & Header -->
                    <div class="text-center" style="text-align: center; margin-bottom: 24px;">
                        <img src="logo.jpg" alt="Alcove Logo" style="width: 48px; height: 48px; border-radius: 8px; border: 1px solid var(--border-color); object-fit: cover; margin-bottom: 12px;">
                        <h2 class="font-heading font-bold" style="font-size: 18px; color: var(--text-primary); letter-spacing: -0.4px;">Welcome to Alcove</h2>
                        <p class="text-muted" style="font-size: 11.5px; margin-top: 2px;">Your all-in-one student workspace</p>
                    </div>

                    <!-- Toggle tabs -->
                    <div style="display: flex; border-bottom: 1px solid var(--border-color); margin-bottom: 20px; gap: 14px;">
                        <button id="login-tab-btn" style="flex: 1; padding: 6px 0; font-size: 12.5px; font-weight: 600; color: ${!this.isSignUp ? 'var(--text-primary)' : 'var(--text-muted)'}; border-bottom: 2px solid ${!this.isSignUp ? 'var(--color-primary)' : 'transparent'}; text-align: center;">
                            Log In
                        </button>
                        <button id="signup-tab-btn" style="flex: 1; padding: 6px 0; font-size: 12.5px; font-weight: 600; color: ${this.isSignUp ? 'var(--text-primary)' : 'var(--text-muted)'}; border-bottom: 2px solid ${this.isSignUp ? 'var(--color-primary)' : 'transparent'}; text-align: center;">
                            Sign Up
                        </button>
                    </div>

                    <!-- Auth Form -->
                    <form id="auth-submit-form" class="d-flex flex-column gap-3" style="display:flex; flex-direction:column; gap:12px;">
                        
                        <!-- Full Name (Sign Up only) -->
                        <div class="form-group" id="group-fullname" style="display: ${this.isSignUp ? 'block' : 'none'};">
                            <label for="auth-fullname">Full Name</label>
                            <input type="text" id="auth-fullname" placeholder="Alex Rivera" ${this.isSignUp ? 'required' : ''}>
                        </div>

                        <!-- School Select (Sign Up only) -->
                        <div class="form-group" id="group-school" style="display: ${this.isSignUp ? 'block' : 'none'};">
                            <label for="auth-school">University</label>
                            <select id="auth-school" ${this.isSignUp ? 'required' : ''}>
                                <option value="Stanford University">Stanford University</option>
                                <option value="UC Berkeley">UC Berkeley</option>
                                <option value="MIT">MIT</option>
                                <option value="Harvard University">Harvard University</option>
                                <option value="Other University">Other University</option>
                            </select>
                        </div>

                        <!-- Email -->
                        <div class="form-group">
                            <label for="auth-email">Email Address</label>
                            <input type="email" id="auth-email" placeholder="you@university.edu" required style="width: 100%; padding: 6px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size:12.5px;">
                        </div>

                        <!-- Password -->
                        <div class="form-group" style="margin-bottom:6px;">
                            <label for="auth-password">Password</label>
                            <input type="password" id="auth-password" placeholder="Min. 6 characters" required style="width: 100%; padding: 6px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size:12.5px;">
                        </div>

                        <!-- Submit Button -->
                        <button type="submit" class="btn btn-primary w-100" style="padding: 8px 12px; font-weight:600; font-size:12.5px; border-radius: var(--border-radius-sm); margin-top: 6px;" id="auth-submit-btn">
                            ${this.isSignUp ? 'Create Account' : 'Continue'}
                        </button>
                    </form>

                    <!-- Toggle Footer Notice -->
                    <div style="text-align: center; margin-top: 18px; font-size: 11px; color: var(--text-muted);">
                        <span id="auth-toggle-notice-text">
                            ${this.isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        </span>
                        <a href="#" id="auth-toggle-link" style="color: var(--color-primary); font-weight: 600; margin-left: 3px;">
                            ${this.isSignUp ? 'Log in' : 'Sign up'}
                        </a>
                    </div>

                </div>

            </div>
        `;
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        const form = document.getElementById('auth-submit-form');
        const loginTab = document.getElementById('login-tab-btn');
        const signupTab = document.getElementById('signup-tab-btn');
        const toggleLink = document.getElementById('auth-toggle-link');

        const toggleMode = (signUpState) => {
            this.isSignUp = signUpState;
            // Redraw viewport
            const viewport = document.getElementById('app-viewport');
            viewport.innerHTML = this.template();
            this.bindEvents();
        };

        if (loginTab) loginTab.addEventListener('click', () => toggleMode(false));
        if (signupTab) signupTab.addEventListener('click', () => toggleMode(true));
        if (toggleLink) {
            toggleLink.addEventListener('click', (e) => {
                e.preventDefault();
                toggleMode(!this.isSignUp);
            });
        }

        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const email = document.getElementById('auth-email').value;
                const password = document.getElementById('auth-password').value;
                const submitBtn = document.getElementById('auth-submit-btn');

                submitBtn.disabled = true;
                submitBtn.textContent = this.isSignUp ? "Creating..." : "Logging in...";

                try {
                    if (this.isSignUp) {
                        const fullName = document.getElementById('auth-fullname').value;
                        const schoolName = document.getElementById('auth-school').value;
                        
                        await signUpUser(email, password, fullName, schoolName);
                        window.app.showToast("Account created successfully! Check your email if verification is required.", "success");
                        
                        // Switch to login tab
                        toggleMode(false);
                    } else {
                        await signInUser(email, password);
                        window.app.showToast("Logged in successfully!", "success");
                        // Router listener onAuthStateChange in app.js will automatically redirect to dashboard!
                    }
                } catch (error) {
                    console.error("Auth error:", error);
                    window.app.showToast(error.message || "Authentication failed.", "danger");
                    submitBtn.disabled = false;
                    submitBtn.textContent = this.isSignUp ? 'Create Account' : 'Continue';
                }
            };
        }
    }
};
export default loginView;
