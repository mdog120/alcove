/* ==========================================================================
   Alcove streamlined account creation
   ========================================================================== */

import { signUpUser } from '../supabase.js';

export const signupView = {
    template() {
        return `
            <div class="auth-page">
                <header class="landing-header">
                    <a href="#login" class="landing-brand" aria-label="Back to Alcove home">
                        <img src="logo.jpg" alt="Alcove Logo" class="landing-logo">
                        <span>Alcove</span>
                    </a>
                    <div class="landing-actions">
                        <span class="text-muted font-12">Already have an account?</span>
                        <a href="#login" class="btn btn-secondary btn-sm">Log in</a>
                    </div>
                </header>

                <main class="auth-layout">
                    <section class="auth-intro">
                        <span class="landing-eyebrow">YOUR STUDENT SPACE</span>
                        <h1>Start with a little more room to think.</h1>
                        <p>Alcove keeps your academic life calm, connected, and in one place.</p>
                        <div class="auth-quote">“A considered workspace for the work and people that matter.”</div>
                    </section>

                    <section class="auth-card glass-panel">
                        <div class="auth-card-heading">
                            <span class="feature-kicker">CREATE ACCOUNT</span>
                            <h2>Welcome to Alcove</h2>
                            <p>It only takes a moment to set up your workspace.</p>
                        </div>
                        <form id="signup-form" class="auth-form">
                            <div class="form-group">
                                <label for="signup-name">Full name</label>
                                <input id="signup-name" type="text" autocomplete="name" placeholder="Your name" required>
                            </div>
                            <div class="form-group">
                                <label for="signup-email">Email address</label>
                                <input id="signup-email" type="email" autocomplete="email" placeholder="you@school.edu" required>
                            </div>
                            <div class="form-group">
                                <label for="signup-school">School <span class="text-muted">(optional)</span></label>
                                <input id="signup-school" type="text" autocomplete="organization" placeholder="Your school or university">
                            </div>
                            <div class="form-group">
                                <label for="signup-password">Password</label>
                                <input id="signup-password" type="password" autocomplete="new-password" minlength="6" placeholder="At least 6 characters" required>
                            </div>
                            <button id="signup-submit" class="btn btn-primary w-100 auth-submit" type="submit">Create workspace <i class="fa-solid fa-arrow-right"></i></button>
                        </form>
                        <p class="auth-footnote">By continuing, you agree to keep Alcove a respectful space for students.</p>
                    </section>
                </main>
            </div>
        `;
    },

    init() {
        const form = document.getElementById('signup-form');
        form.onsubmit = async (event) => {
            event.preventDefault();
            const submit = document.getElementById('signup-submit');
            submit.disabled = true;
            submit.innerHTML = 'Creating your workspace…';

            try {
                const signup = await signUpUser(
                    document.getElementById('signup-email').value.trim(),
                    document.getElementById('signup-password').value,
                    document.getElementById('signup-name').value.trim(),
                    document.getElementById('signup-school').value.trim() || 'My School'
                );

                if (signup.user?.identities?.length === 0) {
                    window.app.showToast('An account with this email already exists. Please log in instead.', 'warning');
                    window.location.hash = '#login';
                    return;
                }

                if (!signup.session) {
                    window.app.showToast('Check your email to confirm your account, then log in.', 'success');
                    window.location.hash = '#login';
                    return;
                }

                window.app.showToast('Your Alcove workspace is ready.', 'success');
            } catch (error) {
                console.error('Signup error:', error);
                window.app.showToast(error.message || 'We could not create your account. Please try again.', 'danger');
                submit.disabled = false;
                submit.innerHTML = 'Create workspace <i class="fa-solid fa-arrow-right"></i>';
            }
        };
    }
};

export default signupView;
