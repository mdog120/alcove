/* ==========================================================================
   Alcove Data Store & LocalStorage Coordinator
   ========================================================================== */

import { getSupabase } from './supabase.js';

const WORKSPACE_KEYS = [
    'courses', 'tasks', 'chats', 'partners', 'notes', 'library_notes',
    'marketplace', 'clubs', 'events'
];

const MOCK_COURSES = [
    { id: "cs-106b", code: "CS 106B", name: "Programming Abstractions", credits: 5, time: "Tue/Thu 1:30 PM", room: "Gates Building 104", grade: "A", type: "regular", color: "indigo" },
    { id: "math-51", code: "MATH 51", name: "Linear Algebra & Calculus", credits: 5, time: "Mon/Wed/Fri 10:30 AM", room: "Math Corner Room 20", grade: "B+", type: "regular", color: "amber" },
    { id: "bio-83", code: "BIO 83", name: "Biochemistry & Genetics", credits: 4, time: "Mon/Wed 2:30 PM", room: "Gilbert Biology Room 101", grade: "A-", type: "regular", color: "emerald" },
    { id: "pwr-1", code: "PWR 1", name: "Rhetoric & Writing", credits: 4, time: "Tue/Thu 10:30 AM", room: "Sweet Hall Room 210", grade: "A", type: "regular", color: "purple" }
];

const MOCK_TASKS = [
    { id: "task-1", title: "CS 106B: Recursion Problem Set", courseId: "cs-106b", type: "assignment", due: "2026-07-28T23:59", priority: "high", status: "in-progress", notes: "Ensure all helper functions are fully documented. Run tests on Stanford server." },
    { id: "task-2", title: "MATH 51: Homework 3", courseId: "math-51", type: "assignment", due: "2026-07-30T10:00", priority: "medium", status: "todo", notes: "Focus on vector projection and eigenvectors sections." },
    { id: "task-3", title: "BIO 83: Lab Report 1", courseId: "bio-83", type: "assignment", due: "2026-07-26T17:00", priority: "low", status: "done", notes: "Upload PDF to Canvas and submit paper copy." },
    { id: "task-4", title: "PWR 1: Essay Draft Revision", courseId: "pwr-1", type: "assignment", due: "2026-07-29T12:00", priority: "medium", status: "todo", notes: "Revise thesis statement based on peer feedback." },
    { id: "task-5", title: "MATH 51: Midterm Exam 1", courseId: "math-51", type: "exam", due: "2026-08-03T10:30", priority: "high", status: "todo", notes: "Chapters 1-4. Practice exam on website." }
];

