/* ==========================================================================
   Alcove Core App Controller & Client-Side Router (Supabase Edition)
   ========================================================================== */

import { store } from './store.js';
import { getSupabase, getUserProfile, signOutUser } from './supabase.js';

import { loginView } from './views/login.js';
import { signupView } from './views/signup.js';
import { dashboardView } from './views/dashboard.js';
import { plannerView } from './views/planner.js';
import { gpaView } from './views/gpa.js';
import { chatView } from './views/chat.js';
import { notesView } from './views/notes.js';
import { marketplaceView } from './views/marketplace.js';
import { eventsView } from './views/events.js';

// Route register
const ROUTES = {
    login: loginView,
    signup: signupView,
    dashboard: dashboardView,
    planner: plannerView,
    gpa: gpaView,
    chat: chatView,
    notes: notesView,
    marketplace: marketplaceView,
    events: eventsView
};

class AppController {
    constructor() {
        this.viewport = document.getElementById('app-viewport');
        this.themeToggleBtn = document.getElementById('theme-toggle');
        this.globalSearch = document.getElementById('global-search');
        this.notifTrigger = document.getElementById('notification-trigger');
        this.notifDropdown = document.getElementById('notif-dropdown');
        this.notifBadge = document.getElementById('notif-badge');
        this.markAllReadBtn = document.getElementById('mark-all-read');
        this.notifContainer = document.getElementById('notif-list-container');
        this.liveDateEl = document.getElementById('live-date');
        
        this.currentViewName = null;
        this.user = null; // Populated from Supabase Auth Profile
    }

