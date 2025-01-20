// users.js

/**
 * Fetch all usernames from the backend.
 * @returns {Promise<string[]>} A promise that resolves to an array of usernames.
 */
function fetchAllUsers() {
  const apiUrl = "http://localhost:8081/user-management/active-user-list";

  return fetch(apiUrl)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.json();
    })
    .then((data) => {
      return data;
    })
    .catch((error) => {
      console.error("Error fetching user list:", error);
      return [];
    });
}

/**
 * Render the user list into a container element.
 * @param {HTMLElement} container - The DOM element where we display the user list.
 * @param {string[]} users - Array of usernames.
 * @param {Function} onUserClick - Callback invoked when a user is clicked (receives username).
 */
function renderUserList(container, users, onUserClick) {
  container.innerHTML = "<h2>List of Users</h2>";

  const ul = document.createElement("ul");

  users.forEach((username) => {
    const li = document.createElement("li");

    // Create a span that acts like a link
    const span = document.createElement("span");
    span.textContent = username;
    span.classList.add("clickable");
    
    // Attach click handler
    span.addEventListener("click", () => {
      onUserClick(username);
    });

    li.appendChild(span);
    ul.appendChild(li);
  });

  container.appendChild(ul);
}
