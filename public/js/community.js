// DOM Elements
const postsList = document.getElementById('postsList');
const pagination = document.getElementById('pagination');
const postTypeFilter = document.getElementById('postTypeFilter');
const sortFilter = document.getElementById('sortFilter');
const searchInput = document.getElementById('searchInput');
const trendingTopics = document.getElementById('trendingTopics');
const activeUsers = document.getElementById('activeUsers');
const createPostForm = document.getElementById('createPostForm');
const submitPostBtn = document.getElementById('submitPost');

// State
let currentPage = 1;
const itemsPerPage = 10;
let currentFilters = {
    type: 'all',
    sort: 'recent',
    search: ''
};

// Load posts
async function loadPosts(page = 1) {
    try {
        const response = await fetch(`/api/community/posts?page=${page}&type=${currentFilters.type}&sort=${currentFilters.sort}&search=${currentFilters.search}`);
        const data = await response.json();

        if (response.ok) {
            updatePostsList(data.posts);
            updatePagination(data.totalPages, page);
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to load posts', 'error');
    }
}

// Update posts list
function updatePostsList(posts) {
    postsList.innerHTML = '';

    posts.forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'card mb-3';

        postElement.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <h5 class="card-title">
                            <a href="/community/post/${post._id}" class="text-decoration-none">${post.title}</a>
                        </h5>
                        <p class="card-text text-muted">
                            <small>
                                Posted by <a href="/profile/${post.author._id}" class="text-decoration-none">${post.author.username}</a>
                                on ${formatDate(post.createdAt)}
                            </small>
                        </p>
                    </div>
                    <span class="badge bg-${getPostTypeBadgeColor(post.type)}">${post.type}</span>
                </div>
                <p class="card-text">${truncateText(post.content, 200)}</p>
                <div class="d-flex justify-content-between align-items-center">
                    <div class="tags">
                        ${post.tags.map(tag => `<span class="badge bg-secondary me-1">${tag}</span>`).join('')}
                    </div>
                    <div class="interactions">
                        <span class="me-3">
                            <i class="fas fa-comment"></i> ${post.comments.length}
                        </span>
                        <span class="me-3">
                            <i class="fas fa-heart"></i> ${post.likes.length}
                        </span>
                        <span>
                            <i class="fas fa-eye"></i> ${post.views}
                        </span>
                    </div>
                </div>
            </div>
        `;

        postsList.appendChild(postElement);
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

// Load trending topics
async function loadTrendingTopics() {
    try {
        const response = await fetch('/api/community/trending-topics');
        const data = await response.json();

        if (response.ok) {
            updateTrendingTopics(data.topics);
        }
    } catch (error) {
        console.error('Failed to load trending topics:', error);
    }
}

// Update trending topics
function updateTrendingTopics(topics) {
    trendingTopics.innerHTML = topics.map(topic => `
        <div class="mb-2">
            <a href="/community/tag/${topic.tag}" class="text-decoration-none">
                <span class="badge bg-primary me-1">${topic.tag}</span>
                <small class="text-muted">${topic.count} posts</small>
            </a>
        </div>
    `).join('');
}

// Load active users
async function loadActiveUsers() {
    try {
        const response = await fetch('/api/community/active-users');
        const data = await response.json();

        if (response.ok) {
            updateActiveUsers(data.users);
        }
    } catch (error) {
        console.error('Failed to load active users:', error);
    }
}

// Update active users
function updateActiveUsers(users) {
    activeUsers.innerHTML = users.map(user => `
        <div class="d-flex align-items-center mb-2">
            <img src="${user.avatar || '/images/default-avatar.png'}" alt="${user.username}" class="rounded-circle me-2" style="width: 32px; height: 32px;">
            <a href="/profile/${user._id}" class="text-decoration-none">${user.username}</a>
        </div>
    `).join('');
}

// Create new post
async function createPost(event) {
    event.preventDefault();

    const postData = {
        type: document.getElementById('postType').value,
        title: document.getElementById('postTitle').value,
        content: document.getElementById('postContent').value,
        tags: document.getElementById('postTags').value.split(',').map(tag => tag.trim()).filter(tag => tag)
    };

    try {
        const response = await fetch('/api/community/posts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(postData)
        });

        const data = await response.json();

        if (response.ok) {
            showNotification('Post created successfully', 'success');
            bootstrap.Modal.getInstance(document.getElementById('createPostModal')).hide();
            createPostForm.reset();
            loadPosts(1);
        } else {
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to create post', 'error');
    }
}

// Event Listeners
postTypeFilter.addEventListener('change', (e) => {
    currentFilters.type = e.target.value;
    currentPage = 1;
    loadPosts(currentPage);
});

sortFilter.addEventListener('change', (e) => {
    currentFilters.sort = e.target.value;
    currentPage = 1;
    loadPosts(currentPage);
});

searchInput.addEventListener('input', debounce((e) => {
    currentFilters.search = e.target.value;
    currentPage = 1;
    loadPosts(currentPage);
}, 300));

pagination.addEventListener('click', (e) => {
    e.preventDefault();
    const pageLink = e.target.closest('.page-link');
    if (pageLink && !pageLink.parentElement.classList.contains('disabled')) {
        const page = parseInt(pageLink.dataset.page);
        currentPage = page;
        loadPosts(page);
    }
});

submitPostBtn.addEventListener('click', createPost);

// Utility functions
function getPostTypeBadgeColor(type) {
    switch (type) {
        case 'discussion':
            return 'primary';
        case 'question':
            return 'success';
        case 'share':
            return 'info';
        default:
            return 'secondary';
    }
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
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
    loadPosts();
    loadTrendingTopics();
    loadActiveUsers();
}); 