/* ==========================================================================
   Alcove Class Chats & Study Partner Matcher Router Module (Beige-Mint Theme)
   ========================================================================== */

import { store } from '../store.js';

export const chatView = {
    activeChannel: 'cs-106b',
    isDirectMessage: false,
    activeDMUser: null,

    template() {
        return `
            <div class="chat-container glass-panel">
                
                <!-- Left Sidebar: Channels & DMs List -->
                <div class="chat-sidebar">
                    <h3 class="font-heading font-bold font-14 mb-2">Collab Chats</h3>
                    
                    <div class="chat-group-label">Class Channels</div>
                    <div id="channels-list">
                        <!-- Dynamic Channels -->
                    </div>

                    <div class="chat-group-label" style="display:flex; justify-content:space-between; align-items:center;">
                        <span>Direct Messages</span>
                        <i class="fa-solid fa-plus font-10 text-muted cursor-pointer" id="start-dm-btn" title="New DM"></i>
                    </div>
                    <div id="dms-list">
                        <!-- Dynamic Direct Messages -->
                    </div>
                </div>

                <!-- Middle Panel: Chat Window -->
                <div class="chat-window">
                    <div class="chat-window-header">
                        <div class="chat-window-title">
                            <h3 id="chat-header-title">#cs-106b</h3>
                            <p id="chat-header-desc">Group chat for CS 106B Programming Abstractions (48 members)</p>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-secondary btn-sm" id="chat-btn-clear" style="padding:6px 12px; font-size:11px;">
                                <i class="fa-regular fa-trash-can"></i> Clear Board
                            </button>
                        </div>
                    </div>

                    <div class="chat-messages" id="chat-messages-viewport">
                        <!-- Messages dynamically render here -->
                    </div>

                    <div class="chat-input-bar">
                        <form id="chat-send-form">
                            <div class="chat-input-wrapper">
                                <button type="button" class="chat-attach-btn" id="chat-mock-attach" title="Attach file">
                                    <i class="fa-regular fa-file"></i>
                                </button>
                                <input type="text" id="chat-input-field" placeholder="Type a message to your classmates..." required autocomplete="off">
                                <button type="submit" class="chat-send-btn" title="Send Message">
                                    <i class="fa-solid fa-arrow-up"></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- Right Sidebar: Study Partner Matcher -->
                <div class="study-matcher-panel" id="matcher-sidebar">
                    <div class="matcher-header">
                        <h4>Partner Matcher</h4>
                        <p>Find study buddies sharing your classes and habits.</p>
                    </div>

                    <div id="matcher-view-container" class="d-flex flex-column gap-3">
                        <!-- Dynamic Matcher layout -->
                    </div>
                </div>

            </div>
        `;
    },

    init() {
        this.renderChannels();
        this.renderMessages();
        this.renderMatcher();
        this.bindEvents();

        const courses = store.getCourses();
        courses.forEach(c => {
            store.subscribe(`chat_${c.id}`, (msg) => {
                if (this.activeChannel === c.id && !this.isDirectMessage) {
                    this.appendMessage(msg);
                }
            });
        });

        store.subscribe("chat_dorm-chat", (msg) => {
            if (this.activeChannel === 'dorm-chat' && !this.isDirectMessage) {
                this.appendMessage(msg);
            }
        });

        store.subscribe("chat_dm-room", (msg) => {
            if (this.isDirectMessage && this.activeChannel === 'dm-room') {
                this.appendMessage(msg);
            }
        });
    },

    renderChannels() {
        const channelsContainer = document.getElementById('channels-list');
        const courses = store.getCourses();

        let channelsHTML = courses.map(c => `
            <a href="#" class="chat-channel-item ${this.activeChannel === c.id && !this.isDirectMessage ? 'active' : ''}" data-channel="${c.id}">
                <span># ${c.id}</span>
            </a>
        `).join('');

        channelsHTML += `
            <a href="#" class="chat-channel-item ${this.activeChannel === 'dorm-chat' && !this.isDirectMessage ? 'active' : ''}" data-channel="dorm-chat">
                <span># dorm-chat</span>
            </a>
        `;

        channelsContainer.innerHTML = channelsHTML;

        const dmsContainer = document.getElementById('dms-list');
        if (this.isDirectMessage && this.activeDMUser) {
            dmsContainer.innerHTML = `
                <a href="#" class="chat-channel-item active" data-channel="dm-room">
                    <span><i class="fa-regular fa-comment"></i> ${this.activeDMUser.name}</span>
                </a>
            `;
        } else {
            dmsContainer.innerHTML = `
                <div class="text-muted font-11 p-2 text-center">No active direct messages. Match with a partner to start!</div>
            `;
        }

        document.querySelectorAll('.chat-channel-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const chanId = item.getAttribute('data-channel');
                if (chanId === 'dm-room') {
                    this.isDirectMessage = true;
                    this.activeChannel = 'dm-room';
                } else {
                    this.isDirectMessage = false;
                    this.activeChannel = chanId;
                }
                this.renderChannels();
                this.renderMessages();
            });
        });
    },

    renderMessages() {
        const viewport = document.getElementById('chat-messages-viewport');
        const headerTitle = document.getElementById('chat-header-title');
        const headerDesc = document.getElementById('chat-header-desc');

        if (this.isDirectMessage && this.activeDMUser) {
            headerTitle.textContent = `Direct Message: ${this.activeDMUser.name}`;
            headerDesc.textContent = `DM with ${this.activeDMUser.name} (${this.activeDMUser.major} Major)`;
        } else {
            headerTitle.textContent = `# ${this.activeChannel}`;
            if (this.activeChannel === 'dorm-chat') {
                headerDesc.textContent = `Dorm community board (112 residents)`;
            } else {
                const course = store.getCourses().find(c => c.id === this.activeChannel);
                const count = Math.floor(Math.random() * 30) + 20;
                headerDesc.textContent = course ? `Group chat for ${course.code} ${course.name} (${count} members)` : `Class forum`;
            }
        }

        const messages = store.getMessages(this.activeChannel);
        
        if (messages.length === 0) {
            viewport.innerHTML = `
                <div class="py-5 text-center text-secondary m-auto">
                    <p style="font-size: 20px; margin-bottom: 6px; color: var(--text-muted);"><i class="fa-regular fa-comment-dots"></i></p>
                    <p class="font-12">Welcome to the beginning of the board!</p>
                </div>
            `;
            return;
        }

        viewport.innerHTML = messages.map(m => `
            <div class="message-bubble ${m.isSelf ? 'outgoing' : 'incoming'}">
                <img src="${m.avatar}" alt="${m.sender}" class="message-avatar">
                <div class="message-content-wrapper">
                    <span class="message-sender">${m.sender}</span>
                    <div class="message-content">${m.text}</div>
                    <span class="message-time">${m.time}</span>
                </div>
            </div>
        `).join('');

        this.scrollToBottom();
    },

    appendMessage(msg) {
        const viewport = document.getElementById('chat-messages-viewport');
        const placeholder = viewport.querySelector('.m-auto');
        if (placeholder) placeholder.remove();

        const indicator = viewport.querySelector('.typing-indicator-bubble');
        if (indicator) indicator.remove();

        const bubble = document.createElement('div');
        bubble.className = `message-bubble ${msg.isSelf ? 'outgoing' : 'incoming'}`;
        bubble.innerHTML = `
            <img src="${msg.avatar}" alt="${msg.sender}" class="message-avatar">
            <div class="message-content-wrapper">
                <span class="message-sender">${msg.sender}</span>
                <div class="message-content">${msg.text}</div>
                <span class="message-time">${msg.time}</span>
            </div>
        `;

        viewport.appendChild(bubble);
        this.scrollToBottom();
    },

    showTypingIndicator() {
        const viewport = document.getElementById('chat-messages-viewport');
        if (viewport.querySelector('.typing-indicator-bubble')) return;

        const indicator = document.createElement('div');
        indicator.className = "typing-indicator-bubble message-bubble incoming";
        indicator.innerHTML = `
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
            <div class="typing-dot"></div>
        `;
        
        viewport.appendChild(indicator);
        this.scrollToBottom();
    },

    scrollToBottom() {
        const viewport = document.getElementById('chat-messages-viewport');
        viewport.scrollTop = viewport.scrollHeight;
    },

    renderMatcher() {
        const container = document.getElementById('matcher-view-container');
        const matchedStatus = localStorage.getItem('alcove_matcher_done') === 'true';

        if (!matchedStatus) {
            container.innerHTML = `
                <div class="glass-panel p-3">
                    <form id="matcher-setup-form" class="matcher-form">
                        <div class="form-group mb-2">
                            <label for="match-subject" style="font-size:10px;">Subject</label>
                            <select id="match-subject" style="padding:5px; font-size:11px;">
                                <option value="cs-106b">CS 106B</option>
                                <option value="math-51">MATH 51</option>
                                <option value="bio-83">BIO 83</option>
                            </select>
                        </div>
                        <div class="form-group mb-2">
                            <label for="match-style" style="font-size:10px;">Study Style</label>
                            <select id="match-style" style="padding:5px; font-size:11px;">
                                <option value="quiet">Quiet Library</option>
                                <option value="group">Cafe Collaboration</option>
                                <option value="flash">Explaining/Cards</option>
                            </select>
                        </div>
                        <div class="form-group mb-2">
                            <label for="match-time" style="font-size:10px;">Time</label>
                            <select id="match-time" style="padding:5px; font-size:11px;">
                                <option value="morning">Mornings</option>
                                <option value="afternoon">Afternoons</option>
                                <option value="night">Nights</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary btn-sm w-100 mt-2" style="font-size:11.5px;">
                            Match Now
                        </button>
                    </form>
                </div>
            `;

            setTimeout(() => {
                const form = document.getElementById('matcher-setup-form');
                if (form) {
                    form.onsubmit = (e) => {
                        e.preventDefault();
                        localStorage.setItem('alcove_matcher_done', 'true');
                        window.app.showToast("Finding best matches...", "info");
                        
                        setTimeout(() => {
                            window.app.showToast("Matches found!", "success");
                            this.renderMatcher();
                        }, 800);
                    };
                }
            }, 50);
        } else {
            const partners = store.getPartners();
            
            container.innerHTML = `
                <div class="d-flex flex-column gap-2">
                    ${partners.map(p => `
                        <div class="study-partner-card glass-panel" data-partner-id="${p.id}">
                            <div class="partner-profile-header">
                                <img src="${p.avatar}" alt="${p.name}" class="partner-avatar">
                                <div class="partner-meta">
                                    <h5>${p.name}</h5>
                                    <p>${p.year} &bull; ${p.major}</p>
                                </div>
                            </div>
                            <div class="partner-tags">
                                ${p.subjects.split(', ').map(sub => `<span class="partner-tag">${sub}</span>`).join('')}
                            </div>
                            <button class="btn btn-outline-indigo btn-sm w-100 partner-chat-btn" data-partner-id="${p.id}" style="padding:4px; font-size:11px;">
                                Message
                            </button>
                        </div>
                    `).join('')}
                    
                    <button class="btn btn-secondary btn-sm w-100" id="reset-matcher-btn" style="font-size:11px;">
                        Reset Preferences
                    </button>
                </div>
            `;

            setTimeout(() => {
                document.getElementById('reset-matcher-btn').addEventListener('click', () => {
                    localStorage.removeItem('alcove_matcher_done');
                    this.renderMatcher();
                });

                container.querySelectorAll('.partner-chat-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const pId = btn.getAttribute('data-partner-id');
                        const partner = partners.find(p => p.id === pId);
                        if (partner) {
                            this.startDM(partner);
                        }
                    });
                });
            }, 50);
        }
    },

    startDM(partner) {
        this.isDirectMessage = true;
        this.activeChannel = 'dm-room';
        this.activeDMUser = partner;

        const dmRoomMsgs = store.getMessages('dm-room');
        if (dmRoomMsgs.length === 0) {
            store.addMessage('dm-room', `Hey Alex! I saw we matched on Alcove for studying. I'm free to meet up at the library tomorrow if you want to work on CS problem sets!`, false, partner.name, partner.avatar);
        }

        this.renderChannels();
        this.renderMessages();
        window.app.showToast(`Opened chat with ${partner.name}`, "success");
    },

    bindEvents() {
        const form = document.getElementById('chat-send-form');
        const input = document.getElementById('chat-input-field');

        form.onsubmit = (e) => {
            e.preventDefault();
            const text = input.value.trim();
            if (!text) return;

            const newMsg = store.addMessage(this.activeChannel, text, true);
            this.appendMessage(newMsg);
            input.value = '';

            if (this.isDirectMessage && this.activeDMUser) {
                this.showTypingIndicator();
                setTimeout(() => {
                    const dmReplies = [
                        "Yeah that sounds perfect, what time works for you?",
                        "Awesome! I'll bring my laptop. See you at Green Library.",
                        "Great, let's grab a table on the second floor.",
                        "Sure! I'll be there around 2 PM."
                    ];
                    const replyText = dmReplies[Math.floor(Math.random() * dmReplies.length)];
                    const replyMsg = store.addMessage('dm-room', replyText, false, this.activeDMUser.name, this.activeDMUser.avatar);
                    this.appendMessage(replyMsg);
                }, 1600);
            } else {
                this.showTypingIndicator();
                store.triggerBotReply(this.activeChannel, text);
            }
        };

        document.getElementById('chat-btn-clear').addEventListener('click', () => {
            if (confirm("Clear this chat history?")) {
                const chats = JSON.parse(localStorage.getItem('alcove_chats') || '{}');
                chats[this.activeChannel] = [];
                localStorage.setItem('alcove_chats', JSON.stringify(chats));
                this.renderMessages();
                window.app.showToast("Message board cleared", "info");
            }
        });

        document.getElementById('chat-mock-attach').addEventListener('click', () => {
            const fileName = prompt("Upload a PDF note or code file:");
            if (fileName && fileName.trim()) {
                const attachmentMsg = `📎 Shared file: **${fileName.trim()}**`;
                const newMsg = store.addMessage(this.activeChannel, attachmentMsg, true);
                this.appendMessage(newMsg);
                window.app.showToast(`Shared file ${fileName.trim()}`, "success");
            }
        });

        const startDm = document.getElementById('start-dm-btn');
        if (startDm) {
            startDm.addEventListener('click', () => {
                const partners = store.getPartners();
                const selection = prompt(`Who would you like to direct message?\nChoose classmate:\n1. Sarah Jenkins\n2. Devon Cole\n3. Emily Watson`);
                if (selection === '1') this.startDM(partners[0]);
                else if (selection === '2') this.startDM(partners[1]);
                else if (selection === '3') this.startDM(partners[2]);
            });
        }
    }
};
export default chatView;
