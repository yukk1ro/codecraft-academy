// Socket.IO connection
const socket = io();

// Authentication state
let isAuthenticated = false;
let currentUser = null;

// DOM Elements
const authButtons = document.getElementById('authButtons');
const userMenu = document.getElementById('userMenu');
const userAvatar = document.getElementById('userAvatar');
const username = document.getElementById('username');
const logoutBtn = document.getElementById('logoutBtn');
const popularChallenges = document.getElementById('popularChallenges');

// Check authentication state
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        updateAuthUI(false);
        return;
    }

    try {
        const response = await fetch('/api/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            currentUser = await response.json();
            updateAuthUI(true);
        } else {
            localStorage.removeItem('token');
            updateAuthUI(false);
        }
    } catch (error) {
        console.error('Error checking authentication:', error);
        localStorage.removeItem('token');
        updateAuthUI(false);
    }
}

// Update authentication UI
function updateAuthUI(authenticated) {
    isAuthenticated = authenticated;

    if (authenticated) {
        authButtons.classList.add('d-none');
        userMenu.classList.remove('d-none');
        userAvatar.src = currentUser.avatar || '/images/default-avatar.png';
        username.textContent = currentUser.username;
    } else {
        authButtons.classList.remove('d-none');
        userMenu.classList.add('d-none');
        userAvatar.src = '';
        username.textContent = '';
    }
}

// Handle logout
logoutBtn.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    updateAuthUI(false);
    window.location.href = '/';
});

// Load popular challenges
async function loadPopularChallenges() {
    try {
        const response = await fetch('/api/challenges/popular');
        const challenges = await response.json();

        popularChallenges.innerHTML = challenges.map(challenge => `
            <div class="col-md-4">
                <div class="card challenge-card fade-in">
                    <div class="card-body">
                        <span class="difficulty ${challenge.difficulty.toLowerCase()}">${challenge.difficulty}</span>
                        <h5 class="card-title">${challenge.title}</h5>
                        <p class="card-text">${challenge.description}</p>
                        <div class="d-flex justify-content-between align-items-center">
                            <span class="text-muted">
                                <i class="fas fa-users"></i> ${challenge.completedCount} completed
                            </span>
                            <a href="/challenges/${challenge._id}" class="btn btn-primary">Try Challenge</a>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading popular challenges:', error);
    }
}

// Socket.IO event handlers
socket.on('connect', () => {
    console.log('Connected to WebSocket server');
});

socket.on('challengeUpdate', (data) => {
    // Update UI when a challenge is updated
    loadPopularChallenges();
});

socket.on('userProgress', (data) => {
    // Update user progress in UI
    if (isAuthenticated && data.userId === currentUser._id) {
        // Update progress indicators
    }
});

// Error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Show error notification to user
    showNotification('An error occurred. Please try again.', 'error');
});

// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type} fade-in`;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.classList.remove('fade-in');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Form validation
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required]');
    let isValid = true;

    inputs.forEach(input => {
        if (!input.value.trim()) {
            isValid = false;
            input.classList.add('is-invalid');
        } else {
            input.classList.remove('is-invalid');
        }
    });

    return isValid;
}

// Add form validation to all forms
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => {
        if (!validateForm(form)) {
            e.preventDefault();
            showNotification('Please fill in all required fields', 'warning');
        }
    });
});

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format number with commas
function formatNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Get current user ID
function getCurrentUserId() {
    if (!currentUser) return null;
    return currentUser._id;
}

// Check if user is authenticated
function requireAuth() {
    if (!isAuthenticated) {
        window.location.href = '/login';
        return false;
    }
    return true;
}

// Handle API errors
function handleApiError(error) {
    console.error('API Error:', error);

    if (error.response) {
        const status = error.response.status;
        const message = error.response.data.message || 'An error occurred';

        switch (status) {
            case 401:
                localStorage.removeItem('token');
                updateAuthUI(false);
                window.location.href = '/login';
                break;
            case 403:
                showNotification('You do not have permission to perform this action', 'error');
                break;
            case 404:
                showNotification('The requested resource was not found', 'error');
                break;
            case 500:
                showNotification('An internal server error occurred', 'error');
                break;
            default:
                showNotification(message, 'error');
        }
    } else if (error.request) {
        showNotification('No response received from the server', 'error');
    } else {
        showNotification('An error occurred while making the request', 'error');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
}); 