/* ==========================================================================
   Alcove Planner & Calendar Router Module (Notion Aesthetics Edition)
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
                    
                    <!-- View Switching Tabs (Notion style) -->
                    <div class="view-tabs">
                        <button class="tab-btn ${this.currentTab === 'calendar' ? 'active' : ''}" id="btn-tab-calendar">
                            📅 Calendar
                        </button>
                        <button class="tab-btn ${this.currentTab === 'kanban' ? 'active' : ''}" id="btn-tab-kanban">
                            📋 Kanban Board
                        </button>
                        <button class="tab-btn ${this.currentTab === 'list' ? 'active' : ''}" id="btn-tab-list">
                            📝 List View
                        </button>
                    </div>
                </div>

                <div class="d-flex align-items-center gap-2">
                    <!-- Course Filters -->
                    <select id="planner-course-filter" class="form-group mb-0" style="padding: 6px 12px; font-size:12px; border-radius: 4px; width:auto; height:32px;">
                        <option value="all">All Classes</option>
                        <!-- Dynamic option list -->
                    </select>

                    <button class="btn btn-primary" id="planner-add-task-btn" style="height:32px;">
                        ➕ New Task
                    </button>
                </div>
            </div>

            <!-- View Dynamic Panels -->
            <div class="glass-panel" id="planner-view-panel">
                <!-- Dynamic subview content -->
            </div>
        `;
    },

    init() {
        this.populateFilters();
        this.renderSubView();
        this.bindEvents();

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

    // Helper to map mock colors to Notion tag themes
    getTagTheme(courseColor) {
        let tag = 'blue';
        if (courseColor === 'amber') tag = 'amber';
        if (courseColor === 'emerald') tag = 'emerald';
        if (courseColor === 'purple' || courseColor === 'indigo') tag = 'purple';
        if (courseColor === 'rose') tag = 'red';
        return tag;
    },

    renderCalendar(container, tasks) {
        const totalDays = 31;
        const startDayOfWeek = 3; 
        const daysInPrevMonth = 30; 

        let calendarHTML = `
            <div class="calendar-container">
                <div class="d-flex align-items-center justify-content-between mb-3">
                    <h3 class="font-heading font-bold" style="font-size:15px;">July 2026</h3>
                    <div class="text-muted font-11">Double click cell to add task</div>
                </div>
                
                <div class="calendar-header-grid">
                    <div>Sun</div><div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div>
                </div>
                <div class="calendar-days-grid">
        `;

        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const dayNum = daysInPrevMonth - i;
            calendarHTML += `<div class="calendar-cell muted"><span class="calendar-date-num">${dayNum}</span></div>`;
        }

        const courses = store.getCourses();
        const todayDayNum = 27; 

        for (let d = 1; d <= totalDays; d++) {
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
                            const courseColor = course ? course.color : "rose";
                            const tagTheme = this.getTagTheme(courseColor);

                            return `
                                <span class="calendar-event ${t.type} ${t.status === 'done' ? 'opacity-50 line-through' : ''}" 
                                      style="background-color: var(--tag-${tagTheme}-bg); color: var(--tag-${tagTheme}-text);"
                                      title="${t.title}" data-task-id="${t.id}">
                                    ${label}: ${t.title}
                                </span>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        }

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

        container.querySelectorAll('.calendar-event').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                const taskId = el.getAttribute('data-task-id');
                this.editTask(taskId);
            });
        });

        container.querySelectorAll('.calendar-cell:not(.muted)').forEach(cell => {
            cell.addEventListener('dblclick', () => {
                const day = cell.getAttribute('data-day');
                const dateStr = `2026-07-${String(day).padStart(2, '0')}T12:00`;
                this.openNewTaskModal(dateStr);
            });
        });
    },

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
        let kanbanHTML = `<div class="kanban-board p-3">`;

        Object.keys(columns).forEach(status => {
            const col = columns[status];
            kanbanHTML += `
                <div class="kanban-col" data-status="${status}">
                    <div class="kanban-col-header">
                        <h4 class="kanban-col-title">
                            <span>${col.title}</span>
                        </h4>
                        <span class="kanban-card-count">${col.list.length}</span>
                    </div>

                    <div class="kanban-cards-list" id="kanban-list-${status}">
                        ${col.list.map(t => {
                            const course = courses.find(c => c.id === t.courseId);
                            const courseCode = course ? course.code : "General";
                            const color = course ? course.color : "rose";
                            const tagTheme = this.getTagTheme(color);
                            const dueDate = new Date(t.due).toLocaleDateString([], { month: 'short', day: 'numeric' });
                            
                            return `
                                <div class="kanban-card" draggable="true" data-task-id="${t.id}">
                                    <span class="kanban-card-tag" style="background-color: var(--tag-${tagTheme}-bg); color: var(--tag-${tagTheme}-text);">
                                        ${courseCode}
                                    </span>
                                    <h5 class="kanban-card-title">${t.title}</h5>
                                    
                                    <div class="kanban-card-meta">
                                        <div class="kanban-card-date">
                                            <span>📅 ${dueDate}</span>
                                        </div>
                                        <div class="d-flex gap-2">
                                            <button class="kanban-edit-btn" data-task-id="${t.id}" title="Edit">
                                                <i class="fa-solid fa-pen" style="font-size: 10px;"></i>
                                            </button>
                                            <button class="kanban-delete-btn" data-task-id="${t.id}" title="Delete">
                                                <i class="fa-solid fa-trash" style="font-size: 10px; color: var(--color-rose);"></i>
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

        this.setupDragAndDrop(container);

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
                card.style.opacity = '0.4';
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

    renderList(container, tasks) {
        const courses = store.getCourses();

        let listHTML = `
            <div class="p-3 overflow-x-auto">
                <table style="width:100%; border-collapse:collapse; text-align:left; font-size:12.5px;">
                    <thead>
                        <tr style="border-bottom: 1.5px solid var(--border-color); color:var(--text-secondary); font-weight:600;">
                            <th style="padding:10px 8px;">Task Title</th>
                            <th style="padding:10px 8px;">Course</th>
                            <th style="padding:10px 8px;">Type</th>
                            <th style="padding:10px 8px;">Due Date</th>
                            <th style="padding:10px 8px;">Priority</th>
                            <th style="padding:10px 8px;">Status</th>
                            <th style="padding:10px 8px; text-align:right;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        if (tasks.length === 0) {
            listHTML += `
                <tr>
                    <td colspan="7" style="padding:32px; text-align:center; color:var(--text-muted);">
                        No tasks found in workspace.
                    </td>
                </tr>
            `;
        } else {
            listHTML += tasks.map(t => {
                const course = courses.find(c => c.id === t.courseId);
                const courseCode = course ? course.code : "General";
                const color = course ? course.color : "rose";
                const tagTheme = this.getTagTheme(color);
                const dateStr = new Date(t.due).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

                let statusColor = "red";
                let statusName = "To Do";
                if (t.status === 'in-progress') { statusColor = "amber"; statusName = "In Progress"; }
                else if (t.status === 'done') { statusColor = "emerald"; statusName = "Done"; }

                let prioColor = "red";
                if (t.priority === 'medium') prioColor = "amber";
                if (t.priority === 'low') prioColor = "blue";

                return `
                    <tr style="border-bottom:1px solid var(--border-color); transition: var(--transition-smooth);" class="list-row-hover">
                        <td style="padding:10px 8px; font-weight:500; color:var(--text-primary);">${t.title}</td>
                        <td style="padding:10px 8px;">
                            <span class="partner-tag" style="background-color: var(--tag-${tagTheme}-bg); color: var(--tag-${tagTheme}-text);">
                                ${courseCode}
                            </span>
                        </td>
                        <td style="padding:10px 8px; text-transform:capitalize; color:var(--text-secondary);">${t.type}</td>
                        <td style="padding:10px 8px; color:var(--text-muted);">${dateStr}</td>
                        <td style="padding:10px 8px;">
                            <span class="partner-tag" style="background-color: var(--tag-${prioColor}-bg); color: var(--tag-${prioColor}-text); text-transform: capitalize;">
                                ${t.priority}
                            </span>
                        </td>
                        <td style="padding:10px 8px;">
                            <span class="partner-tag" style="background-color: var(--tag-${statusColor}-bg); color: var(--tag-${statusColor}-text);">
                                ${statusName}
                            </span>
                        </td>
                        <td style="padding:10px 8px; text-align:right;">
                            <button class="list-edit-btn" data-task-id="${t.id}" style="margin-right:4px;">
                                <i class="fa-solid fa-pen"></i>
                            </button>
                            <button class="list-delete-btn" data-task-id="${t.id}">
                                <i class="fa-solid fa-trash" style="color:var(--color-rose);"></i>
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

        container.querySelectorAll('tbody tr').forEach(row => {
            row.addEventListener('mouseenter', () => { row.style.backgroundColor = 'var(--card-hover-bg)'; });
            row.addEventListener('mouseleave', () => { row.style.backgroundColor = 'transparent'; });
        });

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
        document.getElementById('task-modal-title').textContent = "📝 Add Assignment / Exam";
        
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

        this.openNewTaskModal();
        document.getElementById('task-modal-title').textContent = "📝 Edit Assignment / Exam";
        
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

        document.getElementById('planner-course-filter').addEventListener('change', (e) => {
            this.currentCourseFilter = e.target.value;
            this.renderSubView();
        });

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
