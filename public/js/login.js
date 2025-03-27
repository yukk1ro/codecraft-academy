// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const rememberMeCheckbox = document.getElementById('rememberMe');

// Form validation
function validateForm() {
    let isValid = true;

    // Email validation
    if (!emailInput.value.trim()) {
        isValid = false;
        emailInput.classList.add('is-invalid');
    } else if (!isValidEmail(emailInput.value)) {
        isValid = false;
        emailInput.classList.add('is-invalid');
    } else {
        emailInput.classList.remove('is-invalid');
    }

    // Password validation
    if (!passwordInput.value.trim()) {
        isValid = false;
        passwordInput.classList.add('is-invalid');
    } else {
        passwordInput.classList.remove('is-invalid');
    }

    return isValid;
}

// Email format validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: emailInput.value.trim(),
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token
            localStorage.setItem('token', data.token);

            // Store user data if remember me is checked
            if (rememberMeCheckbox.checked) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }

            // Redirect to home page
            window.location.href = '/';
        } else {
            showNotification(data.message || 'Login failed', 'error');
        }
    } catch (error) {
        console.error('Login error:', error);
        showNotification('An error occurred during login', 'error');
    }
}

// Handle social login
async function handleSocialLogin(provider) {
    try {
        window.location.href = `/api/auth/${provider}`;
    } catch (error) {
        console.error(`${provider} login error:`, error);
        showNotification(`Failed to login with ${provider}`, 'error');
    }
}

// Load saved credentials if remember me was checked
function loadSavedCredentials() {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
        const user = JSON.parse(savedUser);
        emailInput.value = user.email;
        rememberMeCheckbox.checked = true;
    }
}

// Event Listeners
loginForm.addEventListener('submit', handleSubmit);

// Social login buttons
document.querySelector('.btn-outline-dark').addEventListener('click', () => handleSocialLogin('google'));
document.querySelector('.btn-outline-primary').addEventListener('click', () => handleSocialLogin('github'));

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSavedCredentials();

    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/';
    }
}); 