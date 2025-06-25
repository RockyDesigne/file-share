// main.js

const loginWithCredentialsURL = "http://localhost:8081/user-management/login-with-credentials";
const loginWithTOTPURL = "http://localhost:8081/user-management/login-with-code";
const registerUrl = "http://localhost:8081/user-management/register-user";
const getQRImageURL = "http://localhost:8081/user-management/get-user-qr-code?username=";

const loginForm = document.querySelector("#login-form form");
const registerForm = document.querySelector("#register-form form");
const appContainer = document.getElementById("app");
const showUserListBtn = document.getElementById("showUserListBtn");
const pickFolderButton = document.getElementById("pickFolderButton");
const showRegisterBtn = document.getElementById("show-register-btn");
const showLoginBtn = document.getElementById("show-login-btn");
const totpFormDiv = document.getElementById("totp-form");
const registerFormDiv = document.getElementById("register-form");
const loginFormDiv = document.getElementById("login-form");
const qrCodeDiv = document.getElementById("qr-code");
const qrImg = document.getElementById("qr-img");
const scannedQrCodeBtn = document.getElementById("scanned-qr-btn");
const loginStatus = document.getElementById("login-status");
const registerStatus = document.getElementById("register-status");
const authContainer = document.getElementById("auth-container");
const currentUserSpan = document.getElementById("current-user");
const logoutBtn = document.getElementById("logoutBtn");

let currentUser = null;
let publicKeyJwkString = null;

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    if (isAuthenticated()) {
        currentUser = getAuthUser();
        showAuthenticatedUI();
        initWebsocket(currentUser);
    }
});

document.getElementById("otp-form").addEventListener("submit", async function(e) {
    e.preventDefault();
    const code = document.getElementById("code").value;
    // Use stored username/token if needed
    try {
        // Replace with your actual API call and payload
        const response = await fetch(loginWithTOTPURL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: currentUser, publicKey: publicKeyJwkString, currentCode: code })
        });
        if (!response.ok) throw new Error("Invalid code");
        const token = await response.text();
        setAuthData(token, currentUser); // Using setAuthData from auth.js

        loginStatus.textContent = `Logged in as ${currentUser}`;
        showAuthenticatedUI();
        initWebsocket(currentUser);
    } catch (err) {
        document.getElementById("otp-status").textContent = err.message;
    }
});

// Add logout handler
logoutBtn.addEventListener('click', () => {
    logout(); // Using the logout function from auth.js
});

showLoginBtn.addEventListener("click", () => {
    registerFormDiv.style.display = "none";
    loginFormDiv.style.display = "block";
});

scannedQrCodeBtn.addEventListener("click", () => {
    qrCodeDiv.style.display = "none";
});

showRegisterBtn.addEventListener("click", () => {
    loginFormDiv.style.display = "none";
    totpFormDiv.style.display = "none";
    registerFormDiv.style.display = "block";
});

pickFolderButton.addEventListener("click", () => {
    pickFolderToShare();
});

function showQRCodeUI() {
    registerFormDiv.style.display = "none";
    qrCodeDiv.style.display = "block";
}

function showOTPUI() {
    loginFormDiv.style.display = "none";
    totpFormDiv.style.display = "block";
}

// Function to show authenticated UI
function showAuthenticatedUI() {
    authContainer.style.display = "none";
    appContainer.style.display = "block";
    currentUserSpan.textContent = currentUser;
    showMainView(); // Show main view by default
}

// View management
function hideAllViews() {
    const views = document.querySelectorAll('.view');
    views.forEach(view => view.style.display = 'none');
}

function showMainView() {
    hideAllViews();
    document.getElementById('main-view').style.display = 'block';
}

function showUserListView() {
    hideAllViews();
    const userListView = document.getElementById('user-list-view');
    userListView.style.display = 'block';
    loadUserList(currentUser);
}

