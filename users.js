const API_URL = "https://jsonplaceholder.typicode.com/users";

let users = [];

const loadBtn = document.getElementById("load-btn");
const filterInput = document.getElementById("filter-input");
const userListContainer = document.getElementById("user-list");
const statusContainer = document.getElementById("status-container");

function renderUsers(list) {
 
  userListContainer.innerHTML = "";


  if (list.length === 0) {
    userListContainer.innerHTML = `<li class="empty-msg">No users match your filter.</li>`;
    return;
  }

  
  list.forEach((user) => {
    const li = document.createElement("li");
    li.className = "user-item";
    li.innerHTML = `
      <strong>${user.name}</strong><br>
      <small>Email: ${user.email}</small><br>
      <small>City: ${user.address?.city || "N/A"}</small><br>
      <small>Company: ${user.company?.name || "N/A"}</small>
    `;
    userListContainer.appendChild(li);
  });
}


async function loadUsers() {
  statusContainer.textContent = "Loading users...";
  loadBtn.disabled = true;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    users = await response.json();
    renderUsers(users);
    filterInput.disabled = false;
  } catch (error) {
    statusContainer.innerHTML = `<p class="error-msg">Failed to load users: ${error.message}</p>`;
    console.error("Fetch Error:", error);
  } finally {
    loadBtn.disabled = false;
    if (statusContainer.textContent === "Loading users...") {
      statusContainer.textContent = "";
    }
  }
}

loadBtn.addEventListener("click", loadUsers);

filterInput.addEventListener("input", (event) => {
  const searchTerm = event.target.value.toLowerCase().trim();
  
  const filteredUsers = users.filter((user) => {
    return (
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    );
  });

  renderUsers(filteredUsers);
});