// State management
let currentChallenge = null;
let editor = null;
let initialCode = '';

// DOM Elements
const challengeDifficulty = document.getElementById('challengeDifficulty');
const challengeTitle = document.getElementById('challengeTitle');
const challengeDescription = document.getElementById('challengeDescription');
const challengeRequirements = document.getElementById('challengeRequirements');
const challengeTestCases = document.getElementById('challengeTestCases');
const challengeProgress = document.getElementById('challengeProgress');
const challengeProgressText = document.getElementById('challengeProgressText');
const languageSelect = document.getElementById('languageSelect');
const runCodeBtn = document.getElementById('runCode');
const submitCodeBtn = document.getElementById('submitCode');
const resetCodeBtn = document.getElementById('resetCode');
const output = document.getElementById('output');
const testResults = document.getElementById('testResults');

// Initialize CodeMirror editor
function initializeEditor() {
    editor = CodeMirror(document.getElementById('editor'), {
        mode: 'javascript',
        theme: 'monokai',
        lineNumbers: true,
        autoCloseBrackets: true,
        matchBrackets: true,
        indentUnit: 4,
        tabSize: 4,
        lineWrapping: true,
        extraKeys: {
            'Ctrl-Space': 'autocomplete',
            'Ctrl-S': function (cm) {
                saveCode(cm.getValue());
            }
        }
    });

    // Set editor size
    editor.setSize('100%', '400px');
}

// Load challenge data
async function loadChallenge() {
    try {
        const challengeId = window.location.pathname.split('/').pop();
        const response = await fetch(`/api/challenges/${challengeId}`);
        currentChallenge = await response.json();

        // Update UI with challenge data
        challengeDifficulty.className = `difficulty ${currentChallenge.difficulty.toLowerCase()}`;
        challengeDifficulty.textContent = currentChallenge.difficulty;
        challengeTitle.textContent = currentChallenge.title;
        challengeDescription.textContent = currentChallenge.description;

        // Render requirements
        challengeRequirements.innerHTML = currentChallenge.requirements
            .map(req => `<li>${req}</li>`)
            .join('');

        // Render test cases
        challengeTestCases.innerHTML = currentChallenge.testCases
            .map((test, index) => `
                <div class="test-case mb-2">
                    <strong>Test Case ${index + 1}:</strong>
                    <pre class="bg-light p-2 rounded">Input: ${JSON.stringify(test.input)}
Output: ${JSON.stringify(test.expectedOutput)}</pre>
                </div>
            `)
            .join('');

        // Set initial code based on selected language
        initialCode = currentChallenge.templateCode[languageSelect.value];
        editor.setValue(initialCode);

        // Load user progress
        loadUserProgress();
    } catch (error) {
        console.error('Error loading challenge:', error);
        showNotification('Failed to load challenge', 'error');
    }
}

// Load user progress
async function loadUserProgress() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await fetch(`/api/challenges/${currentChallenge._id}/progress`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const progress = await response.json();
            updateProgressUI(progress);
        }
    } catch (error) {
        console.error('Error loading progress:', error);
    }
}

// Update progress UI
function updateProgressUI(progress) {
    const percentage = (progress.completedTests / currentChallenge.testCases.length) * 100;
    challengeProgress.style.width = `${percentage}%`;
    challengeProgressText.textContent = `${progress.completedTests}/${currentChallenge.testCases.length} tests passed`;
}

// Run code
async function runCode() {
    try {
        const code = editor.getValue();
        const language = languageSelect.value;

        runCodeBtn.disabled = true;
        output.textContent = 'Running...';

        const response = await fetch('/api/challenges/run', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                code,
                language,
                challengeId: currentChallenge._id
            })
        });

        const result = await response.json();

        if (result.error) {
            output.textContent = `Error: ${result.error}`;
        } else {
            output.textContent = result.output;
            renderTestResults(result.testResults);
        }
    } catch (error) {
        console.error('Error running code:', error);
        output.textContent = 'An error occurred while running the code';
    } finally {
        runCodeBtn.disabled = false;
    }
}

// Submit code
async function submitCode() {
    try {
        const code = editor.getValue();
        const language = languageSelect.value;

        submitCodeBtn.disabled = true;
        output.textContent = 'Submitting...';

        const token = localStorage.getItem('token');
        if (!token) {
            showNotification('Please login to submit your solution', 'warning');
            return;
        }

        const response = await fetch(`/api/challenges/${currentChallenge._id}/submit`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                code,
                language
            })
        });

        const result = await response.json();

        if (result.error) {
            output.textContent = `Error: ${result.error}`;
        } else {
            output.textContent = result.output;
            renderTestResults(result.testResults);
            updateProgressUI(result.progress);

            if (result.allTestsPassed) {
                showNotification('Congratulations! All tests passed!', 'success');
            }
        }
    } catch (error) {
        console.error('Error submitting code:', error);
        output.textContent = 'An error occurred while submitting the code';
    } finally {
        submitCodeBtn.disabled = false;
    }
}

// Render test results
function renderTestResults(results) {
    testResults.innerHTML = results.map((result, index) => `
        <div class="test-result mb-2">
            <div class="d-flex align-items-center">
                <i class="fas ${result.passed ? 'fa-check text-success' : 'fa-times text-danger'} me-2"></i>
                <strong>Test Case ${index + 1}:</strong>
                <span class="ms-2">${result.passed ? 'Passed' : 'Failed'}</span>
            </div>
            ${!result.passed ? `
                <pre class="bg-light p-2 rounded mt-1">
Expected: ${JSON.stringify(result.expected)}
Got: ${JSON.stringify(result.actual)}
                </pre>
            ` : ''}
        </div>
    `).join('');
}

// Save code to localStorage
function saveCode(code) {
    localStorage.setItem(`challenge_${currentChallenge._id}_code`, code);
    showNotification('Code saved', 'info');
}

// Reset code to initial template
function resetCode() {
    if (confirm('Are you sure you want to reset your code to the initial template?')) {
        editor.setValue(initialCode);
        showNotification('Code reset to initial template', 'info');
    }
}

// Handle language change
languageSelect.addEventListener('change', () => {
    const language = languageSelect.value;
    editor.setOption('mode', language);
    CodeMirror.autoLoadMode(editor, language);

    // Update initial code based on selected language
    initialCode = currentChallenge.templateCode[language];
    editor.setValue(initialCode);
});

// Event listeners
runCodeBtn.addEventListener('click', runCode);
submitCodeBtn.addEventListener('click', submitCode);
resetCodeBtn.addEventListener('click', resetCode);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeEditor();
    loadChallenge();

    // Load saved code if exists
    const savedCode = localStorage.getItem(`challenge_${window.location.pathname.split('/').pop()}_code`);
    if (savedCode) {
        editor.setValue(savedCode);
    }
}); 