function showUserFilesView(username) {
    hideAllViews();
    const userFilesView = document.getElementById('user-files-view');
    userFilesView.style.display = 'block';
    loadUserFiles(username);
    getUserPublicKey(username)
        .then((key) => {
            console.log("Imported user's public key (raw JWK):", key);
            return importRsaPssPublicKey(key);
        })
        .then((cryptoKey) => {
            IMPORTED_PUBLIC_KEY_RSA = cryptoKey;
            console.log("Imported crypto key:", IMPORTED_PUBLIC_KEY_RSA);
        })
        .catch(error => {
            console.error("Error importing public key:", error);
        });
}

// Navigation handlers
document.getElementById('back-to-main').addEventListener('click', showMainView);
document.getElementById('back-to-users').addEventListener('click', showUserListView);
showUserListBtn.addEventListener('click', showUserListView);

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginStatus.textContent = "";

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    const keyPairRSA = await generateRsaPssKeyPair();

    console.log("RSA key pair generated: ", keyPairRSA);

    publicKeyJwkString = await exportPublicKey(keyPairRSA.publicKey).then((key) => JSON.stringify(key));

    console.log("Exporing public key in JWK format: ", publicKeyJwkString);

    PRIVATE_KEY_RSA = keyPairRSA.privateKey;

    try {
        const response = await fetch(loginWithCredentialsURL, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username: username, password: password, publicKey: publicKeyJwkString}),
        });

        if (!response.ok) {
            throw new Error("Wrong username or password");
        }

        // const token = await response.text();
        // setAuthData(token, username); // Using setAuthData from auth.js
        currentUser = username;

        // loginStatus.textContent = `Logged in as ${currentUser}`;
        // showAuthenticatedUI();
        // initWebsocket(currentUser);
        showOTPUI();

    } catch (err) {
        loginStatus.textContent = err.message;
    }
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    registerStatus.textContent = "";

    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value;
    currentUser = username;

    const keyPairRSA = await generateRsaPssKeyPair();

    console.log("RSA key pair generated: ", keyPairRSA);

    publicKeyJwkString = await exportPublicKey(keyPairRSA.publicKey).then((key) => JSON.stringify(key));

    console.log("Exporing public key in JWK format: ", publicKeyJwkString);

    PRIVATE_KEY_RSA = keyPairRSA.privateKey;

    try {
        const response = await fetch(registerUrl, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({username: username, password: password, publicKey: publicKeyJwkString}),
        });


        if (!response.ok) {
            const txt = await response.text();
            throw new Error("registration failed: " + txt);
        }

        const res = await fetch(getQRImageURL + username);

        if (!res.ok) {
            const txt = await response.text();
            throw new Error("registration failed: " + txt);
        }

        const qrBase64 = await res.text();

        qrImg.src = 'data:image/png;base64,' + qrBase64;

        showQRCodeUI();

        //showLoginBtn.click();
    } catch (err) {
        registerStatus.textContent = err.message;
    }
});

// Load user list with navigation
function loadUserList(currentUser) {
    fetchAllUsers().then((users) => {
        renderUserList(appContainer, currentUser, users, (clickedUsername) => {
            showUserFilesView(clickedUsername);
        });
    });
}

async function getUserPublicKey(username) {
    const userKeyApiUrl = `http://localhost:8081/user-management/user-key?username=${encodeURIComponent(username)}`;

    return fetch(userKeyApiUrl)
        .then((res) => {
            if (!res.ok) {
                throw new Error(`HTTP error! Status: ${res.status}`);
            }
            return res.json();
        })
        .then((key) => {
            return key;
        })
        .catch((error) => {
            console.error(`Error fetching key for user "${username}":`, error);
            return "";
        });
}

// Load user files
function loadUserFiles(username) {
    fetchFilesForUser(username).then((files) => {
        const filesContainer = document.getElementById('files-container');
        renderFilesForUser(filesContainer, username, files);
    }).catch(error => {
        console.error('Error loading files:', error);
    });
}

// Prevent form submissions
document.addEventListener('submit', (e) => {
    if (!e.target.matches('form[action]')) {
        e.preventDefault();
    }
});
