/**
 * Career Guide Chatbot - Frontend Application
 * 
 * A static frontend that communicates with the career recommendation backend API.
 * This file can be hosted on GitHub Pages, Netlify, or any static hosting provider.
 */

// ============================================
// API CONFIGURATION
// ============================================
// 
// Change this URL to point to your backend:
// - Local development: 'http://localhost:5001'
// - ngrok tunnel: 'https://your-tunnel-id.ngrok.io'
// - Hosted backend: 'https://your-backend.railway.app'
//
const API_URL = 'https://career-chatbot-backend-v2.onrender.com';

// API endpoint (constructed from base URL)
const RECOMMEND_ENDPOINT = `${API_URL}/recommend`;
const HEALTH_ENDPOINT = `${API_URL}/health`;

// ============================================
// STATE MANAGEMENT
// ============================================

const chatMessages = document.getElementById('chat-messages');
const inputArea = document.getElementById('input-area');

// Chat state machine
let currentState = 'INIT'; // INIT, SALARY, HORIZON, RISK, SKILLS, LOADING, DONE

// User's collected answers
const userAnswers = {
    salary_range: null,
    time_horizon: null,
    risk_appetite: null,
    skills: null
};

// Question definitions
const questions = {
    SALARY: {
        text: "What salary range are you targeting?",
        subtext: "Select based on your expected annual compensation:",
        options: [
            { value: "entry", label: "Entry Level", description: "0-6 LPA" },
            { value: "growth", label: "Growth", description: "6-12 LPA" },
            { value: "premium", label: "Premium", description: "12+ LPA" }
        ]
    },
    HORIZON: {
        text: "What's your time horizon?",
        subtext: "When do you want to achieve this salary?",
        options: [
            { value: "immediate", label: "Immediate", description: "Right now" },
            { value: "mid_term", label: "Mid-Term", description: "2-5 years" },
            { value: "long_term", label: "Long-Term", description: "5+ years" }
        ]
    },
    RISK: {
        text: "What's your risk appetite?",
        subtext: "How much career volatility can you handle?",
        options: [
            { value: "low", label: "Low Risk", description: "Stable & secure" },
            { value: "medium", label: "Medium Risk", description: "Balanced" },
            { value: "high", label: "High Risk", description: "High reward" }
        ]
    }
};

// ============================================
// BACKEND CONNECTIVITY CHECK
// ============================================

/**
 * Check if the backend is reachable
 * Updates the connection status indicator
 */
async function checkBackendHealth() {
    const statusEl = document.getElementById('connection-status');
    if (!statusEl) return;

    try {
        const response = await fetch(HEALTH_ENDPOINT, {
            method: 'GET',
            mode: 'cors'
        });

        if (response.ok) {
            statusEl.className = 'connection-status connected';
            statusEl.innerHTML = '<span class="status-dot"></span>Backend Connected';
        } else {
            throw new Error('Backend not responding');
        }
    } catch (error) {
        statusEl.className = 'connection-status disconnected';
        statusEl.innerHTML = '<span class="status-dot"></span>Backend Offline';
    }
}

// Check backend health on page load
document.addEventListener('DOMContentLoaded', () => {
    checkBackendHealth();
    // Re-check every 30 seconds
    setInterval(checkBackendHealth, 30000);
});

// ============================================
// CHAT FLOW FUNCTIONS
// ============================================

/**
 * Start the chat flow
 */
function startChat() {
    console.log('[DEBUG] startChat() called');
    inputArea.innerHTML = '';
    askNextQuestion('SALARY');
}

/**
 * Ask the next question in sequence
 */
function askNextQuestion(stage) {
    console.log('[DEBUG] askNextQuestion() called with stage:', stage);
    currentState = stage;
    const q = questions[stage];

    // Add bot message with question
    addBotMessage(`<p><strong>${q.text}</strong></p><p class="subtext">${q.subtext}</p>`);

    // Render option buttons after a short delay
    setTimeout(() => {
        console.log('[DEBUG] Rendering options for stage:', stage);
        renderOptions(q.options);
    }, 300);
}

/**
 * Handle option button click
 */
