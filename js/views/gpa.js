/* ==========================================================================
   Alcove GPA Calculator Router Module
   ========================================================================== */

import { store } from '../store.js';

export const gpaView = {
    activeSemester: 'Fall 2025',
    semesters: {
        'Fall 2025': [],
        'Spring 2026': []
    },

    template() {
        return `
            <div class="planner-controls">
                <h2 class="font-heading font-bold font-24">GPA Dashboard & Calculator</h2>
                <div class="d-flex gap-2">
                    <button class="btn btn-secondary" id="gpa-add-semester-btn">
                        <i class="fa-solid fa-folder-plus"></i> New Semester
                    </button>
                    <button class="btn btn-primary" id="gpa-save-btn">
                        <i class="fa-solid fa-floppy-disk"></i> Save Changes
                    </button>
                </div>
            </div>

            <div class="gpa-grid">
                
                <!-- Left Column: Circular Progress Gauge & Stats -->
                <div class="gpa-stats-pane glass-panel gpa-card-score">
                    <h3 class="font-heading font-bold mb-4">Academic Summary</h3>
                    
                    <div class="gpa-gauge-container">
                        <svg class="gpa-gauge-circle" viewBox="0 0 200 200">
                            <defs>
                                <linearGradient id="gpa-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stop-color="var(--color-primary)" />
                                    <stop offset="100%" stop-color="var(--color-secondary)" />
                                </linearGradient>
                            </defs>
                            <circle class="gpa-gauge-bg" cx="100" cy="100" r="90"></circle>
                            <circle class="gpa-gauge-fill" id="gpa-radial-fill" cx="100" cy="100" r="90"></circle>
                        </svg>
                        <div class="gpa-gauge-text">
                            <span class="gpa-gauge-value" id="gpa-radial-val">0.00</span>
                            <span class="gpa-gauge-label">Cumulative GPA</span>
                        </div>
                    </div>

                    <div class="gpa-stats-rows">
                        <div class="gpa-stat-row">
                            <span>Total Units/Credits:</span>
                            <span id="gpa-total-credits">0</span>
                        </div>
                        <div class="gpa-stat-row">
                            <span>Honor Points Earned:</span>
                            <span id="gpa-total-points">0.0</span>
                        </div>
                        <div class="gpa-stat-row">
                            <span>Current Academic standing:</span>
                            <span id="gpa-standing" class="text-indigo font-bold">Excellent</span>
                        </div>
                    </div>

                    <!-- Target GPA Estimator Widget -->
                    <div class="mt-4 p-3 glass-panel w-100 text-left font-12" style="background-color: var(--bg-tertiary);">
                        <h4 class="font-semibold mb-2 text-indigo"><i class="fa-solid fa-bullseye"></i> GPA Goal Target</h4>
                        <div class="d-flex align-items-center justify-content-between mb-2">
                            <span>Target GPA Goal:</span>
                            <input type="number" id="gpa-target-input" value="3.90" step="0.05" min="0" max="4.0" style="width: 60px; padding: 4px 6px; border-radius: 4px; border: 1px solid var(--border-color); background: var(--bg-primary); color: var(--text-primary); text-align: center;">
                        </div>
                        <p class="text-muted" id="gpa-target-suggestion">To reach a 3.90, you need an average of A (4.0) in your remaining courses.</p>
                    </div>
                </div>

                <!-- Right Column: Course details logger by semester -->
                <div class="gpa-courses-panel glass-panel">
                    <!-- Semester Tabs -->
                    <div class="gpa-tabs" id="gpa-semesters-tabs">
                        <!-- Dynamic semester tab buttons -->
                    </div>

                    <!-- Course listing table form -->
                    <div class="gpa-courses-list" id="gpa-courses-table">
                        <!-- Dynamic course rows -->
                    </div>

                    <!-- Foot actions -->
                    <div class="gpa-actions">
                        <button class="btn btn-secondary btn-sm" id="gpa-add-course-btn">
                            <i class="fa-solid fa-plus-circle text-emerald"></i> Add Course Row
                        </button>
                        <span class="text-muted font-12" id="gpa-semester-summary">
                            Semester GPA: 0.00 | Credits: 0
                        </span>
                    </div>
                </div>

            </div>
        `;
    },

    init() {
        this.loadGPAData();
        this.renderSemestersTabs();
        this.renderCoursesList();
        this.recalculateGPA();
        this.bindEvents();
    },

    // Retrieve courses details mapped by semester
    loadGPAData() {
        // Build semesters data from store
        const storeCourses = store.getCourses();
        
        // Fallback default setups
        this.semesters = {
            'Fall 2025': [],
            'Spring 2026': []
        };

        // Populate semester lists from courses database
        storeCourses.forEach(c => {
            // Assign courses to semesters (mocking CS 106B and MATH 51 to Fall 2025, BIO 83 and PWR 1 to Spring 2026)
            let sem = 'Fall 2025';
            if (c.id === 'bio-83' || c.id === 'pwr-1') {
                sem = 'Spring 2026';
            }
            if (!this.semesters[sem]) this.semesters[sem] = [];
            
            this.semesters[sem].push({
                id: c.id,
                name: c.code,
                desc: c.name,
                credits: c.credits,
                grade: c.grade,
                weight: c.type || 'regular'
            });
        });

        // Pull any other saved data from localstorage
        const savedSem = localStorage.getItem('alcove_gpa_semesters');
        if (savedSem) {
            this.semesters = JSON.parse(savedSem);
        }
    },

    renderSemestersTabs() {
        const container = document.getElementById('gpa-semesters-tabs');
        container.innerHTML = Object.keys(this.semesters).map(sem => `
            <button class="gpa-tab-btn ${this.activeSemester === sem ? 'active' : ''}" data-sem="${sem}">
                ${sem}
            </button>
        `).join('');

        // Tab click binds
        container.querySelectorAll('.gpa-tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeSemester = btn.getAttribute('data-sem');
                this.renderSemestersTabs();
                this.renderCoursesList();
                this.recalculateGPA();
            });
        });
    },

    renderCoursesList() {
        const container = document.getElementById('gpa-courses-table');
        const courses = this.semesters[this.activeSemester] || [];

        if (courses.length === 0) {
            container.innerHTML = `
                <div class="py-5 text-center text-secondary">
                    <p class="mb-2">No courses registered for this semester.</p>
                    <span class="font-11 text-muted">Click "Add Course Row" to get started.</span>
                </div>
            `;
            return;
        }

        const grades = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "F", "W"];
        
        container.innerHTML = courses.map((c, index) => `
            <div class="gpa-course-row" data-index="${index}">
                <!-- Course Name -->
                <input type="text" class="gpa-course-name" value="${c.name}" placeholder="e.g. CS 106B" required>
                
                <!-- Credits -->
                <input type="number" class="gpa-course-credits" value="${c.credits}" placeholder="Units" min="1" max="10" required>
                
                <!-- Grade Selector -->
                <select class="gpa-course-grade">
                    ${grades.map(g => `<option value="${g}" ${c.grade === g ? 'selected' : ''}>Grade: ${g}</option>`).join('')}
                </select>
                
                <!-- Weight Class -->
                <select class="gpa-course-weight">
                    <option value="regular" ${c.weight === 'regular' ? 'selected' : ''}>Regular (4.0)</option>
                    <option value="honors" ${c.weight === 'honors' ? 'selected' : ''}>Honors (+0.5)</option>
                    <option value="ap" ${c.weight === 'ap' ? 'selected' : ''}>AP/IB (+1.0)</option>
                </select>
                
                <!-- Delete row button -->
                <button class="gpa-remove-course" data-index="${index}" title="Remove Course">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `).join('');

        // Wire inputs reactive calculations
        container.querySelectorAll('.gpa-course-name').forEach((input, i) => {
            input.addEventListener('input', (e) => { courses[i].name = e.target.value; });
        });
        container.querySelectorAll('.gpa-course-credits').forEach((input, i) => {
            input.addEventListener('input', (e) => { 
                courses[i].credits = parseInt(e.target.value) || 0; 
                this.recalculateGPA();
            });
        });
        container.querySelectorAll('.gpa-course-grade').forEach((select, i) => {
            select.addEventListener('change', (e) => { 
                courses[i].grade = e.target.value; 
                this.recalculateGPA();
            });
        });
        container.querySelectorAll('.gpa-course-weight').forEach((select, i) => {
            select.addEventListener('change', (e) => { 
                courses[i].weight = e.target.value; 
                this.recalculateGPA();
            });
        });

        // Wire remove buttons
        container.querySelectorAll('.gpa-remove-course').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'));
                courses.splice(index, 1);
                this.renderCoursesList();
                this.recalculateGPA();
            });
        });
    },

    recalculateGPA() {
        const gradeScale = {
            "A+": 4.0, "A": 4.0, "A-": 3.7,
            "B+": 3.3, "B": 3.0, "B-": 2.7,
            "C+": 2.3, "C": 2.0, "C-": 1.7,
            "D+": 1.3, "D": 1.0, "F": 0.0, "W": null
        };

        let cumulativeCredits = 0;
        let cumulativePoints = 0;
        
        let semesterCredits = 0;
        let semesterPoints = 0;

        // Iterate over all semesters to compute cumulative statistics
        Object.keys(this.semesters).forEach(semName => {
            const semCourses = this.semesters[semName];
            
            semCourses.forEach(c => {
                const baseValue = gradeScale[c.grade];
                if (baseValue !== null && baseValue !== undefined) {
                    // Apply weight bonuses
                    let finalWeight = baseValue;
                    if (c.weight === 'honors') finalWeight += 0.5;
                    if (c.weight === 'ap') finalWeight += 1.0;

                    const coursePoints = finalWeight * c.credits;
                    
                    // Cumulative addition
                    cumulativeCredits += c.credits;
                    cumulativePoints += coursePoints;

                    // Semester specific addition
                    if (semName === this.activeSemester) {
                        semesterCredits += c.credits;
                        semesterPoints += coursePoints;
                    }
                }
            });
        });

        // Compute results
        const cumulativeGPA = cumulativeCredits > 0 ? (cumulativePoints / cumulativeCredits) : 0.00;
        const currentSemGPA = semesterCredits > 0 ? (semesterPoints / semesterCredits) : 0.00;

        // Update Semicircular SVG Gauge details
        const strokeFillEl = document.getElementById('gpa-radial-fill');
        const radialValEl = document.getElementById('gpa-radial-val');
        
        radialValEl.textContent = cumulativeGPA.toFixed(2);
        
        // Circular gauge calculations
        // Radius = 90. Circumference = 2 * PI * 90 = 565.48
        const maxCircumference = 565.48;
        const percentage = Math.min(cumulativeGPA / 4.0, 1.0); // cap at 4.0 bounds
        const strokeOffset = maxCircumference - (percentage * maxCircumference);
        strokeFillEl.style.strokeDashoffset = strokeOffset;

        // Populate bottom widgets label
        document.getElementById('gpa-total-credits').textContent = cumulativeCredits;
        document.getElementById('gpa-total-points').textContent = cumulativePoints.toFixed(1);
        document.getElementById('gpa-semester-summary').textContent = `Semester GPA: ${currentSemGPA.toFixed(2)} | Credits: ${semesterCredits}`;

        // Academic standing text descriptor
        const standingEl = document.getElementById('gpa-standing');
        if (cumulativeGPA >= 3.8) {
            standingEl.textContent = "Summa Cum Laude (Excellent)";
            standingEl.style.color = "var(--color-emerald)";
        } else if (cumulativeGPA >= 3.5) {
            standingEl.textContent = "Dean's List (Very Good)";
            standingEl.style.color = "var(--color-primary)";
        } else if (cumulativeGPA >= 3.0) {
            standingEl.textContent = "Good Standing";
            standingEl.style.color = "var(--color-cyan)";
        } else {
            standingEl.textContent = "Needs Academic Review";
            standingEl.style.color = "var(--color-rose)";
        }

        // Reevaluate Goal target estimator details
        this.updateTargetSuggestion(cumulativeGPA, cumulativeCredits);
    },

    updateTargetSuggestion(currentGPA, currentCredits) {
        const targetInput = document.getElementById('gpa-target-input');
        const suggestionEl = document.getElementById('gpa-target-suggestion');
        
        if (!targetInput || !suggestionEl) return;
        
        const targetGPA = parseFloat(targetInput.value) || 3.90;
        
        // Basic projection (assume user has 15 more credits/units to take)
        const remainingCredits = 15;
        const requiredAvg = ((targetGPA * (currentCredits + remainingCredits)) - (currentGPA * currentCredits)) / remainingCredits;

        if (requiredAvg <= 0) {
            suggestionEl.textContent = `You've already surpassed your target! Keep up the excellent work!`;
            suggestionEl.style.color = "var(--color-emerald)";
        } else if (requiredAvg > 4.5) {
            suggestionEl.textContent = `Goal requires an average of ${requiredAvg.toFixed(2)} in your next 15 units. This is mathematically out of range for regular classes.`;
            suggestionEl.style.color = "var(--color-rose)";
        } else {
            let letterText = "A- (3.7)";
            if (requiredAvg > 3.7) letterText = "A (4.0)";
            if (requiredAvg > 4.0) letterText = "A+ / AP Classes (+4.0)";
            
            suggestionEl.textContent = `To reach your target of ${targetGPA.toFixed(2)}, you must average a ${requiredAvg.toFixed(2)} (${letterText}) across your next ${remainingCredits} credits.`;
            suggestionEl.style.color = "var(--text-secondary)";
        }
    },

    bindEvents() {
        // Save button coordinator
        document.getElementById('gpa-save-btn').addEventListener('click', () => {
            // Save local memory state to localStorage
            localStorage.setItem('alcove_gpa_semesters', JSON.stringify(this.semesters));

            // Also update the central classes database course grades to sync back!
            const allCourses = store.getCourses();
            
            Object.keys(this.semesters).forEach(sem => {
                this.semesters[sem].forEach(semCourse => {
                    const match = allCourses.find(ac => ac.code === semCourse.name);
                    if (match) {
                        match.grade = semCourse.grade;
                        match.credits = semCourse.credits;
                        match.type = semCourse.weight;
                    }
                });
            });

            store.saveCourses(allCourses);
            window.app.showToast("GPA metrics and course listings saved!", "success");
        });

        // Add course row
        document.getElementById('gpa-add-course-btn').addEventListener('click', () => {
            if (!this.semesters[this.activeSemester]) {
                this.semesters[this.activeSemester] = [];
            }
            this.semesters[this.activeSemester].push({
                id: `course-${Date.now()}`,
                name: '',
                desc: 'Custom course',
                credits: 4,
                grade: 'A',
                weight: 'regular'
            });
            this.renderCoursesList();
            this.recalculateGPA();
        });

        // Add semester button coordinator
        document.getElementById('gpa-add-semester-btn').addEventListener('click', () => {
            const semName = prompt("Enter the name of the new semester (e.g. Summer 2026):");
            if (semName && semName.trim()) {
                if (this.semesters[semName.trim()]) {
                    window.app.showToast("Semester already exists!", "warning");
                    return;
                }
                this.semesters[semName.trim()] = [];
                this.activeSemester = semName.trim();
                this.renderSemestersTabs();
                this.renderCoursesList();
                this.recalculateGPA();
                window.app.showToast(`Created semester ${semName}`, "success");
            }
        });

        // Target goal calculator input updates
        document.getElementById('gpa-target-input').addEventListener('input', () => {
            const currentGPA = parseFloat(document.getElementById('gpa-radial-val').textContent) || 0;
            const currentCredits = parseInt(document.getElementById('gpa-total-credits').textContent) || 0;
            this.updateTargetSuggestion(currentGPA, currentCredits);
        });
    }
};
export default gpaView;
