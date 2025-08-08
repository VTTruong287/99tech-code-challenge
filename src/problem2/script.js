// Constants and Configuration
const CacheKey = {
    PRICES: 'prices'
};

const PRICES_DATA_URL = 'https://interview.switcheo.com/prices.json';

// State Management
let isReady = false;
let priceData = [];
let tokenList = [];
let selectedFromToken = 'USDC';
let selectedToToken = 'ETH';
// Simulate user balances - in real app this would come from wallet
let userBalances = {
    'USDC': new BigNumber('1000.00'),
    'USDT': new BigNumber('500.00'),
    'ETH': new BigNumber('2.5'),
    'WBTC': new BigNumber('0.1')
}

// Popular tokens for quick access
const popularTokens = [
    'USDC', 'USDT', 'ETH', 'WBTC'
];

// Initialize the application
const initialize = async () => {
    await loadData();
    setupEventListeners();
    populateTokenList();
    updateBalances();
    updateExchangeInfo();
};

// Load price data from API
const loadData = async () => {
    try {
        const cachedData = getCachedLocalData(CacheKey.PRICES);
        
        // Refresh data if cached data is older than 1 hour
        if (cachedData && new Date(cachedData.date) > new Date(Date.now() - 1 * 60 * 60 * 1000)) {
            priceData = cachedData.data;
            isReady = true;
            return cachedData.data;
        }

        const response = await fetch(PRICES_DATA_URL);
        if (!response.ok) {
            throw new Error('Failed to load price data');
        }

        const data = await response.json();
        priceData = data;
        cacheLocalData(data, CacheKey.PRICES);
        isReady = true;

        return data;
    } catch (error) {
        console.error('Error loading data:', error);
        showNotification('Failed to load price data. Using cached data.', 'warning');
        
        // Fallback to cached data
        const cachedData = getCachedLocalData(CacheKey.PRICES);
        if (cachedData) {
            priceData = cachedData.data;
            isReady = true;
        }
    }
};