function handleOptionClick(value, label) {
    console.log('[DEBUG] handleOptionClick() called with value:', value, 'label:', label);
    console.log('[DEBUG] Current state:', currentState);

    // Show user's selection
    addUserMessage(label);

    // Clear options
    inputArea.innerHTML = '';

    // Store answer and proceed
    if (currentState === 'SALARY') {
        userAnswers.salary_range = value;
        console.log('[DEBUG] Stored salary_range:', value, '-> Moving to HORIZON');
        setTimeout(() => askNextQuestion('HORIZON'), 400);
    } else if (currentState === 'HORIZON') {
        userAnswers.time_horizon = value;
        console.log('[DEBUG] Stored time_horizon:', value, '-> Moving to RISK');
        setTimeout(() => askNextQuestion('RISK'), 400);
    } else if (currentState === 'RISK') {
        userAnswers.risk_appetite = value;
        console.log('[DEBUG] Stored risk_appetite:', value, '-> Moving to SKILLS');
        setTimeout(() => askForSkills(), 400);
    } else {
        console.error('[DEBUG] ERROR: Unknown state:', currentState);
    }
}

/**
 * Ask for skills/interests with free-text input
 */
function askForSkills() {
    console.log('[DEBUG] askForSkills() called');
    currentState = 'SKILLS';

    // Add bot message asking for skills
    addBotMessage(`
        <p><strong>What are your skills and interests?</strong></p>
        <p class="subtext">Describe your abilities, experience, or what you enjoy doing:</p>
    `);

    // Render text input after a short delay
    setTimeout(() => {
        console.log('[DEBUG] Rendering skills input field');
        renderSkillsInput();
    }, 300);
}

/**
 * Render text input for skills
 */
function renderSkillsInput() {
    inputArea.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'text-input-container';

    const input = document.createElement('input');
    input.type = 'text';
    input.id = 'skills-input';
    input.className = 'skills-input';
    input.placeholder = 'e.g., Python, data analysis, problem solving, communication...';
    input.maxLength = 500;

    const submitBtn = document.createElement('button');
    submitBtn.className = 'submit-btn';
    submitBtn.innerHTML = '<span>→</span>';
    submitBtn.onclick = handleSkillsSubmit;

    // Allow Enter key to submit
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleSkillsSubmit();
        }
    });

    container.appendChild(input);
    container.appendChild(submitBtn);
    inputArea.appendChild(container);

    // Focus the input
    input.focus();
}

/**
 * Handle skills submission
 */
function handleSkillsSubmit() {
    const input = document.getElementById('skills-input');
    const skillsText = input ? input.value.trim() : '';

    console.log('[DEBUG] handleSkillsSubmit() called with skills:', skillsText);

    if (!skillsText) {
        // Shake the input if empty
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
        return;
    }

    // Show user's input
    addUserMessage(skillsText);

    // Store skills and submit
    userAnswers.skills = skillsText;
    console.log('[DEBUG] Final userAnswers:', JSON.stringify(userAnswers));

    // Clear input area and submit
    inputArea.innerHTML = '';
    submitData();
}

// ============================================
// UI RENDERING FUNCTIONS
// ============================================

/**
 * Render option buttons in the input area
 */
function renderOptions(options) {
    inputArea.innerHTML = '';

    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerHTML = `
            <span class="option-label">${opt.label}</span>
        `;
        btn.title = opt.description;
        btn.onclick = () => handleOptionClick(opt.value, opt.label);
        inputArea.appendChild(btn);
    });
}

/**
 * Add a bot message to the chat
 */
function addBotMessage(html, extraClass = '') {
    const div = document.createElement('div');
    div.className = `message bot-message ${extraClass}`;
    div.innerHTML = `<div class="message-content">${html}</div>`;
    chatMessages.appendChild(div);
    scrollToBottom();
}

/**
 * Add a user message to the chat
 */
function addUserMessage(text) {
    const div = document.createElement('div');
    div.className = 'message user-message';
    div.innerHTML = `<div class="message-content"><p>${escapeHtml(text)}</p></div>`;
    chatMessages.appendChild(div);
    scrollToBottom();
}

/**
 * Show loading indicator
 */
