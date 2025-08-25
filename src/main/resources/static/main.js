// main.js
const loginUrl = "/user-management/login";
const registerUrl = "/user-management/register-user";
const turnCredUrl = "/turn-cred";

//const loginForm = document.querySelector("#login-form form");
//const registerForm = document.querySelector("#register-form form");
const appContainer = document.getElementById("app");
const showUserListBtn = document.getElementById("showUserListBtn");
const pickFolderButton = document.getElementById("pickFolderButton");
//const showRegisterBtn = document.getElementById("show-register-btn");
//const showLoginBtn = document.getElementById("show-login-btn");
//const registerFormDiv = document.getElementById("register-form");
//const loginFormDiv = document.getElementById("login-form");
//const loginStatus = document.getElementById("login-status");
//const registerStatus = document.getElementById("register-status");
const authContainer = document.getElementById("auth-container");
const currentUserSpan = document.getElementById("current-user");
const shareLinkEl = document.getElementById("shareLink");
const WSS_DOMAIN = "secure-file-share.dedyn.io";
//const logoutBtn = document.getElementById("logoutBtn");

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const reg = params.get('reg');

    const proceed = () => {
        showAuthenticatedUI();           
        if (reg) {
            showUserFilesView(reg);        
        }
    };

    register().then(loginAnon).then(proceed).then(() => initWebsocket(currentUser)).catch(err => {
        console.error('login failed:', err);
    });
});

async function register() {

    const username = USERNAME;
    const password = PASSWORD;
    currentUser = USERNAME;

    try {
        const response = await fetch(registerUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username, password: password}),
        });


        if (!response.ok) {
            const txt = await response.text();
            throw new Error("registration failed: " + txt);
        }

    } catch (err) {
        error("error in registration: ", err);
    }
}

async function loginAnon() {

        const username = USERNAME;
        const password = PASSWORD;

        const keyPairRSA = await generateRsaPssKeyPair();

        log("RSA key pair generated: ", keyPairRSA);
    
        const publicKeyJwkString = await exportPublicKey(keyPairRSA.publicKey).then((key) => JSON.stringify(key));
    
        log("Exporting public key in JWK format: ", publicKeyJwkString);
    
        PRIVATE_KEY_RSA = keyPairRSA.privateKey;

        try {
            const response = await fetch(loginUrl, {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({username: username, password: password, publicKey: publicKeyJwkString }),
            });

            if (!response.ok) {
                throw new Error("Wrong username or password");
            }

            const token = await response.text();
            setAuthData(token, username); // Using setAuthData from auth.js
            currentUser = username;

        } catch (err) {
            error(err);
        }
}

// Check authentication status on page load
// document.addEventListener('DOMContentLoaded', () => {
//     if (isAuthenticated()) {
//         currentUser = getAuthUser();
//         showAuthenticatedUI();
//         initWebsocket(currentUser);
//     }
// });

// Add logout handler
//logoutBtn.addEventListener('click', () => {
//    logout(); // Using the logout function from auth.js
//});
//
//showLoginBtn.addEventListener("click", () => {
//    registerFormDiv.style.display = "none";
//    loginFormDiv.style.display = "block";
//});
//
//showRegisterBtn.addEventListener("click", () => {
//    loginFormDiv.style.display = "none";
//    registerFormDiv.style.display = "block";
//});



pickFolderButton.addEventListener("click", () => {
    pickFolderToShare().then((link) => showShareFilesView(link));
});

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

function showShareFilesView(link) {
    //hideAllViews();
    shareLinkEl.href = link;
    shareLinkEl.textContent = link;
    document.getElementById('shared-files-view').style.display = 'block';
}

// function showUserListView() {
//     hideAllViews();
//     const userListView = document.getElementById('user-list-view');
//     userListView.style.display = 'block';
//     loadUserList(currentUser);
// }

