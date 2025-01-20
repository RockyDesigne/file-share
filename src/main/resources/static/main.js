// main.js

const loginUrl = "http://localhost:8081/user-management/login";
const registerUrl = "http://localhost:8081/user-management/register-user";

const loginForm = document.querySelector("#login-form form");
const registerForm = document.querySelector("#register-form form");
const appContainer = document.getElementById("app");
const showUserListBtn = document.getElementById("showUserListBtn");
const pickFolderButton = document.getElementById("pickFolderButton");
const showRegisterBtn = document.getElementById("show-register-btn");
const showLoginBtn = document.getElementById("show-login-btn");
const registerFormDiv = document.getElementById("register-form");
const loginFormDiv = document.getElementById("login-form");
const loginStatus = document.getElementById("login-status");
const registerStatus = document.getElementById("register-status");
const authContainer = document.getElementById("auth-container");
const currentUserSpan = document.getElementById("current-user");

let user = null;

showLoginBtn.addEventListener("click", () => {
    registerFormDiv.style.display = "none";
    loginFormDiv.style.display = "block";
});

showRegisterBtn.addEventListener("click", () => {
    loginFormDiv.style.display = "none";
    registerFormDiv.style.display = "block";
});

loginForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginStatus.textContent = "";

    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;

    try {
        const response = await fetch(loginUrl, {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({username: username,password: password}),
        });

        if (!response.ok) {
            throw new Error("Wrong username or password");
        }

        token = response;
        currentUser = username;

        loginStatus.textContent = `Logged in as ${currentUser}`;

        authContainer.style.display = "none";
        appContainer.style.display = "block";
        currentUserSpan.textContent = currentUser;
        //TO DO:
        //web socket conn
        initWebsocket(currentUser);

    } catch (err) {
        loginStatus.textContent = err.message;
    }
});

registerForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    registerStatus.textContent = "";

    const username = document.getElementById("reg-username").value.trim();
    const password = document.getElementById("reg-password").value;

    try {
        const response = await fetch(registerUrl, {
                    method: "POST",
                    headers: {"Content-Type": "application/json"},
                    body: JSON.stringify({username: username,password: password}),
                });


        if (!response.ok) {
            const txt = await response.text();
            throw new Error("registration failed: " + txt);
        }

        registerStatus.textContent = "Registration successful, you may now login.";

        //showLoginBtn.click();
    } catch (err) {
        registerStatus.textContent = err.message;
    }
});

function loadUserList() {
  fetchAllUsers().then((users) => {
    renderUserList(appContainer, users, (clickedUsername) => {
      loadUserFiles(clickedUsername);
    });
  });
}

function loadUserFiles(username) {
  fetchFilesForUser(username).then((files) => {
    renderFilesForUser(appContainer, username, files);
  });
}

showUserListBtn.addEventListener("click", () => {
  loadUserList();
});

pickFolderButton.addEventListener("click", () => {
    pickFolderToShare();
});

loadUserList();
