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

    const span = document.createElement("span");
    span.textContent = file.name;
    span.classList.add("clickable");

    //attach event listener
    span.addEventListener("click", async () => {
      try {
        // Get the current user from auth
        const currentUser = getAuthUser();
        // Add visual feedback early
        span.classList.add("downloading");
        const status = document.createElement("span");
        status.textContent = " (Connecting...)";
        li.appendChild(status);

        // Set file size for the transfer
        FILE_SIZE = file.size;
        RECEIVED_CHUNKS = [];
        TOTAL_RECEIVED = 0;

        // Initiate WebRTC offer and wait for connection
        await initiateOffer(currentUser, username);
        
        // Update status
        status.textContent = " (Requesting file...)";
        
        // Request the specific file only after connection is ready
        askForFile(file.name);
      } catch (error) {
        console.error("Error during file request:", error);
        span.classList.remove("downloading");
        const status = li.querySelector("span");
        if (status) {
          status.textContent = " (Connection failed)";
        }
      }
    });

    li.appendChild(span);
    ul.appendChild(li);
  });

  container.appendChild(ul);
}
