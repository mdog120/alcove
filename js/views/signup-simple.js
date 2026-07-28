/* ==========================================================================
   Alcove streamlined account creation
   ========================================================================== */

import { signUpUser } from '../supabase.js';

const STATES = [
    ['AL', 'Alabama'], ['AK', 'Alaska'], ['AZ', 'Arizona'], ['AR', 'Arkansas'], ['CA', 'California'], ['CO', 'Colorado'], ['CT', 'Connecticut'], ['DE', 'Delaware'], ['FL', 'Florida'], ['GA', 'Georgia'], ['HI', 'Hawaii'], ['ID', 'Idaho'], ['IL', 'Illinois'], ['IN', 'Indiana'], ['IA', 'Iowa'], ['KS', 'Kansas'], ['KY', 'Kentucky'], ['LA', 'Louisiana'], ['ME', 'Maine'], ['MD', 'Maryland'], ['MA', 'Massachusetts'], ['MI', 'Michigan'], ['MN', 'Minnesota'], ['MS', 'Mississippi'], ['MO', 'Missouri'], ['MT', 'Montana'], ['NE', 'Nebraska'], ['NV', 'Nevada'], ['NH', 'New Hampshire'], ['NJ', 'New Jersey'], ['NM', 'New Mexico'], ['NY', 'New York'], ['NC', 'North Carolina'], ['ND', 'North Dakota'], ['OH', 'Ohio'], ['OK', 'Oklahoma'], ['OR', 'Oregon'], ['PA', 'Pennsylvania'], ['RI', 'Rhode Island'], ['SC', 'South Carolina'], ['SD', 'South Dakota'], ['TN', 'Tennessee'], ['TX', 'Texas'], ['UT', 'Utah'], ['VT', 'Vermont'], ['VA', 'Virginia'], ['WA', 'Washington'], ['WV', 'West Virginia'], ['WI', 'Wisconsin'], ['WY', 'Wyoming']
];

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
                            <div class="auth-form-grid">
                                <div class="form-group">
                                    <label for="signup-age">Age</label>
                                    <input id="signup-age" type="number" min="13" max="100" placeholder="18" required>
                                </div>
                                <div class="form-group">
                                    <label for="signup-level">I’m in</label>
                                    <select id="signup-level" required>
                                        <option value="highschool">High school</option>
                                        <option value="college" selected>College / university</option>
                                    </select>
                                </div>
                            </div>
                            <div class="auth-form-grid">
                                <div class="form-group">
                                    <label for="signup-year">Grade or year</label>
                                    <select id="signup-year" required>
                                        <option value="9th grade">9th grade</option>
                                        <option value="10th grade">10th grade</option>
                                        <option value="11th grade">11th grade</option>
                                        <option value="12th grade">12th grade</option>
                                        <option value="Freshman" selected>College freshman</option>
                                        <option value="Sophomore">College sophomore</option>
                                        <option value="Junior">College junior</option>
                                        <option value="Senior">College senior</option>
                                        <option value="Graduate student">Graduate student</option>
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="signup-state">State</label>
                                    <select id="signup-state" required>
                                        <option value="" disabled selected>Select state</option>
                                        ${STATES.map(([code, name]) => `<option value="${code}">${name}</option>`).join('')}
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="signup-city">City</label>
                                <input id="signup-city" type="text" autocomplete="address-level2" placeholder="Your city" required>
                            </div>
                            <div class="form-group">
                                <label for="signup-school">School or university</label>
                                <input id="signup-school" type="text" autocomplete="organization" placeholder="Start typing your school name" required>
                                <div id="signup-school-results" class="school-results" aria-live="polite"></div>
                                <span id="school-search-note" class="field-note">College results come from the U.S. Department of Education directory.</span>
                            </div>
                            <div class="form-group">
                                <label for="signup-district">School district <span class="text-muted">(high school students)</span></label>
                                <input id="signup-district" type="text" autocomplete="organization" placeholder="e.g. Austin Independent School District">
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
                    document.getElementById('signup-school').value.trim(),
                    {
                        age: Number(document.getElementById('signup-age').value),
                        state: document.getElementById('signup-state').value,
                        city: document.getElementById('signup-city').value.trim(),
                        educationLevel: document.getElementById('signup-level').value,
                        gradYear: document.getElementById('signup-year').value,
                        schoolDistrict: document.getElementById('signup-district').value.trim()
                    }
                );

                if (signup.user?.identities?.length === 0) {
                    window.app.showToast('An account with this email already exists. Please log in instead.', 'warning');
                    window.location.hash = '#login';
                    return;
                }

                if (!signup.session) {
                    window.app.showToast('Account created. Please sign in to continue.', 'success');
                    window.location.hash = '#login';
                    return;
                }

                window.app.showToast('Your Alcove workspace is ready.', 'success');
                window.location.hash = '#dashboard';
            } catch (error) {
                console.error('Signup error:', error);
                window.app.showToast(error.message || 'We could not create your account. Please try again.', 'danger');
                submit.disabled = false;
                submit.innerHTML = 'Create workspace <i class="fa-solid fa-arrow-right"></i>';
            }
        };

        const schoolInput = document.getElementById('signup-school');
        const schoolResults = document.getElementById('signup-school-results');
        const levelInput = document.getElementById('signup-level');
        const stateInput = document.getElementById('signup-state');
        const searchNote = document.getElementById('school-search-note');
        let searchTimer;

        const clearResults = () => {
            schoolResults.innerHTML = '';
            schoolResults.classList.remove('active');
        };

        const setSearchMode = () => {
            const college = levelInput.value === 'college';
            searchNote.textContent = college
                ? 'Search real colleges and universities from the U.S. Department of Education directory.'
                : 'Enter your high school and district. A nationwide K–12 directory is being added next.';
            clearResults();
        };

        const searchColleges = async () => {
            const query = schoolInput.value.trim();
            if (levelInput.value !== 'college' || query.length < 2) {
                clearResults();
                return;
            }

            schoolResults.innerHTML = '<span class="school-results-status">Searching schools…</span>';
            schoolResults.classList.add('active');
            try {
                const params = new URLSearchParams({
                    api_key: 'DEMO_KEY',
                    'school.name': query,
                    fields: 'id,school.name,school.city,school.state',
                    per_page: '8'
                });
                if (stateInput.value) params.set('school.state', stateInput.value);
                const response = await fetch(`https://api.data.gov/ed/collegescorecard/v1/schools.json?${params}`);
                if (!response.ok) throw new Error('School search is temporarily unavailable.');
                const data = await response.json();
                const schools = data.results || [];
                if (!schools.length) {
                    schoolResults.innerHTML = '<span class="school-results-status">No match found — you can still enter your school manually.</span>';
                    return;
                }
                schoolResults.innerHTML = schools.map(school => `
                    <button type="button" class="school-result" data-school="${school['school.name']}" aria-label="Select ${school['school.name']}">
                        <strong>${school['school.name']}</strong>
                        <span>${school['school.city'] || ''}${school['school.city'] && school['school.state'] ? ', ' : ''}${school['school.state'] || ''}</span>
                    </button>
                `).join('');
                schoolResults.querySelectorAll('.school-result').forEach(result => {
                    result.addEventListener('click', () => {
                        schoolInput.value = result.dataset.school;
                        clearResults();
                    });
                });
            } catch (error) {
                schoolResults.innerHTML = '<span class="school-results-status">Search is unavailable — enter your school manually.</span>';
            }
        };

        schoolInput.addEventListener('input', () => {
            clearTimeout(searchTimer);
            searchTimer = setTimeout(searchColleges, 300);
        });
        levelInput.addEventListener('change', setSearchMode);
        stateInput.addEventListener('change', () => {
            if (schoolInput.value.trim().length >= 2) searchColleges();
        });
        setSearchMode();
    }
};

export default signupView;
