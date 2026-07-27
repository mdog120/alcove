/* ==========================================================================
   Alcove Notion-Style Landing Page & Auth Modal View Router Module
   ========================================================================== */

import { signInUser, signUpUser } from '../supabase.js';

export const loginView = {
    isSignUp: false, // Toggles modal display mode

    template() {
        return `
            <!-- Landing Page Header Navigation -->
            <header class="landing-header">
                <div class="landing-brand">
                    <img src="logo.jpg" alt="Alcove Logo" class="landing-logo">
                    <span>Alcove</span>
                </div>
                <div class="landing-actions">
                    <button class="landing-actions-btn-link" id="nav-login-btn">Log In</button>
                    <button class="btn btn-primary btn-sm" id="nav-signup-btn" style="padding: 4px 10px; font-size: 12px;">
                        Get Alcove Free
                    </button>
                </div>
            </header>

            <!-- Landing Page Hero Banner -->
            <section class="landing-hero">
                <h1>Your school life, in one organized workspace.</h1>
                <p>
                    Alcove brings classes, assignments, GPA tracking, study sheets, and classmate group chats together into one beautiful, flat workspace.
                </p>
                <button class="btn btn-primary" id="hero-cta-btn" style="padding: 8px 16px; font-size:13.5px; font-weight:600;">
                    Get Alcove Free &rarr;
                </button>
            </section>

            <!-- Alternating Features Grid (Notion style with animated CSS demos) -->
            <section class="landing-grid">
                
                <!-- Feature 1: Class Scheduler -->
                <div class="landing-feature-card glass-panel">
                    <div class="landing-feature-text">
                        <h3>Class Scheduler</h3>
                        <p>Track assignments and exam deadlines on a calendar, Kanban board, or simple list view.</p>
                    </div>
                    <!-- CSS Kanban Demo Animation -->
                    <div class="demo-animation-box">
                        <div class="demo-kanban-col">
                            <span class="demo-kanban-title">To Do</span>
                            <div class="demo-kanban-card animated">CS Midterm</div>
                        </div>
                        <div class="demo-kanban-col">
                            <span class="demo-kanban-title">In Progress</span>
                            <div class="demo-kanban-card">Math Sheet</div>
                        </div>
                    </div>
                </div>

                <!-- Feature 2: GPA Calculator -->
                <div class="landing-feature-card glass-panel">
                    <div class="landing-feature-text">
                        <h3>GPA Goal Calculator</h3>
                        <p>Log course letter grades and calculate cumulative GPAs. Set targets and estimate grades needed.</p>
                    </div>
                    <!-- CSS GPA Gauge Demo Animation -->
                    <div class="demo-animation-box">
                        <div class="demo-gpa-box">
                            <svg class="demo-gpa-svg" viewBox="0 0 100 100">
                                <circle cx="50" cy="50" r="40" stroke="var(--bg-tertiary)" stroke-width="8" fill="none"></circle>
                                <circle class="demo-gpa-fill" cx="50" cy="50" r="40" fill="none"></circle>
                            </svg>
                            <span style="font-size: 9px; font-weight: 700; color: var(--text-secondary);">3.83 Cumulative</span>
                        </div>
                    </div>
                </div>

                <!-- Feature 3: Class Chats -->
                <div class="landing-feature-card glass-panel">
                    <div class="landing-feature-text">
                        <h3>Collaborative Chats</h3>
                        <p>Join class group chats, matches with study partners, and launch secure direct messages.</p>
                    </div>
                    <!-- CSS Scrolling Chat Demo Animation -->
                    <div class="demo-animation-box">
                        <div class="demo-chat-viewport">
                            <div class="demo-chat-bubble">Is anyone working on the CS problem set?</div>
                            <div class="demo-chat-bubble outgoing">Yeah! Let's study in the library tomorrow.</div>
                        </div>
                    </div>
                </div>

                <!-- Feature 4: Note Sharing -->
                <div class="landing-feature-card glass-panel">
                    <div class="landing-feature-text">
                        <h3>Study Notes Library</h3>
                        <p>Write rich note pages with formatting, and share them directly into the public Campus Library.</p>
                    </div>
                    <!-- CSS Notebook Typing Demo Animation -->
                    <div class="demo-animation-box">
                        <div class="demo-notes-editor">
                            <div class="demo-notes-line"></div>
                            <div class="demo-notes-line"></div>
                            <div class="demo-notes-line"></div>
                        </div>
                    </div>
                </div>

            </section>

            <!-- Authentication Overlay Modal Card -->
            <div id="auth-modal-overlay" class="modal-overlay">
                <div class="modal-content glass-panel" style="position: relative; max-width: 360px; width: 100%; padding: 28px; background-color: var(--panel-bg); border-radius: var(--border-radius-md); border: 1px solid var(--border-color); box-shadow: 0 12px 36px rgba(0,0,0,0.15);">
                    
                    <!-- Close Modal Trigger -->
                    <button class="close-modal-btn" id="auth-close-btn" style="position: absolute; top: 12px; right: 14px; font-size: 18px; border:none; background:none; cursor:pointer; color:var(--text-muted);">&times;</button>
                    
                    <!-- Branded logo header -->
                    <div style="text-align: center; margin-bottom: 20px;">
                        <img src="logo.jpg" alt="Alcove Logo" style="width: 44px; height: 44px; border-radius: 6px; border: 1px solid var(--border-color); object-fit: cover; margin-bottom: 8px;">
                        <h3 class="font-heading font-bold" id="auth-modal-title" style="font-size: 15px; color: var(--text-primary); letter-spacing:-0.2px;">Log In to Alcove</h3>
                    </div>

                    <!-- Modal Tabs toggling login/signup state -->
                    <div style="display: flex; border-bottom: 1px solid var(--border-color); margin-bottom: 16px; gap: 14px;">
                        <button id="modal-tab-login" style="flex: 1; padding: 6px 0; font-size: 12px; font-weight: 600; text-align: center; cursor:pointer;">
                            Log In
                        </button>
                        <button id="modal-tab-signup" style="flex: 1; padding: 6px 0; font-size: 12px; font-weight: 600; text-align: center; cursor:pointer;">
                            Sign Up
                        </button>
                    </div>

                    <!-- Form submission -->
                    <form id="modal-auth-form" style="display: flex; flex-direction: column; gap: 10px;">
                        
                        <!-- Full Name (Signup only) -->
                        <div class="form-group" id="modal-group-fullname" style="display: none;">
                            <label for="modal-fullname">Full Name</label>
                            <input type="text" id="modal-fullname" placeholder="Alex Rivera" style="width: 100%; padding: 5px 8px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size: 12px;">
                        </div>

                        <!-- School Selector (Signup only) -->
                        <div class="form-group" id="modal-group-school" style="display: none;">
                            <label for="modal-school">University</label>
                            <select id="modal-school" style="width: 100%; padding: 5px 8px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size: 12px;">
                                <option value="Stanford University">Stanford University</option>
                                <option value="UC Berkeley">UC Berkeley</option>
                                <option value="MIT">MIT</option>
                                <option value="Harvard University">Harvard University</option>
                                <option value="Other University">Other University</option>
                            </select>
                        </div>

                        <!-- Email -->
                        <div class="form-group">
                            <label for="modal-email">Email Address</label>
                            <input type="email" id="modal-email" placeholder="you@university.edu" required style="width: 100%; padding: 5px 8px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size: 12px;">
                        </div>

                        <!-- Password -->
                        <div class="form-group">
                            <label for="modal-password">Password</label>
                            <input type="password" id="modal-password" placeholder="Min. 6 characters" required style="width: 100%; padding: 5px 8px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size: 12px;">
                        </div>

                        <!-- Submit action button -->
                        <button type="submit" class="btn btn-primary w-100" id="modal-submit-btn" style="margin-top: 8px; font-weight: 600; padding: 6px; font-size:12px;">
                            Continue
                        </button>
                    </form>

                    <!-- Bottom Toggle Option link -->
                    <div style="text-align: center; margin-top: 14px; font-size: 10.5px; color: var(--text-muted);">
                        <span id="modal-toggle-notice-text">Don't have an account?</span>
                        <a href="#" id="modal-toggle-link" style="color: var(--color-primary); font-weight: 600; margin-left: 2px;">Sign up</a>
                    </div>

                </div>
            </div>
        `;
    },

    init() {
        this.bindEvents();
    },

    bindEvents() {
        const overlay = document.getElementById('auth-modal-overlay');
        
        const openModal = (signUpState) => {
            this.isSignUp = signUpState;
            if (overlay) overlay.classList.add('active');
            this.updateModalState();
        };

        const closeModal = () => {
            if (overlay) overlay.classList.remove('active');
        };

        // Header Navigation Hooks
        document.getElementById('nav-login-btn').addEventListener('click', () => openModal(false));
        document.getElementById('nav-signup-btn').addEventListener('click', () => openModal(true));
        
        // Hero Call to Action Hook
        document.getElementById('hero-cta-btn').addEventListener('click', () => openModal(true));

        // Close Trigger Button hooks
        document.getElementById('auth-close-btn').addEventListener('click', closeModal);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeModal();
        });

        // Modal Tab Buttons Switchers
        document.getElementById('modal-tab-login').addEventListener('click', () => {
            this.isSignUp = false;
            this.updateModalState();
        });
        
        document.getElementById('modal-tab-signup').addEventListener('click', () => {
            this.isSignUp = true;
            this.updateModalState();
        });

        // Bottom link toggle
        document.getElementById('modal-toggle-link').addEventListener('click', (e) => {
            e.preventDefault();
            this.isSignUp = !this.isSignUp;
            this.updateModalState();
        });

        // Auth Form submit trigger
        const form = document.getElementById('modal-auth-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const email = document.getElementById('modal-email').value;
                const password = document.getElementById('modal-password').value;
                const submitBtn = document.getElementById('modal-submit-btn');

                submitBtn.disabled = true;
                submitBtn.textContent = this.isSignUp ? "Creating account..." : "Logging in...";

                try {
                    if (this.isSignUp) {
                        const fullName = document.getElementById('modal-fullname').value;
                        const schoolName = document.getElementById('modal-school').value;
                        
                        await signUpUser(email, password, fullName, schoolName);
                        window.app.showToast("Account created! Check email if verification is active.", "success");
                        this.isSignUp = false;
                        this.updateModalState();
                    } else {
                        await signInUser(email, password);
                        window.app.showToast("Successfully logged in!", "success");
                        closeModal();
                        // appState listener will trigger routing to dashboard!
                    }
                } catch (error) {
                    console.error("Auth error:", error);
                    window.app.showToast(error.message || "Failed to authenticate.", "danger");
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Continue';
                }
            };
        }
    },

    // Handles the toggles between Login and Signup display inside the active modal
    updateModalState() {
        const title = document.getElementById('auth-modal-title');
        const submitBtn = document.getElementById('modal-submit-btn');
        const loginTab = document.getElementById('modal-tab-login');
        const signupTab = document.getElementById('modal-tab-signup');
        const noticeText = document.getElementById('modal-toggle-notice-text');
        const toggleLink = document.getElementById('modal-toggle-link');

        const nameGroup = document.getElementById('modal-group-fullname');
        const schoolGroup = document.getElementById('modal-group-school');
        
        const nameInput = document.getElementById('modal-fullname');

        // Styles reset
        loginTab.style.color = 'var(--text-muted)';
        loginTab.style.borderBottom = '2px solid transparent';
        signupTab.style.color = 'var(--text-muted)';
        signupTab.style.borderBottom = '2px solid transparent';

        if (this.isSignUp) {
            title.textContent = "Create your account";
            submitBtn.textContent = "Create Account";
            signupTab.style.color = 'var(--text-primary)';
            signupTab.style.borderBottom = '2px solid var(--color-primary)';
            noticeText.textContent = "Already have an account?";
            toggleLink.textContent = "Log in";

            nameGroup.style.display = 'block';
            schoolGroup.style.display = 'block';
            nameInput.required = true;
        } else {
            title.textContent = "Log In to Alcove";
            submitBtn.textContent = "Continue";
            loginTab.style.color = 'var(--text-primary)';
            loginTab.style.borderBottom = '2px solid var(--color-primary)';
            noticeText.textContent = "Don't have an account?";
            toggleLink.textContent = "Sign up";

            nameGroup.style.display = 'none';
            schoolGroup.style.display = 'none';
            nameInput.required = false;
        }
    }
};
export default loginView;
