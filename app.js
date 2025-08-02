let token = localStorage.getItem("token");
let role = localStorage.getItem("role");

//  Login Handler
document.getElementById("loginForm").addEventListener("submit", async function (e) {
  e.preventDefault();
  const username = document.getElementById("username").value;
  const password = document.getElementById("password").value;

  try {
    const res = await fetch("https://auth-service-okqn.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Login failed");

    token = data.token;
    role = data.role;
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);

    document.getElementById("login-section").style.display = "none";
    document.getElementById("dashboard").style.display = "block";
    showDashboard(role);
  } catch (err) {
    alert("Login error: " + err.message);
  }
});

//  Show relevant dashboard
function showDashboard(role) {
  ["admin", "manufacturer", "distributor", "seller"].forEach(r => {
    document.getElementById(`${r}-dashboard`).style.display = (r === role ? "block" : "none");
  });

  if (role === "admin") loadUsers();
  if (role === "manufacturer") loadManufacturerInventory();
  if (role === "distributor") {
    loadDistributorInventory();
    loadSellerOrders();
  }
  if (role === "seller") loadSellerInventory();
}

//  Logout
document.getElementById("logout-btn").addEventListener("click", () => {
  localStorage.clear();
  window.location.reload();
});

//  ADMIN FUNCTIONS

async function loadUsers() {
  const res = await fetch("https://auth-service-okqn.onrender.com/users", {
    headers: { Authorization: "Bearer " + token }
  });
  const users = await res.json();
  const list = document.getElementById("user-list");
  list.innerHTML = "";
  users.forEach(user => {
    list.innerHTML += `<li>${user.username} (${user.role}) 
      <button onclick="deleteUser(${user.id})">❌</button></li>`;
  });
}

async function deleteUser(id) {
  await fetch(`https://auth-service-okqn.onrender.com/users/${id}`, {
    method: "DELETE",
    headers: { Authorization: "Bearer " + token },
  });
  loadUsers();
}

document.getElementById("createUserForm").addEventListener("submit", async e => {
  e.preventDefault();
  const username = document.getElementById("new-username").value;
  const password = document.getElementById("new-password").value;
  const role = document.getElementById("new-role").value;

  const res = await fetch("https://auth-service-okqn.onrender.com/register", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ username, password, role }),
  });

  const data = await res.json();
  if (res.ok) {
    alert("User created!");
    loadUsers();
  } else {
    alert("Error: " + data.error);
  }
});

//  MANUFACTURER

async function loadManufacturerInventory() {
  const res = await fetch("https://manufacturer-service-1uh3.onrender.com/blankets", {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await res.json();
  const table = document.getElementById("manufacturer-inventory");
  table.innerHTML = "<tr><th>Name</th><th>Material</th><th>Stock</th><th>Min Stock</th></tr>";
  data.forEach(b => {
    table.innerHTML += `<tr><td>${b.name}</td><td>${b.material}</td><td>${b.stock}</td><td>${b.min_stock}</td></tr>`;
  });
}

document.getElementById("addBlanketForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("blanket-name").value;
  const material = document.getElementById("blanket-material").value;
  const stock = document.getElementById("blanket-stock").value;
  const min_stock = document.getElementById("blanket-min").value;

  try {
    const res = await fetch("https://manufacturer-service-1uh3.onrender.com/blankets", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ name, material, stock, min_stock }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Insert failed");
    alert("Blanket added!");
    loadManufacturerInventory();
  } catch (err) {
    alert("Error: " + err.message);
  }
});

//  DISTRIBUTOR

async function loadDistributorInventory() {
  const res = await fetch("https://distributor-service-5f9m.onrender.com/inventory", {
    headers: { Authorization: "Bearer " + token },
  });
  const data = await res.json();
  const table = document.getElementById("distributor-inventory");
  table.innerHTML = "<tr><th>Name</th><th>Stock</th><th>Min Stock</th></tr>";
  data.forEach(i => {
    table.innerHTML += `<tr><td>${i.name}</td><td>${i.stock}</td><td>${i.min_stock}</td></tr>`;
  });
}

document.getElementById("addInventoryForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("inventory-name").value;
  const stock = document.getElementById("inventory-stock").value;
  const min_stock = document.getElementById("inventory-min").value;

  const res = await fetch("https://distributor-service-5f9m.onrender.com/inventory", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ name, stock, min_stock }),
  });

  const data = await res.json();
  if (res.ok) {
    alert("Stock added to inventory!");
    loadDistributorInventory();
  } else {
    alert("Error: " + data.error);
  }
});

//  Seller Order Fulfillment
async function loadSellerOrders() {
  const res = await fetch("https://distributor-service-5f9m.onrender.com/orders", {
    headers: { Authorization: "Bearer " + token },
  });
  const orders = await res.json();
  const list = document.getElementById("seller-orders");
  list.innerHTML = "";
  orders.forEach(o => {
    list.innerHTML += `<li>${o.customer} requested ${o.name} x${o.quantity}</li>`;
  });
}

// 🛍 SELLER

async function loadSellerInventory() {
  const res = await fetch("https://seller-service-59bq.onrender.com/inventory", {
    headers: { Authorization: "Bearer " + token },
  });
  const inventory = await res.json();
  const table = document.getElementById("seller-inventory");
  table.innerHTML = "<tr><th>Name</th><th>Stock</th><th>Min Stock</th></tr>";
  inventory.forEach(i => {
    table.innerHTML += `<tr><td>${i.name}</td><td>${i.stock}</td><td>${i.min_stock}</td></tr>`;
  });
}

document.getElementById("placeOrderForm").addEventListener("submit", async e => {
  e.preventDefault();
  const name = document.getElementById("order-name").value;
  const quantity = document.getElementById("order-qty").value;
  const customer = document.getElementById("order-customer").value;

  const res = await fetch("https://seller-service-59bq.onrender.com/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ name, quantity, customer }),
  });

  const data = await res.json();
  if (res.ok) {
    alert("Order placed!");
    loadSellerInventory();
  } else {
    alert("Error: " + data.error);
  }
});