const MOCK_CHAT_MESSAGES = {
    "cs-106b": [
        { id: "m1", sender: "Sarah Jenkins", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80", text: "Hey! Has anyone figured out the recursive backtracking problem on the assignment? I keep getting a stack overflow.", time: "10:12 AM", isSelf: false },
        { id: "m2", sender: "Devon Cole", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80", text: "Make sure your base case is checked before making any recursive calls, Sarah. I had that issue too.", time: "10:15 AM", isSelf: false },
        { id: "m3", sender: "Leticia Ramos", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80", text: "Yeah, and check if you are passing the grid parameter by reference, otherwise it duplicates memory.", time: "10:18 AM", isSelf: false }
    ],
    "math-51": [
        { id: "m4", sender: "Andy Patel", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80", text: "When is the review session for the linear algebra midterm? Is it in the quad?", time: "Yesterday", isSelf: false },
        { id: "m5", sender: "Prof. Keith (TA)", avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80", text: "Yes, it is tomorrow at 4 PM in Math Corner Room 20. We will record it.", time: "Yesterday", isSelf: false }
    ],
    "bio-83": [
        { id: "m6", sender: "Emily Watson", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80", text: "Who wants to meet up at the library to study the Krebs cycle diagrams tonight?", time: "Monday", isSelf: false }
    ],
    "pwr-1": [
        { id: "m7", sender: "Alex Rivera", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80", text: "Is anyone down to peer edit draft 1? I can look over yours too.", time: "2 Days ago", isSelf: true },
        { id: "m8", sender: "Sarah Jenkins", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80", text: "I can edit yours Alex! Send it over in a DM.", time: "2 Days ago", isSelf: false }
    ],
    "dorm-chat": [
        { id: "m9", sender: "RA Jordan", avatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&q=80", text: "Weekly floor meeting tonight at 8 PM. Free donuts will be provided!", time: "9:00 AM", isSelf: false }
    ]
};

const MOCK_PARTNERS = [
    { id: "p-1", name: "Sarah Jenkins", major: "Computer Science", year: "Junior", subjects: "CS 106B, MATH 51", style: "Quiet library focus, active coder", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" },
    { id: "p-2", name: "Devon Cole", major: "Mathematics", year: "Sophomore", subjects: "MATH 51, PHYS 41", style: "Late night coffee shop, group reviews", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" },
    { id: "p-3", name: "Emily Watson", major: "Human Biology", year: "Freshman", subjects: "BIO 83, CHEM 31", style: "Flashcards, diagram drawing", avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80" }
];

const MOCK_NOTES = [
    { id: "note-1", title: "Recursion & Backtracking Rules", courseId: "cs-106b", content: "Recursion Steps:\n1. Find your Base Case (simplest input).\n2. Find your Recursive Case (reduce the problem size).\n3. Ensure base case returns a value, stopping the chain.\n\nBacktracking Blueprint:\nbool solve(State& s) {\n    if (isGoal(s)) return true;\n    for (Choice c : choices) {\n        if (isValid(c)) {\n            make(c);\n            if (solve(s)) return true;\n            undo(c); // backtrack\n        }\n    }\n    return false;\n}", date: "July 25, 2026", color: "indigo" },
    { id: "note-2", title: "Eigenvalues & Diagonalization", courseId: "math-51", content: "Eigenvalue Equation:\nAx = λx\nwhere A is a square matrix, x is the eigenvector, and λ is the eigenvalue.\n\nSteps to calculate:\n1. Solve characteristic equation: det(A - λI) = 0\n2. Find roots to get λ values.\n3. For each λ, find the null space of (A - λI) to get eigenvectors.", date: "July 24, 2026", color: "amber" }
];

const MOCK_LIBRARY_NOTES = [
    { id: "lib-1", title: "C++ Memory Management Guide", course: "CS 106B", author: "Leticia Ramos", downloads: 142, rating: 4.8, type: "PDF Note" },
    { id: "lib-2", title: "Krebs Cycle & Cell Respiration", course: "BIO 83", author: "Emily Watson", downloads: 89, rating: 4.9, type: "Diagram Guide" },
    { id: "lib-3", title: "Linear Algebra Exam 1 Review", course: "MATH 51", author: "Devon Cole", downloads: 231, rating: 4.7, type: "Study Sheet" },
    { id: "lib-4", title: "Structuring Persuasive Arguments", course: "PWR 1", author: "Dr. Clara Winters", downloads: 54, rating: 4.5, type: "Slides Outline" }
];

const MOCK_MARKETPLACE = [
    { id: "mk-1", title: "Introduction to Algorithms (CLRS 4th Ed)", price: 65, condition: "good", course: "CS 161", category: "Textbooks", imgType: "book-blue", seller: "Marcus Aurelius", sellerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80", desc: "No markings inside, slight wear on the cover spine. Perfect for CS 161 this autumn." },
    { id: "mk-2", title: "TI-84 Plus CE Graphing Calculator", price: 80, condition: "new", course: "MATH 51", category: "Electronics", imgType: "calculator", seller: "Jessica Thorne", sellerAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=100&q=80", desc: "Practically brand new, comes with charger cable and protective sliding cover. Color screen." },
    { id: "mk-3", title: "Chemistry Molecule Model Set", price: 15, condition: "fair", course: "CHEM 33", category: "Lab Gear", imgType: "flask", seller: "Chloe Vance", sellerAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80", desc: "Missing two carbon atoms but all other elements are intact. Great for visualizing stereochemistry." },
    { id: "mk-4", title: "iPad Pro 11-inch (M1, 128GB)", price: 420, condition: "good", course: "", category: "Electronics", imgType: "laptop", seller: "Andy Patel", sellerAvatar: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=100&q=80", desc: "Includes Apple Pencil 2. Screen is completely flawless. Small scratch on the back shell." }
];

const MOCK_CLUBS = [
    { id: "club-1", name: "Computer Science Society", icon: "💻", count: 428, joined: true, desc: "Stanford's largest CS community. Organizes hackathons, professional networking, and tech workshops." },
    { id: "club-2", name: "Stanford Outdoors Club", icon: "⛺", count: 189, joined: true, desc: "We host weekly hiking trips, camping weekends, and outdoor bouldering sessions across California." },
    { id: "club-3", name: "Campus Chess Association", icon: "♟️", count: 96, joined: false, desc: "Weekly casual game nights, rated tournaments, and chess master lectures. Open to all skill levels." },
    { id: "club-4", name: "Bioengineering Innovators", icon: "🧬", count: 112, joined: false, desc: "Connecting biology enthusiasts with hardware developers to tackle health and environmental crises." }
];

const MOCK_EVENTS = [
    { id: "ev-1", title: "Fall Hackathon Kickoff & Pitch", clubId: "club-1", clubName: "CS Society", date: "2026-07-28T18:00", location: "Gates Building Lobby", tag: "Academic", rsvped: true, desc: "Find study groups and brainstorm ideas. Free pizza and energy drinks provided for all registrants!" },
    { id: "ev-2", title: "Sunset Hike & Bonfire", clubId: "club-2", clubName: "Stanford Outdoors", date: "2026-08-01T17:30", location: "Lake Lagunita Fire Pit", tag: "Social", rsvped: false, desc: "A brief scenic trail hike around the lake followed by s'mores, songs, and stargazing." },
    { id: "ev-3", title: "Career Fair Prep & Resume Blitz", clubId: "club-1", clubName: "CS Society", date: "2026-07-29T15:00", location: "Old Union Ballroom", tag: "Career", rsvped: false, desc: "Get your resume roasted by senior students and recruiters before the fall fair next month." }
];

// Helper to check and load from localStorage
function getOrInitialize(key, initialVal) {
    const data = localStorage.getItem(`alcove_${key}`);
    if (data) return JSON.parse(data);
    localStorage.setItem(`alcove_${key}`, JSON.stringify(initialVal));
    return initialVal;
}

export const store = {
    // Current user state
    user: {
        name: "Alex Rivera",
        school: "Stanford University",
        year: "Stanford '27",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
        notifications: [
            { id: "n-1", type: "chat", title: "New Message in CS 106B", text: "Leticia Ramos: 'check if you are passing...'", time: "5m ago", read: false },
            { id: "n-2", type: "event", title: "Event Reminder", text: "CS Society Hackathon starts tomorrow at 6:00 PM.", time: "1h ago", read: false },
            { id: "n-3", type: "task", title: "Assignment Due Soon", text: "Recursion Problem Set is due tomorrow.", time: "3h ago", read: false }
        ]
    },

    // Reactive state triggers
    listeners: {},
    cloudUserId: null,
    cloudSyncTimer: null,

    async connectCloudWorkspace(userId) {
        this.cloudUserId = userId;
        const sb = getSupabase();
        if (!sb || !userId) return false;

        try {
            const { data, error } = await sb
                .from('workspace_data')
                .select('data')
                .eq('user_id', userId)
                .maybeSingle();
            if (error) throw error;

            if (data?.data && Object.keys(data.data).length > 0) {
                WORKSPACE_KEYS.forEach(key => {
                    if (data.data[key] !== undefined) {
                        localStorage.setItem(`alcove_${key}`, JSON.stringify(data.data[key]));
                    }
                });
                return true;
            }

            // First signed-in session: preserve the student's existing local work.
            await this.saveCloudWorkspace();
            return false;
        } catch (error) {
            console.warn('Could not load Alcove workspace from Supabase:', error.message);
            return false;
        }
    },

    disconnectCloudWorkspace() {
        this.cloudUserId = null;
        if (this.cloudSyncTimer) clearTimeout(this.cloudSyncTimer);
        this.cloudSyncTimer = null;
    },

    workspaceSnapshot() {
        // Initialize every collection before taking the first cloud snapshot.
        this.getCourses();
        this.getTasks();
        this.getMessages('cs-106b');
        this.getPartners();
        this.getNotes();
        this.getLibraryNotes();
        this.getMarketplace();
        this.getClubs();
        this.getEvents();

        return WORKSPACE_KEYS.reduce((snapshot, key) => {
            const raw = localStorage.getItem(`alcove_${key}`);
            if (raw) snapshot[key] = JSON.parse(raw);
            return snapshot;
        }, {});
    },

    async saveCloudWorkspace() {
        const sb = getSupabase();
        if (!sb || !this.cloudUserId) return;

        try {
            const { error } = await sb.from('workspace_data').upsert({
                user_id: this.cloudUserId,
                data: this.workspaceSnapshot()
            });
            if (error) throw error;
        } catch (error) {
            console.warn('Could not save Alcove workspace to Supabase:', error.message);
        }
    },

    scheduleCloudSync() {
        if (!this.cloudUserId) return;
        if (this.cloudSyncTimer) clearTimeout(this.cloudSyncTimer);
        this.cloudSyncTimer = setTimeout(() => this.saveCloudWorkspace(), 500);
    },

    persistWorkspaceValue(key, value) {
        localStorage.setItem(`alcove_${key}`, JSON.stringify(value));
        this.scheduleCloudSync();
    },

    subscribe(event, callback) {
        if (!this.listeners[event]) this.listeners[event] = [];
        this.listeners[event].push(callback);
    },

    emit(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(cb => cb(data));
        }
    },

    // Data retrievers
    getCourses() {
        return getOrInitialize("courses", MOCK_COURSES);
    },

    saveCourses(courses) {
        this.persistWorkspaceValue('courses', courses);
        this.emit("courses_changed", courses);
    },

    getTasks() {
        return getOrInitialize("tasks", MOCK_TASKS);
    },

    saveTasks(tasks) {
        this.persistWorkspaceValue('tasks', tasks);
        this.emit("tasks_changed", tasks);
    },

    getMessages(channelId) {
        const chats = getOrInitialize("chats", MOCK_CHAT_MESSAGES);
        return chats[channelId] || [];
    },

    addMessage(channelId, text, isSelf = true, senderName = "Alex Rivera", senderAvatar = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80") {
        const chats = getOrInitialize("chats", MOCK_CHAT_MESSAGES);
        if (!chats[channelId]) chats[channelId] = [];
        
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newMsg = {
            id: `msg-${Date.now()}`,
            sender: senderName,
            avatar: senderAvatar,
            text,
            time: timeStr,
            isSelf
        };

        chats[channelId].push(newMsg);
        this.persistWorkspaceValue('chats', chats);
        this.emit(`chat_${channelId}`, newMsg);
        return newMsg;
    },

    getPartners() {
        return getOrInitialize("partners", MOCK_PARTNERS);
    },

    getNotes() {
        return getOrInitialize("notes", MOCK_NOTES);
    },

    saveNotes(notes) {
        this.persistWorkspaceValue('notes', notes);
        this.emit("notes_changed", notes);
    },

    getLibraryNotes() {
        return getOrInitialize("library_notes", MOCK_LIBRARY_NOTES);
    },

    saveLibraryNotes(libNotes) {
        this.persistWorkspaceValue('library_notes', libNotes);
        this.emit("lib_notes_changed", libNotes);
    },

    getMarketplace() {
        return getOrInitialize("marketplace", MOCK_MARKETPLACE);
    },

    saveMarketplace(marketplace) {
        this.persistWorkspaceValue('marketplace', marketplace);
        this.emit("marketplace_changed", marketplace);
    },

    getClubs() {
        return getOrInitialize("clubs", MOCK_CLUBS);
    },

    saveClubs(clubs) {
        this.persistWorkspaceValue('clubs', clubs);
        this.emit("clubs_changed", clubs);
    },

    getEvents() {
        return getOrInitialize("events", MOCK_EVENTS);
    },

    saveEvents(events) {
        this.persistWorkspaceValue('events', events);
        this.emit("events_changed", events);
    },

    // Automated chat bot response module
    triggerBotReply(channelId, userMsg) {
        // Classmates list for responses
        const bots = [
            { name: "Sarah Jenkins", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80" },
            { name: "Devon Cole", avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80" },
            { name: "Leticia Ramos", avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80" },
            { name: "Andy Patel", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80" }
        ];

        const replies = [
            "Good point! Let's double check that during office hours.",
            "Ah, makes sense. Thanks for the tip!",
            "I am actually stuck on that too. Let me try this approach now.",
            "Can we meet up in the library after class tomorrow to work on this?",
            "Wait, are you looking at page 14 of the textbook? It outlines a similar scenario.",
            "Let's create a study room on Alcove and go over it together!",
            "I checked it, works perfectly. Thanks!",
            "Oh, that makes so much more sense now."
        ];

        // Random classmate & reply
        const bot = bots[Math.floor(Math.random() * bots.length)];
        const reply = replies[Math.floor(Math.random() * replies.length)];

        setTimeout(() => {
            // Add message
            this.addMessage(channelId, reply, false, bot.name, bot.avatar);
            this.emit("notif_received", {
                type: "chat",
                title: `Message in #${channelId}`,
                text: `${bot.name}: "${reply.substring(0, 30)}..."`
            });
        }, 1800);
    }
};
