document.addEventListener('DOMContentLoaded', function() {
    const loadingScreen = document.getElementById('loadingScreen');
    const body = document.body;
    const container = document.querySelector('.container');
    // Start fading after 0.2 seconds
    setTimeout(function() {
        // Fade out loading screen
        loadingScreen.classList.add('fade-out');
        // Remove loading class from body and show content
        body.classList.remove('loading');
        container.classList.remove('loading');
        container.classList.add('loaded');
        // Remove loading screen from DOM after fade out
        setTimeout(function() {
            loadingScreen.remove();
        }, 800);
    }, 200);
});

// Header fade out on scroll
document.addEventListener('DOMContentLoaded', function() {
    const header = document.querySelector('.header');
    let lastScrollTop = 0;
    const scrollThreshold = 100; // Start hiding after 100px scroll
    window.addEventListener('scroll', function() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (scrollTop > scrollThreshold) {
            if (scrollTop > lastScrollTop) {
                // Scrolling down - hide header
                header.classList.add('hidden');
            } else {
                // Scrolling up - show header
                header.classList.remove('hidden');
            }
        } else {
            // Near top - always show header
            header.classList.remove('hidden');
        }
        lastScrollTop = scrollTop;
    });
});

document.addEventListener('DOMContentLoaded', () => {
    new BackgroundThemeManager();
});

// --- Background Theme Manager ---
class BackgroundThemeManager {
    constructor() {
        this.themes = {
            default: 'bg-theme-default',
            dark: 'bg-theme-dark'
        };
        this.currentTheme = localStorage.getItem('backgroundTheme') || 'default';
        this.toggleButton = document.getElementById('background-theme-toggle');
        this.body = document.body;
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        if (this.toggleButton) {
            this.toggleButton.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTheme();
            });
        }
    }

    applyTheme(themeName) {
        // Remove all theme classes
        Object.values(this.themes).forEach(themeClass => {
            this.body.classList.remove(themeClass);
        });
        
        // Add the current theme class
        this.body.classList.add(this.themes[themeName]);
        
        // Store preference
        localStorage.setItem('backgroundTheme', themeName);
        this.currentTheme = themeName;
        
        // Update button icon based on theme
        this.updateButtonIcon(themeName);
    }

    updateButtonIcon(themeName) {
        if (this.toggleButton) {
            const icon = this.toggleButton.querySelector('i');
            if (icon) {
                if (themeName === 'dark') {
                    icon.className = 'fas fa-sun';
                    this.toggleButton.title = 'Switch to light background';
                } else {
                    icon.className = 'fas fa-paint-brush';
                    this.toggleButton.title = 'Switch to dark background';
                }
            }
        }
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'default' ? 'dark' : 'default';
        this.applyTheme(newTheme);
    }
}


// --- Online Users Heartbeat Logic ---
class WikiUserHeartbeat {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.serverUrl = window.location.origin;
        this.heartbeatInterval = null;
        this.onlineCountElement = null;
        this.isActive = true;
        this.checkExistingTabs();
        this.init();
    }
    checkExistingTabs() {
        const activeTabs = JSON.parse(localStorage.getItem('wiki_active_tabs') || '[]');
        const now = Date.now();
        const validTabs = activeTabs.filter(tab => now - tab.timestamp < 10000);
        const existingTab = validTabs.find(tab => tab.sessionId === this.sessionId);
        if (existingTab) {
            this.isActive = false;
            return;
        }
        validTabs.push({
            sessionId: this.sessionId,
            timestamp: now,
            url: window.location.href
        });
        localStorage.setItem('wiki_active_tabs', JSON.stringify(validTabs));
        window.addEventListener('beforeunload', () => {
            this.removeTab();
        });
        setInterval(() => {
            this.cleanupOldTabs();
        }, 5000);
    }
    removeTab() {
        const activeTabs = JSON.parse(localStorage.getItem('wiki_active_tabs') || '[]');
        const updatedTabs = activeTabs.filter(tab => tab.sessionId !== this.sessionId);
        localStorage.setItem('wiki_active_tabs', JSON.stringify(updatedTabs));
    }
    cleanupOldTabs() {
        const activeTabs = JSON.parse(localStorage.getItem('wiki_active_tabs') || '[]');
        const now = Date.now();
        const validTabs = activeTabs.filter(tab => now - tab.timestamp < 10000);
        localStorage.setItem('wiki_active_tabs', JSON.stringify(validTabs));
    }
    generateSessionId() {
        let sharedId = localStorage.getItem('wiki_shared_session_id');
        if (!sharedId) {
            sharedId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('wiki_shared_session_id', sharedId);
        }
        return sharedId;
    }
    init() {
        this.startHeartbeat();
        this.updateOnlineCountDisplay();
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.isActive = false;
            } else {
                this.isActive = true;
                this.sendHeartbeat();
            }
        });
        window.addEventListener('beforeunload', () => {
            this.isActive = false;
        });
        setInterval(() => {
            this.updateOnlineCountDisplay();
        }, 1000);
    }
    startHeartbeat() {
        this.sendHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.isActive) {
                this.sendHeartbeat();
            }
        }, 1000);
    }
    async sendHeartbeat() {
        try {
            await fetch(`${this.serverUrl}/api/heartbeat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sessionId: this.sessionId
                })
            });
        } catch (error) {}
    }
    async updateOnlineCountDisplay() {
        try {
            const response = await fetch(`${this.serverUrl}/api/online-count`);
            if (response.ok) {
                const data = await response.json();
                this.updateOnlineCountElement(data.onlineCount);
            }
        } catch (error) {
            this.updateOnlineCountElement('?');
        }
    }
    updateOnlineCountElement(count) {
        if (!this.onlineCountElement) {
            this.onlineCountElement = document.getElementById('online-users-count');
        }
        if (this.onlineCountElement) {
            this.onlineCountElement.textContent = count;
            if (count === '?') {
                this.onlineCountElement.classList.add('offline');
                this.onlineCountElement.classList.remove('online');
            } else {
                this.onlineCountElement.classList.add('online');
                this.onlineCountElement.classList.remove('offline');
            }
        }
    }
}
document.addEventListener('DOMContentLoaded', () => {
    if (!window.wikiHeartbeat) {
        window.wikiHeartbeat = new WikiUserHeartbeat();
    }
}); 