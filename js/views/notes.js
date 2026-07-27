/* ==========================================================================
   Alcove Notes Manager & Shared Campus Library Router Module
   ========================================================================== */

import { store } from '../store.js';

export const notesView = {
    activeNoteId: 'note-1',
    librarySearchQuery: '',

    template() {
        return `
            <div class="planner-controls">
                <h2 class="font-heading font-bold font-24">Study Notes Hub</h2>
                <button class="btn btn-primary" id="notes-new-btn">
                    <i class="fa-solid fa-file-circle-plus"></i> New Note
                </button>
            </div>

            <!-- Notes Main Editor Panel Layout -->
            <div class="notes-layout mb-5">
                
                <!-- Left Pane: Notes Folders List -->
                <div class="notes-list-pane glass-panel">
                    <div class="notes-search-bar mb-3">
                        <i class="fa-solid fa-magnifying-glass" style="color:var(--text-muted); align-self:center; margin-left: 10px; position:absolute;"></i>
                        <input type="text" id="notes-local-search" placeholder="Search my notes..." style="padding-left:32px;">
                    </div>
                    
                    <div class="notes-cards-grid" id="notes-list-container">
                        <!-- Dynamic list of notes folders -->
                    </div>
                </div>

                <!-- Right Pane: Live Text Editor -->
                <div class="note-editor-pane glass-panel">
                    <div class="editor-header-inputs">
                        <input type="text" id="editor-title" class="editor-title-input" placeholder="Untitled Note">
                        <div class="editor-meta-row">
                            <select id="editor-course">
                                <!-- Course selectors -->
                            </select>
                            <span class="text-muted font-11" id="editor-date-lbl">Saved: July 27, 2026</span>
                        </div>
                    </div>

                    <!-- Mock Rich Text Toolbar -->
                    <div class="editor-toolbar">
                        <button class="editor-tool-btn" data-cmd="bold" title="Bold"><i class="fa-solid fa-bold"></i></button>
                        <button class="editor-tool-btn" data-cmd="italic" title="Italic"><i class="fa-solid fa-italic"></i></button>
                        <button class="editor-tool-btn" data-cmd="underline" title="Underline"><i class="fa-solid fa-underline"></i></button>
                        <button class="editor-tool-btn" data-cmd="list" title="Bullet List"><i class="fa-solid fa-list-ul"></i></button>
                        <button class="editor-tool-btn" data-cmd="code" title="Code Block"><i class="fa-solid fa-code"></i></button>
                        <div style="width: 1px; background-color: var(--border-color); margin: 0 4px;"></div>
                        <button class="editor-tool-btn" data-cmd="share" title="Share to Campus Library" id="editor-btn-share">
                            <i class="fa-solid fa-share-nodes" style="color:var(--color-cyan);"></i>
                        </button>
                    </div>

                    <!-- Text Area -->
                    <textarea id="editor-text-body" class="editor-textarea" placeholder="Start typing study notes, equations, code diagrams..."></textarea>
                    
                    <div class="editor-footer">
                        <span class="editor-status" id="editor-char-count">0 characters</span>
                        <div class="d-flex gap-2">
                            <button class="btn btn-secondary btn-sm" id="editor-delete-btn">Delete Note</button>
                            <button class="btn btn-primary btn-sm" id="editor-save-btn">Save Note</button>
                        </div>
                    </div>
                </div>

            </div>

            <!-- Bottom Section: Campus Shared Library -->
            <section class="notes-library-section">
                <div class="dashboard-section-title">
                    <span><i class="fa-solid fa-book-open text-cyan mr-2"></i>Campus Shared Library</span>
                </div>

                <div class="marketplace-filter-row glass-panel p-3 mb-4">
                    <div class="header-search flex-1 mb-0" style="max-width:400px; position:relative;">
                        <i class="fa-solid fa-magnifying-glass" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted);"></i>
                        <input type="text" id="library-search-input" placeholder="Search community shared notes (e.g. Krebs, Calculus)..." style="padding-left:40px; background-color:var(--bg-primary);">
                    </div>
                    <div class="marketplace-filters">
                        <select id="library-class-filter">
                            <option value="all">All Courses</option>
                            <option value="CS 106B">CS 106B</option>
                            <option value="MATH 51">MATH 51</option>
                            <option value="BIO 83">BIO 83</option>
                            <option value="PWR 1">PWR 1</option>
                        </select>
                    </div>
                </div>

                <div class="library-grid" id="library-grid-container">
                    <!-- Dynamic shared note cards -->
                </div>
            </section>
        `;
    },

    init() {
        this.renderNotesList();
        this.renderCoursesOptions();
        this.loadActiveNote();
        this.renderLibrary();
        this.bindEvents();

        // Register store changes
        store.subscribe("notes_changed", () => {
            this.renderNotesList();
        });
        store.subscribe("lib_notes_changed", () => {
            this.renderLibrary();
        });
    },

    renderNotesList(searchQuery = '') {
        const container = document.getElementById('notes-list-container');
        let notes = store.getNotes();

        // Local search filter
        if (searchQuery) {
            notes = notes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.content.toLowerCase().includes(searchQuery.toLowerCase()));
        }

        if (notes.length === 0) {
            container.innerHTML = `<div class="p-4 text-center text-secondary font-12">No notes found</div>`;
            return;
        }

        container.innerHTML = notes.map(n => {
            const course = store.getCourses().find(c => c.id === n.courseId);
            const courseCode = course ? course.code : "General";
            const color = course ? course.color : "muted";

            return `
                <div class="note-folder-card glass-panel ${this.activeNoteId === n.id ? 'active' : ''}" data-note-id="${n.id}">
                    <div class="note-info-block">
                        <span class="note-folder-icon text-${color}">📁</span>
                        <div class="note-folder-details">
                            <h4>${n.title || 'Untitled Note'}</h4>
                            <p>${courseCode} &bull; ${n.date}</p>
                        </div>
                    </div>
                    <i class="fa-solid fa-chevron-right text-muted font-11"></i>
                </div>
            `;
        }).join('');

        // Folder click routing
        container.querySelectorAll('.note-folder-card').forEach(card => {
            card.addEventListener('click', () => {
                this.activeNoteId = card.getAttribute('data-note-id');
                this.renderNotesList(searchQuery);
                this.loadActiveNote();
            });
        });
    },

    renderCoursesOptions() {
        const select = document.getElementById('editor-course');
        const courses = store.getCourses();

        select.innerHTML = courses.map(c => `
            <option value="${c.id}">${c.code} - ${c.name}</option>
        `).join('');
    },

    loadActiveNote() {
        const notes = store.getNotes();
        const note = notes.find(n => n.id === this.activeNoteId);
        
        const titleInput = document.getElementById('editor-title');
        const courseSelect = document.getElementById('editor-course');
        const dateLabel = document.getElementById('editor-date-lbl');
        const textBody = document.getElementById('editor-text-body');
        const charCount = document.getElementById('editor-char-count');

        if (note) {
            titleInput.value = note.title;
            courseSelect.value = note.courseId;
            dateLabel.textContent = `Saved: ${note.date}`;
            textBody.value = note.content;
            charCount.textContent = `${note.content.length} characters`;
        } else {
            // Empty state if activeNoteId deleted or invalid
            titleInput.value = '';
            textBody.value = '';
            dateLabel.textContent = 'Unsaved Note';
            charCount.textContent = '0 characters';
        }
    },

    // Render Shared Public Library
    renderLibrary(classFilter = 'all') {
        const container = document.getElementById('library-grid-container');
        let libNotes = store.getLibraryNotes();

        // Search & course filtering
        if (this.librarySearchQuery) {
            libNotes = libNotes.filter(n => n.title.toLowerCase().includes(this.librarySearchQuery) || n.author.toLowerCase().includes(this.librarySearchQuery));
        }

        if (classFilter !== 'all') {
            libNotes = libNotes.filter(n => n.course === classFilter);
        }

        if (libNotes.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-5 text-center text-secondary">
                    <p>No community notes found matching filters.</p>
                </div>
            `;
            return;
        }

        const courses = store.getCourses();

        container.innerHTML = libNotes.map(n => {
            const courseMatch = courses.find(c => c.code === n.course);
            const badgeColor = courseMatch ? courseMatch.color : "indigo";

            return `
                <div class="library-note-card glass-panel">
                    <div class="lib-card-header">
                        <span class="lib-card-tag" style="background-color:rgba(var(--color-${badgeColor}), 0.1); color:var(--color-${badgeColor});">
                            ${n.course}
                        </span>
                        <div class="lib-card-downloads">
                            <i class="fa-solid fa-download"></i>
                            <span class="dl-count">${n.downloads}</span>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="lib-card-title">${n.title}</h4>
                        <span class="lib-card-author">Shared by ${n.author}</span>
                    </div>

                    <div class="lib-card-footer">
                        <div class="lib-card-rating">
                            <i class="fa-solid fa-star"></i>
                            <span>${n.rating}</span>
                        </div>
                        <button class="btn btn-secondary btn-sm lib-download-btn" data-lib-id="${n.id}" style="padding: 6px 12px; font-size:11px;">
                            <i class="fa-solid fa-download text-cyan"></i> Get
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        // Wire download button interactions
        container.querySelectorAll('.lib-download-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-lib-id');
                const list = store.getLibraryNotes();
                const note = list.find(n => n.id === id);
                if (note) {
                    note.downloads++;
                    store.saveLibraryNotes(list);
                    
                    // Display download loading feedback
                    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin text-cyan"></i> Fetching`;
                    btn.disabled = true;

                    setTimeout(() => {
                        window.app.showToast(`Downloaded: "${note.title}"! Checked in downloads directory.`, "success");
                        btn.innerHTML = `<i class="fa-solid fa-check text-emerald"></i> Get`;
                        this.renderLibrary(classFilter);
                    }, 1000);
                }
            });
        });
    },

    bindEvents() {
        // My notes local search filter
        document.getElementById('notes-local-search').addEventListener('input', (e) => {
            this.renderNotesList(e.target.value);
        });

        // New note button coordinator
        document.getElementById('notes-new-btn').addEventListener('click', () => {
            const allNotes = store.getNotes();
            const now = new Date();
            const newNote = {
                id: `note-${Date.now()}`,
                title: "New Lecture Notes",
                courseId: store.getCourses()[0].id,
                content: "Lecture topic summary...",
                date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                color: "indigo"
            };

            allNotes.unshift(newNote);
            store.saveNotes(allNotes);
            this.activeNoteId = newNote.id;
            this.renderNotesList();
            this.loadActiveNote();
            window.app.showToast("Created a new blank note!", "success");
        });

        // Save Note content
        document.getElementById('editor-save-btn').addEventListener('click', () => {
            const allNotes = store.getNotes();
            const note = allNotes.find(n => n.id === this.activeNoteId);

            if (note) {
                note.title = document.getElementById('editor-title').value || "Untitled Note";
                note.courseId = document.getElementById('editor-course').value;
                note.content = document.getElementById('editor-text-body').value;
                note.date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                store.saveNotes(allNotes);
                window.app.showToast("Note content saved locally!", "success");
                this.renderNotesList();
                this.loadActiveNote();
            }
        });

        // Delete note
        document.getElementById('editor-delete-btn').addEventListener('click', () => {
            if (confirm("Are you sure you want to delete this note?")) {
                let allNotes = store.getNotes();
                allNotes = allNotes.filter(n => n.id !== this.activeNoteId);
                store.saveNotes(allNotes);
                
                window.app.showToast("Note deleted", "warning");
                // Reset active note ID to first remaining note
                this.activeNoteId = allNotes.length > 0 ? allNotes[0].id : null;
                this.renderNotesList();
                this.loadActiveNote();
            }
        });

        // Char count updater
        document.getElementById('editor-text-body').addEventListener('keyup', (e) => {
            document.getElementById('editor-char-count').textContent = `${e.target.value.length} characters`;
        });

        // Mock Toolbar operations
        document.querySelectorAll('.editor-toolbar button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cmd = btn.getAttribute('data-cmd');
                const textarea = document.getElementById('editor-text-body');
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const selectedText = text.substring(start, end);

                if (cmd === 'share') return; // Handled separately below

                let wrappedText = selectedText;
                if (cmd === 'bold') wrappedText = `**${selectedText}**`;
                if (cmd === 'italic') wrappedText = `*${selectedText}*`;
                if (cmd === 'underline') wrappedText = `<u>${selectedText}</u>`;
                if (cmd === 'list') wrappedText = `\n- ${selectedText}`;
                if (cmd === 'code') wrappedText = `\`\`\`\n${selectedText}\n\`\`\``;

                textarea.value = text.substring(0, start) + wrappedText + text.substring(end);
                window.app.showToast(`Applied markdown tag`, "info");
            });
        });

        // Share note to public library
        document.getElementById('editor-btn-share').addEventListener('click', () => {
            const title = document.getElementById('editor-title').value;
            const courseId = document.getElementById('editor-course').value;
            const course = store.getCourses().find(c => c.id === courseId);
            const courseCode = course ? course.code : "GEN";

            const libNotes = store.getLibraryNotes();
            libNotes.push({
                id: `lib-${Date.now()}`,
                title: `${title} (Lecture Notes)`,
                course: courseCode,
                author: store.user.name,
                downloads: 0,
                rating: 5.0,
                type: "Notes Share"
            });

            store.saveLibraryNotes(libNotes);
            window.app.showToast("Note published to Campus Shared Library!", "success");
            this.renderLibrary();
        });

        // Shared library search & filters
        document.getElementById('library-search-input').addEventListener('input', (e) => {
            this.librarySearchQuery = e.target.value.toLowerCase();
            const filterVal = document.getElementById('library-class-filter').value;
            this.renderLibrary(filterVal);
        });

        document.getElementById('library-class-filter').addEventListener('change', (e) => {
            this.renderLibrary(e.target.value);
        });
    }
};
export default notesView;
