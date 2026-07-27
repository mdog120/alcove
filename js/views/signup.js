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

    // Returns merged local and user-created custom schools
    getMergedSchoolsDatabase() {
        const customSchools = JSON.parse(localStorage.getItem('alcove_custom_schools') || '[]');
        return [...LOCAL_SCHOOLS_DATABASE, ...customSchools];
    },

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
                                            ${US_STATES.map(s => `<option value="${s.code}">${s.name} (${s.code})</option>`).join('')}
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
                            <p class="text-muted mb-4" style="font-size: 12px;" id="wizard-school-subtitle">Type your details and choose options from the dropdowns.</p>

                            <form id="onboarding-form-3" class="d-flex flex-column gap-3" style="position:relative;">
                                
                                <!-- School District Field (High School only) -->
                                <div class="form-group" id="district-form-group" style="position:relative; display:none;">
                                    <label for="reg-district">School District</label>
                                    <input type="text" id="reg-district" placeholder="e.g. Palo Alto Unified" autocomplete="off" style="width: 100%; padding: 7px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size:13px;">
                                    
                                    <!-- Autocomplete Dropdown List for Districts -->
                                    <div id="autocomplete-district-box" class="glass-panel" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1001; max-height: 140px; overflow-y: auto; margin-top: 2px;">
                                        <!-- Dynamic rows -->
                                    </div>
                                </div>

                                <!-- School Field with Autocomplete -->
                                <div class="form-group" style="position:relative;">
                                    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
                                        <label for="reg-school">School Name</label>
                                        <button type="button" id="geo-school-btn" style="font-size: 10px; color:var(--color-primary); font-weight:600;">
                                            📍 Find schools near me
                                        </button>
                                    </div>
                                    <input type="text" id="reg-school" placeholder="Start typing school..." required autocomplete="off" style="width: 100%; padding: 7px 10px; border-radius: var(--border-radius-sm); border: 1px solid var(--border-color); background: var(--input-bg); color: var(--text-primary); font-size:13px;">
                                    
                                    <!-- Autocomplete Dropdown List for Schools -->
                                    <div id="autocomplete-school-box" class="glass-panel" style="display: none; position: absolute; top: 100%; left: 0; right: 0; background: var(--panel-bg); border: 1px solid var(--border-color); border-radius: var(--border-radius-sm); box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 1000; max-height: 160px; overflow-y: auto; margin-top: 2px;">
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

    // Fetch Universities from HipoLabs API
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

    // Fetch Districts dynamically from Wikipedia
    async queryDistrictsAPI(nameQuery) {
        try {
            const queryUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&limit=10&search=${encodeURIComponent(nameQuery)}+School+District`;
            const response = await fetch(queryUrl);
            const data = await response.json();
            const titles = data[1] || [];
            
            return titles
                .filter(title => title.toLowerCase().includes("school district") || title.toLowerCase().includes("unified school"))
                .map(title => ({ name: title }));
        } catch (e) {
            console.warn("Wikipedia School District API failed:", e);
            return [];
        }
    },

    // Fetch High Schools dynamically from Wikipedia (incorporating chosen district name)
    async queryHighSchoolsAPI(nameQuery, districtFilter = '') {
        try {
            let searchStr = nameQuery;
            if (districtFilter) {
                searchStr = `${nameQuery} ${districtFilter}`;
            } else {
                searchStr = `${nameQuery} High School`;
            }
            
            const queryUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&origin=*&limit=15&search=${encodeURIComponent(searchStr)}`;
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

        // 1. Autocomplete Search Logic for Districts
        const districtInput = document.getElementById('reg-district');
        const districtBox = document.getElementById('autocomplete-district-box');

        const searchDistricts = async (query) => {
            if (!query || query.trim().length < 2) {
                districtBox.style.display = 'none';
                return;
            }

            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(async () => {
                const matches = await this.queryDistrictsAPI(query);
                renderDistrictRows(matches);
            }, 300);
        };

        const renderDistrictRows = (matches) => {
            if (matches.length === 0) {
                districtBox.innerHTML = `
                    <div style="padding: 10px; font-size:11.5px; color:var(--text-muted); text-align:center;">
                        No matching school districts found.
                    </div>
                `;
            } else {
                districtBox.innerHTML = matches.map(d => `
                    <div class="autocomplete-district-row" data-name="${d.name}" style="padding: 8px 12px; cursor: pointer; font-size:12px; border-bottom:1px solid var(--border-color); color:var(--text-primary); transition:var(--transition-smooth);">
                        <strong>${d.name}</strong>
                    </div>
                `).join('');

                districtBox.querySelectorAll('.autocomplete-district-row').forEach(row => {
                    row.onmouseenter = () => { row.style.backgroundColor = 'var(--card-hover-bg)'; };
                    row.onmouseleave = () => { row.style.backgroundColor = 'transparent'; };
                    row.onclick = () => {
                        districtInput.value = row.getAttribute('data-name');
                        districtBox.style.display = 'none';
                    };
                });
            }
            districtBox.style.display = 'block';
        };

        if (districtInput) {
            districtInput.oninput = (e) => searchDistricts(e.target.value);
        }

        // 2. Autocomplete Search Logic for Schools
        const schoolInput = document.getElementById('reg-school');
        const schoolBox = document.getElementById('autocomplete-school-box');

        const searchSchools = async (query) => {
            if (!query || query.trim().length < 2) {
                schoolBox.style.display = 'none';
                return;
            }

            schoolBox.innerHTML = `<div style="padding:10px; font-size:11.5px; color:var(--text-muted); text-align:center;">Searching...</div>`;
            schoolBox.style.display = 'block';

            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(async () => {
                let matches = [];
                const mergedDB = this.getMergedSchoolsDatabase();
                
                // Fetch local matching entries
                const cleanQuery = query.toLowerCase();
                let localMatches = mergedDB.filter(s => 
                    s.type === this.educationLevel && 
                    s.name.toLowerCase().includes(cleanQuery)
                );

                if (this.educationLevel === 'college') {
                    const externalMatches = await this.queryUniversitiesAPI(query);
                    const mergedMap = new Map();
                    localMatches.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
                    externalMatches.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
                    matches = Array.from(mergedMap.values());
                } else {
                    const selectedDistrict = districtInput.value.trim();
                    const externalMatches = await this.queryHighSchoolsAPI(query, selectedDistrict);
                    const mergedMap = new Map();
                    localMatches.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
                    externalMatches.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
                    matches = Array.from(mergedMap.values());
                }

                renderSchoolRows(matches);
            }, 350);
        };

        const renderSchoolRows = (matches) => {
            let listHTML = '';
            
            if (matches.length === 0) {
                listHTML += `
                    <div style="padding: 10px; font-size:11.5px; color:var(--text-muted); text-align:center;">
                        No matching ${this.educationLevel === 'highschool' ? 'high schools' : 'colleges'} found.
                    </div>
                `;
            } else {
                listHTML += matches.map(s => {
                    const subtitle = s.city ? `${s.city}${s.state ? `, ${s.state}` : ''}` : 'US School';
                    return `
                        <div class="autocomplete-school-row" data-name="${s.name}" style="padding: 8px 12px; cursor: pointer; font-size:12px; border-bottom:1px solid var(--border-color); color:var(--text-primary); transition:var(--transition-smooth); display:flex; justify-content:space-between;">
                            <strong>${s.name}</strong>
                            <span style="font-size:10px; color:var(--text-muted);">${subtitle}</span>
                        </div>
                    `;
                }).join('');
            }

            // Append custom manual register link at bottom of dropdown
            listHTML += `
                <div id="manual-register-trigger" style="padding: 10px 12px; cursor: pointer; font-size:12px; text-align:center; font-weight:600; color:var(--color-primary); background-color:var(--bg-secondary); border-top:1px solid var(--border-color); transition:var(--transition-smooth);">
                     Can't find your school? Add it manually
                </div>
            `;

            schoolBox.innerHTML = listHTML;

            // Bind click rows
            schoolBox.querySelectorAll('.autocomplete-school-row').forEach(row => {
                row.onmouseenter = () => { row.style.backgroundColor = 'var(--card-hover-bg)'; };
                row.onmouseleave = () => { row.style.backgroundColor = 'transparent'; };
                row.onclick = () => {
                    schoolInput.value = row.getAttribute('data-name');
                    schoolBox.style.display = 'none';
                };
            });

            // Bind manual registration link click
            const trigger = document.getElementById('manual-register-trigger');
            if (trigger) {
                trigger.onmouseenter = () => { trigger.style.backgroundColor = 'var(--bg-tertiary)'; };
                trigger.onmouseleave = () => { trigger.style.backgroundColor = 'var(--bg-secondary)'; };
                trigger.onclick = (e) => {
                    e.stopPropagation();
                    schoolBox.style.display = 'none';
                    this.openCustomSchoolModal();
                };
            }

            schoolBox.style.display = 'block';
        };

        if (schoolInput) {
            schoolInput.oninput = (e) => searchSchools(e.target.value);
        }

        // Click outside closes dropdowns
        document.addEventListener('click', (e) => {
            if (districtInput && e.target !== districtInput && e.target !== districtBox) {
                districtBox.style.display = 'none';
            }
            if (schoolInput && e.target !== schoolInput && e.target !== schoolBox) {
                schoolBox.style.display = 'none';
            }
        });

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

                window.app.showToast(`Locating schools near ${city}, ${state}...`, "info");

                const mergedDB = this.getMergedSchoolsDatabase();
                let localMatches = mergedDB.filter(s => 
                    s.type === this.educationLevel && 
                    s.state === state && 
                    s.city.toLowerCase() === city.toLowerCase()
                );

                let results = [];
                if (this.educationLevel === 'college') {
                    const externalMatches = await this.queryUniversitiesAPI(city);
                    const mergedMap = new Map();
                    localMatches.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
                    externalMatches.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
                    results = Array.from(mergedMap.values());
                } else {
                    const selectedDistrict = districtInput.value.trim();
                    const queryStr = selectedDistrict ? `${city} ${selectedDistrict}` : `${city} High School`;
                    const externalMatches = await this.queryHighSchoolsAPI(queryStr);
                    const mergedMap = new Map();
                    localMatches.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
                    externalMatches.forEach(item => mergedMap.set(item.name.toLowerCase(), item));
                    results = Array.from(mergedMap.values());
                }

                renderSchoolRows(results);
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
            const schoolDistrict = districtInput ? districtInput.value : '';
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
                    schoolDistrict,
                    major,
                    gradYear
                });

                window.app.showToast("Account onboarding completed! Logging you in...", "success");
                
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

    // Injects floating modal to write school properties manually
    openCustomSchoolModal() {
        // Destroy existing modal if loaded
        const exist = document.getElementById('custom-school-modal-overlay');
        if (exist) exist.remove();

        const currentDistrict = document.getElementById('reg-district').value;
        const currentCity = document.getElementById('reg-city').value;
        const currentState = document.getElementById('reg-state').value;

        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'custom-school-modal-overlay';
        modal.innerHTML = `
            <div class="modal-content glass-panel" style="max-width:380px; padding:24px; position:relative; background:var(--panel-bg); border:1px solid var(--border-color); border-radius:6px; box-shadow:0 12px 32px rgba(0,0,0,0.15);">
                <button id="custom-school-close" class="close-modal-btn" style="position:absolute; top:12px; right:14px; font-size:18px; border:none; background:none; cursor:pointer; color:var(--text-muted);">&times;</button>
                
                <h3 class="font-heading font-bold mb-1" style="font-size:15px; color:var(--text-primary);">Add Custom School</h3>
                <p class="text-muted mb-3" style="font-size:11px;">Register a school not listed in standard directories.</p>
                
                <form id="custom-school-form" style="display:flex; flex-direction:column; gap:10px;">
                    <div class="form-group">
                        <label>School Name</label>
                        <input type="text" id="custom-name" placeholder="e.g. West Palo Alto Academy" required style="width:100%; padding:6px 8px; border-radius:4px; border:1px solid var(--border-color); background:var(--input-bg); color:var(--text-primary); font-size:12.5px;">
                    </div>
                    <div class="form-group" style="display: ${this.educationLevel === 'highschool' ? 'block' : 'none'};">
                        <label>School District</label>
                        <input type="text" id="custom-district" placeholder="e.g. Palo Alto Unified" value="${currentDistrict}" style="width:100%; padding:6px 8px; border-radius:4px; border:1px solid var(--border-color); background:var(--input-bg); color:var(--text-primary); font-size:12.5px;">
                    </div>
                    <div class="form-group">
                        <label>Location / Address</label>
                        <input type="text" id="custom-address" placeholder="e.g. 120 University Ave" value="${currentCity ? `${currentCity}, ${currentState}` : ''}" required style="width:100%; padding:6px 8px; border-radius:4px; border:1px solid var(--border-color); background:var(--input-bg); color:var(--text-primary); font-size:12.5px;">
                    </div>
                    
                    <div class="d-flex gap-2" style="margin-top:12px; display:flex;">
                        <button type="button" class="btn btn-secondary flex-1" id="custom-cancel-btn" style="padding:6px; font-size:12px;">Cancel</button>
                        <button type="submit" class="btn btn-primary flex-1" style="padding:6px; font-size:12px;">Save & Select</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const destroy = () => modal.remove();

        document.getElementById('custom-school-close').onclick = destroy;
        document.getElementById('custom-cancel-btn').onclick = destroy;
        modal.onclick = (e) => { if (e.target === modal) destroy(); };

        document.getElementById('custom-school-form').onsubmit = (e) => {
            e.preventDefault();
            const customName = document.getElementById('custom-name').value.trim();
            const customDistrict = document.getElementById('custom-district') ? document.getElementById('custom-district').value.trim() : '';
            const customAddress = document.getElementById('custom-address').value.trim();

            const customList = JSON.parse(localStorage.getItem('alcove_custom_schools') || '[]');
            
            const newSchool = {
                name: customName,
                type: this.educationLevel,
                city: customAddress.split(',')[0]?.trim() || currentCity,
                state: currentState,
                district: customDistrict,
                address: customAddress
            };

            customList.push(newSchool);
            localStorage.setItem('alcove_custom_schools', JSON.stringify(customList));

            // Populate the signup form field
            document.getElementById('reg-school').value = customName;
            
            window.app.showToast(`Saved "${customName}" successfully!`, "success");
            destroy();
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

            // Toggle District Input visibility based on Education Level
            const districtGroup = document.getElementById('district-form-group');
            const districtInput = document.getElementById('reg-district');
            
            const title = document.getElementById('wizard-school-title');
            const subtitle = document.getElementById('wizard-school-subtitle');
            const majorLbl = document.getElementById('lbl-reg-major');
            const majorInput = document.getElementById('reg-major');

            if (this.educationLevel === 'highschool') {
                districtGroup.style.display = 'block';
                if (districtInput) districtInput.required = true;

                title.textContent = "Your High School Details";
                subtitle.textContent = "Choose your school district and select your high school from the filtered dropdown.";
                majorLbl.textContent = "Academic Focus / Track";
                majorInput.placeholder = "e.g. STEM, Humanities";
            } else {
                districtGroup.style.display = 'none';
                if (districtInput) {
                    districtInput.required = false;
                    districtInput.value = '';
                }

                title.textContent = "Your College Details";
                subtitle.textContent = "Select your university or college using restricted search or geographic lookup.";
                majorLbl.textContent = "Major / Concentration";
                majorInput.placeholder = "e.g. Computer Science";
            }
        }
    }
};
export default signupView;
