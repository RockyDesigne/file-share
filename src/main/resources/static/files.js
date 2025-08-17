// files.js

/**
 * Fetch all files belonging to a specific user.
 * @param {string} username
 * @returns {Promise<Object[]>}
 */
function fetchFilesByReg(reg) {
  const filesApiUrl = `http://localhost:8081/file-management/get-published-files?reg=${encodeURIComponent(reg)}`;

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
      console.error(`Error fetching files for reg "${reg}":`, error);
      return [];
    });
}

/**
 * Render the files owned by a given user.
 * @param {HTMLElement} container
 * @param {string} username
 * @param {Object[]} files}
 */
function renderFilesForUser(container, files) {
  container.innerHTML = `<h2>Files</h2>`;

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
        FILE_NAME = file.name;
        PUBLISHED_FILE_HASH = file.hash;
        PUBLISHED_FILE_SIGNATURE = file.signature;

        FILE_OWNER_USERNAME = file.userName;

        initiateOffer(currentUser, FILE_OWNER_USERNAME);
        
        // Update status
        status.textContent = " (Requesting file...)";
        
        // Request the specific file only after connection is ready
        //askForFile(file.name);
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
