// DOM Elements
const leaderboardTable = document.getElementById('leaderboardTable');
const pagination = document.getElementById('pagination');
const timeFilter = document.getElementById('timeFilter');
const categoryFilter = document.getElementById('categoryFilter');
const searchInput = document.getElementById('searchInput');

// Top 3 users elements
const firstPlaceAvatar = document.getElementById('firstPlaceAvatar');
const firstPlaceUsername = document.getElementById('firstPlaceUsername');
const firstPlacePoints = document.getElementById('firstPlacePoints');
const secondPlaceAvatar = document.getElementById('secondPlaceAvatar');
const secondPlaceUsername = document.getElementById('secondPlaceUsername');
const secondPlacePoints = document.getElementById('secondPlacePoints');
const thirdPlaceAvatar = document.getElementById('thirdPlaceAvatar');
const thirdPlaceUsername = document.getElementById('thirdPlaceUsername');
const thirdPlacePoints = document.getElementById('thirdPlacePoints');

// State
let currentPage = 1;
const itemsPerPage = 10;
let currentFilters = {
    time: 'all',
    category: 'all',
    search: ''
};

// Load leaderboard data
async function loadLeaderboard(page = 1) {
    try {
        const response = await fetch(`/api/leaderboard?page=${page}&time=${currentFilters.time}&category=${currentFilters.category}&search=${currentFilters.search}`);
        const data = await response.json();

        if (response.ok) {
            updateLeaderboardTable(data.users);
            updatePagination(data.totalPages, page);
            updateTopThree(data.topThree);
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to load leaderboard data', 'error');
    }
}

// Update leaderboard table
function updateLeaderboardTable(users) {
    leaderboardTable.innerHTML = '';

    users.forEach((user, index) => {
        const row = document.createElement('tr');
        const rank = (currentPage - 1) * itemsPerPage + index + 1;

        row.innerHTML = `
            <td>${rank}</td>
            <td>
                <div class="d-flex align-items-center">
                    <img src="${user.avatar || '/images/default-avatar.png'}" alt="${user.username}" class="rounded-circle me-2" style="width: 32px; height: 32px;">
                    <a href="/profile/${user._id}" class="text-decoration-none">${user.username}</a>
                </div>
            </td>
            <td>${user.points}</td>
            <td>${user.completedChallenges}</td>
            <td>${user.level}</td>
            <td>
                <span class="badge bg-success">${user.streak} days</span>
            </td>
        `;

        leaderboardTable.appendChild(row);
    });
}

// Update pagination
function updatePagination(totalPages, currentPage) {
    pagination.innerHTML = '';

    // Previous button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `
        <a class="page-link" href="#" data-page="${currentPage - 1}">
            <i class="fas fa-chevron-left"></i>
        </a>
    `;
    pagination.appendChild(prevLi);

    // Page numbers
    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `
            <a class="page-link" href="#" data-page="${i}">${i}</a>
        `;
        pagination.appendChild(li);
    }

    // Next button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `
        <a class="page-link" href="#" data-page="${currentPage + 1}">
            <i class="fas fa-chevron-right"></i>
        </a>
    `;
    pagination.appendChild(nextLi);
}

// Update top three users
function updateTopThree(topThree) {
    if (topThree.length >= 3) {
        // First place
        firstPlaceAvatar.src = topThree[0].avatar || '/images/default-avatar.png';
        firstPlaceUsername.textContent = topThree[0].username;
        firstPlacePoints.textContent = `${topThree[0].points} points`;

        // Second place
        secondPlaceAvatar.src = topThree[1].avatar || '/images/default-avatar.png';
        secondPlaceUsername.textContent = topThree[1].username;
        secondPlacePoints.textContent = `${topThree[1].points} points`;

        // Third place
        thirdPlaceAvatar.src = topThree[2].avatar || '/images/default-avatar.png';
        thirdPlaceUsername.textContent = topThree[2].username;
        thirdPlacePoints.textContent = `${topThree[2].points} points`;
    }
}

// Event Listeners
timeFilter.addEventListener('change', (e) => {
    currentFilters.time = e.target.value;
    currentPage = 1;
    loadLeaderboard(currentPage);
});

categoryFilter.addEventListener('change', (e) => {
    currentFilters.category = e.target.value;
    currentPage = 1;
    loadLeaderboard(currentPage);
});

searchInput.addEventListener('input', debounce((e) => {
    currentFilters.search = e.target.value;
    currentPage = 1;
    loadLeaderboard(currentPage);
}, 300));

pagination.addEventListener('click', (e) => {
    e.preventDefault();
    const pageLink = e.target.closest('.page-link');
    if (pageLink && !pageLink.parentElement.classList.contains('disabled')) {
        const page = parseInt(pageLink.dataset.page);
        currentPage = page;
        loadLeaderboard(page);
    }
});

// Utility function for debouncing
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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard();
}); 