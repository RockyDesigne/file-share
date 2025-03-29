// auth.js - Authentication management

// Generate a unique ID for this tab session
const TAB_ID = Math.random().toString(36).substring(2);
const AUTH_TOKEN_KEY = `auth_token_${TAB_ID}`;
const AUTH_USER_KEY = `auth_user_${TAB_ID}`;

// Store authentication data
function setAuthData(token, username) {
    sessionStorage.setItem(AUTH_TOKEN_KEY, token);
    sessionStorage.setItem(AUTH_USER_KEY, username);
}

// Get stored authentication token
function getAuthToken() {
    return sessionStorage.getItem(AUTH_TOKEN_KEY);
}

// Get stored username
function getAuthUser() {
    return sessionStorage.getItem(AUTH_USER_KEY);
}

// Clear authentication data
function clearAuthData() {
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
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
