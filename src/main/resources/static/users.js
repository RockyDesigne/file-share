const apiUrl = "http://localhost:8081/user-management/user-list";
const userList = document.getElementById("user-list");

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
    data.forEach(username => {
      const listItem = document.createElement("li");
      //listItem.textContent = username;
      userList.appendChild(listItem);

      const link = document.createElement("a");
      link.textContent = username;
      link.href = `user-file-list.html?username=${encodeURIComponent(username)}`;
      listItem.appendChild(link);

    });
  })
  .catch(error => {
    console.error("Error when fetching user list:", error);
  });