function showUserFilesView(reg) {
    hideAllViews();
    const userFilesView = document.getElementById('user-files-view');
    userFilesView.style.display = 'block';
    loadUserFiles(reg);
    getUserPublicKey(reg)
        .then((key) => {
            log("Imported user's public key (raw JWK):", key);
            return importRsaPssPublicKey(key);
        })
        .then((cryptoKey) => {
            IMPORTED_PUBLIC_KEY_RSA = cryptoKey;
            log("Imported crypto key:", IMPORTED_PUBLIC_KEY_RSA);
        })
        .catch(error => {
            error("Error importing public key:", error);
        });
}

// Navigation handlers
// document.getElementById('back-to-main').addEventListener('click', showMainView);
// document.getElementById('back-to-users').addEventListener('click', showUserListView);
//showUserListBtn.addEventListener('click', showUserListView);

//loginForm.addEventListener("submit", async (event) => {
//    event.preventDefault();
//    loginStatus.textContent = "";
//
//    const username = document.getElementById("login-username").value.trim();
//    const password = document.getElementById("login-password").value;
//
//    const keyPairRSA = await generateRsaPssKeyPair();
//
//    console.log("RSA key pair generated: ", keyPairRSA);
//
//    const publicKeyJwkString = await exportPublicKey(keyPairRSA.publicKey).then((key) => JSON.stringify(key));
//
//    console.log("Exporing public key in JWK format: ", publicKeyJwkString);
//
//    PRIVATE_KEY_RSA = keyPairRSA.privateKey;
//
//    try {
//        const response = await fetch(loginUrl, {
//            method: "POST",
//            headers: {"Content-Type": "application/json"},
//            body: JSON.stringify({username: username, password: password, publicKey: publicKeyJwkString}),
//        });
//
//        if (!response.ok) {
//            throw new Error("Wrong username or password");
//        }
//
//        const token = await response.text();
//        setAuthData(token, username); // Using setAuthData from auth.js
//        currentUser = username;
//
//        loginStatus.textContent = `Logged in as ${currentUser}`;
//        showAuthenticatedUI();
//        initWebsocket(currentUser);
//
//    } catch (err) {
//        loginStatus.textContent = err.message;
//    }
//});

//registerForm.addEventListener("submit", async (event) => {
//    event.preventDefault();
//    registerStatus.textContent = "";
//
//    const username = document.getElementById("reg-username").value.trim();
//    const password = document.getElementById("reg-password").value;
//    currentUser = username;
//
//    const keyPairRSA = await generateRsaPssKeyPair();
//
//    console.log("RSA key pair generated: ", keyPairRSA);
//
//    const publicKeyJwkString = await exportPublicKey(keyPairRSA.publicKey).then((key) => JSON.stringify(key));
//
//    console.log("Exporing public key in JWK format: ", publicKeyJwkString);
//
//    PRIVATE_KEY_RSA = keyPairRSA.privateKey;
//
//    try {
//        const response = await fetch(registerUrl, {
//                    method: "POST",
//                    headers: {"Content-Type": "application/json"},
//                    body: JSON.stringify({username: username, password: password, publicKey: publicKeyJwkString}),
//        });
//
//
//        if (!response.ok) {
//            const txt = await response.text();
//            throw new Error("registration failed: " + txt);
//        }
//
//        registerStatus.textContent = "Registration successful, you may now login.";
//
//        //showLoginBtn.click();
//    } catch (err) {
//        registerStatus.textContent = err.message;
//    }
//});

// Load user list with navigation
function loadUserList(currentUser) {
    fetchAllUsers().then((users) => {
        renderUserList(appContainer, currentUser, users, (clickedUsername) => {
            showUserFilesView(clickedUsername);
        });
    });
}

async function getUserPublicKey(username) {
    const userKeyApiUrl = `/user-management/user-key?username=${encodeURIComponent(username)}`;

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
function loadUserFiles(reg) {
    fetchFilesByReg(reg).then((files) => {
        const filesContainer = document.getElementById('files-container');
        log(files);
        renderFilesForUser(filesContainer, files);
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
