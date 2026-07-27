/* ==========================================================================
   Alcove Dashboard View Router Module
   ========================================================================== */

import { store } from '../store.js';

export const dashboardView = {
    // Return view HTML template
    template() {
        return `
            <!-- Dashboard Hero Section -->
            <section class="dashboard-hero glass-panel glass-panel-glow">
                <div class="hero-welcome">
                    <h1 id="welcome-greeting">Hello, Alex!</h1>
                    <p>Welcome back to your academic digital home. Here is what is on your plate today.</p>
                </div>
                <div class="hero-stats">
                    <div class="hero-stat-item">
                        <span class="hero-stat-val" id="dash-gpa-val">3.83</span>
                        <span class="hero-stat-lbl">Cumulative GPA</span>
                    </div>
                    <div class="hero-stat-item">
                        <span class="hero-stat-val" id="dash-tasks-val">4</span>
                        <span class="hero-stat-lbl">Tasks Pending</span>
                    </div>
                    <div class="hero-stat-item">
                        <span class="hero-stat-val" id="dash-clubs-val">2</span>
                        <span class="hero-stat-lbl">Joined Clubs</span>
                    </div>
                </div>
            </section>

            <!-- Quick Actions Panel -->
            <section class="quick-actions-bar">
                <div class="quick-action-card glass-panel" id="qa-add-task">
                    <div class="quick-action-icon text-rose" style="background-color: rgba(244,63,94,0.1);">
                        <i class="fa-solid fa-plus"></i>
                    </div>
                    <span>Add Task</span>
                </div>
                <div class="quick-action-card glass-panel" id="qa-gpa">
                    <div class="quick-action-icon text-indigo" style="background-color: rgba(99,102,241,0.1);">
                        <i class="fa-solid fa-calculator"></i>
                    </div>
                    <span>GPA Calculator</span>
                </div>
                <div class="quick-action-card glass-panel" id="qa-chat">
                    <div class="quick-action-icon text-purple" style="background-color: rgba(168,85,247,0.1);">
                        <i class="fa-solid fa-comments"></i>
                    </div>
                    <span>Class Chats</span>
                </div>
                <div class="quick-action-card glass-panel" id="qa-notes">
                    <div class="quick-action-icon text-cyan" style="background-color: rgba(6,182,212,0.1);">
                        <i class="fa-solid fa-file-signature"></i>
                    </div>
                    <span>Notes Library</span>
                </div>
                <div class="quick-action-card glass-panel" id="qa-sell">
                    <div class="quick-action-icon text-emerald" style="background-color: rgba(16,185,129,0.1);">
                        <i class="fa-solid fa-tags"></i>
                    </div>
                    <span>Sell Book / Gear</span>
                </div>
            </section>

            <!-- Main widgets layout grid -->
            <div class="dashboard-grid">
                
                <!-- Today's Schedule -->
                <section class="dashboard-section glass-panel p-4">
                    <div class="dashboard-section-title">
                        <span><i class="fa-solid fa-graduation-cap text-indigo mr-2"></i>Today's Class Schedule</span>
                        <span class="text-muted font-12" id="current-day-label">Tuesday Classes</span>
                    </div>
                    <div class="schedule-widget-list" id="dash-schedule-container">
                        <!-- Dynamic schedule list -->
                    </div>
                </section>

                <!-- Urgent Tasks/Deadlines -->
                <section class="dashboard-section glass-panel p-4">
                    <div class="dashboard-section-title">
                        <span><i class="fa-solid fa-clock text-rose mr-2"></i>Urgent Deadlines</span>
                        <a href="#planner" class="text-indigo font-12 font-semibold">View Planner &rarr;</a>
                    </div>
                    <div class="task-summary-list" id="dash-tasks-container">
                        <!-- Dynamic tasks summary -->
                    </div>
                </section>

            </div>
        `;
    },

    // Setup action hooks & render elements
    init() {
        this.updateWelcomeGreeting();
        this.renderStats();
        this.renderSchedule();
        this.renderUrgentTasks();
        this.bindEvents();
    },

    updateWelcomeGreeting() {
        const greetingEl = document.getElementById('welcome-greeting');
        const hour = new Date().getHours();
        let greeting = "Hello, Alex!";
        if (hour < 12) greeting = "Good morning, Alex!";
        else if (hour < 18) greeting = "Good afternoon, Alex!";
        else greeting = "Good evening, Alex!";
        greetingEl.textContent = greeting;
    },

    renderStats() {
        // Compute GPA based on Courses grades
        const courses = store.getCourses();
        const gradeScale = {
            "A+": 4.0, "A": 4.0, "A-": 3.7,
            "B+": 3.3, "B": 3.0, "B-": 2.7,
            "C+": 2.3, "C": 2.0, "C-": 1.7,
            "D+": 1.3, "D": 1.0, "F": 0.0
        };

        let totalPoints = 0;
        let totalCredits = 0;
        courses.forEach(c => {
            if (gradeScale[c.grade] !== undefined) {
                totalPoints += gradeScale[c.grade] * c.credits;
                totalCredits += c.credits;
            }
        });

        const gpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : "0.00";
        document.getElementById('dash-gpa-val').textContent = gpa;

        const tasksCount = store.getTasks().filter(t => t.status !== 'done').length;
        document.getElementById('dash-tasks-val').textContent = tasksCount;

        const clubsCount = store.getClubs().filter(c => c.joined).length;
        document.getElementById('dash-clubs-val').textContent = clubsCount;
    },

    renderSchedule() {
        const container = document.getElementById('dash-schedule-container');
        const courses = store.getCourses();

        // Let's determine today's schedule. Mock calendar day is Tuesday (Tue)
        const currentDay = new Date().getDay(); // 0 = Sun, 1 = Mon, 2 = Tue, 3 = Wed, 4 = Thu, 5 = Fri, 6 = Sat
        const dayMap = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        
        document.getElementById('current-day-label').textContent = `${dayMap[currentDay]} Classes`;

        const dayAbbrev = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][currentDay];
        
        // Filter classes scheduled for today
        const todayClasses = courses.filter(c => c.time.includes(dayAbbrev));

        if (todayClasses.length === 0) {
            container.innerHTML = `
                <div class="py-5 text-center text-secondary">
                    <i class="fa-solid fa-moon text-indigo mb-3" style="font-size: 32px; opacity: 0.5;"></i>
                    <p>No classes scheduled for today. Study session time!</p>
                </div>
            `;
            return;
        }

        container.innerHTML = todayClasses.map(c => {
            // Get hours info e.g. "1:30 PM" from "Tue/Thu 1:30 PM"
            const timeParts = c.time.split(' ');
            const timeString = timeParts[timeParts.length - 2];
            const ampmString = timeParts[timeParts.length - 1];

            return `
                <div class="schedule-card glass-panel">
                    <div class="schedule-time-box">
                        <span class="schedule-time text-${c.color}">${timeString}</span>
                        <span class="schedule-period">${ampmString}</span>
                    </div>
                    <div class="schedule-details">
                        <h4>${c.code}: ${c.name}</h4>
                        <span class="schedule-location"><i class="fa-solid fa-location-dot"></i> ${c.room}</span>
                    </div>
                    <a href="#chat" class="btn btn-secondary btn-sm" style="padding: 6px 12px; font-size: 11px;">
                        <i class="fa-solid fa-comment-dots text-${c.color}"></i> Class Chat
                    </a>
                </div>
            `;
        }).join('');
    },

    renderUrgentTasks() {
        const container = document.getElementById('dash-tasks-container');
        const tasks = store.getTasks().filter(t => t.status !== 'done');

        // Sort by priority (high > medium > low) then date
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        tasks.sort((a, b) => {
            if (priorityWeight[b.priority] !== priorityWeight[a.priority]) {
                return priorityWeight[b.priority] - priorityWeight[a.priority];
            }
            return new Date(a.due) - new Date(b.due);
        });

        const urgentTasks = tasks.slice(0, 4);

        if (urgentTasks.length === 0) {
            container.innerHTML = `
                <div class="py-5 text-center text-secondary">
                    <i class="fa-solid fa-circle-check text-emerald mb-3" style="font-size: 32px; opacity: 0.5;"></i>
                    <p>All tasks completed! Excellent work.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = urgentTasks.map(t => {
            const course = store.getCourses().find(c => c.id === t.courseId);
            const courseCode = course ? course.code : "General";
            const dueFormatted = new Date(t.due).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            
            let badgeColor = "low";
            if (t.priority === 'high') badgeColor = "high";
            if (t.priority === 'medium') badgeColor = "medium";

            return `
                <div class="task-summary-card glass-panel ${badgeColor}">
                    <div>
                        <h4 class="task-sum-title">${t.title}</h4>
                        <div class="task-sum-meta">
                            <span class="text-${course ? course.color : 'muted'} font-semibold">${courseCode}</span>
                            <span>&bull;</span>
                            <span class="text-muted">Due: ${dueFormatted}</span>
                        </div>
                    </div>
                    <button class="task-complete-btn" data-task-id="${t.id}" aria-label="Mark task as complete">
                        <i class="fa-solid fa-check"></i>
                    </button>
                </div>
            `;
        }).join('');

        // Attach complete action handlers
        container.querySelectorAll('.task-complete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = btn.getAttribute('data-task-id');
                const allTasks = store.getTasks();
                const task = allTasks.find(t => t.id === id);
                if (task) {
                    task.status = 'done';
                    store.saveTasks(allTasks);
                    window.app.showToast(`Completed: "${task.title}"!`, "success");
                    this.renderUrgentTasks();
                    this.renderStats();
                }
            });
        });
    },

    bindEvents() {
        // Quick Action binds
        document.getElementById('qa-add-task').addEventListener('click', () => {
            // Populate courses selector inside Modal
            const courseSelect = document.getElementById('task-course');
            courseSelect.innerHTML = store.getCourses().map(c => `
                <option value="${c.id}">${c.code} - ${c.name}</option>
            `).join('');

            // Reset form details
            document.getElementById('task-form').reset();
            document.getElementById('task-id').value = '';
            document.getElementById('task-modal-title').textContent = "Add Assignment / Exam";
            
            // Set default date to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(23, 59, 0, 0);
            document.getElementById('task-due').value = tomorrow.toISOString().substring(0, 16);

            window.app.openModal('task-modal');
        });

        // Form submit handler for Add Task
        document.getElementById('task-form').onsubmit = (e) => {
            e.preventDefault();
            const allTasks = store.getTasks();
            const taskId = document.getElementById('task-id').value;
            const taskTitle = document.getElementById('task-title').value;
            const taskCourse = document.getElementById('task-course').value;
            const taskType = document.getElementById('task-type').value;
            const taskDue = document.getElementById('task-due').value;
            const taskPriority = document.getElementById('task-priority').value;
            const taskNotes = document.getElementById('task-notes').value;

            if (taskId) {
                // Edit task
                const idx = allTasks.findIndex(t => t.id === taskId);
                if (idx !== -1) {
                    allTasks[idx] = { ...allTasks[idx], title: taskTitle, courseId: taskCourse, type: taskType, due: taskDue, priority: taskPriority, notes: taskNotes };
                }
            } else {
                // New task
                allTasks.push({
                    id: `task-${Date.now()}`,
                    title: taskTitle,
                    courseId: taskCourse,
                    type: taskType,
                    due: taskDue,
                    priority: taskPriority,
                    status: 'todo',
                    notes: taskNotes
                });
            }

            store.saveTasks(allTasks);
            window.app.closeModal('task-modal');
            window.app.showToast(taskId ? "Task updated successfully!" : "New task added to planner!", "success");
            this.renderUrgentTasks();
            this.renderStats();
        };

        document.getElementById('qa-gpa').addEventListener('click', () => { window.location.hash = '#gpa'; });
        document.getElementById('qa-chat').addEventListener('click', () => { window.location.hash = '#chat'; });
        document.getElementById('qa-notes').addEventListener('click', () => { window.location.hash = '#notes'; });
        
        document.getElementById('qa-sell').addEventListener('click', () => {
            document.getElementById('marketplace-form').reset();
            window.app.openModal('marketplace-modal');
        });

        // Form submit handler for sell textbook
        document.getElementById('marketplace-form').onsubmit = (e) => {
            e.preventDefault();
            const title = document.getElementById('item-title').value;
            const price = parseFloat(document.getElementById('item-price').value);
            const condition = document.getElementById('item-condition').value;
            const course = document.getElementById('item-course').value;
            const category = document.getElementById('item-category').value;
            const imgType = document.getElementById('item-image-select').value;
            const desc = document.getElementById('item-desc').value;

            const allMarket = store.getMarketplace();
            allMarket.push({
                id: `mk-${Date.now()}`,
                title,
                price,
                condition,
                course,
                category,
                imgType,
                seller: store.user.name,
                sellerAvatar: store.user.avatar,
                desc
            });

            store.saveMarketplace(allMarket);
            window.app.closeModal('marketplace-modal');
            window.app.showToast("Your listing is now live in the marketplace!", "success");
        };
    }
};
export default dashboardView;
