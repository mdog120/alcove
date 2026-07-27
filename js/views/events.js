/* ==========================================================================
   Alcove Campus Hub (Clubs & Events) Router Module
   ========================================================================== */

import { store } from '../store.js';

export const eventsView = {
    currentTab: 'events', // 'events' | 'clubs'

    template() {
        return `
            <div class="planner-controls">
                <div class="d-flex align-items-center gap-3">
                    <h2 class="font-heading font-bold font-24">Campus Hub</h2>
                    
                    <div class="campus-tabs">
                        <button class="campus-tab-btn ${this.currentTab === 'events' ? 'active' : ''}" id="btn-camp-events">
                            Campus Events
                        </button>
                        <button class="campus-tab-btn ${this.currentTab === 'clubs' ? 'active' : ''}" id="btn-camp-clubs">
                            Clubs Directory
                        </button>
                    </div>
                </div>

                <div class="d-flex gap-2">
                    <button class="btn btn-primary" id="hub-create-btn">
                        <i class="fa-solid fa-plus-circle"></i> Create Event
                    </button>
                </div>
            </div>

            <!-- Hub dynamic viewport -->
            <div id="hub-view-viewport">
                <!-- Javascript will inject views -->
            </div>
        `;
    },

    init() {
        this.renderSubView();
        this.bindEvents();

        // Subscribe to store notifications
        store.subscribe("events_changed", () => {
            if (this.currentTab === 'events') this.renderEvents();
        });
        store.subscribe("clubs_changed", () => {
            if (this.currentTab === 'clubs') this.renderClubs();
        });
    },

    renderSubView() {
        const viewport = document.getElementById('hub-view-viewport');
        const createBtn = document.getElementById('hub-create-btn');

        if (this.currentTab === 'events') {
            createBtn.style.display = 'inline-flex';
            this.renderEvents(viewport);
        } else {
            createBtn.style.display = 'none';
            this.renderClubs(viewport);
        }
    },

    // 1. Render Campus Events View
    renderEvents(viewport = null) {
        const container = viewport || document.getElementById('hub-view-viewport');
        const events = store.getEvents();
        
        // Sort events chronologically
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        let eventsHTML = `<div class="events-grid">`;

        if (events.length === 0) {
            eventsHTML += `
                <div class="col-span-full py-5 text-center text-secondary">
                    <p>No active campus events listed.</p>
                </div>
            `;
        } else {
            eventsHTML += events.map(ev => {
                const dateObj = new Date(ev.date);
                const day = dateObj.getDate();
                const month = dateObj.toLocaleDateString([], { month: 'short' }).toUpperCase();
                const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                let badgeColor = "indigo";
                if (ev.tag === "Social") badgeColor = "cyan";
                if (ev.tag === "Career") badgeColor = "purple";
                if (ev.tag === "Academic") badgeColor = "rose";

                // Random mock attendees count
                const attendeesCount = ev.rsvped ? 34 : 33;

                return `
                    <div class="event-card glass-panel">
                        <div class="event-banner-placeholder">
                            <span class="event-tag-badge" style="background-color:rgba(var(--color-${badgeColor}), 0.1); color:var(--color-${badgeColor});">
                                ${ev.tag}
                            </span>
                            
                            <div class="event-date-badge">
                                <span class="event-date-day">${day}</span>
                                <span class="event-date-month">${month}</span>
                            </div>
                        </div>

                        <div class="event-info-panel">
                            <span class="event-host-club">${ev.clubName}</span>
                            <h4 class="event-title-header">${ev.title}</h4>
                            <p class="event-details-desc">${ev.desc}</p>
                            
                            <div class="event-location-row">
                                <i class="fa-solid fa-clock"></i>
                                <span>${timeString}</span>
                                <span style="margin: 0 4px;">&bull;</span>
                                <i class="fa-solid fa-location-dot"></i>
                                <span title="${ev.location}">${ev.location}</span>
                            </div>

                            <div class="event-footer-action-row">
                                <span class="event-rsvp-stats">
                                    <i class="fa-solid fa-users text-muted mr-1"></i> ${attendeesCount} RSVP'd
                                </span>
                                <button class="btn btn-sm event-rsvp-action-btn ${ev.rsvped ? 'btn-secondary' : 'btn-primary'}" data-event-id="${ev.id}" style="padding: 6px 12px; font-size:11px;">
                                    ${ev.rsvped ? '<i class="fa-solid fa-calendar-check text-emerald"></i> Going' : '<i class="fa-regular fa-calendar-plus"></i> RSVP'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        eventsHTML += `</div>`;
        container.innerHTML = eventsHTML;

        // Wire RSVP actions
        container.querySelectorAll('.event-rsvp-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-event-id');
                const allEvents = store.getEvents();
                const event = allEvents.find(e => e.id === id);
                if (event) {
                    event.rsvped = !event.rsvped;
                    store.saveEvents(allEvents);
                    
                    if (event.rsvped) {
                        window.app.showToast(`RSVP'd for "${event.title}"! Added to schedule.`, "success");
                        // Automatically push a task representing this event to the planner!
                        const allTasks = store.getTasks();
                        allTasks.push({
                            id: `task-ev-${event.id}`,
                            title: `Campus Event: ${event.title}`,
                            courseId: 'general',
                            type: 'reading',
                            due: event.date,
                            priority: 'low',
                            status: 'todo',
                            notes: `RSVP'd Campus Event. Location: ${event.location}`
                        });
                        store.saveTasks(allTasks);
                    } else {
                        window.app.showToast(`Cancelled RSVP for "${event.title}"`, "warning");
                        // Remove from planner tasks
                        let allTasks = store.getTasks();
                        allTasks = allTasks.filter(t => t.id !== `task-ev-${event.id}`);
                        store.saveTasks(allTasks);
                    }
                    this.renderEvents(viewport);
                }
            });
        });
    },

    // 2. Render Clubs Directory View
    renderClubs(viewport = null) {
        const container = viewport || document.getElementById('hub-view-viewport');
        const clubs = store.getClubs();

        let clubsHTML = `<div class="clubs-grid">`;

        clubsHTML += clubs.map(club => {
            let emojiColor = "indigo";
            if (club.icon === "⛺") emojiColor = "emerald";
            if (club.icon === "♟️") emojiColor = "amber";
            if (club.icon === "🧬") emojiColor = "rose";

            return `
                <div class="club-card glass-panel">
                    <div class="club-card-header">
                        <div class="club-logo" style="background-color:rgba(var(--color-${emojiColor}), 0.1); color:var(--color-${emojiColor});">
                            ${club.icon}
                        </div>
                        <div class="club-header-meta">
                            <h4>${club.name}</h4>
                            <p class="club-members-count">${club.count} Members</p>
                        </div>
                    </div>

                    <p class="club-desc">${club.desc}</p>

                    <div class="club-card-footer">
                        <span class="text-muted font-11">Official Stanford Club</span>
                        <button class="btn btn-sm club-join-action-btn ${club.joined ? 'btn-secondary' : 'btn-outline-indigo'}" data-club-id="${club.id}" style="padding: 6px 12px; font-size:11px;">
                            ${club.joined ? 'Joined' : 'Join Club'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        clubsHTML += `</div>`;
        container.innerHTML = clubsHTML;

        // Wire Join/Leave clicks
        container.querySelectorAll('.club-join-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-club-id');
                const allClubs = store.getClubs();
                const club = allClubs.find(c => c.id === id);
                if (club) {
                    club.joined = !club.joined;
                    if (club.joined) {
                        club.count++;
                        window.app.showToast(`Joined ${club.name}!`, "success");
                    } else {
                        club.count--;
                        window.app.showToast(`Left ${club.name}`, "warning");
                    }
                    store.saveClubs(allClubs);
                    this.renderClubs(viewport);
                }
            });
        });
    },

    bindEvents() {
        // Tab switching
        document.getElementById('btn-camp-events').addEventListener('click', () => {
            this.currentTab = 'events';
            this.renderSubView();
            this.updateActiveTabStyles();
        });

        document.getElementById('btn-camp-clubs').addEventListener('click', () => {
            this.currentTab = 'clubs';
            this.renderSubView();
            this.updateActiveTabStyles();
        });

        // Open create event modal
        document.getElementById('hub-create-btn').addEventListener('click', () => {
            // Populate clubs selection in form
            const select = document.getElementById('event-club');
            select.innerHTML = store.getClubs().filter(c => c.joined).map(c => `
                <option value="${c.name}">${c.name}</option>
            `).join('');

            document.getElementById('event-form').reset();
            window.app.openModal('event-overlay');
            window.app.openModal('event-modal');
        });

        // Handle Event Form submission
        document.getElementById('event-form').onsubmit = (e) => {
            e.preventDefault();
            const title = document.getElementById('event-title').value;
            const clubName = document.getElementById('event-club').value;
            const location = document.getElementById('event-location').value;
            const date = document.getElementById('event-date').value;
            const tag = document.getElementById('event-tag').value;
            const desc = document.getElementById('event-desc').value;

            const allEvents = store.getEvents();
            allEvents.push({
                id: `ev-${Date.now()}`,
                title,
                clubId: `club-${Date.now()}`,
                clubName,
                date,
                location,
                tag,
                rsvped: true, // auto RSVP own created event
                desc
            });

            store.saveEvents(allEvents);
            window.app.closeModal('event-modal');
            window.app.showToast("Your event has been posted to Campus Hub!", "success");
            this.renderSubView();

            // Auto push task to scheduler
            const allTasks = store.getTasks();
            allTasks.push({
                id: `task-ev-self`,
                title: `Campus Event: ${title}`,
                courseId: 'general',
                type: 'reading',
                due: date,
                priority: 'low',
                status: 'todo',
                notes: `My hosted Campus Event. Location: ${location}`
            });
            store.saveTasks(allTasks);
        };
    },

    updateActiveTabStyles() {
        const eventsTabBtn = document.getElementById('btn-camp-events');
        const clubsTabBtn = document.getElementById('btn-camp-clubs');

        eventsTabBtn.classList.remove('active');
        clubsTabBtn.classList.remove('active');

        if (this.currentTab === 'events') eventsTabBtn.classList.add('active');
        else clubsTabBtn.classList.add('active');
    }
};
export default eventsView;
