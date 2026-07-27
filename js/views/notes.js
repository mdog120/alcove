/* ==========================================================================
   Alcove Notes Manager & Shared Campus Library Router Module (Beige-Mint)
   ========================================================================== */

import { store } from '../store.js';

export const notesView = {
    activeNoteId: 'note-1',
    librarySearchQuery: '',

    template() {
        return `
            <div class="planner-controls">
                <h2 class="font-heading font-bold font-24"><i class="fa-regular fa-file-lines"></i> Study Notes Hub</h2>
                <button class="btn btn-primary" id="notes-new-btn">
                    New Note
                </button>
            </div>

            <!-- Notes Main Editor Panel Layout -->
            <div class="notes-layout mb-4">
                
                <!-- Left Pane: Notes Folders List -->
                <div class="notes-list-pane glass-panel">
                    <div class="notes-search-bar mb-3">
                        <input type="text" id="notes-local-search" placeholder="Search my notes...">
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
                        <button class="editor-tool-btn" data-cmd="bold" title="Bold"><b>B</b></button>
                        <button class="editor-tool-btn" data-cmd="italic" title="Italic"><i>I</i></button>
                        <button class="editor-tool-btn" data-cmd="underline" title="Underline"><u>U</u></button>
                        <button class="editor-tool-btn" data-cmd="list" title="Bullet List">List</button>
                        <button class="editor-tool-btn" data-cmd="code" title="Code Block">&lt;/&gt;</button>
                        <div style="width: 1px; background-color: var(--border-color); margin: 0 4px;"></div>
                        <button class="editor-tool-btn" data-cmd="share" title="Share to Campus Library" id="editor-btn-share" style="width: auto; padding: 0 6px;">
                            <i class="fa-regular fa-share-from-square"></i> Share
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
                    <span><i class="fa-regular fa-folder-open"></i> Campus Library</span>
                </div>

                <div class="marketplace-filter-row glass-panel p-3 mb-4">
                    <div class="header-search flex-1 mb-0" style="max-width:360px; position:relative;">
                        <i class="fa-solid fa-magnifying-glass" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:12px;"></i>
                        <input type="text" id="library-search-input" placeholder="Search community notes..." style="padding-left:36px; background-color:var(--bg-primary);">
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

        store.subscribe("notes_changed", () => {
            this.renderNotesList();
        });
        store.subscribe("lib_notes_changed", () => {
            this.renderLibrary();
        });
    },

    getTagTheme(courseColor) {
        let tag = 'blue';
        if (courseColor === 'amber') tag = 'amber';
        if (courseColor === 'emerald') tag = 'emerald';
        if (courseColor === 'purple' || courseColor === 'indigo') tag = 'purple';
        if (courseColor === 'rose') tag = 'red';
        return tag;
    },

    renderNotesList(searchQuery = '') {
        const container = document.getElementById('notes-list-container');
        let notes = store.getNotes();

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

            return `
                <div class="note-folder-card glass-panel ${this.activeNoteId === n.id ? 'active' : ''}" data-note-id="${n.id}">
                    <div class="note-info-block">
                        <span class="note-folder-icon"><i class="fa-regular fa-file-lines"></i></span>
                        <div class="note-folder-details">
                            <h4>${n.title || 'Untitled Note'}</h4>
                            <p>${courseCode} &bull; ${n.date}</p>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

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
            titleInput.value = '';
            textBody.value = '';
            dateLabel.textContent = 'Unsaved';
            charCount.textContent = '0 characters';
        }
    },

    renderLibrary(classFilter = 'all') {
        const container = document.getElementById('library-grid-container');
        let libNotes = store.getLibraryNotes();

        if (this.librarySearchQuery) {
            libNotes = libNotes.filter(n => n.title.toLowerCase().includes(this.librarySearchQuery) || n.author.toLowerCase().includes(this.librarySearchQuery));
        }

        if (classFilter !== 'all') {
            libNotes = libNotes.filter(n => n.course === classFilter);
        }

        if (libNotes.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-4 text-center text-secondary">
                    <p class="font-12 text-muted">No shared notes found matching query.</p>
                </div>
            `;
            return;
        }

        const courses = store.getCourses();

        container.innerHTML = libNotes.map(n => {
            const courseMatch = courses.find(c => c.code === n.course);
            const rawColor = courseMatch ? courseMatch.color : "indigo";
            const tagTheme = this.getTagTheme(rawColor);

            return `
                <div class="library-note-card glass-panel">
                    <div class="lib-card-header">
                        <span class="lib-card-tag" style="background-color: var(--tag-${tagTheme}-bg); color: var(--tag-${tagTheme}-text);">
                            ${n.course}
                        </span>
                        <div class="lib-card-downloads">
                            <span><i class="fa-regular fa-circle-down"></i> ${n.downloads}</span>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="lib-card-title">${n.title}</h4>
                        <span class="lib-card-author">Shared by ${n.author}</span>
                    </div>

                    <div class="lib-card-footer">
                        <div class="lib-card-rating">
                            <span><i class="fa-regular fa-star"></i> ${n.rating}</span>
                        </div>
                        <button class="btn btn-secondary btn-sm lib-download-btn" data-lib-id="${n.id}" style="padding: 4px 8px; font-size:11px;">
                            Download
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.lib-download-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-lib-id');
                const list = store.getLibraryNotes();
                const note = list.find(n => n.id === id);
                if (note) {
                    note.downloads++;
                    store.saveLibraryNotes(list);
                    
                    btn.innerHTML = `Loading...`;
                    btn.disabled = true;

                    setTimeout(() => {
                        window.app.showToast(`Downloaded "${note.title}" successfully!`, "success");
                        btn.innerHTML = `Download`;
                        btn.disabled = false;
                        this.renderLibrary(classFilter);
                    }, 800);
                }
            });
        });
    },

    bindEvents() {
        document.getElementById('notes-local-search').addEventListener('input', (e) => {
            this.renderNotesList(e.target.value);
        });

        document.getElementById('notes-new-btn').addEventListener('click', () => {
            const allNotes = store.getNotes();
            const now = new Date();
            const newNote = {
                id: `note-${Date.now()}`,
                title: "New Study Sheet",
                courseId: store.getCourses()[0].id,
                content: "",
                date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                color: "indigo"
            };

            allNotes.unshift(newNote);
            store.saveNotes(allNotes);
            this.activeNoteId = newNote.id;
            this.renderNotesList();
            this.loadActiveNote();
            window.app.showToast("Created a new blank note page!", "success");
        });

        document.getElementById('editor-save-btn').addEventListener('click', () => {
            const allNotes = store.getNotes();
            const note = allNotes.find(n => n.id === this.activeNoteId);

            if (note) {
                note.title = document.getElementById('editor-title').value || "Untitled Note";
                note.courseId = document.getElementById('editor-course').value;
                note.content = document.getElementById('editor-text-body').value;
                note.date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                
                store.saveNotes(allNotes);
                window.app.showToast("Saved note workspace!", "success");
                this.renderNotesList();
                this.loadActiveNote();
            }
        });

        document.getElementById('editor-delete-btn').addEventListener('click', () => {
            if (confirm("Delete this page?")) {
                let allNotes = store.getNotes();
                allNotes = allNotes.filter(n => n.id !== this.activeNoteId);
                store.saveNotes(allNotes);
                
                window.app.showToast("Note deleted", "warning");
                this.activeNoteId = allNotes.length > 0 ? allNotes[0].id : null;
                this.renderNotesList();
                this.loadActiveNote();
            }
        });

        document.getElementById('editor-text-body').addEventListener('keyup', (e) => {
            document.getElementById('editor-char-count').textContent = `${e.target.value.length} characters`;
        });

        document.querySelectorAll('.editor-toolbar button').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const cmd = btn.getAttribute('data-cmd');
                const textarea = document.getElementById('editor-text-body');
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const text = textarea.value;
                const selectedText = text.substring(start, end);

                if (cmd === 'share') return; 

                let wrappedText = selectedText;
                if (cmd === 'bold') wrappedText = `**${selectedText}**`;
                if (cmd === 'italic') wrappedText = `*${selectedText}*`;
                if (cmd === 'underline') wrappedText = `<u>${selectedText}</u>`;
                if (cmd === 'list') wrappedText = `\n- ${selectedText}`;
                if (cmd === 'code') wrappedText = `\`\`\`\n${selectedText}\n\`\`\``;

                textarea.value = text.substring(0, start) + wrappedText + text.substring(end);
            });
        });

        document.getElementById('editor-btn-share').addEventListener('click', () => {
            const title = document.getElementById('editor-title').value;
            const courseId = document.getElementById('editor-course').value;
            const course = store.getCourses().find(c => c.id === courseId);
            const courseCode = course ? course.code : "GEN";

            const libNotes = store.getLibraryNotes();
            libNotes.push({
                id: `lib-${Date.now()}`,
                title: `${title}`,
                course: courseCode,
                author: store.user.name,
                downloads: 0,
                rating: 5.0,
                type: "Notes Share"
            });

            store.saveLibraryNotes(libNotes);
            window.app.showToast("Shared to campus library!", "success");
            this.renderLibrary();
        });

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
