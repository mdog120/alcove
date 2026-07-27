/* ==========================================================================
   Alcove Planner & Calendar Router Module
   ========================================================================== */

import { store } from '../store.js';

export const plannerView = {
    currentTab: 'calendar', // 'calendar' | 'kanban' | 'list'
    currentCourseFilter: 'all',

    template() {
        return `
            <div class="planner-controls">
                <div class="d-flex align-items-center gap-3">
                    <h2 class="font-heading font-bold font-24">Class Scheduler</h2>
                    
                    <!-- View Switching Tabs -->
                    <div class="view-tabs">
                        <button class="tab-btn ${this.currentTab === 'calendar' ? 'active' : ''}" id="btn-tab-calendar">
                            <i class="fa-solid fa-calendar"></i> Calendar
                        </button>
                        <button class="tab-btn ${this.currentTab === 'kanban' ? 'active' : ''}" id="btn-tab-kanban">
                            <i class="fa-solid fa-columns"></i> Kanban Board
                        </button>
                        <button class="tab-btn ${this.currentTab === 'list' ? 'active' : ''}" id="btn-tab-list">
                            <i class="fa-solid fa-list-check"></i> List View
                        </button>
                    </div>
                </div>

                <div class="d-flex align-items-center gap-2">
                    <!-- Course Filters -->
                    <select id="planner-course-filter" class="form-group mb-0" style="padding: 8px 12px; font-size:12px; border-radius: 20px; width:auto; height:36px;">
                        <option value="all">All Classes</option>
                        <!-- Dynamic option list -->
                    </select>

                    <button class="btn btn-primary" id="planner-add-task-btn" style="height:36px;">
                        <i class="fa-solid fa-plus"></i> New Task
                    </button>
                </div>
            </div>

            <!-- View Dynamic Panels -->
            <div class="glass-panel" id="planner-view-panel">
                <!-- Javascript will inject subviews here -->
            </div>
        `;
    },

    init() {
        this.populateFilters();
        this.renderSubView();
        this.bindEvents();

        // Listen for store modifications
        store.subscribe("tasks_changed", () => {
            this.renderSubView();
        });
    },

    populateFilters() {
        const filterSelect = document.getElementById('planner-course-filter');
        const courses = store.getCourses();
        
        filterSelect.innerHTML = '<option value="all">All Classes</option>' + courses.map(c => `
            <option value="${c.id}" ${this.currentCourseFilter === c.id ? 'selected' : ''}>${c.code}</option>
        `).join('');
    },

    renderSubView() {
        const panel = document.getElementById('planner-view-panel');
        let tasks = store.getTasks();

        // Apply course filter
        if (this.currentCourseFilter !== 'all') {
            tasks = tasks.filter(t => t.courseId === this.currentCourseFilter);
        }

        if (this.currentTab === 'calendar') {
            this.renderCalendar(panel, tasks);
        } else if (this.currentTab === 'kanban') {
            this.renderKanban(panel, tasks);
        } else {
            this.renderList(panel, tasks);
        }
    },

    // 1. Render Calendar Mode (July 2026)
    renderCalendar(container, tasks) {
        // July 2026: Wednesday starts July 1st, 31 days in month.
        const totalDays = 31;
        const startDayOfWeek = 3; // Wednesday (0=Sun, 1=Mon, 2=Tue, 3=Wed...)
        const daysInPrevMonth = 30; // June

        let calendarHTML = `
            <div class="calendar-container">
                <div class="d-flex align-items-center justify-content-between mb-4">
                    <h3 class="font-heading font-bold">July 2026</h3>
                    <div class="text-muted font-12">Click cells to add tasks</div>
                </div>
                
                <div class="calendar-header-grid">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div class="calendar-days-grid">
        `;

        // Render previous month cells padding
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            calendarHTML += `<div class="calendar-cell muted"><span class="calendar-date-num">${dayNum}</span></div>`;
        }

        // Render July days
        const courses = store.getCourses();
        const todayDayNum = 27; // Mock date is July 27, 2026

        for (let d = 1; d <= totalDays; d++) {
            // Find tasks due on this date (format: 2026-07-DD)
            const dateStr = `2026-07-${String(d).padStart(2, '0')}`;
            const dayTasks = tasks.filter(t => t.due.startsWith(dateStr));
            const isToday = d === todayDayNum;

            calendarHTML += `
                <div class="calendar-cell ${isToday ? 'today' : ''}" data-day="${d}">
                    <span class="calendar-date-num">${d}</span>
                    <div class="d-flex flex-column gap-1 overflow-hidden" style="flex:1;">
                        ${dayTasks.map(t => {
                            const course = courses.find(c => c.id === t.courseId);
                            const label = course ? course.code : "Task";
                            return `
                                <span class="calendar-event ${t.type} ${t.status === 'done' ? 'opacity-50 line-through' : ''}" 
                                      title="${t.title}" data-task-id="${t.id}">
                                    ${label}: ${t.title}
                                </span>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

        // Render next month padding to make full grid of 5 or 6 rows (total cells = 35 or 42)
        const totalCellsSoFar = startDayOfWeek + totalDays;
        const totalGridCells = totalCellsSoFar > 35 ? 42 : 35;
        for (let n = 1; n <= totalGridCells - totalCellsSoFar; n++) {
            calendarHTML += `<div class="calendar-cell muted"><span class="calendar-date-num">${n}</span></div>`;
        }

        calendarHTML += `
                </div>
            </div>
        `;
        container.innerHTML = calendarHTML;

        // Add task click routing
        container.querySelectorAll('.calendar-event').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = el.getAttribute('data-task-id');
                this.editTask(taskId);
            });
        });

        // Add task-by-cell double-click modal
        container.querySelectorAll('.calendar-cell:not(.muted)').forEach(cell => {
            cell.addEventListener('dblclick', () => {
                const day = cell.getAttribute('data-day');
                const dateStr = `2026-07-${String(day).padStart(2, '0')}T12:00`;
                this.openNewTaskModal(dateStr);
            });
        });
    },

    // 2. Render Kanban Mode (To Do / In Progress / Done)
    renderKanban(container, tasks) {
        const columns = {
            todo: { title: "To Do", badgeColor: "text-rose", list: [] },
            "in-progress": { title: "In Progress", badgeColor: "text-amber", list: [] },
            done: { title: "Completed", badgeColor: "text-emerald", list: [] }
        };

        tasks.forEach(t => {
            if (columns[t.status]) columns[t.status].list.push(t);
        });

        const courses = store.getCourses();

        let kanbanHTML = `<div class="kanban-board p-4">`;

        Object.keys(columns).forEach(status => {
            const col = columns[status];
            kanbanHTML += `
                <div class="kanban-col glass-panel" data-status="${status}">
                    <div class="kanban-col-header">
                        <h4 class="kanban-col-title">
                            <i class="fa-solid fa-circle ${col.badgeColor}" style="font-size: 8px;"></i>
                            <span>${col.title}</span>
                        </h4>
                        <span class="kanban-card-count">${col.list.length}</span>
                    </div>

                    <div class="kanban-cards-list" id="kanban-list-${status}">
                        ${col.list.map(t => {
                            const course = courses.find(c => c.id === t.courseId);
                            const courseCode = course ? course.code : "General";
                            const color = course ? course.color : "muted";
                            const dueDate = new Date(t.due).toLocaleDateString([], { month: 'short', day: 'numeric' });
                            
                            return `
                                <div class="kanban-card" draggable="true" data-task-id="${t.id}">
                                    <span class="kanban-card-tag" style="background-color: rgba(var(--color-${color}), 0.1); color: var(--color-${color});">
                                        ${courseCode}
                                    </span>
                                    <h5 class="kanban-card-title">${t.title}</h5>
                                    
                                    <div class="kanban-card-meta">
                                        <div class="kanban-card-date">
                                            <i class="fa-regular fa-clock"></i>
                                            <span>${dueDate}</span>
                                        </div>
                                        <div class="d-flex gap-2">
                                            <button class="kanban-edit-btn" data-task-id="${t.id}" title="Edit Task">
                                                <i class="fa-solid fa-pen" style="font-size: 11px;"></i>
                                            </button>
                                            <button class="kanban-delete-btn" data-task-id="${t.id}" title="Delete Task">
                                                <i class="fa-solid fa-trash" style="font-size: 11px; color: var(--color-rose);"></i>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        kanbanHTML += `</div>`;
        container.innerHTML = kanbanHTML;

        // Implement Drag and Drop Mechanics
        this.setupDragAndDrop(container);

        // Wire edit & delete keys
        container.querySelectorAll('.kanban-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-task-id');
                this.editTask(id);
            });
        });

        container.querySelectorAll('.kanban-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-task-id');
                this.deleteTask(id);
            });
        });
    },

    setupDragAndDrop(container) {
        const cards = container.querySelectorAll('.kanban-card');
        const columns = container.querySelectorAll('.kanban-cards-list');

        cards.forEach(card => {
            card.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', card.getAttribute('data-task-id'));
                card.style.opacity = '0.5';
            });

            card.addEventListener('dragend', () => {
                card.style.opacity = '1';
            });
        });

        columns.forEach(col => {
            col.addEventListener('dragover', (e) => {
                e.preventDefault();
                col.style.backgroundColor = 'var(--card-hover-bg)';
            });

            col.addEventListener('dragleave', () => {
                col.style.backgroundColor = 'transparent';
            });

            col.addEventListener('drop', (e) => {
                e.preventDefault();
                col.style.backgroundColor = 'transparent';
                
                const taskId = e.dataTransfer.getData('text/plain');
                const nextStatus = col.id.replace('kanban-list-', '');
                
                const allTasks = store.getTasks();
                const task = allTasks.find(t => t.id === taskId);
                
                if (task && task.status !== nextStatus) {
                    task.status = nextStatus;
                    store.saveTasks(allTasks);
                    window.app.showToast(`Updated status to ${nextStatus}`, "success");
                    this.renderSubView();
                }
            });
        });
    },

    // 3. Render List View Mode
    renderList(container, tasks) {
        const courses = store.getCourses();

        let listHTML = `
            <div class="p-4 overflow-x-auto">
                <table style="width:100%; border-collapse:collapse; text-align:left; font-size:13px;">
                    <thead>
                        <tr style="border-bottom: 2px solid var(--border-color); color:var(--text-secondary); font-weight:700;">
                            <th style="padding:12px;">Task Title</th>
                            <th style="padding:12px;">Class Course</th>
                            <th style="padding:12px;">Type</th>
                            <th style="padding:12px;">Due Date</th>
                            <th style="padding:12px;">Priority</th>
                            <th style="padding:12px;">Status</th>
                            <th style="padding:12px; text-align:right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (tasks.length === 0) {
            listHTML += `
                <tr>
                    <td colspan="7" style="padding:40px; text-align:center; color:var(--text-muted);">
                        No tasks found matching query filters.
                    </td>
                </tr>
            `;
        } else {
            listHTML += tasks.map(t => {
                const course = courses.find(c => c.id === t.courseId);
                const courseCode = course ? course.code : "General";
                const courseColor = course ? course.color : "muted";
                const dateStr = new Date(t.due).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                let statusBadge = `<span class="partner-tag" style="background-color:rgba(244,63,94,0.1); color:var(--color-rose);">To Do</span>`;
                if (t.status === 'in-progress') {
                    statusBadge = `<span class="partner-tag" style="background-color:rgba(245,158,11,0.1); color:var(--color-amber);">In Progress</span>`;
                } else if (t.status === 'done') {
                    statusBadge = `<span class="partner-tag" style="background-color:rgba(16,185,129,0.1); color:var(--color-emerald);">Done</span>`;
                }

                let prioBadge = "🟡 Medium";
                if (t.priority === 'high') prioBadge = "🔴 High";
                if (t.priority === 'low') prioBadge = "🟢 Low";

                return `
                    <tr style="border-bottom:1px solid var(--border-color); transition: var(--transition-smooth);" class="list-row-hover">
                        <td style="padding:14px 12px; font-weight:600; color:var(--text-primary);">${t.title}</td>
                        <td style="padding:14px 12px;">
                            <span class="partner-tag" style="background-color: rgba(var(--color-${courseColor}), 0.1); color: var(--color-${courseColor});">
                                ${courseCode}
                            </span>
                        </td>
                        <td style="padding:14px 12px; text-transform:capitalize; color:var(--text-secondary);">${t.type}</td>
                        <td style="padding:14px 12px; color:var(--text-muted);">${dateStr}</td>
                        <td style="padding:14px 12px;">${prioBadge}</td>
                        <td style="padding:14px 12px;">${statusBadge}</td>
                        <td style="padding:14px 12px; text-align:right;">
                            <button class="list-edit-btn btn btn-secondary btn-sm" data-task-id="${t.id}" style="padding:6px 10px; margin-right:4px;">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="list-delete-btn btn btn-danger btn-sm" data-task-id="${t.id}" style="padding:6px 10px;">
                                <i class="fa-solid fa-trash"></i>
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        listHTML += `
                    </tbody>
                </table>
            </div>
        `;
        container.innerHTML = listHTML;

        // Row selectors hover styling in-line helper
        container.querySelectorAll('tbody tr').forEach(row => {
            row.addEventListener('mouseenter', () => { row.style.backgroundColor = 'var(--card-hover-bg)'; });
            row.addEventListener('mouseleave', () => { row.style.backgroundColor = 'transparent'; });
        });

        // Event triggers
        container.querySelectorAll('.list-edit-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-task-id');
                this.editTask(id);
            });
        });

        container.querySelectorAll('.list-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-task-id');
                this.deleteTask(id);
            });
        });
    },

    openNewTaskModal(defaultDate = '') {
        const courseSelect = document.getElementById('task-course');
        courseSelect.innerHTML = store.getCourses().map(c => `
            <option value="${c.id}">${c.code} - ${c.name}</option>
        `).join('');

        document.getElementById('task-form').reset();
        document.getElementById('task-id').value = '';
        document.getElementById('task-modal-title').textContent = "Add Assignment / Exam";
        
        if (defaultDate) {
            document.getElementById('task-due').value = defaultDate;
        } else {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(23, 59, 0, 0);
            document.getElementById('task-due').value = tomorrow.toISOString().substring(0, 16);
        }

        window.app.openModal('task-modal');
    },

    editTask(id) {
        const task = store.getTasks().find(t => t.id === id);
        if (!task) return;

        // Open task modal in editing state
        this.openNewTaskModal();
        document.getElementById('task-modal-title').textContent = "Edit Assignment / Exam";
        
        document.getElementById('task-id').value = task.id;
        document.getElementById('task-title').value = task.title;
        document.getElementById('task-course').value = task.courseId;
        document.getElementById('task-type').value = task.type;
        document.getElementById('task-due').value = task.due;
        document.getElementById('task-priority').value = task.priority;
        document.getElementById('task-notes').value = task.notes;
    },

    deleteTask(id) {
        if (confirm("Are you sure you want to delete this task?")) {
            let allTasks = store.getTasks();
            const task = allTasks.find(t => t.id === id);
            allTasks = allTasks.filter(t => t.id !== id);
            store.saveTasks(allTasks);
            window.app.showToast(`Deleted task: "${task.title}"`, "warning");
            this.renderSubView();
        }
    },

    bindEvents() {
        // Tab buttons routing trigger
        document.getElementById('btn-tab-calendar').addEventListener('click', () => {
            this.currentTab = 'calendar';
            this.renderSubView();
            this.updateActiveTabStyles();
        });

        document.getElementById('btn-tab-kanban').addEventListener('click', () => {
            this.currentTab = 'kanban';
            this.renderSubView();
            this.updateActiveTabStyles();
        });

        document.getElementById('btn-tab-list').addEventListener('click', () => {
            this.currentTab = 'list';
            this.renderSubView();
            this.updateActiveTabStyles();
        });

        // Filter event listener
        document.getElementById('planner-course-filter').addEventListener('change', (e) => {
            this.currentCourseFilter = e.target.value;
            this.renderSubView();
        });

        // Add task button click
        document.getElementById('planner-add-task-btn').addEventListener('click', () => {
            this.openNewTaskModal();
        });
    },

    updateActiveTabStyles() {
        document.querySelectorAll('.view-tabs .tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        if (this.currentTab === 'calendar') document.getElementById('btn-tab-calendar').classList.add('active');
        else if (this.currentTab === 'kanban') document.getElementById('btn-tab-kanban').classList.add('active');
        else document.getElementById('btn-tab-list').classList.add('active');
    }
};
export default plannerView;