// Cache data in localStorage
const cacheLocalData = (data, key) => {
    const cacheData = {
        data: data,
        date: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
};

// Get cached data from localStorage
const getCachedLocalData = (key) => {
    const cached = localStorage.getItem(key);
    return cached ? JSON.parse(cached) : null;
};

// Setup all event listeners
const setupEventListeners = () => {
    // Token selectors
    document.getElementById('from-token-selector').addEventListener('click', () => openTokenModal('from'));
    document.getElementById('to-token-selector').addEventListener('click', () => openTokenModal('to'));
    
    // Swap direction button
    document.getElementById('swap-direction-btn').addEventListener('click', swapTokens);
    
    // Amount inputs
    document.getElementById('input-amount').addEventListener('input', handleAmountInput);
    document.getElementById('max-from-btn').addEventListener('click', setMaxAmount);
    
    // Swap button
    document.getElementById('swap-button').addEventListener('click', executeSwap);
    
    // Modal events
    document.getElementById('modal-close').addEventListener('click', closeTokenModal);
    document.getElementById('token-search').addEventListener('input', filterTokens);
    
    // Success modal
    document.getElementById('close-success-btn').addEventListener('click', closeSuccessModal);
    
    // Close modals on overlay click
    document.getElementById('token-modal').addEventListener('click', (e) => {
        if (e.target.id === 'token-modal') closeTokenModal();
    });
    
    document.getElementById('success-modal').addEventListener('click', (e) => {
        if (e.target.id === 'success-modal') closeSuccessModal();
    });
};

// Populate token list from available tokens
const populateTokenList = () => {
    if (!priceData || priceData.length === 0) return;
    
    // Create token list from price data
    tokenList = priceData.map(item => ({
        currency: item.currency,
        price: item.price,
        date: item.date
    })).filter(token => token.price > 0); // Only tokens with valid prices
    
    // Sort by popularity and price
    tokenList.sort((a, b) => {
        const aPopular = popularTokens.includes(a.currency);
        const bPopular = popularTokens.includes(b.currency);
        
        if (aPopular && !bPopular) return -1;
        if (!aPopular && bPopular) return 1;
        
        return b.price - a.price; // Better price first
    });
};

// Update user balances (simulated)
const updateBalances = () => {
    // Update balance displays
    document.getElementById('from-balance').textContent = 
        formatNumber(userBalances[selectedFromToken] || new BigNumber(0));
    document.getElementById('to-balance').textContent = 
        formatNumber(userBalances[selectedToToken] || new BigNumber(0));
};

// Update exchange rate and price impact
const updateExchangeInfo = () => {
    const fromToken = priceData.find(t => t.currency === selectedFromToken);
    const toToken = priceData.find(t => t.currency === selectedToToken);
    
    if (!fromToken || !toToken) {
        hideExchangeInfo();
        return;
    }
    
    // Fix: Correct exchange rate calculation
    // If ETH price = 1645.93 and USDC price = 1, then 1 ETH = 1645.93 USDC
    // So exchange rate = fromToken.price / toToken.price
    const exchangeRate = new BigNumber(fromToken.price).dividedBy(toToken.price);
    const inputAmount = new BigNumber(document.getElementById('input-amount').value || 0);
    
    if (inputAmount.gt(0)) {
        const outputAmount = inputAmount.times(exchangeRate);
        document.getElementById('output-amount').value = formatNumber(outputAmount);
        
        // Calculate price impact (simplified)
        const priceImpact = calculatePriceImpact(inputAmount.toNumber(), selectedFromToken);
        
        // Update exchange info
        document.getElementById('exchange-rate').textContent = 
            `1 ${selectedFromToken} = ${formatNumber(exchangeRate)} ${selectedToToken}`;
        
        const impactElement = document.getElementById('price-impact');
        impactElement.textContent = `${priceImpact.toFixed(2)}%`;
        impactElement.className = getImpactClass(priceImpact);
        
        showExchangeInfo();
        updateSwapButton(inputAmount.toNumber());
    } else {
        document.getElementById('output-amount').value = '';
        hideExchangeInfo();
        updateSwapButton(0);
    }
};

// Calculate price impact (simplified simulation)
const calculatePriceImpact = (amount, token) => {
    // Simulate price impact based on amount and token
    const baseImpact = 0.01; // 0.01% base impact
    const amountFactor = Math.min(amount / 1000, 1); // Higher amounts = higher impact
    return baseImpact + (amountFactor * 0.1); // Max 0.11% impact
};

// Get CSS class for price impact
const getImpactClass = (impact) => {
    if (impact < 0.05) return 'impact-low';
    if (impact < 0.1) return 'impact-medium';
    return 'impact-high';
};

// Show/hide exchange info
const showExchangeInfo = () => {
    document.getElementById('exchange-info').style.display = 'block';
};

const hideExchangeInfo = () => {
    document.getElementById('exchange-info').style.display = 'none';
};

// Update swap button state
const updateSwapButton = (amount) => {
    const button = document.getElementById('swap-button');
    const buttonText = button.querySelector('.button-text');
    
    const amountBN = new BigNumber(amount);
    const balanceBN = userBalances[selectedFromToken] || new BigNumber(0);
    
    if (amountBN.lte(0)) {
        button.disabled = true;
        buttonText.textContent = 'Enter an amount';
    } else if (amountBN.gt(balanceBN)) {
        button.disabled = true;
        buttonText.textContent = 'Insufficient balance';
    } else {
        button.disabled = false;
        buttonText.textContent = 'Swap';
    }
};

// Handle amount input
const handleAmountInput = (e) => {
    const value = parseFloat(e.target.value);
    if (value < 0) {
        e.target.value = '';
    }
    updateExchangeInfo();
};

// Set maximum amount
const setMaxAmount = () => {
    const maxAmount = userBalances[selectedFromToken] || new BigNumber(0);
    document.getElementById('input-amount').value = formatNumber(maxAmount);
    updateExchangeInfo();
};

// Swap token positions
const swapTokens = () => {
    const temp = selectedFromToken;
    selectedFromToken = selectedToToken;
    selectedToToken = temp;
    
    updateTokenDisplay();
    updateBalances();
    updateExchangeInfo();
};

// Update token display
const updateTokenDisplay = () => {
    // Update from token
    document.getElementById('from-token-icon').src = `tokens/${selectedFromToken}.svg`;
    document.getElementById('from-token-symbol').textContent = selectedFromToken;
    
    // Update to token
    document.getElementById('to-token-icon').src = `tokens/${selectedToToken}.svg`;
    document.getElementById('to-token-symbol').textContent = selectedToToken;
};

// Open token selection modal
const openTokenModal = (type) => {
    const modal = document.getElementById('token-modal');
    modal.dataset.type = type;
    modal.style.display = 'flex';
    
    // Populate token list
    populateModalTokenList();
    
    // Focus search input
    setTimeout(() => {
        document.getElementById('token-search').focus();
    }, 100);
};

// Close token selection modal
const closeTokenModal = () => {
    document.getElementById('token-modal').style.display = 'none';
    document.getElementById('token-search').value = '';
    filterTokens(); // Reset filter
};

// Populate modal token list
const populateModalTokenList = () => {
    const tokenListElement = document.getElementById('token-list');
    const type = document.getElementById('token-modal').dataset.type;
    const currentToken = type === 'from' ? selectedFromToken : selectedToToken;
    
    tokenListElement.innerHTML = '';
    
    tokenList.forEach(token => {
        const tokenItem = document.createElement('div');
        tokenItem.className = 'token-item';
        if (token.currency === currentToken) {
            tokenItem.classList.add('selected');
        }
        
        // Get user balance for this token
        const userBalance = userBalances[token.currency] || new BigNumber(0);
        const balanceFormatted = formatNumber(userBalance);
        
        tokenItem.innerHTML = `
            <img src="tokens/${token.currency}.svg" alt="${token.currency}" 
                 onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiNFNUU3RUIiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIGZpbGw9IiM5Q0EzQUYiPgo8cGF0aCBkPSJNMTYgNkMxMC40NzcgNiA2IDEwLjQ3NyA2IDE2QzYgMjEuNTIzIDEwLjQ3NyAyNiAxNiAyNkMyMS41MjMgMjYgMjYgMjEuNTIzIDI2IDE2QzI2IDEwLjQ3NyAyMS41MjMgMTYgMTYgMTZaIi8+Cjwvc3ZnPgo8L3N2Zz4K'">
            <div class="token-info">
                <div class="token-name">${token.currency}</div>
                <div class="token-symbol">${token.currency}</div>
            </div>
            <div class="token-details">
                <div class="token-price">$${formatNumber(token.price)}</div>
                <div class="token-balance">Balance: ${balanceFormatted}</div>
            </div>
        `;
        
        tokenItem.addEventListener('click', () => selectToken(token.currency, type));
        tokenListElement.appendChild(tokenItem);
    });
};

// Select token from modal
const selectToken = (token, type) => {
    if (type === 'from') {
        selectedFromToken = token;
    } else {
        selectedToToken = token;
    }
    
    updateTokenDisplay();
    updateBalances();
    updateExchangeInfo();
    closeTokenModal();
};

// Filter tokens in modal
const filterTokens = () => {
    const searchTerm = document.getElementById('token-search').value.toLowerCase();
    const tokenItems = document.querySelectorAll('.token-item');
    
    tokenItems.forEach(item => {
        const tokenName = item.querySelector('.token-name').textContent.toLowerCase();
        const tokenSymbol = item.querySelector('.token-symbol').textContent.toLowerCase();
        
        if (tokenName.includes(searchTerm) || tokenSymbol.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
};

// Execute swap
const executeSwap = async () => {
    const amount = new BigNumber(document.getElementById('input-amount').value || 0);
    const balanceBN = userBalances[selectedFromToken] || new BigNumber(0);
    
    if (amount.lte(0) || amount.gt(balanceBN)) {
        return;
    }
    
    // Show loading state
    const button = document.getElementById('swap-button');
    const buttonText = button.querySelector('.button-text');
    const originalText = buttonText.textContent;
    
    button.classList.add('loading');
    buttonText.textContent = 'Processing...';
    button.disabled = true;
    
    document.getElementById('loading-overlay').style.display = 'flex';
    
    try {
        // Simulate swap processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update balances using BigNumber
        userBalances[selectedFromToken] = balanceBN.minus(amount);
        
        const fromToken = priceData.find(t => t.currency === selectedFromToken);
        const toToken = priceData.find(t => t.currency === selectedToToken);
        const exchangeRate = new BigNumber(fromToken.price).dividedBy(toToken.price);
        const receivedAmount = amount.times(exchangeRate);
        
        userBalances[selectedToToken] = (userBalances[selectedToToken] || new BigNumber(0)).plus(receivedAmount);
        
        // Update displays
        updateBalances();
        updateTokenDisplay();
        
        // Show success modal
        showSuccessModal(amount, receivedAmount);
        
        // Reset form
        document.getElementById('input-amount').value = '';
        document.getElementById('output-amount').value = '';
        updateExchangeInfo();
        
    } catch (error) {
        console.error('Swap failed:', error);
        showNotification('Swap failed. Please try again.', 'error');
    } finally {
        // Reset button state
        button.classList.remove('loading');
        buttonText.textContent = originalText;
        button.disabled = false;
        document.getElementById('loading-overlay').style.display = 'none';
    }
};

// Show success modal
const showSuccessModal = (fromAmount, toAmount) => {
    const modal = document.getElementById('success-modal');
    const txHash = generateTransactionHash();
    
    document.getElementById('tx-hash').textContent = txHash;
    document.getElementById('swap-amount').textContent = 
        `${formatNumber(fromAmount)} ${selectedFromToken} → ${formatNumber(toAmount)} ${selectedToToken}`;
    
    modal.style.display = 'flex';
};

// Close success modal
const closeSuccessModal = () => {
    document.getElementById('success-modal').style.display = 'none';
};

// Generate random transaction hash
const generateTransactionHash = () => {
    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) {
        hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return hash.substring(0, 10) + '...' + hash.substring(54);
};

// Format number for display
const formatNumber = (num) => {
    // Handle BigNumber objects
    if (num instanceof BigNumber) {
        num = num.toNumber();
    }
    
    if (num === 0) return '0.00';
    if (num < 0.01) return num.toFixed(6);
    if (num < 1) return num.toFixed(4);
    if (num < 1000) return num.toFixed(2);
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

// Show notification
const showNotification = (message, type = 'info') => {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}</span>
            <span class="notification-message">${message}</span>
            <button class="notification-close">×</button>
        </div>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#fef2f2' : type === 'warning' ? '#fffbeb' : '#eff6ff'};
        color: ${type === 'error' ? '#dc2626' : type === 'warning' ? '#d97706' : '#2563eb'};
        border: 1px solid ${type === 'error' ? '#fecaca' : type === 'warning' ? '#fed7aa' : '#bfdbfe'};
        border-radius: 12px;
        padding: 1rem 1.5rem;
        box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        font-family: inherit;
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }
        .notification-close {
            background: none;
            border: none;
            font-size: 1.25rem;
            cursor: pointer;
            margin-left: auto;
            color: inherit;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .notification-close:hover {
            opacity: 0.7;
        }
    `;
    document.head.appendChild(style);
    
    // Add close functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.remove();
    });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
    
    document.body.appendChild(notification);
};

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', initialize);