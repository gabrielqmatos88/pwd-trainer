document.addEventListener('DOMContentLoaded', () => {
    // State
    let targetPassword = '';
    let startTime = null;
    let timerInterval = null;
    let isTiming = false;

    // DOM Elements
    const targetInput = document.getElementById('target-password');
    const setTargetBtn = document.getElementById('set-target-btn');
    const targetStatus = document.getElementById('target-status');
    const toggleBtns = document.querySelectorAll('.toggle-visibility');

    const practiceSection = document.getElementById('practice-section');
    const practiceInput = document.getElementById('practice-input');
    const timerDisplay = document.getElementById('timer');
    const feedbackMessage = document.getElementById('feedback-message');

    const attemptsList = document.getElementById('attempts-list');
    const clearHistoryBtn = document.getElementById('clear-history-btn');
    const bestTimeDisplay = document.getElementById('best-time-display');

    let bestTime = Infinity;

    // --- Setup Section ---

    setTargetBtn.addEventListener('click', () => {
        const value = targetInput.value;
        if (value.length === 0) {
            showFeedback('Please enter a password first.', 'error');
            return;
        }

        targetPassword = value;
        targetStatus.textContent = 'Active';
        targetStatus.classList.add('active');

        // Enable practice section
        practiceSection.classList.remove('disabled');
        practiceInput.disabled = false;
        practiceInput.focus();

        // Clear previous target input for security (optional, but good practice)
        // targetInput.value = ''; 

        showFeedback('Target password set! Start practicing.', 'success');
    });

    // --- Visibility Toggles ---

    toggleBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Prevent focus loss if possible, or just toggle
            const inputId = btn.getAttribute('data-for');
            const input = document.getElementById(inputId);
            const icon = btn.querySelector('i');

            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.remove('fa-eye');
                icon.classList.add('fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.remove('fa-eye-slash');
                icon.classList.add('fa-eye');
            }
        });
    });

    // --- Caps Lock Detection ---
    const capsLockIndicator = document.getElementById('caps-lock-indicator');

    function updateCapsLockState(e) {
        if (e.getModifierState && e.getModifierState("CapsLock")) {
            capsLockIndicator.classList.remove('hidden');
        } else if (e.getModifierState) {
            capsLockIndicator.classList.add('hidden');
        }
    }

    document.addEventListener('keydown', updateCapsLockState);
    document.addEventListener('keyup', updateCapsLockState);
    document.addEventListener('click', updateCapsLockState);
    practiceInput.addEventListener('focus', updateCapsLockState);

    // --- Practice Section ---

    practiceInput.addEventListener('input', (e) => {
        if (!isTiming && e.target.value.length > 0) {
            startTimer();
        } else if (e.target.value.length === 0) {
            resetTimer(); // Reset if they delete everything
        }
    });

    practiceInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            if (practiceInput.value.length === 0) return;
            finishAttempt();
        }
    });

    function startTimer() {
        isTiming = true;
        startTime = Date.now();
        timerDisplay.classList.add('running');

        // Update timer every 10ms for smooth display
        timerInterval = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            timerDisplay.textContent = elapsed.toFixed(2) + 's';
        }, 10);
    }

    function stopTimer() {
        isTiming = false;
        clearInterval(timerInterval);
        timerDisplay.classList.remove('running');
    }

    function resetTimer() {
        stopTimer();
        timerDisplay.textContent = '0.00s';
    }

    function finishAttempt() {
        stopTimer();

        const attemptText = practiceInput.value;
        const duration = (Date.now() - startTime) / 1000;
        const isCorrect = attemptText === targetPassword;

        addAttemptToHistory(attemptText, duration, isCorrect);

        // Feedback
        if (isCorrect) {
            showFeedback(`Correct! Time: ${duration.toFixed(2)}s`, 'success');

            // Update Best Time
            if (duration < bestTime) {
                bestTime = duration;
                bestTimeDisplay.textContent = bestTime.toFixed(2) + 's';
                // Optional: Add a "New Record!" effect here if desired
            }
        } else {
            showFeedback('Incorrect password. Try again.', 'error');
        }

        // Reset input
        practiceInput.value = '';
        resetTimer();
    }

    function showFeedback(msg, type) {
        feedbackMessage.textContent = msg;
        feedbackMessage.className = `feedback-message show ${type}`;

        // Auto hide after 3 seconds
        setTimeout(() => {
            feedbackMessage.classList.remove('show');
        }, 3000);
    }

    // --- History Section ---

    function addAttemptToHistory(text, duration, isCorrect) {
        // Remove empty state if present
        const emptyState = attemptsList.querySelector('.empty-state');
        if (emptyState) {
            emptyState.remove();
        }

        const li = document.createElement('li');
        li.className = 'attempt-item';

        const statusClass = isCorrect ? 'status-correct' : 'status-fail';
        const statusText = isCorrect ? 'Success' : 'Fail';
        const statusIcon = isCorrect ? '<i class="fa-solid fa-check"></i>' : '<i class="fa-solid fa-xmark"></i>';

        // Mask the text initially
        const maskedText = '•'.repeat(Math.min(text.length, 20)); // Limit dots

        li.innerHTML = `
            <div class="attempt-status ${statusClass}">
                ${statusIcon} ${statusText}
            </div>
            <div class="attempt-time">
                ${duration.toFixed(2)}s
            </div>
            <div class="attempt-input-wrapper">
                <span class="attempt-text" data-real="${escapeHtml(text)}" data-masked="${maskedText}">${maskedText}</span>
                <button class="reveal-btn" title="Show/Hide">
                    <i class="fa-regular fa-eye"></i>
                </button>
            </div>
        `;

        // Prepend to list
        attemptsList.insertBefore(li, attemptsList.firstChild);
    }

    // Delegated event listener for history items
    attemptsList.addEventListener('click', (e) => {
        const btn = e.target.closest('.reveal-btn');
        if (!btn) return;

        const wrapper = btn.closest('.attempt-input-wrapper');
        const textSpan = wrapper.querySelector('.attempt-text');
        const icon = btn.querySelector('i');

        const realText = textSpan.getAttribute('data-real');
        const maskedText = textSpan.getAttribute('data-masked');

        if (textSpan.textContent === maskedText) {
            textSpan.textContent = realText;
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            textSpan.textContent = maskedText;
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    });

    clearHistoryBtn.addEventListener('click', () => {
        attemptsList.innerHTML = '<li class="empty-state">No attempts yet. Start practicing!</li>';
        bestTime = Infinity;
        bestTimeDisplay.textContent = '--';
    });

    // Utility to prevent XSS in history
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
});
