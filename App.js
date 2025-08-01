const BASE_URL = {
  auth: "https://auth-service-okqn.onrender.com/register",
  manufacturer: "https://manufacturer-api-ez0s.onrender.com/blankets",
  distributor: "https://distributor-service-smne.onrender.com/inventory",
  seller: "https://seller-service-viqu.onrender.com/orders"
};

let token = "";
let role = "";

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const res = await fetch(`${BASE_URL.auth}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });
  const data = await res.json();
  if (res.ok) {
    token = data.token;
    role = data.role;
    showDashboard();
  } else {
    document.getElementById("loginError").innerText = data.message || "Login failed";
  }
});

document.getElementById("logoutBtn").onclick = () => location.reload();

function showDashboard() {
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("dashboardSection").style.display = "block";
  document.getElementById("roleTitle").innerText = role.charAt(0).toUpperCase() + role.slice(1) + " Dashboard";
  document.getElementById(`${role}Panel`).style.display = "block";
  if (role === "admin") loadAdminPanel();
  if (role === "manufacturer") loadManufacturer();
  if (role === "distributor") loadDistributor();
  if (role === "seller") loadSeller();
}

// Admin create user
document.getElementById("createUserForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = {
    username: document.getElementById("newUsername").value,
    password: document.getElementById("newPassword").value,
    role: document.getElementById("newRole").value
  };
  const res = await fetch(`${BASE_URL.auth}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(user)
  });
  document.getElementById("userStatus").innerText = res.ok ? "✅ User created!" : "❌ Failed to create.";
});

function loadAdminPanel() {
  document.getElementById("adminPanel").style.display = "block";
}

// Example: Manufacturer Functions
async function loadManufacturer() {
  const res = await fetch(`${BASE_URL.manufacturer}/blankets`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  const table = document.querySelector("#manufacturerTable tbody");
  table.innerHTML = "";
  data.forEach(b => {
    const row = `<tr><td>${b.name}</td><td>${b.material}</td><td>${b.stock}</td></tr>`;
    table.innerHTML += row;
    if (b.stock <= b.min_stock) {
      document.getElementById("manufacturerAlert").innerText = "⚠️ Low Stock Alert!";
    }
  });
}

document.getElementById("addBlanketForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const body = {
    name: document.getElementById("blanketName").value,
    material: document.getElementById("blanketMaterial").value,
    stock: +document.getElementById("blanketStock").value
  };
  await fetch(`${BASE_URL.manufacturer}/blankets`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body)
  });
  loadManufacturer();
});

// Repeat similar logic for Distributor and Seller panels...