    init() {
        // Theme initialization
        const savedTheme = localStorage.getItem('alcove_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());

        // Routing listeners
        window.addEventListener('hashchange', () => this.handleRoute());

        const bootstrapApp = () => {
            this.updateDateTime();
            this.renderNotifications();
            setInterval(() => this.updateDateTime(), 60000); // update date every minute

            // Orchestrate 3D Book Intro Animation
            this.orchestrateIntroAnimation();
        };

        if (document.readyState === 'loading') {
            window.addEventListener('DOMContentLoaded', bootstrapApp);
        } else {
            bootstrapApp();
        }

        // Global Modals listeners
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.getAttribute('data-close');
                this.closeModal(modalId);
            });
        });
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay')) {
                e.target.classList.remove('active');
            }
        });

        // Notification Tray toggle
        this.notifTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            this.notifDropdown.classList.toggle('active');
        });
        document.addEventListener('click', () => {
            this.notifDropdown.classList.remove('active');
        });
        this.notifDropdown.addEventListener('click', (e) => e.stopPropagation());

        this.markAllReadBtn.addEventListener('click', () => {
            if (this.user) {
                store.user.notifications.forEach(n => n.read = true);
                this.renderNotifications();
                this.showToast("All notifications marked as read", "success");
            }
        });

        // Register for store notifications
        store.subscribe("notif_received", (notif) => {
            store.user.notifications.unshift({
                id: `n-${Date.now()}`,
                type: notif.type,
                title: notif.title,
                text: notif.text,
                time: "Just now",
                read: false
            });
            this.renderNotifications();
            this.showToast(`${notif.title}: ${notif.text}`, "info");
        });

        // Global search input
        this.globalSearch.addEventListener('keyup', (e) => {
            this.handleGlobalSearch(e.target.value.toLowerCase());
        });

        // Signout click handler on User Profile Card
        const profileCard = document.querySelector('.user-profile');
        if (profileCard) {
            profileCard.style.cursor = 'pointer';
            profileCard.addEventListener('click', () => {
                if (confirm("Would you like to sign out of Alcove?")) {
                    if (this.user?.isDemo) {
                        this.endDemoSession();
                        return;
                    }
                    signOutUser().then(() => {
                        this.showToast("Logged out successfully", "info");
                    });
                }
            });
        }
    }

    // Orchestrates the 3D book animation opening
    orchestrateIntroAnimation() {
        const overlay = document.getElementById('intro-overlay');
        const book = document.getElementById('intro-book');
        const title = document.getElementById('intro-title');
        
        const introPlayed = sessionStorage.getItem('alcove_intro_played') === 'true';

        if (introPlayed && overlay) {
            // Already played in this session - skip animation entirely
            overlay.remove();
            this.handleRoute();
            this.initSupabaseListener();
        } else {
            // Play custom 3D opening animations
            setTimeout(() => {
                if (book) book.classList.add('opened');
            }, 600);

            setTimeout(() => {
                if (title) title.classList.add('reveal');
            }, 1200);

            setTimeout(() => {
                if (overlay) overlay.classList.add('fade-out');
            }, 3600);

            setTimeout(() => {
                if (overlay) overlay.remove();
                sessionStorage.setItem('alcove_intro_played', 'true');
                this.handleRoute();
                this.initSupabaseListener();
            }, 4400);
        }
    }

    // Initializes Supabase session checking and Auth hooks
    initSupabaseListener() {
        const savedDemo = localStorage.getItem('alcove_demo_user');
        if (savedDemo) {
            try {
                this.activateUser({ ...JSON.parse(savedDemo), isDemo: true });
                return;
            } catch {
                localStorage.removeItem('alcove_demo_user');
            }
        }

        const sb = getSupabase();
        if (!sb) {
            // Fallback for standalone mock operations if client config fails
            this.showToast("Database client offline. Using mock storage.", "warning");
            const appContainer = document.getElementById('main-app-container');
            appContainer.classList.remove('landing-active');
            appContainer.style.display = 'grid';
            this.handleRoute();
            return;
        }

        // On session change
        sb.auth.onAuthStateChange(async (event, session) => {
            if (session) {
                // User is authenticated
                const profile = await getUserProfile(session.user);
                this.activateUser(profile);
            } else {
                // User is unauthenticated / logged out
                this.user = null;
                this.handleRoute();
            }
        });
    }

    activateUser(profile) {
        this.user = profile;
        Object.assign(store.user, profile);

        document.getElementById('sidebar-user-name').textContent = profile.name;
        document.getElementById('sidebar-user-school').textContent = profile.school;
        document.getElementById('sidebar-avatar').src = profile.avatar;
        document.getElementById('header-school-name').innerHTML = `
            <span class="school-selector-icon"><i class="fa-regular fa-building"></i></span>
            ${profile.school}
        `;

        const appContainer = document.getElementById('main-app-container');
        appContainer.classList.remove('landing-active');
        appContainer.style.display = 'grid';

        if (!window.location.hash || window.location.hash === '#login' || window.location.hash === '#signup') {
            window.location.hash = '#dashboard';
        } else {
            this.handleRoute();
        }
    }

    startDemoSession() {
        const profile = {
            id: 'local-demo',
            name: 'Alex Rivera',
            school: 'Stanford University',
            year: "Stanford '27",
            avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
            isDemo: true
        };
        localStorage.setItem('alcove_demo_user', JSON.stringify(profile));
        this.activateUser(profile);
        this.showToast('Demo workspace ready — changes are saved on this device.', 'success');
    }

    endDemoSession() {
        localStorage.removeItem('alcove_demo_user');
        this.user = null;
        this.initSupabaseListener();
        window.location.hash = '#login';
        this.showToast('Signed out of the demo workspace.', 'info');
    }

    // Hash routing controller
    handleRoute() {
        let hash = window.location.hash.substring(1) || 'dashboard';
        
        // Auth gate guard
        if (!this.user && hash !== 'login' && hash !== 'signup') {
            window.location.hash = '#login';
            hash = 'login';
        } else if (this.user && (hash === 'login' || hash === 'signup')) {
            window.location.hash = '#dashboard';
            hash = 'dashboard';
        }

        const view = ROUTES[hash];

        if (view) {
            this.currentViewName = hash;
            
            // Update active sidebar nav
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
                item.classList.remove('active');
                if (item.getAttribute('data-view') === hash) {
                    item.classList.add('active');
                }
            });

            // Display application canvas / landing page view overrides
            const appContainer = document.getElementById('main-app-container');
            if (hash === 'login' || hash === 'signup') {
                appContainer.classList.add('landing-active');
                appContainer.style.display = 'block';
            } else {
                appContainer.classList.remove('landing-active');
                appContainer.style.display = 'grid';
            }

            // Mount the view template
            this.viewport.innerHTML = view.template();
            
            // Execute view initialization
            if (typeof view.init === 'function') {
                view.init();
            }

            // Scroll view to top
            this.viewport.scrollTop = 0;
        } else {
            // Fallback
            window.location.hash = this.user ? '#dashboard' : '#login';
        }
    }

    // Toggle between light & dark theme
    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('alcove_theme', nextTheme);
        this.showToast(`Switched to ${nextTheme} theme`, "info");
    }

    // Date display updates
    updateDateTime() {
        const options = { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        const now = new Date();
        this.liveDateEl.textContent = now.toLocaleDateString('en-US', options);
    }

    // Dynamic Notifications list
    renderNotifications() {
        const notifs = store.user.notifications;
        const unreadCount = notifs.filter(n => !n.read).length;

        if (unreadCount > 0) {
            this.notifBadge.textContent = unreadCount;
            this.notifBadge.style.display = 'flex';
        } else {
            this.notifBadge.style.display = 'none';
        }

        if (notifs.length === 0) {
            this.notifContainer.innerHTML = `<div class="p-4 text-center text-muted font-12">No notifications</div>`;
            return;
        }

        this.notifContainer.innerHTML = notifs.map(n => {
            let iconClass = "fa-bell";
            let iconBg = "rgba(127, 154, 138, 0.1)";
            let iconColor = "var(--color-primary)";

            if (n.type === "chat") {
                iconClass = "fa-comments";
                iconBg = "rgba(127, 154, 138, 0.1)";
                iconColor = "var(--color-primary)";
            } else if (n.type === "task") {
                iconClass = "fa-calendar-days";
                iconBg = "rgba(235, 87, 87, 0.1)";
                iconColor = "var(--color-rose)";
            } else if (n.type === "event") {
                iconClass = "fa-flag";
                iconBg = "rgba(127, 154, 138, 0.1)";
                iconColor = "var(--color-primary)";
            }

            return `
                <div class="notif-item ${n.read ? '' : 'unread'}" data-notif-id="${n.id}">
                    <div class="notif-icon" style="background-color: ${iconBg}; color: ${iconColor};">
                        <i class="fa-solid ${iconClass}"></i>
                    </div>
                    <div class="notif-info">
                        <span class="notif-text">${n.title}</span>
                        <span class="notif-time">${n.text} &bull; ${n.time}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Add read listeners
        this.notifContainer.querySelectorAll('.notif-item').forEach(item => {
            item.addEventListener('click', () => {
                const id = item.getAttribute('data-notif-id');
                const notif = store.user.notifications.find(n => n.id === id);
                if (notif) {
                    notif.read = true;
                    this.renderNotifications();
                    
                    // Route if helpful
                    if (notif.type === 'chat') window.location.hash = '#chat';
                    if (notif.type === 'task') window.location.hash = '#planner';
                    if (notif.type === 'event') window.location.hash = '#events';
                }
            });
        });
    }

    // Universal Global Search
    handleGlobalSearch(query) {
        if (!query) {
            // reload route to clear search results
            this.handleRoute();
            return;
        }

        // Search matches across categories
        const courses = store.getCourses().filter(c => c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query));
        const tasks = store.getTasks().filter(t => t.title.toLowerCase().includes(query) || t.notes.toLowerCase().includes(query));
        const libraryNotes = store.getLibraryNotes().filter(ln => ln.title.toLowerCase().includes(query) || ln.course.toLowerCase().includes(query));
        const books = store.getMarketplace().filter(m => m.title.toLowerCase().includes(query) || m.desc.toLowerCase().includes(query));

        let resultsHTML = `
            <div class="search-results-overlay">
                <div class="d-flex align-items-center justify-content-between mb-4">
                    <h2>Search Results for "${query}"</h2>
                    <button class="btn btn-secondary btn-sm" id="close-search-results"><i class="fa-solid fa-xmark"></i> Clear</button>
                </div>
        `;

        if (!courses.length && !tasks.length && !libraryNotes.length && !books.length) {
            resultsHTML += `<p class="text-center text-secondary py-5">No results found matching your search.</p>`;
        } else {
            resultsHTML += `<div class="search-results-grid">`;
            
            if (courses.length) {
                resultsHTML += `
                    <div class="search-result-sec glass-panel p-4">
                        <h3 class="mb-3 text-indigo" style="color:var(--color-primary) !important;"><i class="fa-regular fa-building"></i> Classes (${courses.length})</h3>
                        <div class="list-group">${courses.map(c => `
                            <div class="py-2 border-bottom">
                                <strong class="text-primary">${c.code}</strong> - ${c.name}
                                <div class="text-muted font-11">${c.time} &bull; ${c.room}</div>
                            </div>
                        `).join('')}</div>
                    </div>
                `;
            }

            if (tasks.length) {
                resultsHTML += `
                    <div class="search-result-sec glass-panel p-4">
                        <h3 class="mb-3 text-rose"><i class="fa-regular fa-calendar"></i> Tasks (${tasks.length})</h3>
                        <div class="list-group">${tasks.map(t => `
                            <div class="py-2 border-bottom">
                                <strong class="text-primary">${t.title}</strong>
                                <div class="text-muted font-11">Due: ${new Date(t.due).toLocaleDateString()} &bull; Priority: ${t.priority}</div>
                            </div>
                        `).join('')}</div>
                    </div>
                `;
            }

            if (libraryNotes.length) {
                resultsHTML += `
                    <div class="search-result-sec glass-panel p-4">
                        <h3 class="mb-3 text-cyan" style="color:var(--color-primary) !important;"><i class="fa-regular fa-file-lines"></i> Shared Notes (${libraryNotes.length})</h3>
                        <div class="list-group">${libraryNotes.map(n => `
                            <div class="py-2 border-bottom">
                                <strong class="text-primary">${n.title}</strong> (${n.course})
                                <div class="text-muted font-11">Shared by ${n.author} &bull; ${n.downloads} downloads</div>
                            </div>
                        `).join('')}</div>
                    </div>
                `;
            }

            if (books.length) {
                resultsHTML += `
                    <div class="search-result-sec glass-panel p-4">
                        <h3 class="mb-3 text-purple" style="color:var(--color-primary) !important;"><i class="fa-regular fa-handshake"></i> Marketplace (${books.length})</h3>
                        <div class="list-group">${books.map(b => `
                            <div class="py-2 border-bottom">
                                <strong class="text-primary">${b.title}</strong> - $${b.price}
                                <div class="text-muted font-11">Condition: ${b.condition} &bull; Seller: ${b.seller}</div>
                            </div>
                        `).join('')}</div>
                    </div>
                `;
            }

            resultsHTML += `</div>`;
        }
        resultsHTML += `</div>`;

        this.viewport.innerHTML = resultsHTML;

        // Hook clean close button
        document.getElementById('close-search-results').addEventListener('click', () => {
            this.globalSearch.value = '';
            this.handleRoute();
        });
    }

    // Modal helpers
    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    // Global Toast notifications
    showToast(message, type = "info") {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let icon = "fa-info-circle";
        if (type === "success") icon = "fa-check-circle";
        if (type === "warning") icon = "fa-exclamation-triangle";
        if (type === "danger") icon = "fa-times-circle";

        toast.innerHTML = `
            <i class="fa-solid ${icon} toast-icon"></i>
            <span>${message}</span>
        `;
        container.appendChild(toast);

        // Animate out
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(10px)';
            toast.style.transition = 'all 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3200);
    }
}

// Instantiate and expose globally so child views can open modals/trigger toasts
export const app = new AppController();
app.init();
window.app = app; // Expose to window for inline onclick hooks if needed
export default app;
