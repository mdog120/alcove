/* ==========================================================================
   Alcove Dedicated Sign Up & Onboarding Questionnaire Router Module
   ========================================================================== */

import { signUpUser } from '../supabase.js';

// Local instant-lookup database of common schools (works offline)
const LOCAL_SCHOOLS_DATABASE = [
    { name: "Stanford University", type: "college", city: "Stanford", state: "CA" },
    { name: "University of California, Berkeley", type: "college", city: "Berkeley", state: "CA" },
    { name: "San Jose State University", type: "college", city: "San Jose", state: "CA" },
    { name: "Santa Clara University", type: "college", city: "Santa Clara", state: "CA" },
    { name: "University of California, Los Angeles", type: "college", city: "Los Angeles", state: "CA" },
    { name: "New York University", type: "college", city: "New York", state: "NY" },
    { name: "Columbia University", type: "college", city: "New York", state: "NY" },
    { name: "Massachusetts Institute of Technology", type: "college", city: "Cambridge", state: "MA" },
    { name: "Harvard University", type: "college", city: "Cambridge", state: "MA" },
    
    { name: "Palo Alto High School", type: "highschool", city: "Palo Alto", state: "CA" },
    { name: "Henry M. Gunn High School", type: "highschool", city: "Palo Alto", state: "CA" },
    { name: "Menlo-Atherton High School", type: "highschool", city: "Atherton", state: "CA" },
    { name: "Berkeley High School", type: "highschool", city: "Berkeley", state: "CA" },
    { name: "Stuyvesant High School", type: "highschool", city: "New York", state: "NY" },
    { name: "Bronx High School of Science", type: "highschool", city: "New York", state: "NY" },
    { name: "Cambridge Rindge and Latin School", type: "highschool", city: "Cambridge", state: "MA" }
];

