// files.js

/**
 * Fetch all files belonging to a specific user.
 * @param {string} username
 * @returns {Promise<Object[]>}
 */
function fetchFilesForUser(username) {
  const filesApiUrl = `http://localhost:8081/file-management/files?username=${encodeURIComponent(username)}`;

  return fetch(filesApiUrl)
    .then((res) => {
      if (!res.ok) {
        throw new Error(`HTTP error! Status: ${res.status}`);
      }
      return res.json();
    })
    .then((files) => {
      return files;
    })
    .catch((error) => {
      console.error(`Error fetching files for user "${username}":`, error);
      return [];
    });
}

/**
 * Render the files owned by a given user.
 * @param {HTMLElement} container
 * @param {string} username
 * @param {Object[]} files}
 */
function renderFilesForUser(container, username, files) {
  container.innerHTML = `<h2>Files owned by ${username}</h2>`;

  if (files.length === 0) {
    const msg = document.createElement("p");
    msg.textContent = "No files found for this user.";
    container.appendChild(msg);
    return;
  }

  const ul = document.createElement("ul");
  files.forEach((file) => {
    const li = document.createElement("li");
    li.textContent = file.name;
    ul.appendChild(li);
  });

  container.appendChild(ul);
}
