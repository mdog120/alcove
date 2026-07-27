/* ==========================================================================
   Alcove Campus Hub (Clubs & Events) Router Module (Beige-Mint Theme)
   ========================================================================== */

import { store } from '../store.js';

export const eventsView = {
    currentTab: 'events', // 'events' | 'clubs'

    template() {
        return `
            <div class="planner-controls">
                <div class="d-flex align-items-center gap-3">
                    <h2 class="font-heading font-bold font-24"><i class="fa-regular fa-flag"></i> Campus Hub</h2>
                    
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
                        Create Event
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

    renderEvents(viewport = null) {
        const container = viewport || document.getElementById('hub-view-viewport');
        const events = store.getEvents();
        
        events.sort((a, b) => new Date(a.date) - new Date(b.date));

        let eventsHTML = `<div class="events-grid">`;

        if (events.length === 0) {
            eventsHTML += `
                <div class="col-span-full py-4 text-center text-secondary">
                    <p class="font-12 text-muted">No upcoming campus events listed.</p>
                </div>
            `;
        } else {
            eventsHTML += events.map(ev => {
                const dateObj = new Date(ev.date);
                const day = dateObj.getDate();
                const month = dateObj.toLocaleDateString([], { month: 'short' }).toUpperCase();
                const timeString = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                let tagTheme = "blue";
                if (ev.tag === "Social") tagTheme = "cyan";
                if (ev.tag === "Career") tagTheme = "purple";
                if (ev.tag === "Academic") tagTheme = "red";

                const attendeesCount = ev.rsvped ? 34 : 33;

                return `
                    <div class="event-card glass-panel">
                        <div class="event-banner-placeholder">
                            <span class="event-tag-badge" style="background-color: var(--tag-${tagTheme}-bg); color: var(--tag-${tagTheme}-text); border:none; padding:2px 6px;">
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
                                <span><i class="fa-regular fa-clock"></i> ${timeString}</span>
                                <span style="margin: 0 4px;">&bull;</span>
                                <span title="${ev.location}"><i class="fa-regular fa-compass"></i> ${ev.location}</span>
                            </div>

                            <div class="event-footer-action-row">
                                <span class="event-rsvp-stats">
                                    <i class="fa-regular fa-user"></i> ${attendeesCount} Going
                                </span>
                                <button class="btn btn-sm event-rsvp-action-btn ${ev.rsvped ? 'btn-secondary' : 'btn-primary'}" data-event-id="${ev.id}" style="padding: 4px 8px; font-size:11px;">
                                    ${ev.rsvped ? 'Going' : 'RSVP'}
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        eventsHTML += `</div>`;
        container.innerHTML = eventsHTML;

        container.querySelectorAll('.event-rsvp-action-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-event-id');
                const allEvents = store.getEvents();
                const event = allEvents.find(e => e.id === id);
                if (event) {
                    event.rsvped = !event.rsvped;
                    store.saveEvents(allEvents);
                    
                    if (event.rsvped) {
                        window.app.showToast(`RSVP'd for "${event.title}"!`, "success");
                        const allTasks = store.getTasks();
                        allTasks.push({
                            id: `task-ev-${event.id}`,
                            title: `Event: ${event.title}`,
                            courseId: 'general',
                            type: 'reading',
                            due: event.date,
                            priority: 'low',
                            status: 'todo',
                            notes: `Location: ${event.location}`
                        });
                        store.saveTasks(allTasks);
                    } else {
                        window.app.showToast(`Cancelled RSVP for "${event.title}"`, "warning");
                        let allTasks = store.getTasks();
                        allTasks = allTasks.filter(t => t.id !== `task-ev-${event.id}`);
                        store.saveTasks(allTasks);
                    }
                    this.renderEvents(viewport);
                }
            });
        });
    },

    renderClubs(viewport = null) {
        const container = viewport || document.getElementById('hub-view-viewport');
        const clubs = store.getClubs();

        let clubsHTML = `<div class="clubs-grid">`;

        clubsHTML += clubs.map(club => {
            let tagTheme = "purple";
            let iconHtml = `<i class="fa-solid fa-code"></i>`;
            
            if (club.icon === "⛺") { tagTheme = "emerald"; iconHtml = `<i class="fa-solid fa-mountain"></i>`; }
            else if (club.icon === "♟️") { tagTheme = "amber"; iconHtml = `<i class="fa-solid fa-chess"></i>`; }
            else if (club.icon === "🧬") { tagTheme = "red"; iconHtml = `<i class="fa-solid fa-dna"></i>`; }

            return `
                <div class="club-card glass-panel">
                    <div class="club-card-header">
                        <div class="club-logo" style="background-color: var(--tag-${tagTheme}-bg); color: var(--tag-${tagTheme}-text);">
                            ${iconHtml}
                        </div>
                        <div class="club-header-meta">
                            <h4>${club.name}</h4>
                            <p class="club-members-count">${club.count} Members</p>
                        </div>
                    </div>

                    <p class="club-desc">${club.desc}</p>

                    <div class="club-card-footer">
                        <span class="text-muted font-11">Stanford Club</span>
                        <button class="btn btn-sm club-join-action-btn ${club.joined ? 'btn-secondary' : 'btn-outline-indigo'}" data-club-id="${club.id}" style="padding: 4px 8px; font-size:11px;">
                            ${club.joined ? 'Leave' : 'Join'}
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        clubsHTML += `</div>`;
        container.innerHTML = clubsHTML;

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

        document.getElementById('hub-create-btn').addEventListener('click', () => {
            const select = document.getElementById('event-club');
            select.innerHTML = store.getClubs().filter(c => c.joined).map(c => `
                <option value="${c.name}">${c.name}</option>
            `).join('');

            document.getElementById('event-form').reset();
            window.app.openModal('event-modal');
        });

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
                rsvped: true,
                desc
            });

            store.saveEvents(allEvents);
            window.app.closeModal('event-modal');
            window.app.showToast("Event posted successfully!", "success");
            this.renderSubView();

            const allTasks = store.getTasks();
            allTasks.push({
                id: `task-ev-self`,
                title: `Event: ${title}`,
                courseId: 'general',
                type: 'reading',
                due: date,
                priority: 'low',
                status: 'todo',
                notes: `Location: ${location}`
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
