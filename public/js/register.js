// DOM Elements
const registerForm = document.getElementById('registerForm');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const termsCheckbox = document.getElementById('terms');

// Form validation
function validateForm() {
    let isValid = true;

    // Username validation
    if (!usernameInput.value.trim()) {
        isValid = false;
        usernameInput.classList.add('is-invalid');
    } else if (usernameInput.value.length < 3) {
        isValid = false;
        usernameInput.classList.add('is-invalid');
        usernameInput.nextElementSibling.textContent = 'Username must be at least 3 characters long';
    } else {
        usernameInput.classList.remove('is-invalid');
    }

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
    } else if (passwordInput.value.length < 8) {
        isValid = false;
        passwordInput.classList.add('is-invalid');
        passwordInput.nextElementSibling.textContent = 'Password must be at least 8 characters long';
    } else {
        passwordInput.classList.remove('is-invalid');
    }

    // Confirm password validation
    if (!confirmPasswordInput.value.trim()) {
        isValid = false;
        confirmPasswordInput.classList.add('is-invalid');
    } else if (confirmPasswordInput.value !== passwordInput.value) {
        isValid = false;
        confirmPasswordInput.classList.add('is-invalid');
    } else {
        confirmPasswordInput.classList.remove('is-invalid');
    }

    // Terms validation
    if (!termsCheckbox.checked) {
        isValid = false;
        termsCheckbox.classList.add('is-invalid');
    } else {
        termsCheckbox.classList.remove('is-invalid');
    }

    return isValid;
}

// Email format validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Password strength validation
function validatePasswordStrength(password) {
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar;
}

// Handle form submission
async function handleSubmit(e) {
    e.preventDefault();

    if (!validateForm()) {
        return;
    }

    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: usernameInput.value.trim(),
                email: emailInput.value.trim(),
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (response.ok) {
            // Store token
            localStorage.setItem('token', data.token);

            // Store user data
            localStorage.setItem('user', JSON.stringify(data.user));

            // Redirect to home page
            window.location.href = '/';
        } else {
            showNotification(data.message || 'Registration failed', 'error');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('An error occurred during registration', 'error');
    }
}

// Handle social registration
async function handleSocialRegistration(provider) {
    try {
        window.location.href = `/api/auth/${provider}`;
    } catch (error) {
        console.error(`${provider} registration error:`, error);
        showNotification(`Failed to register with ${provider}`, 'error');
    }
}

// Real-time password strength indicator
passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const strength = validatePasswordStrength(password);

    if (password.length >= 8 && strength) {
        passwordInput.classList.add('is-valid');
        passwordInput.classList.remove('is-invalid');
    } else {
        passwordInput.classList.remove('is-valid');
    }
});

// Real-time password confirmation
confirmPasswordInput.addEventListener('input', () => {
    if (confirmPasswordInput.value === passwordInput.value) {
        confirmPasswordInput.classList.add('is-valid');
        confirmPasswordInput.classList.remove('is-invalid');
    } else {
        confirmPasswordInput.classList.remove('is-valid');
    }
});

// Event Listeners
registerForm.addEventListener('submit', handleSubmit);

// Social registration buttons
document.querySelector('.btn-outline-dark').addEventListener('click', () => handleSocialRegistration('google'));
document.querySelector('.btn-outline-primary').addEventListener('click', () => handleSocialRegistration('github'));

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = '/';
    }
}); 