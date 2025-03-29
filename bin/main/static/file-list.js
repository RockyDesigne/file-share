const UrlParams = new URLSearchParams(window.location.search);
const username = UrlParams.get("username");

const apiUrl = `http://localhost:8081/file-management/files?username=${encodeURIComponent(username)}`;
const fileList = document.getElementById("file-list");

fetch(apiUrl, {
  method: "GET",
})
  .then(res => {
    console.log("Response object:", res);
    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    console.log("Response data:", data);
    data.forEach(file => {
      const listItem = document.createElement("li");
      listItem.textContent = file.name;
      fileList.appendChild(listItem);
    });
  })
  .catch(error => {
    console.error("Error when fetching file list:", error);
  });