export const signupView = {
    currentStep: 1,
    educationLevel: 'college', // 'college' | 'highschool'
    debounceTimer: null,

    template() {
        return `
            <!-- Onboarding page navbar -->
            <header class="landing-header">
                <div class="landing-brand">
                    <img src="logo.jpg" alt="Alcove Logo" class="landing-logo">
                    <span>Alcove Onboarding</span>
                </div>
                <div class="landing-actions">
                    <span class="text-muted font-12">Already have an account?</span>
                    <a href="#login" class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 11.5px;">Log In</a>
                </div>
            </header>

            <!-- Questionnaire Container -->
            <div class="d-flex align-items-center justify-content-center" style="min-height: calc(100vh - 120px); padding: 20px 24px; background-color: var(--bg-primary);">
                
                <div class="glass-panel" style="max-width: 480px; width: 100%; padding: 32px; background: var(--panel-bg); border-radius: var(--border-radius-md); border: 1px solid var(--border-color); box-shadow: var(--panel-shadow);">
                    
                    <!-- Progress Header -->
                    <div style="margin-bottom: 24px;">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                            <span class="font-bold text-primary" style="font-size:12px; text-transform:uppercase; letter-spacing:0.3px;" id="wizard-progress-title">Step 1 of 3: Account Setup</span>
                            <span class="text-muted" style="font-size:11px;" id="wizard-step-pct">33% Complete</span>
                        </div>
                        <div style="width:100%; height:4px; background-color:var(--bg-secondary); border-radius:2px; overflow:hidden;">
                            <div id="wizard-progress-bar" style="width:33%; height:100%; background-color:var(--color-primary); transition: width 0.4s ease;"></div>
                        </div>
                    </div>

                    <!-- Steps Wrapper -->
                    <div id="onboarding-steps-container">
                        
                        <!-- STEP 1: Account Credentials -->
                        <div class="onboarding-step-pane" id="step-pane-1">
                            <h2 class="font-heading font-bold mb-3" style="font-size: 18px; color:var(--text-primary); letter-spacing:-0.2px;">Let's create your account credentials</h2>
                            <p class="text-muted mb-4" style="font-size: 12px; line-height: 1.4;">Enter a secure email address and password to start your student workspace.</p>

                            <form id="onboarding-form-1" class="d-flex flex-column gap-3">
                                <div class="form-group">
                                    <label for="reg-email">School Email Address</label>
                                    <input type="email" id="reg-email" placeholder="you@university.edu" required style="width: 100%; padding: 7px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size:13px;">
                                </div>
                                <div class="form-group">
                                    <label for="reg-password">Create Password</label>
                                    <input type="password" id="reg-password" placeholder="Minimum 6 characters" required style="width: 100%; padding: 7px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size:13px;">
                                </div>
                                <button type="submit" class="btn btn-primary w-100" style="padding:8px 12px; font-weight:600; margin-top:8px; font-size:12.5px;">
                                    Continue &rarr;
                                </button>
                            </form>
                        </div>

                        <!-- STEP 2: Demographics Questionnaire -->
                        <div class="onboarding-step-pane" id="step-pane-2" style="display: none;">
                            <h2 class="font-heading font-bold mb-3" style="font-size: 18px; color:var(--text-primary);">Tell us about yourself</h2>
                            <p class="text-muted mb-4" style="font-size: 12px;">This helps personalize your classmates search and GPA target projections.</p>

                            <form id="onboarding-form-2" class="d-flex flex-column gap-3">
                                <div class="form-group">
                                    <label for="reg-fullname">Full Name</label>
                                    <input type="text" id="reg-fullname" placeholder="Alex Rivera" required style="width: 100%; padding: 7px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size:13px;">
                                </div>
                                
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="reg-age">Age</label>
                                        <input type="number" id="reg-age" placeholder="18" required min="13" max="100" style="width: 100%; padding: 7px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size:13px;">
                                    </div>
                                    <div class="form-group">
                                        <label for="reg-state">State</label>
                                        <select id="reg-state" required style="width: 100%; padding: 7px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size:13px;">
                                            <option value="CA">California (CA)</option>
                                            <option value="NY">New York (NY)</option>
                                            <option value="MA">Massachusetts (MA)</option>
                                            <option value="TX">Texas (TX)</option>
                                            <option value="WA">Washington (WA)</option>
                                            <option value="IL">Illinois (IL)</option>
                                            <option value="FL">Florida (FL)</option>
                                            <option value="Other">Other State</option>
                                        </select>
                                    </div>
                                </div>

                                <div class="form-group">
                                    <label for="reg-city">City</label>
                                    <input type="text" id="reg-city" placeholder="Palo Alto" required style="width: 100%; padding: 7px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size:13px;">
                                </div>

                                <div class="form-group">
                                    <label>Education Level</label>
                                    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:4px;">
                                        
                                        <!-- Card 1: High School -->
                                        <div class="glass-panel" id="card-type-highschool" style="padding:12px; cursor:pointer; text-align:center; border: 1.5px solid var(--border-color); border-radius:var(--border-radius-sm); transition: var(--transition-smooth);">
                                            <div style="font-size: 16px; margin-bottom:4px;">🏫</div>
                                            <div class="font-bold font-12" style="color:var(--text-primary);">High School</div>
                                        </div>

                                        <!-- Card 2: College -->
                                        <div class="glass-panel" id="card-type-college" style="padding:12px; cursor:pointer; text-align:center; border: 1.5px solid var(--border-color); border-radius:var(--border-radius-sm); transition: var(--transition-smooth);">
                                            <div style="font-size: 16px; margin-bottom:4px;">🎓</div>
                                            <div class="font-bold font-12" style="color:var(--text-primary);">College / Uni</div>
                                        </div>

                                    </div>
                                </div>

                                <div class="d-flex gap-2 mt-2">
                                    <button type="button" class="btn btn-secondary flex-1" id="wizard-back-btn-2">Back</button>
                                    <button type="submit" class="btn btn-primary flex-1">Next Step &rarr;</button>
                                </div>
                            </form>
                        </div>

                        <!-- STEP 3: Academic details & Autocomplete -->
                        <div class="onboarding-step-pane" id="step-pane-3" style="display: none;">
                            <h2 class="font-heading font-bold mb-3" style="font-size: 18px; color:var(--text-primary);" id="wizard-school-title">Your High School Details</h2>
                            <p class="text-muted mb-4" style="font-size: 12px;" id="wizard-school-subtitle">Type your school name and choose it from the filtered dropdown.</p>

                            <form id="onboarding-form-3" class="d-flex flex-column gap-3" style="position:relative;">
                                
                                <!-- School Field with Autocomplete -->
                                <div class="form-group" style="position:relative;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
                                        <label for="reg-school">School Name</label>
                                        <button type="button" id="geo-school-btn" style="font-size: 10px; color:var(--color-primary); font-weight:600;">
                                            📍 Find schools near me
                                        </button>
                                    </div>
                                    <input type="text" id="reg-school" placeholder="Start typing school..." required autocomplete="off" style="width: 100%; padding: 7px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size:13px;">
                                    
                                    <!-- Autocomplete Dropdown List -->
                                    <div id="autocomplete-box" class="glass-panel" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; max-height: 160px; overflow-y: auto; margin-top: 2px;">
                                        <!-- Dynamic rows -->
                                    </div>
                                </div>

                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="reg-major" id="lbl-reg-major">Major / Focus</label>
                                        <input type="text" id="reg-major" placeholder="e.g. Science" required style="width: 100%; padding: 7px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size:13px;">
                                    </div>
                                    <div class="form-group">
                                        <label for="reg-gradyear">Graduation Year</label>
                                        <input type="text" id="reg-gradyear" placeholder="2028" required style="width: 100%; padding: 7px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size:13px;">
                                    </div>
                                </div>

                                <div class="d-flex gap-2 mt-3">
                                    <button type="button" class="btn btn-secondary flex-1" id="wizard-back-btn-3">Back</button>
                                    <button type="submit" class="btn btn-primary flex-1" id="wizard-submit-btn">Complete Setup</button>
                                </div>
                            </form>
                        </div>

                    </div>

                </div>

            </div>
        `;
    },

    init() {
        this.currentStep = 1;
        this.updateStepView();
        this.bindEvents();
    },

    // Fetch Universities in real-time from HipoLabs API
    async queryUniversitiesAPI(nameQuery) {
        try {
            const response = await fetch(`https://universities.hipolabs.com/search?country=United+States&name=${encodeURIComponent(nameQuery)}`);
            const data = await response.json();
            return data.slice(0, 10).map(u => ({
                name: u.name,
                type: "college",
                city: u.name.includes("University of") ? "Statewide" : "",
                state: ""
            }));
        } catch (e) {
            console.warn("HipoLabs University API call failed:", e);
            return [];
        }
    },

    // Fetch High Schools in real-time from Wikipedia Open Search directory
    async queryHighSchoolsAPI(nameQuery) {
        try {
            const queryUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&limit=15&search=${encodeURIComponent(nameQuery)}+High+School`;
            const response = await fetch(queryUrl);
            const data = await response.json();
            const titles = data[1] || [];
            
            return titles
                .filter(title => title.toLowerCase().includes("high school") && !title.toLowerCase().includes("wiki"))
                .map(title => ({
                    name: title,
                    type: "highschool",
                    city: "",
                    state: ""
                }));
        } catch (e) {
            console.warn("Wikipedia High School Search API failed:", e);
            return [];
        }
    },

    bindEvents() {
        // Step 1 Submit
        document.getElementById('onboarding-form-1').onsubmit = (e) => {
            e.preventDefault();
            this.currentStep = 2;
            this.updateStepView();
        };

        // Step 2 Submit
        document.getElementById('onboarding-form-2').onsubmit = (e) => {
            e.preventDefault();
            this.currentStep = 3;
            this.updateStepView();
        };

        // Navigation Back Buttons
        document.getElementById('wizard-back-btn-2').onclick = () => {
            this.currentStep = 1;
            this.updateStepView();
        };

        document.getElementById('wizard-back-btn-3').onclick = () => {
            this.currentStep = 2;
            this.updateStepView();
        };

        // Education Card Selection logic
        const hsCard = document.getElementById('card-type-highschool');
        const colCard = document.getElementById('card-type-college');

        const selectType = (type) => {
            this.educationLevel = type;
            if (hsCard && colCard) {
                hsCard.style.borderColor = 'var(--border-color)';
                hsCard.style.backgroundColor = 'transparent';
                colCard.style.borderColor = 'var(--border-color)';
                colCard.style.backgroundColor = 'transparent';

                const activeCard = type === 'highschool' ? hsCard : colCard;
                activeCard.style.borderColor = 'var(--color-primary)';
                activeCard.style.backgroundColor = 'var(--card-hover-bg)';
            }
        };

        if (hsCard && colCard) {
            hsCard.onclick = () => selectType('highschool');
            colCard.onclick = () => selectType('college');
            selectType(this.educationLevel);
        }

        // Age Listener: default selection based on Age <= 18
        const ageInput = document.getElementById('reg-age');
        if (ageInput) {
            ageInput.oninput = (e) => {
                const val = parseInt(e.target.value) || 0;
                if (val > 0) {
                    if (val <= 18) selectType('highschool');
                    else selectType('college');
                }
            };
        }

        // Autocomplete search logic
        const schoolInput = document.getElementById('reg-school');
        const autocompleteBox = document.getElementById('autocomplete-box');

        const searchSchools = async (query) => {
            if (!query || query.trim().length < 2) {
                autocompleteBox.style.display = 'none';
                return;
            }

            // 1. Fetch Local Matches first (instant fallback)
            const cleanQuery = query.toLowerCase();
            const localMatches = LOCAL_SCHOOLS_DATABASE.filter(s => 
                s.type === this.educationLevel && 
                s.name.toLowerCase().includes(cleanQuery)
            );

            renderAutocompleteRows(localMatches, true);

            // Debounced API Request
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(async () => {
                let externalMatches = [];
                if (this.educationLevel === 'college') {
                    externalMatches = await this.queryUniversitiesAPI(query);
                } else {
                    externalMatches = await this.queryHighSchoolsAPI(query);
                }

                // Merge local and external results uniquely by name
                const mergedMap = new Map();
                localMatches.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
                externalMatches.forEach(item => mergedMap.set(item.name.toLowerCase(), item));

                renderAutocompleteRows(Array.from(mergedMap.values()), false);
            }, 350);
        };

        const renderAutocompleteRows = (matches, isLoading = false) => {
            if (matches.length === 0) {
                autocompleteBox.innerHTML = `
                    <div style="padding: 10px; font-size:11.5px; color:var(--text-muted); text-align:center;">
                        ${isLoading ? 'Searching...' : `No matching ${this.educationLevel === 'highschool' ? 'high schools' : 'colleges'} found.`}
                    </div>
                `;
            } else {
                autocompleteBox.innerHTML = matches.map(s => {
                    const subtitle = s.city ? `${s.city}${s.state ? `, ${s.state}` : ''}` : 'US Institute';
                    return `
                        <div class="autocomplete-row" data-name="${s.name}" style="padding: 8px 12px; cursor: pointer; font-size:12px; border-bottom:1px solid var(--border-color); color:var(--text-primary); transition:var(--transition-smooth); display:flex; justify-content:space-between;">
                            <strong>${s.name}</strong>
                            <span style="font-size:10px; color:var(--text-muted);">${subtitle}</span>
                        </div>
                    `;
                }).join('');

                // Hover style handlers
                autocompleteBox.querySelectorAll('.autocomplete-row').forEach(row => {
                    row.onmouseenter = () => { row.style.backgroundColor = 'var(--card-hover-bg)'; };
                    row.onmouseleave = () => { row.style.backgroundColor = 'transparent'; };
                    row.onclick = () => {
                        schoolInput.value = row.getAttribute('data-name');
                        autocompleteBox.style.display = 'none';
                    };
                });
            }
            autocompleteBox.style.display = 'block';
        };

        if (schoolInput) {
            schoolInput.oninput = (e) => searchSchools(e.target.value);
            // Hide list on outside click
            document.addEventListener('click', (e) => {
                if (e.target !== schoolInput && e.target !== autocompleteBox) {
                    if (autocompleteBox) autocompleteBox.style.display = 'none';
                }
            });
        }

        // Location-Based "Near Me" Matching
        const geoBtn = document.getElementById('geo-school-btn');
        if (geoBtn) {
            geoBtn.onclick = async () => {
                const state = document.getElementById('reg-state').value;
                const city = document.getElementById('reg-city').value.trim();

                if (!city) {
                    window.app.showToast("Please enter your City in Step 2 first!", "warning");
                    return;
                }

                window.app.showToast(`Locating ${this.educationLevel === 'highschool' ? 'high schools' : 'universities'} in ${city}...`, "info");

                // Filter by local coordinates
                let localMatches = LOCAL_SCHOOLS_DATABASE.filter(s => 
                    s.type === this.educationLevel && 
                    s.state === state && 
                    s.city.toLowerCase() === city.toLowerCase()
                );

                // Fetch external elements matching city query from API
                let externalMatches = [];
                if (this.educationLevel === 'college') {
                    externalMatches = await this.queryUniversitiesAPI(city);
                } else {
                    externalMatches = await this.queryHighSchoolsAPI(`${city} ${state}`);
                }

                const mergedMap = new Map();
                localMatches.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
                externalMatches.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
                const results = Array.from(mergedMap.values());

                renderAutocompleteRows(results, false);
            };
        }

        // Final Submit: Onboarding Completion
        document.getElementById('onboarding-form-3').onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('reg-email').value;
            const password = document.getElementById('reg-password').value;
            const fullName = document.getElementById('reg-fullname').value;
            const age = parseInt(document.getElementById('reg-age').value) || null;
            const state = document.getElementById('reg-state').value;
            const city = document.getElementById('reg-city').value;
            const schoolName = document.getElementById('reg-school').value;
            const major = document.getElementById('reg-major').value;
            const gradYear = document.getElementById('reg-gradyear').value;

            const submitBtn = document.getElementById('wizard-submit-btn');
            submitBtn.disabled = true;
            submitBtn.textContent = "Setting up workspace...";

            try {
                await signUpUser(email, password, fullName, schoolName, {
                    age,
                    state,
                    city,
                    educationLevel: this.educationLevel,
                    major,
                    gradYear
                });

                window.app.showToast("Account onboarding completed! Logging you in...", "success");
                
                // Set default redirection delay
                setTimeout(() => {
                    window.location.hash = '#login';
                }, 1000);
            } catch (err) {
                console.error("Signup error:", err);
                window.app.showToast(err.message || "Signup failed.", "danger");
                submitBtn.disabled = false;
                submitBtn.textContent = "Complete Setup";
            }
        };
    },

    updateStepView() {
        const pane1 = document.getElementById('step-pane-1');
        const pane2 = document.getElementById('step-pane-2');
        const pane3 = document.getElementById('step-pane-3');
        
        const progTitle = document.getElementById('wizard-progress-title');
        const progPct = document.getElementById('wizard-step-pct');
        const progBar = document.getElementById('wizard-progress-bar');

        if (!pane1 || !pane2 || !pane3) return;

        pane1.style.display = 'none';
        pane2.style.display = 'none';
        pane3.style.display = 'none';

        if (this.currentStep === 1) {
            pane1.style.display = 'block';
            progTitle.textContent = "Step 1 of 3: Account Setup";
            progPct.textContent = "33% Complete";
            progBar.style.width = '33%';
        } else if (this.currentStep === 2) {
            pane2.style.display = 'block';
            progTitle.textContent = "Step 2 of 3: Profile Questionnaire";
            progPct.textContent = "66% Complete";
            progBar.style.width = '66%';
        } else {
            pane3.style.display = 'block';
            progTitle.textContent = "Step 3 of 3: Academic Details";
            progPct.textContent = "100% Ready";
            progBar.style.width = '100%';

            // Dynamic titles depending on High School vs College
            const title = document.getElementById('wizard-school-title');
            const subtitle = document.getElementById('wizard-school-subtitle');
            const majorLbl = document.getElementById('lbl-reg-major');
            const majorInput = document.getElementById('reg-major');

            if (this.educationLevel === 'highschool') {
                title.textContent = "Your High School Details";
                subtitle.textContent = "Select your high school using restricted search or geographic lookup.";
                majorLbl.textContent = "Academic Focus / Track";
                majorInput.placeholder = "e.g. STEM, Humanities";
            } else {
                title.textContent = "Your College Details";
                subtitle.textContent = "Select your university or college using restricted search or geographic lookup.";
                majorLbl.textContent = "Major / Concentration";
                majorInput.placeholder = "e.g. Computer Science";
            }
        }
    }
};
export default signupView;
