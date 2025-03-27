// DOM Elements
const profilePicture = document.getElementById('profilePicture');
const profileUsername = document.getElementById('profileUsername');
const profileEmail = document.getElementById('profileEmail');
const completedChallenges = document.getElementById('completedChallenges');
const totalPoints = document.getElementById('totalPoints');
const userRank = document.getElementById('userRank');
const skillsList = document.getElementById('skillsList');
const activityFeed = document.getElementById('activityFeed');
const completedChallengesList = document.getElementById('completedChallengesList');
const editProfileBtn = document.getElementById('editProfileBtn');
const editProfileModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
const editProfileForm = document.getElementById('editProfileForm');
const editUsername = document.getElementById('editUsername');
const editBio = document.getElementById('editBio');
const editAvatar = document.getElementById('editAvatar');
const editSkills = document.getElementById('editSkills');
const saveProfileBtn = document.getElementById('saveProfileBtn');

// Load profile data
async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const response = await fetch('/api/users/me', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load profile');
        }

        const user = await response.json();
        updateProfileUI(user);

        // Load additional data
        loadUserStats();
        loadUserSkills();
        loadActivityFeed();
        loadCompletedChallenges();
    } catch (error) {
        console.error('Error loading profile:', error);
        showNotification('Failed to load profile', 'error');
    }
}

// Update profile UI
function updateProfileUI(user) {
    profilePicture.src = user.avatar || '/images/default-avatar.png';
    profileUsername.textContent = user.username;
    profileEmail.textContent = user.email;

    // Set edit form values
    editUsername.value = user.username;
    editBio.value = user.bio || '';
    editSkills.value = user.skills ? user.skills.join(', ') : '';
}

// Load user statistics
async function loadUserStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/me/stats', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load stats');
        }

        const stats = await response.json();
        completedChallenges.textContent = stats.completedChallenges;
        totalPoints.textContent = stats.totalPoints;
        userRank.textContent = `#${stats.rank}`;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Load user skills
async function loadUserSkills() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/me/skills', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load skills');
        }

        const skills = await response.json();
        skillsList.innerHTML = skills.map(skill => `
            <div class="skill-item mb-2">
                <div class="d-flex justify-content-between align-items-center">
                    <span>${skill.name}</span>
                    <div class="progress" style="width: 100px; height: 6px;">
                        <div class="progress-bar" role="progressbar" style="width: ${skill.level}%"></div>
                    </div>
                </div>
                <small class="text-muted">${skill.completedChallenges} challenges completed</small>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading skills:', error);
    }
}

// Load activity feed
async function loadActivityFeed() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/me/activity', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load activity');
        }

        const activities = await response.json();
        activityFeed.innerHTML = activities.map(activity => `
            <div class="activity-item mb-3">
                <div class="d-flex align-items-center">
                    <i class="fas ${getActivityIcon(activity.type)} text-primary me-2"></i>
                    <div>
                        <p class="mb-0">${activity.description}</p>
                        <small class="text-muted">${formatDate(activity.timestamp)}</small>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading activity:', error);
    }
}

// Load completed challenges
async function loadCompletedChallenges() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/users/me/completed-challenges', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to load completed challenges');
        }

        const challenges = await response.json();
        completedChallengesList.innerHTML = challenges.map(challenge => `
            <div class="challenge-item mb-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div>
                        <h6 class="mb-0">${challenge.title}</h6>
                        <small class="text-muted">Completed on ${formatDate(challenge.completedAt)}</small>
                    </div>
                    <span class="badge bg-success">${challenge.points} points</span>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading completed challenges:', error);
    }
}

// Handle profile edit
function handleProfileEdit() {
    editProfileBtn.addEventListener('click', () => {
        editProfileModal.show();
    });

    saveProfileBtn.addEventListener('click', async () => {
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();

            formData.append('username', editUsername.value);
            formData.append('bio', editBio.value);
            formData.append('skills', editSkills.value);

            if (editAvatar.files[0]) {
                formData.append('avatar', editAvatar.files[0]);
            }

            const response = await fetch('/api/users/me', {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const updatedUser = await response.json();
            updateProfileUI(updatedUser);
            editProfileModal.hide();
            showNotification('Profile updated successfully', 'success');
        } catch (error) {
            console.error('Error updating profile:', error);
            showNotification('Failed to update profile', 'error');
        }
    });
}

// Helper functions
function getActivityIcon(type) {
    const icons = {
        'challenge_completed': 'fa-trophy',
        'achievement_earned': 'fa-medal',
        'skill_improved': 'fa-chart-line',
        'profile_updated': 'fa-user-edit'
    };
    return icons[type] || 'fa-info-circle';
}

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

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadProfile();
    handleProfileEdit();
}); 