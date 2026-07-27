/* ==========================================================================
   Alcove Textbook & Gear Marketplace Router Module
   ========================================================================== */

import { store } from '../store.js';

export const marketplaceView = {
    searchQuery: '',
    categoryFilter: 'all',
    conditionFilter: 'all',

    template() {
        return `
            <div class="planner-controls">
                <h2 class="font-heading font-bold font-24">Campus Marketplace</h2>
                <button class="btn btn-primary" id="market-sell-btn">
                    <i class="fa-solid fa-tags"></i> List Item for Sale
                </button>
            </div>

            <!-- Filters Bar -->
            <div class="marketplace-filter-row glass-panel p-3 mb-4">
                <div class="header-search flex-1 mb-0" style="max-width:320px; position:relative;">
                    <i class="fa-solid fa-magnifying-glass" style="position:absolute; left:14px; top:50%; transform:translateY(-50%); color:var(--text-muted);"></i>
                    <input type="text" id="market-search-input" placeholder="Search books, gear, calculators..." style="padding-left:40px; background-color:var(--bg-primary);">
                </div>
                
                <div class="marketplace-filters">
                    <select id="market-cat-filter">
                        <option value="all">All Categories</option>
                        <option value="Textbooks">Textbooks</option>
                        <option value="Electronics">Electronics</option>
                        <option value="Lab Gear">Lab Gear</option>
                        <option value="Dorm Life">Dorm Life</option>
                    </select>

                    <select id="market-cond-filter">
                        <option value="all">All Conditions</option>
                        <option value="new">Like New</option>
                        <option value="good">Very Good / Good</option>
                        <option value="fair">Fair</option>
                        <option value="worn">Worn</option>
                    </select>
                </div>
            </div>

            <!-- Grid Items -->
            <div class="marketplace-grid" id="market-grid-container">
                <!-- Dynamic cards -->
            </div>
        `;
    },

    init() {
        this.renderMarketGrid();
        this.bindEvents();

        // Listen for store listings changes
        store.subscribe("marketplace_changed", () => {
            this.renderMarketGrid();
        });
    },

    renderMarketGrid() {
        const container = document.getElementById('market-grid-container');
        let items = store.getMarketplace();

        // Query filtering
        if (this.searchQuery) {
            items = items.filter(i => i.title.toLowerCase().includes(this.searchQuery) || (i.course && i.course.toLowerCase().includes(this.searchQuery)));
        }

        // Category filter
        if (this.categoryFilter !== 'all') {
            items = items.filter(i => i.category === this.categoryFilter);
        }

        // Condition filter
        if (this.conditionFilter !== 'all') {
            if (this.conditionFilter === 'good') {
                items = items.filter(i => i.condition === 'good' || i.condition === 'new');
            } else {
                items = items.filter(i => i.condition === this.conditionFilter);
            }
        }

        if (items.length === 0) {
            container.innerHTML = `
                <div class="col-span-full py-5 text-center text-secondary">
                    <i class="fa-solid fa-store-slash text-indigo mb-3" style="font-size:36px; opacity:0.5;"></i>
                    <p>No listings found matching your search options.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => {
            let iconEmoji = "📚";
            if (item.imgType === "calculator") iconEmoji = "🧮";
            if (item.imgType === "laptop") iconEmoji = "💻";
            if (item.imgType === "flask") iconEmoji = "🧪";

            let conditionLabel = "Good";
            if (item.condition === "new") conditionLabel = "Like New";
            if (item.condition === "good") conditionLabel = "Very Good";
            if (item.condition === "fair") conditionLabel = "Fair Condition";
            if (item.condition === "worn") conditionLabel = "Worn Spine";

            return `
                <div class="marketplace-card glass-panel">
                    <div class="item-image-wrapper">
                        <span class="item-thumb-placeholder">${iconEmoji}</span>
                        <div class="item-price-tag">$${item.price}</div>
                    </div>
                    
                    <div class="item-details-panel">
                        <span class="item-cat-label">${item.category} ${item.course ? `&bull; ${item.course}` : ''}</span>
                        <h4 class="item-title-txt" title="${item.title}">${item.title}</h4>
                        <span class="item-condition-badge">${conditionLabel}</span>

                        <div class="item-seller-row">
                            <div class="item-seller-info">
                                <img src="${item.sellerAvatar}" alt="${item.seller}" class="item-seller-avatar">
                                <span class="item-seller-name">${item.seller}</span>
                            </div>
                            <button class="btn btn-secondary btn-sm contact-seller-btn" data-item-id="${item.id}" style="padding: 6px 12px; font-size:11px;">
                                <i class="fa-regular fa-comment text-indigo"></i> Buy / Contact
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Wire purchase details click
        container.querySelectorAll('.contact-seller-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-item-id');
                const list = store.getMarketplace();
                const item = list.find(i => i.id === id);
                if (item) {
                    this.contactSeller(item);
                }
            });
        });
    },

    contactSeller(item) {
        if (item.seller === store.user.name) {
            window.app.showToast("This is your own listing!", "warning");
            return;
        }

        // Direct user to chat pane with seller
        const mockSeller = {
            id: `partner-${item.seller.replace(/\s+/g, '-').toLowerCase()}`,
            name: item.seller,
            major: item.category === 'Textbooks' ? 'Student' : 'Campus Hub',
            year: '',
            subjects: '',
            style: '',
            avatar: item.sellerAvatar
        };

        // Create DM channel messages in store if empty
        const roomName = `dm-${mockSeller.id}`;
        
        // Add message template
        store.addMessage('dm-room', `Hey Alex! I saw you wanted to buy my "${item.title}" listed for $${item.price}! Let me know when you'd like to meet up on campus.`, false, mockSeller.name, mockSeller.avatar);

        // Inject active DM settings into chatView
        import('./chat.js').then(module => {
            module.chatView.isDirectMessage = true;
            module.chatView.activeChannel = 'dm-room';
            module.chatView.activeDMUser = mockSeller;
            
            // Route
            window.location.hash = '#chat';
            window.app.showToast(`Connecting with seller ${item.seller}...`, "success");
        });
    },

    bindEvents() {
        // List item btn clicks
        document.getElementById('market-sell-btn').addEventListener('click', () => {
            document.getElementById('marketplace-form').reset();
            window.app.openModal('marketplace-modal');
        });

        // Search inputs
        document.getElementById('market-search-input').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.toLowerCase();
            this.renderMarketGrid();
        });

        // Category & condition dropdown changes
        document.getElementById('market-cat-filter').addEventListener('change', (e) => {
            this.categoryFilter = e.target.value;
            this.renderMarketGrid();
        });

        document.getElementById('market-cond-filter').addEventListener('change', (e) => {
            this.conditionFilter = e.target.value;
            this.renderMarketGrid();
        });
    }
};
export default marketplaceView;
