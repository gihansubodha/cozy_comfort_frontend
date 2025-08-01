let token = "";
let userRole = "";
const BASE_URLS = {
  auth: "https://auth-service-okqn.onrender.com/login",
  manufacturer: "https://manufacturer-api-ez0s.onrender.com/blankets",
  distributor: "https://distributor-service-smne.onrender.com/inventory",
  seller: "https://seller-service-viqu.onrender.com/orders",
};

function showSection(sectionId) {
  document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
  document.getElementById(sectionId).style.display = "block";
}

// =======================
// 🔐 Login + Role Handling
// =======================
document.getElementById("loginBtn").addEventListener("click", () => {
  const username = document.getElementById("loginUser").value;
  const password = document.getElementById("loginPass").value;

  fetch(`${BASE_URLS.auth}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.token) {
      token = data.token;
      userRole = data.role;
      document.getElementById("loginSection").style.display = "none";
      showSection(`${userRole}Dashboard`);
      if (userRole === "admin") loadUsers();
      if (userRole === "manufacturer") loadBlankets(); loadManufacturerOrders();
      if (userRole === "distributor") loadInventory(); loadSellerOrders();
      if (userRole === "seller") loadOrders();
    } else {
      alert("Invalid login");
    }
  });
});

// =======================
// 👤 Admin – User Handling
// =======================
document.getElementById("createUserBtn").addEventListener("click", () => {
  const username = document.getElementById("newUsername").value;
  const password = document.getElementById("newPassword").value;
  const role = document.getElementById("newRole").value;

  fetch(`${BASE_URLS.auth}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ username, password, role })
  })
  .then(res => res.json())
  .then(data => {
    alert("User created!");
    loadUsers();
  });
});

function loadUsers() {
  fetch(`${BASE_URLS.auth}/users`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById("userList");
    list.innerHTML = "";
    data.forEach(u => {
      const li = document.createElement("li");
      li.textContent = `${u.username} (${u.role})`;
      list.appendChild(li);
    });
  });
}

// ============================
// 🧵 Manufacturer – Blankets
// ============================
function loadBlankets() {
  fetch(`${BASE_URLS.manufacturer}/blankets`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    const table = document.getElementById("blanketList");
    table.innerHTML = "<tr><th>Name</th><th>Material</th><th>Stock</th></tr>";
    data.forEach(b => {
      const row = document.createElement("tr");
      row.innerHTML = `<td>${b.name}</td><td>${b.material}</td><td>${b.stock}</td>`;
      table.appendChild(row);
    });
  });
}

document.getElementById("addBlanketBtn").addEventListener("click", () => {
  const name = document.getElementById("blanketName").value;
  const material = document.getElementById("blanketMaterial").value;
  const stock = +document.getElementById("blanketStock").value;
  const min_stock = +document.getElementById("blanketMin").value;

  fetch(`${BASE_URLS.manufacturer}/blankets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ name, material, stock, min_stock })
  })
  .then(res => res.json())
  .then(() => {
    alert("Blanket added!");
    loadBlankets();
  });
});

function loadManufacturerOrders() {
  fetch(`${BASE_URLS.manufacturer}/orders`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById("manufacturerOrderList");
    list.innerHTML = "";
    data.forEach(o => {
      const li = document.createElement("li");
      li.textContent = `${o.blanket_name} - ${o.quantity} - ${o.status}`;
      list.appendChild(li);
    });
  });
}

// ===========================
// 📦 Distributor – Inventory
// ===========================
function loadInventory() {
  fetch(`${BASE_URLS.distributor}/inventory`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById("inventoryList");
    list.innerHTML = "";
    data.forEach(i => {
      const li = document.createElement("li");
      li.textContent = `${i.name} - ${i.stock}`;
      list.appendChild(li);
    });
  });
}

document.getElementById("addInventoryBtn").addEventListener("click", () => {
  const name = document.getElementById("inventoryName").value;
  const stock = +document.getElementById("inventoryStock").value;
  const min_stock = +document.getElementById("inventoryMin").value;

  fetch(`${BASE_URLS.distributor}/inventory`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ name, stock, min_stock })
  })
  .then(res => res.json())
  .then(() => {
    alert("Inventory added");
    loadInventory();
  });
});

function loadSellerOrders() {
  fetch(`${BASE_URLS.distributor}/seller_orders`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById("sellerOrderList");
    list.innerHTML = "";
    data.forEach(o => {
      const li = document.createElement("li");
      li.textContent = `${o.blanket_name} - ${o.quantity} - ${o.status}`;
      list.appendChild(li);
    });
  });
}

// ===========================
// 🛒 Seller – Orders
// ===========================
function loadOrders() {
  fetch(`${BASE_URLS.seller}/orders`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  .then(res => res.json())
  .then(data => {
    const list = document.getElementById("orderList");
    list.innerHTML = "";
    data.forEach(o => {
      const li = document.createElement("li");
      li.textContent = `${o.name} (${o.customer}) - Qty: ${o.quantity}`;
      list.appendChild(li);
    });
  });
}

document.getElementById("addOrderBtn").addEventListener("click", () => {
  const name = document.getElementById("orderName").value;
  const customer = document.getElementById("orderCustomer").value;
  const quantity = +document.getElementById("orderQty").value;
  const min_stock = +document.getElementById("orderMin").value;

  fetch(`${BASE_URLS.seller}/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ name, customer, quantity, min_stock })
  })
  .then(res => res.json())
  .then(() => {
    alert("Order placed");
    loadOrders();
  });
});
