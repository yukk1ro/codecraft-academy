// State management
let currentPage = 1;
let totalPages = 1;
let filters = {
    search: '',
    difficulty: '',
    language: ''
};

// DOM Elements
const searchInput = document.getElementById('searchInput');
const difficultyFilter = document.getElementById('difficultyFilter');
const languageFilter = document.getElementById('languageFilter');
const challengesGrid = document.getElementById('challengesGrid');
const pagination = document.getElementById('pagination');

// Event Listeners
searchInput.addEventListener('input', debounce(handleSearch, 300));
difficultyFilter.addEventListener('change', handleFilterChange);
languageFilter.addEventListener('change', handleFilterChange);

// Load initial challenges
document.addEventListener('DOMContentLoaded', () => {
    loadChallenges();
});

// Load challenges with current filters
async function loadChallenges() {
    try {
        const queryParams = new URLSearchParams({
            page: currentPage,
            ...filters
        });

        const response = await fetch(`/api/challenges?${queryParams}`);
        const data = await response.json();

        totalPages = data.totalPages;
        renderChallenges(data.challenges);
        renderPagination();
    } catch (error) {
        console.error('Error loading challenges:', error);
        showNotification('Failed to load challenges', 'error');
    }
}

// Render challenges grid
function renderChallenges(challenges) {
    challengesGrid.innerHTML = challenges.map(challenge => `
        <div class="col-md-4">
            <div class="card challenge-card fade-in">
                <div class="card-body">
                    <span class="difficulty ${challenge.difficulty.toLowerCase()}">${challenge.difficulty}</span>
                    <h5 class="card-title">${challenge.title}</h5>
                    <p class="card-text">${challenge.description}</p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <span class="text-muted me-3">
                                <i class="fas fa-code"></i> ${challenge.language}
                            </span>
                            <span class="text-muted">
                                <i class="fas fa-users"></i> ${challenge.completedCount} completed
                            </span>
                        </div>
                        <a href="/challenges/${challenge._id}" class="btn btn-primary">Try Challenge</a>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
}

// Render pagination
function renderPagination() {
    const pages = [];

    // Previous button
    pages.push(`
        <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage - 1}">Previous</a>
        </li>
    `);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        if (
            i === 1 || // First page
            i === totalPages || // Last page
            (i >= currentPage - 1 && i <= currentPage + 1) // Pages around current
        ) {
            pages.push(`
                <li class="page-item ${i === currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `);
        } else if (
            i === currentPage - 2 ||
            i === currentPage + 2
        ) {
            pages.push(`
                <li class="page-item disabled">
                    <span class="page-link">...</span>
                </li>
            `);
        }
    }

    // Next button
    pages.push(`
        <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
            <a class="page-link" href="#" data-page="${currentPage + 1}">Next</a>
        </li>
    `);

    pagination.innerHTML = pages.join('');

    // Add click handlers
    pagination.querySelectorAll('.page-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = parseInt(e.target.dataset.page);
            if (page && page !== currentPage) {
                currentPage = page;
                loadChallenges();
            }
        });
    });
}

// Handle search input
function handleSearch(e) {
    filters.search = e.target.value;
    currentPage = 1; // Reset to first page
    loadChallenges();
}

// Handle filter changes
function handleFilterChange(e) {
    const { id, value } = e.target;
    filters[id.replace('Filter', '')] = value;
    currentPage = 1; // Reset to first page
    loadChallenges();
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Socket.IO event handlers for real-time updates
socket.on('challengeUpdate', (data) => {
    // Update the specific challenge in the grid
    const challengeElement = document.querySelector(`[data-challenge-id="${data.challenge._id}"]`);
    if (challengeElement) {
        const challenge = data.challenge;
        challengeElement.querySelector('.card-title').textContent = challenge.title;
        challengeElement.querySelector('.card-text').textContent = challenge.description;
        challengeElement.querySelector('.difficulty').className = `difficulty ${challenge.difficulty.toLowerCase()}`;
        challengeElement.querySelector('.difficulty').textContent = challenge.difficulty;
        challengeElement.querySelector('.completed-count').textContent = challenge.completedCount;
    }
});

// Error handling
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showNotification('An error occurred. Please try again.', 'error');
}); 