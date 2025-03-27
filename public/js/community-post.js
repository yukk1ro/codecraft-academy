// DOM Elements
const postTitle = document.getElementById('postTitle');
const postAuthor = document.getElementById('postAuthor');
const postDate = document.getElementById('postDate');
const postType = document.getElementById('postType');
const postContent = document.getElementById('postContent');
const postTags = document.getElementById('postTags');
const likeBtn = document.getElementById('likeBtn');
const likeCount = document.getElementById('likeCount');
const viewCount = document.getElementById('viewCount');
const commentForm = document.getElementById('commentForm');
const commentContent = document.getElementById('commentContent');
const commentsList = document.getElementById('commentsList');
const authorAvatar = document.getElementById('authorAvatar');
const authorName = document.getElementById('authorName');
const authorRole = document.getElementById('authorRole');
const authorBio = document.getElementById('authorBio');
const authorProfile = document.getElementById('authorProfile');
const relatedPosts = document.getElementById('relatedPosts');

// Get post ID from URL
const postId = window.location.pathname.split('/').pop();

// Load post data
async function loadPost() {
    try {
        const response = await fetch(`/api/community/posts/${postId}`);
        const post = await response.json();

        if (response.ok) {
            updatePostUI(post);
            loadAuthorInfo(post.author);
            loadRelatedPosts(post.tags);
        } else {
            showNotification(post.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to load post', 'error');
    }
}

// Update post UI
function updatePostUI(post) {
    postTitle.textContent = post.title;
    postAuthor.textContent = post.author.username;
    postAuthor.href = `/profile/${post.author._id}`;
    postDate.textContent = formatDate(post.createdAt);
    postType.textContent = post.type;
    postType.className = `badge bg-${getPostTypeBadgeColor(post.type)}`;
    postContent.textContent = post.content;
    postTags.innerHTML = post.tags.map(tag => `
        <span class="badge bg-secondary me-1">${tag}</span>
    `).join('');
    likeCount.textContent = post.likes.length;
    viewCount.textContent = post.views;

    // Update like button state
    if (post.likes.includes(getCurrentUserId())) {
        likeBtn.classList.add('btn-primary');
        likeBtn.classList.remove('btn-outline-primary');
    }

    // Update comments
    updateComments(post.comments);
}

// Load author info
async function loadAuthorInfo(authorId) {
    try {
        const response = await fetch(`/api/users/${authorId}`);
        const author = await response.json();

        if (response.ok) {
            updateAuthorUI(author);
        }
    } catch (error) {
        console.error('Failed to load author info:', error);
    }
}

// Update author UI
function updateAuthorUI(author) {
    authorAvatar.src = author.avatar || '/images/default-avatar.png';
    authorName.textContent = author.username;
    authorRole.textContent = author.role || 'Member';
    authorBio.textContent = author.bio || 'No bio available';
    authorProfile.href = `/profile/${author._id}`;
}

// Load related posts
async function loadRelatedPosts(tags) {
    try {
        const response = await fetch(`/api/community/posts?tags=${tags.join(',')}&limit=5`);
        const data = await response.json();

        if (response.ok) {
            updateRelatedPosts(data.posts);
        }
    } catch (error) {
        console.error('Failed to load related posts:', error);
    }
}

// Update related posts
function updateRelatedPosts(posts) {
    relatedPosts.innerHTML = posts
        .filter(post => post._id !== postId)
        .map(post => `
            <div class="mb-3">
                <a href="/community/post/${post._id}" class="text-decoration-none">
                    <h6 class="mb-1">${post.title}</h6>
                    <small class="text-muted">
                        By ${post.author.username} • ${formatDate(post.createdAt)}
                    </small>
                </a>
            </div>
        `).join('');
}

// Update comments
function updateComments(comments) {
    commentsList.innerHTML = comments.map((comment, index) => `
        <div class="comment mb-3">
            <div class="d-flex justify-content-between align-items-start">
                <div>
                    <a href="/profile/${comment.author._id}" class="text-decoration-none">
                        <img src="${comment.author.avatar || '/images/default-avatar.png'}" alt="${comment.author.username}" class="rounded-circle me-2" style="width: 32px; height: 32px;">
                        <strong>${comment.author.username}</strong>
                    </a>
                    <small class="text-muted ms-2">${formatDate(comment.createdAt)}</small>
                </div>
                <button class="btn btn-sm btn-outline-primary" onclick="toggleCommentLike(${index})">
                    <i class="fas fa-heart"></i> ${comment.likes.length}
                </button>
            </div>
            <p class="mt-2 mb-0">${comment.content}</p>
        </div>
    `).join('');
}

// Event Listeners
likeBtn.addEventListener('click', async () => {
    try {
        const response = await fetch(`/api/community/posts/${postId}/like`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            const post = await response.json();
            updatePostUI(post);
        } else {
            const data = await response.json();
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to like post', 'error');
    }
});

commentForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
        const response = await fetch(`/api/community/posts/${postId}/comments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                content: commentContent.value
            })
        });

        if (response.ok) {
            const post = await response.json();
            updatePostUI(post);
            commentContent.value = '';
        } else {
            const data = await response.json();
            showNotification(data.message, 'error');
        }
    } catch (error) {
        showNotification('Failed to post comment', 'error');
    }
});

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

function getCurrentUserId() {
    const token = localStorage.getItem('token');
    if (!token) return null;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
    } catch (error) {
        return null;
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPost();
}); 