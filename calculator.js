class WikiStatCalculator {
    constructor() {
        this.suffixes = [
            'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'Ud', 'Dd', 'Td', 'Qad', 'Qid', 'Sxd', 'Spd', 'Ocd', 'Nod',
            'Vg', 'UVg', 'DVg', 'TVg', 'QaVg', 'QiVg', 'SxVg', 'SpVg', 'OcVg', 'NoVg', 'Tg', 'UTg', 'DTg', 'TTg', 'QaTg', 'QiTg', 'SxTg',
            'SpTg', 'OcTg', 'NoTg', 'Qag', 'UQag', 'DQag', 'TQag', 'QaQag', 'QiQag', 'SxQag', 'SpQag', 'OcQag', 'NoQag', 'Qig', 'UQig'
        ];

        this.cooldowns = {
            FS: 0.85,
            BT: 0.85,
            PP: 0.85,
            MS: 0.9,
            JF: 0.5,
            TC: 300,
            TPM: 60,
            UC: 300,
        };

        this.suffixToMultiplier = {};
        this.mapSuffixes();
        this.renderPrefixList();
        this.bindEvents();
    }

    mapSuffixes() {
        this.suffixes.forEach((suffix, index) => {
            this.suffixToMultiplier[suffix] = Math.pow(10, (index + 1) * 3);
        });
    }

    renderPrefixList() {
        const prefixGrid = document.getElementById('prefixGrid');
        if (!prefixGrid) return;
        prefixGrid.innerHTML = '';
        this.suffixes.forEach(suffix => {
            const prefixItem = document.createElement('div');
            prefixItem.className = 'prefix-item';
            prefixItem.textContent = suffix;
            prefixItem.addEventListener('click', () => {
                this.copyToClipboard(suffix);
            });
            prefixGrid.appendChild(prefixItem);
        });
    }

    copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast(`Copied "${text}" to clipboard!`);
            }).catch(() => {
                this.fallbackCopyToClipboard(text);
            });
        } else {
            this.fallbackCopyToClipboard(text);
        }
    }

    fallbackCopyToClipboard(text) {
        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            if (successful) {
                this.showToast(`Copied "${text}" to clipboard!`);
            } else {
                this.showToast('Failed to copy to clipboard');
            }
        } catch (err) {
            this.showToast('Failed to copy to clipboard');
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }

    toNumber(str) {
        if (!str) return NaN;
        if (str == "0") return 0;
        str = str.trim();
        const sortedSuffixes = [...this.suffixes].sort((a, b) => b.length - a.length);
        for (const suffix of sortedSuffixes) {
            if (!str.toLowerCase().endsWith(suffix.toLowerCase())) continue;
            const num = parseFloat(str.slice(0, -suffix.length));
            if (!isNaN(num)) {
                return num * this.suffixToMultiplier[suffix];
            }
        }
        return parseFloat(str) || NaN;
    }

    formatTime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const parts = [];
        if (days > 0) parts.push(`${days} d`);
        if (hours > 0) parts.push(`${hours} h`);
        if (minutes > 0) parts.push(`${minutes} m`);
        parts.push(`${secs} s`);
        return parts.join(' ');
    }

    formatNumber(num) {
        for (let i = this.suffixes.length - 1; i >= 0; i--) {
            const suffix = this.suffixes[i];
            const multiplier = this.suffixToMultiplier[suffix];
            if (num >= multiplier) {
                const value = num / multiplier;
                const decimalPlaces = value >= 1000 ? 0 : value >= 100 ? 1 : 2;
                return value.toFixed(decimalPlaces) + suffix;
            }
        }
        return Math.floor(num).toString();
    }

    showProgressBar(current, target, skill) {
        const resultsBox = document.getElementById('resultsBox');
        if (!resultsBox) return;
        const progress = Math.min((current / target) * 100, 100);
        const gain = this.toNumber(document.getElementById('gain').value);
        const ticks = Math.ceil((target - current) / gain);
        const cooldown = this.cooldowns[skill] || 0.85;
        const totalSeconds = ticks * cooldown;
        const formattedTime = this.formatTime(totalSeconds);
        const progressHTML = `
            <div class="progress-container">
                <div class="progress-stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">Progress to Target</div>
                        <div class="stat-value">${progress.toFixed(1)}%</div>
                        <div class="stat-detail">${this.formatNumber(current)} / ${this.formatNumber(target)}</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Ticks Required</div>
                        <div class="stat-value">${ticks.toLocaleString()}</div>
                        <div class="stat-detail">${cooldown}s cooldown</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">Time Required</div>
                        <div class="stat-value">${formattedTime}</div>
                        <div class="stat-detail">Total duration</div>
                    </div>
                </div>
                <div class="progress-bar-container">
                    <div class="progress-text">${this.formatNumber(current)} -> ${this.formatNumber(target)}</div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                </div>
            </div>
        `;
        const resultsContent = resultsBox.querySelector('.results-content');
        if (resultsContent) {
            resultsContent.innerHTML = progressHTML;
        }
        setTimeout(() => {
            const progressFill = resultsBox.querySelector('.progress-fill');
            if (progressFill) {
                progressFill.style.width = `${progress}%`;
            }
        }, 100);
    }

    calculate() {
        const activeButton = document.querySelector('.skill-button.active');
        const skill = activeButton ? activeButton.getAttribute('data-skill') : 'FS';
        const current = this.toNumber(document.getElementById('current').value);
        const target = this.toNumber(document.getElementById('target').value);
        const gain = this.toNumber(document.getElementById('gain').value);
        
        if (isNaN(current) || isNaN(target) || isNaN(gain)) {
            this.showToast('Please enter valid numbers for all fields');
            return;
        }
        if (target <= current) {
            this.showToast('Target stat must be greater than current stat');
            return;
        }
        if (gain <= 0) {
            this.showToast('Gain per tick must be greater than 0');
            return;
        }
        
        this.showProgressBar(current, target, skill);
    }

    bindEvents() {
        const form = document.getElementById('calculatorForm');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculate();
            });
        }
        
        document.querySelectorAll('.skill-button').forEach(button => {
            button.addEventListener('click', () => {
                document.querySelectorAll('.skill-button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            });
        });
    }
}

// Rune Calculator Class
class WikiRuneCalculator {
    constructor() {
        this.rolls = [
            { name: 'Common', chance: 60, amount: 5 },
            { name: 'Uncommon', chance: 20, amount: 15 },
            { name: 'Rare', chance: 10, amount: 50 },
            { name: 'Epic', chance: 7, amount: 100 },
            { name: 'Legendary', chance: 2.5, amount: 350 },
            { name: 'Mythical', chance: 0.5, amount: 800 },
            { name: 'Ancient', chance: 0.25, amount: 1400 },
            { name: 'Divine', chance: 0.1, amount: 2500 },
            { name: 'Arcanith', chance: 0.05, amount: 6000 },
            { name: 'Cosmic', chance: 0.025, amount: 13000 },
            { name: 'Angelic', chance: 0.015, amount: 20000 },
            { name: 'Demonic', chance: 0.010, amount: 31000 },
        ];

        this.initializeElements();
        this.renderRollList();
        this.bindEvents();
    }

    initializeElements() {
        this.form = document.getElementById('runeCalculatorForm');
        this.resultsBox = document.getElementById('runeResultsBox');
        this.uniCoinsInput = document.getElementById('uniCoins');
        this.runeAmountInput = document.getElementById('runeAmount');
    }

    renderRollList() {
        const rollsGrid = document.getElementById('runesGrid');
        if (!rollsGrid) return;
        rollsGrid.innerHTML = '';
        this.rolls.forEach(rarity => {
            const item = document.createElement('div');
            item.className = 'odds-item';
            const tier = document.createElement('span');
            tier.className = `odds-tier ${rarity.name.toLowerCase()}`;
            tier.textContent = rarity.name;
            const multi = document.createElement('span');
            multi.className = 'odds-multi';
            multi.textContent = `+${rarity.amount}x`;
            const chance = document.createElement('span');
            chance.className = 'odds-chance';
            chance.textContent = `${rarity.chance}%`;

            item.appendChild(tier);
            item.appendChild(multi);
            item.appendChild(chance);
            rollsGrid.appendChild(item);
        });
    }

    bindEvents() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.calculateRuneMultiplier();
            });
        }

        // Universal Coins conversion logic
        if (this.uniCoinsInput && this.runeAmountInput) {
            this.uniCoinsInput.addEventListener('input', () => {
                this.handleUniCoinsInput();
            });

            this.runeAmountInput.addEventListener('input', () => {
                this.handleRunesInput();
            });
        }
    }

    handleUniCoinsInput() {
        const uniCoinsValue = this.uniCoinsInput.value.trim();
        
        if (uniCoinsValue === '') {
            // If Universal Coins is cleared, unlock runes field
            this.runeAmountInput.disabled = false;
            this.runeAmountInput.style.opacity = '1';
            this.runeAmountInput.placeholder = 'e.g. 2.5M';
        } else {
            // Convert Universal Coins to Runes (1 Universal Coin = 3 Runes)
            const uniCoinsAmount = this.parseNumber(uniCoinsValue);
            const runesFromCoins = uniCoinsAmount * 3;
            
            // Lock runes field and show converted value
            this.runeAmountInput.disabled = true;
            this.runeAmountInput.style.opacity = '0.6';
            this.runeAmountInput.value = this.formatNumber(runesFromCoins);
            this.runeAmountInput.placeholder = 'Auto-calculated from Universal Coins';
        }
    }

    handleRunesInput() {
        // If someone manually enters runes, clear Universal Coins
        if (!this.runeAmountInput.disabled && this.runeAmountInput.value.trim() !== '') {
            this.uniCoinsInput.value = '';
        }
    }

    parseNumber(value) {
        if (!value) return 0;
        
        const cleanValue = value.toString().replace(/,/g, '').trim();
        const lastChar = cleanValue.slice(-1).toUpperCase();
        const numericPart = parseFloat(cleanValue.slice(0, -1));
        
        if (isNaN(numericPart) && isNaN(parseFloat(cleanValue))) {
            return 0;
        }
        
        if (isNaN(numericPart)) {
            return parseFloat(cleanValue);
        }
        
        const multipliers = {
            'K': 1000,
            'M': 1000000,
            'B': 1000000000,
            'T': 1000000000000,
            'Qa': 1000000000000000,
            'Qi': 1000000000000000000,
            'Sx': 1000000000000000000000,
            'Sp': 1000000000000000000000000,
            'Oc': 1000000000000000000000000000,
            'No': 1000000000000000000000000000000,
            'Dc': 1000000000000000000000000000000000
        };
        
        return multipliers[lastChar] ? numericPart * multipliers[lastChar] : parseFloat(cleanValue);
    }

    formatNumber(num) {
        if (num < 1000) return num.toFixed(2);
        if (num < 1000000) return (num / 1000).toFixed(2) + 'K';
        if (num < 1000000000) return (num / 1000000).toFixed(2) + 'M';
        if (num < 1000000000000) return (num / 1000000000).toFixed(2) + 'B';
        if (num < 1000000000000000) return (num / 1000000000000).toFixed(2) + 'T';
        if (num < 1000000000000000000) return (num / 1000000000000000).toFixed(2) + 'Qa';
        if (num < 1000000000000000000000) return (num / 1000000000000000000).toFixed(2) + 'Qi';
        if (num < 1000000000000000000000000) return (num / 1000000000000000000000).toFixed(2) + 'Sx';
        if (num < 1000000000000000000000000000) return (num / 1000000000000000000000000).toFixed(2) + 'Sp';
        if (num < 1000000000000000000000000000000) return (num / 1000000000000000000000000000).toFixed(2) + 'Oc';
        if (num < 1000000000000000000000000000000000) return (num / 1000000000000000000000000000000).toFixed(2) + 'No';
        return (num / 1000000000000000000000000000000000).toFixed(2) + 'Dc';
    }

    calculateRuneMultiplier() {
        // Get runes amount from either direct input or Universal Coins conversion
        let runeAmount;
        const uniCoinsValue = this.uniCoinsInput.value.trim();
        const runesValue = this.runeAmountInput.value.trim();
        
        if (uniCoinsValue !== '') {
            // Using Universal Coins - convert to runes
            const uniCoinsAmount = this.parseNumber(uniCoinsValue);
            runeAmount = uniCoinsAmount * 3; // 1 Universal Coin = 3 Runes
        } else {
            // Using direct runes input
            runeAmount = this.parseNumber(runesValue);
        }
        
        if (runeAmount <= 0) {
            this.resultsBox.querySelector('.rune-results-content').innerHTML = 
                '<p class="results-placeholder">Please enter a valid amount.</p>';
            return;
        }

        // Constants based on expected values
        const MULTIPLIER_PER_RUNE = 0.172; // 43x per roll / 250 runes per roll
        const RUNES_PER_ROLL = 250;
        
        // Calculations
        const totalRolls = Math.floor(runeAmount / RUNES_PER_ROLL);
        let expectedMultiplier = runeAmount * MULTIPLIER_PER_RUNE;
        const leftoverRunes = runeAmount % RUNES_PER_ROLL;

        if (totalRolls < 1) {
            expectedMultiplier = 0;
        }

        // Prepare input display based on source
        let inputDisplay = '';
        if (uniCoinsValue !== '') {
            inputDisplay = `
                <div class="rune-stat-card">
                    <div class="rune-stat-label">Universal Coins</div>
                    <div class="rune-stat-value">${this.formatNumber(this.parseNumber(uniCoinsValue))}</div>
                    <div class="rune-stat-detail">= ${this.formatNumber(runeAmount)} runes</div>
                </div>`;
        } else {
            inputDisplay = `
                <div class="rune-stat-card">
                    <div class="rune-stat-label">Input Runes</div>
                    <div class="rune-stat-value">${this.formatNumber(runeAmount)}</div>
                </div>`;
        }
        
        // Display results
        this.resultsBox.querySelector('.rune-results-content').innerHTML = `
            ${inputDisplay}
            <div class="rune-stat-card">
                <div class="rune-stat-label">Total Rolls</div>
                <div class="rune-stat-value">${this.formatNumber(totalRolls)}</div>
                <div class="rune-stat-detail">${this.formatNumber(leftoverRunes)} runes left</div>
            </div>
            <div class="rune-stat-card">
                <div class="rune-stat-label">Expected Multiplier</div>
                <div class="rune-stat-value">+${this.formatNumber(expectedMultiplier)}</div>
                <div class="rune-stat-detail">Based on 43x per roll average</div>
            </div>
        `;
    }
}

// Initialize calculator when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WikiStatCalculator();
    new WikiRuneCalculator();
}); 