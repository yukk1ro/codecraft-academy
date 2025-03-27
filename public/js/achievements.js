// DOM Elements
const achievementsList = document.getElementById('achievementsList');
const recentAchievements = document.getElementById('recentAchievements');
const achievementCategories = document.getElementById('achievementCategories');
const totalAchievements = document.getElementById('totalAchievements');
const completedAchievements = document.getElementById('completedAchievements');
const inProgressAchievements = document.getElementById('inProgressAchievements');
const achievementModal = new bootstrap.Modal(document.getElementById('achievementModal'));

// State
let currentFilter = 'all';
let achievements = [];
let categories = [];

// Load achievements
async function loadAchievements() {
    try {
        const response = await fetch('/api/achievements', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load achievements');
        }

        const data = await response.json();
        achievements = data.achievements;
        categories = data.categories;

        updateAchievementsUI();
        updateCategoriesUI();
        updateStats();
    } catch (error) {
        handleApiError(error);
    }
}

// Update achievements UI
function updateAchievementsUI() {
    const filteredAchievements = filterAchievements(achievements, currentFilter);

    achievementsList.innerHTML = filteredAchievements.map(achievement => `
        <div class="achievement-item card mb-3 ${achievement.completed ? 'completed' : ''}" 
             data-achievement-id="${achievement._id}">
            <div class="card-body">
                <div class="d-flex align-items-center">
                    <img src="${achievement.icon}" alt="${achievement.name}" 
                         class="achievement-icon me-3" style="width: 48px; height: 48px;">
                    <div class="flex-grow-1">
                        <h5 class="card-title mb-1">${achievement.name}</h5>
                        <p class="card-text text-muted mb-1">${achievement.description}</p>
                        <div class="progress mb-0" style="height: 4px;">
                            <div class="progress-bar" role="progressbar" 
                                 style="width: ${(achievement.progress / achievement.required) * 100}%">
                            </div>
                        </div>
                        <small class="text-muted">
                            ${achievement.progress}/${achievement.required} ${achievement.unit}
                        </small>
                    </div>
                    <button class="btn btn-link" onclick="showAchievementDetails('${achievement._id}')">
                        <i class="fas fa-info-circle"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');

    // Update recent achievements
    const recent = achievements
        .filter(a => a.completed)
        .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
        .slice(0, 5);

    recentAchievements.innerHTML = recent.map(achievement => `
        <div class="recent-achievement d-flex align-items-center mb-3">
            <img src="${achievement.icon}" alt="${achievement.name}" 
                 class="achievement-icon me-3" style="width: 32px; height: 32px;">
            <div>
                <h6 class="mb-0">${achievement.name}</h6>
                <small class="text-muted">${formatDate(achievement.completedAt)}</small>
            </div>
        </div>
    `).join('');
}

// Update categories UI
function updateCategoriesUI() {
    achievementCategories.innerHTML = categories.map(category => `
        <a href="#" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
           data-category="${category.name}">
            ${category.name}
            <span class="badge bg-primary rounded-pill">
                ${category.count}
            </span>
        </a>
    `).join('');

    // Add click handlers
    document.querySelectorAll('[data-category]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const category = e.currentTarget.dataset.category;
            filterByCategory(category);
        });
    });
}

// Update stats
function updateStats() {
    totalAchievements.textContent = achievements.length;
    completedAchievements.textContent = achievements.filter(a => a.completed).length;
    inProgressAchievements.textContent = achievements.filter(a => !a.completed && a.progress > 0).length;
}

// Filter achievements
function filterAchievements(achievements, filter) {
    switch (filter) {
        case 'completed':
            return achievements.filter(a => a.completed);
        case 'in-progress':
            return achievements.filter(a => !a.completed && a.progress > 0);
        default:
            return achievements;
    }
}

// Filter by category
function filterByCategory(category) {
    const filtered = achievements.filter(a => a.category === category);
    updateAchievementsList(filtered);
}

// Show achievement details
function showAchievementDetails(achievementId) {
    const achievement = achievements.find(a => a._id === achievementId);
    if (!achievement) return;

    document.getElementById('achievementIcon').src = achievement.icon;
    document.getElementById('achievementName').textContent = achievement.name;
    document.getElementById('achievementDescription').textContent = achievement.description;
    document.getElementById('achievementProgress').style.width =
        `${(achievement.progress / achievement.required) * 100}%`;
    document.getElementById('achievementProgressText').textContent =
        `${achievement.progress}/${achievement.required} ${achievement.unit}`;
    document.getElementById('achievementStatus').textContent =
        achievement.completed ? 'Completed' : 'In Progress';

    achievementModal.show();
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadAchievements();

    // Filter buttons
    document.querySelectorAll('[data-filter]').forEach(button => {
        button.addEventListener('click', (e) => {
            const filter = e.currentTarget.dataset.filter;
            currentFilter = filter;

            // Update active state
            document.querySelectorAll('[data-filter]').forEach(btn => {
                btn.classList.remove('active');
            });
            e.currentTarget.classList.add('active');

            // Update UI
            updateAchievementsUI();
        });
    });
}); 