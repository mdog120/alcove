/* ==========================================================================
   Alcove Notion-Style Landing Page & Login Modal Router Module
   ========================================================================== */

import { signInUser } from '../supabase.js';

export const loginView = {
    template() {
        return `
            <!-- Landing Page Header Navigation -->
            <header class="landing-header">
                <div class="landing-brand">
                    <img src="logo.jpg" alt="Alcove Logo" class="landing-logo">
                    <span>Alcove</span>
                </div>
                <div class="landing-actions">
                    <button type="button" class="landing-actions-btn-link" id="nav-login-btn">Log In</button>
                    <!-- Converted to direct native href anchor link -->
                    <a href="#signup" class="btn btn-primary btn-sm" id="nav-signup-btn" style="padding: 4px 10px; font-size: 12px; display: inline-flex; align-items: center; justify-content: center; text-decoration: none;">
                        Get Alcove Free
                    </a>
                </div>
            </header>

            <!-- Landing Page Hero Banner -->
            <section class="landing-hero">
                <h1>Your school life, in one organized workspace.</h1>
                <p>
                    Alcove brings classes, assignments, GPA tracking, study sheets, and classmate group chats together into one beautiful place.
                </p>
                <!-- Converted to direct native href anchor link -->
                <a href="#signup" class="btn btn-primary" id="hero-cta-btn" style="padding: 8px 16px; font-size:13.5px; font-weight:600; display: inline-block; text-decoration: none;">
                    Get Alcove Free &rarr;
                </a>
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

            <!-- Authentication Overlay Modal Card (Login Only) -->
            <div id="auth-modal-overlay" class="modal-overlay">
                <div class="modal-content glass-panel" style="position: relative; max-width: 350px; width: 100%; padding: 28px; background-color: var(--panel-bg); border-radius: var(--border-radius-md); border: 1px solid var(--border-color); box-shadow: 0 12px 36px rgba(0,0,0,0.15);">
                    
                    <!-- Close Modal Trigger -->
                    <button type="button" class="close-modal-btn" id="auth-close-btn" style="position: absolute; top: 12px; right: 14px; font-size: 18px; border:none; background:none; cursor:pointer; color:var(--text-muted);">&times;</button>
                    
                    <!-- Branded logo header -->
                    <div style="text-align: center; margin-bottom: 22px;">
                        <img src="logo.jpg" alt="Alcove Logo" style="width: 44px; height: 44px; border-radius: 6px; border: 1px solid var(--border-color); object-fit: cover; margin-bottom: 8px;">
                        <h3 class="font-heading font-bold" style="font-size: 16px; color: var(--text-primary); letter-spacing:-0.2px;">Log In to Alcove</h3>
                    </div>

                    <!-- Login Form submission -->
                    <form id="modal-auth-form" style="display: flex; flex-direction: column; gap: 12px;">
                        
                        <!-- Email -->
                        <div class="form-group">
                            <label for="modal-email">Email Address</label>
                            <input type="email" id="modal-email" placeholder="you@university.edu" required style="width: 100%; padding: 6px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size: 12.5px;">
                        </div>

                        <!-- Password -->
                        <div class="form-group">
                            <label for="modal-password">Password</label>
                            <input type="password" id="modal-password" placeholder="Password" required style="width: 100%; padding: 6px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size: 12.5px;">
                        </div>

                        <!-- Submit action button -->
                        <button type="submit" class="btn btn-primary w-100" id="modal-submit-btn" style="margin-top: 6px; font-weight: 600; padding: 7px; font-size:12.5px;">
                            Continue
                        </button>
                    </form>

                    <!-- Bottom Toggle Option link -->
                    <div style="text-align: center; margin-top: 18px; font-size: 11px; color: var(--text-muted);">
                        <span>Don't have an account?</span>
                        <a href="#signup" style="color: var(--color-primary); font-weight: 600; margin-left: 2px;">Sign up</a>
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
        
        const openModal = () => {
            if (overlay) overlay.classList.add('active');
        };

        const closeModal = () => {
            if (overlay) overlay.classList.remove('active');
        };

        // Header Navigation Hooks
        const loginBtn = document.getElementById('nav-login-btn');
        if (loginBtn) loginBtn.addEventListener('click', openModal);

        // Close Trigger Button hooks
        const closeBtn = document.getElementById('auth-close-btn');
        if (closeBtn) closeBtn.addEventListener('click', closeModal);
        
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) closeModal();
            });
        }

        // Auth Form submit trigger
        const form = document.getElementById('modal-auth-form');
        if (form) {
            form.onsubmit = async (e) => {
                e.preventDefault();
                const email = document.getElementById('modal-email').value;
                const password = document.getElementById('modal-password').value;
                const submitBtn = document.getElementById('modal-submit-btn');

                submitBtn.disabled = true;
                submitBtn.textContent = "Logging in...";

                try {
                    await signInUser(email, password);
                    window.app.showToast("Successfully logged in!", "success");
                    closeModal();
                } catch (error) {
                    console.error("Auth error:", error);
                    window.app.showToast(error.message || "Failed to authenticate.", "danger");
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Continue';
                }
            };
        }
    }
};
export default loginView;
