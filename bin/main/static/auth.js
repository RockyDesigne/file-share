// auth.js - Authentication management

// Generate a unique ID for this tab session
// const TAB_ID = Math.random().toString(36).substring(2);
// const AUTH_TOKEN_KEY = `auth_token_${TAB_ID}`;
// const AUTH_USER_KEY = `auth_user_${TAB_ID}`;

// Store authentication data
function setAuthData(token, username) {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', username);
}

// Get stored authentication token
function getAuthToken() {
    return localStorage.getItem('auth_token');
}

// Get stored username
function getAuthUser() {
    return localStorage.getItem('auth_user');
}

// Clear authentication data
function clearAuthData() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
}

// Check if user is authenticated
function isAuthenticated() {
    return getAuthToken() !== null;
}

// Add authentication headers to fetch options
function withAuth(fetchOptions = {}) {
    const token = getAuthToken();
    if (!token) return fetchOptions;

    return {
        ...fetchOptions,
        headers: {
            ...fetchOptions.headers,
            'Authorization': `Bearer ${token}`
        }
    };
}

// Logout function
function logout() {
    clearAuthData();
    window.location.reload();
}