function showLoading() {
    const div = document.createElement('div');
    div.className = 'message bot-message loading-message';
    div.id = 'loading-indicator';
    div.innerHTML = `
        <div class="message-content">
            <span>Analyzing career data</span>
            <div class="loading-dots">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;
    chatMessages.appendChild(div);
    scrollToBottom();
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    const loader = document.getElementById('loading-indicator');
    if (loader) {
        loader.remove();
    }
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================
// API COMMUNICATION
// ============================================

/**
 * Submit data to backend API
 */
async function submitData() {
    currentState = 'LOADING';
    showLoading();

    // Debug: Log the payload being sent
    console.log('=== API REQUEST ===');
    console.log('Endpoint:', RECOMMEND_ENDPOINT);
    console.log('Payload:', JSON.stringify(userAnswers, null, 2));

    try {
        const response = await fetch(RECOMMEND_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userAnswers)
        });

        hideLoading();

        // Debug: Log response status
        console.log('Response status:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.log('Error response:', errorData);
            throw new Error(errorData.error || `Server error: ${response.status}`);
        }

        const data = await response.json();

        // Debug: Log the full response
        console.log('=== API RESPONSE ===');
        console.log('Data:', JSON.stringify(data, null, 2));
        console.log('Careers count:', data.recommended_careers ? data.recommended_careers.length : 0);

        displayResults(data);
        currentState = 'DONE';

    } catch (error) {
        hideLoading();
        console.error('=== API ERROR ===', error);

        // Determine if it's a network error (backend offline) or other error
        if (error.message === 'Failed to fetch' || error.name === 'TypeError') {
            displayBackendOfflineError();
        } else {
            displayError(error.message);
        }

        // Add retry button
        const retryBtn = document.createElement('button');
        retryBtn.className = 'primary-btn';
        retryBtn.innerHTML = '<span>Retry</span>';
        retryBtn.onclick = submitData;
        inputArea.appendChild(retryBtn);
    }
}

// ============================================
// RESULTS DISPLAY
// ============================================

/**
 * Display recommendation results
 */
function displayResults(data) {
    // Show feasibility note first
    if (data.feasibility_note) {
        addBotMessage(`<div class="feasibility-note">📋 ${escapeHtml(data.feasibility_note)}</div>`);
    }

    // Show recommendations
    if (data.recommended_careers && data.recommended_careers.length > 0) {
        addBotMessage('<p class="results-header">Here are your recommended career paths:</p>');

        data.recommended_careers.forEach((career, index) => {
            setTimeout(() => {
                const card = createCareerCard(career);
                const wrapper = document.createElement('div');
                wrapper.className = 'message bot-message card-wrapper';
                wrapper.appendChild(card);
                chatMessages.appendChild(wrapper);
                scrollToBottom();
            }, index * 200);
        });
    } else {
        addBotMessage(
            '<p>No exact matches found for your criteria, but don\'t give up! Consider adjusting your parameters to explore more options.</p>'
        );
    }

    // Add restart button after results
    setTimeout(() => {
        addRestartButton();
    }, data.recommended_careers ? data.recommended_careers.length * 200 + 300 : 300);
}

/**
 * Create a career recommendation card
 */
function createCareerCard(career) {
    const card = document.createElement('div');
    card.className = 'recommendation-card';
    card.innerHTML = `
        <div class="recommendation-role">${escapeHtml(career.role)}</div>
        <div class="recommendation-reason">${escapeHtml(career.reason)}</div>
    `;
    return card;
}

/**
 * Display error message
 */
function displayError(message) {
    addBotMessage(
        `<p>⚠️ ${escapeHtml(message)}</p><p>Please check if the backend server is running.</p>`,
        'error-message'
    );
}

/**
 * Display backend offline error with helpful information
 */
function displayBackendOfflineError() {
    addBotMessage(
        `<div class="offline-error">
            <p><strong>🔌 Backend Unavailable</strong></p>
            <p>The recommendation service is currently offline. This can happen when:</p>
            <ul>
                <li>The backend server is not running</li>
                <li>The ngrok tunnel has expired</li>
                <li>Network connectivity issues</li>
            </ul>
            <p><em>If you're the developer, start the backend with:</em></p>
            <code>cd backend_v2 && python api.py</code>
        </div>`,
        'error-message'
    );

    // Update connection status
    checkBackendHealth();
}

/**
 * Add restart button
 */
function addRestartButton() {
    inputArea.innerHTML = '';

    const restartBtn = document.createElement('button');
    restartBtn.className = 'primary-btn';
    restartBtn.innerHTML = '<span>Start Over</span> <span class="btn-arrow">↻</span>';
    restartBtn.onclick = () => {
        // Reset state
        currentState = 'INIT';
        userAnswers.salary_range = null;
        userAnswers.time_horizon = null;
        userAnswers.risk_appetite = null;

        // Clear messages except first
        const messages = chatMessages.querySelectorAll('.message');
        messages.forEach((msg, i) => {
            if (i > 0) msg.remove();
        });

        // Reset input area
        inputArea.innerHTML = `
            <button id="start-btn" class="primary-btn" onclick="startChat()">
                <span>Get Started</span>
                <span class="btn-arrow">→</span>
            </button>
        `;
    };

    inputArea.appendChild(restartBtn);
}
