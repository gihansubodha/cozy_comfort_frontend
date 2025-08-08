// 🔗 API URLs
const AUTH_URL = "https://auth-service-okqn.onrender.com";
const SELLER_URL = "https://seller-service-viqu.onrender.com";
const DISTRIBUTOR_URL = "https://distributor-service-smne.onrender.com";
const MANUFACTURER_URL = "https://manufacturer-api-ez0s.onrender.com";

//  Dynamic IDs
const seller_id = localStorage.getItem('seller_id');
const distributor_id = localStorage.getItem('distributor_id');
const manufacturer_id = localStorage.getItem('manufacturer_id');

//  Dashboard Loader
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById('login-btn')?.addEventListener('click', login);
document.querySelectorAll('.logout-btn')?.forEach(btn => btn.addEventListener('click', logout));

  showWelcome();

  if (window.location.pathname.includes("seller.html")) {
    loadSellerStock();
    autoLoadLowStock();
    loadDistributors();

  } else if (window.location.pathname.includes("distributor.html")) {
    loadDistributorStock();
    loadPendingRequests();
    loadDistributorLowStock();
    loadDistributorRequestHistory();
    setInterval(loadDistributorLowStock, 10000);
    setInterval(loadPendingRequests, 10000);

  } else if (window.location.pathname.includes("manufacturer.html")) {
    loadManufacturerStock();
    autoLoadLowStockAlerts();
    loadDistributorRequests();
    loadDistributorRequestHistory();

  } else if (window.location.pathname.includes("admin.html")) {
    loadAllUsers();
  }
});

//  Login Function
async function login() {
  const username = document.getElementById('username')?.value.trim() || "";
  const password = document.getElementById('password')?.value.trim() || "";

  if (!username || !password) {
    const msg = document.getElementById('login-msg');
    if (msg) msg.innerText = "Please enter username and password.";
    return;
  }

  try {
    const res = await fetch(`${AUTH_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const data = await res.json();

    if (res.ok) {
      const userRes = await fetch(`${AUTH_URL}/get_user/${username}`);
      const userData = await userRes.json();

      if (userRes.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.role);
        localStorage.setItem('username', username);

        if (data.role === "seller") localStorage.setItem('seller_id', userData.id);
        if (data.role === "distributor") localStorage.setItem('distributor_id', userData.id);
        if (data.role === "manufacturer") localStorage.setItem('manufacturer_id', userData.id);
      }

      if (data.role === "seller") window.location.href = "seller.html";
      else if (data.role === "distributor") window.location.href = "distributor.html";
      else if (data.role === "manufacturer") window.location.href = "manufacturer.html";
      else if (data.role === "admin") window.location.href = "admin.html";
    } else {
      const msg = document.getElementById('login-msg');
      if (msg) msg.innerText = data.msg || "Login failed.";
    }
  } catch (err) {
    console.error("Login Error:", err);
    const msg = document.getElementById('login-msg');
    if (msg) msg.innerText = "Login failed. Check server.";
  }
}

//  Welcome Message
function showWelcome() {
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');
  const msg = document.getElementById('welcome-msg');
  if (msg && username && role) msg.innerText = `Welcome, ${username} | ${role}`;
}

// ---------------- SELLER ---------------- //
async function loadSellerStock() {
  if (!seller_id) return;
  const res = await fetch(`${SELLER_URL}/stock/${seller_id}`);
  const stock = await res.json();
  const table = document.getElementById("seller-stock-table");
  if (!table) return;
  table.innerHTML = "<tr><th>Model</th><th>Model No.</th><th>Price</th><th>Quantity</th><th>Actions</th></tr>";
  stock.forEach(item => {
    table.innerHTML += `
      <tr>
        <td>${item.blanket_model}</td>
        <td>${item.model_number || "-"}</td>
        <td>${item.price || "-"}</td>
        <td>${item.quantity}</td>
        <td>
          <button class="btn" onclick="editStock(${item.id}, ${item.quantity})">Edit</button>
          <button class="btn cancel" onclick="deleteStock(${item.id})">Delete</button>
        </td>
      </tr>`;
  });
}

async function addSellerStock() {
  const blanket_model = document.getElementById('add-model')?.value.trim() || "";
  const model_number = document.getElementById('add-model-number')?.value.trim() || "";
  const price = parseFloat(document.getElementById('add-price')?.value) || null;
  const quantity = parseInt(document.getElementById('add-qty')?.value);

  if (!seller_id) return alert("Seller ID missing. Please log in again.");
  if (!blanket_model || isNaN(quantity) || quantity < 0) return alert("Enter valid details.");

  const payload = { seller_id: parseInt(seller_id), blanket_model, model_number, price, quantity };

  const res = await fetch(`${SELLER_URL}/stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  const data = await res.json();

  if (res.ok) {
    alert(data.msg || "Stock item added!");
    hideAddStockPopup();
    loadSellerStock();
  } else {
    alert("Failed to add stock: " + (data.msg || "Unknown error"));
  }
}

async function editStock(stock_id, current_qty) {
  const new_qty = prompt("Enter new quantity:", current_qty);
  if (!new_qty) return;
  await fetch(`${SELLER_URL}/stock/${stock_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: parseInt(new_qty) })
  });
  loadSellerStock();
}

async function deleteStock(stock_id) {
  if (!confirm("Are you sure?")) return;
  await fetch(`${SELLER_URL}/stock/${stock_id}`, { method: "DELETE" });
  loadSellerStock();
}

async function autoLoadLowStock() {
  await loadLowStock();
  setInterval(loadLowStock, 10000);
}

async function loadLowStock() {
  if (!seller_id) return;
  const res = await fetch(`${SELLER_URL}/check-low-stock/${seller_id}`);
  const data = await res.json();
  const div = document.getElementById('low-stock-list');
  if (!div) return;
  div.innerHTML = data.low_stock.length === 0 ?
    "<p>No low stock items.</p>" :
    `<table><tr><th>Model</th><th>Model No.</th><th>Price</th><th>Qty</th></tr>` +
    data.low_stock.map(i => `<tr><td>${i.blanket_model}</td><td>${i.model_number || "-"}</td><td>${i.price || "-"}</td><td>${i.quantity}</td></tr>`).join('') +
    `</table>`;
}

//  Load Distributor List
async function loadDistributors() {
  const res = await fetch(`${DISTRIBUTOR_URL}/all`);
  const distributors = await res.json();
  const select = document.getElementById("distributor-select");
  if (!select) return;
  select.innerHTML = `<option value="">Select Distributor</option>`;
  distributors.forEach(d => {
    select.innerHTML += `<option value="${d.id}">${d.name}</option>`;
  });
}

async function sendStockRequest() {
  const selectEl = document.getElementById('distributor-select');
  const distributor_id = selectEl ? parseInt(selectEl.value) : NaN;
  const blanket_model = (document.getElementById('request-model')?.value || "").trim();
  const model_number = (document.getElementById('request-model-number')?.value || "").trim() || null;
  const priceRaw = document.getElementById('request-price')?.value;
  const price = priceRaw !== undefined && priceRaw !== "" ? parseFloat(priceRaw) : null;
  const qtyRaw = document.getElementById('request-qty')?.value;
  const quantity = qtyRaw ? parseInt(qtyRaw) : NaN;

  if (!distributor_id || !blanket_model || isNaN(quantity) || quantity <= 0) {
    alert("Select a distributor and enter valid details.");
    return;
  }

  await fetch(`${SELLER_URL}/request-stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seller_id, distributor_id, blanket_model, model_number, price, quantity })
  });

  alert("Request sent to Distributor");

  // Clear if they exist
  document.getElementById('request-model')?.value = "";
  document.getElementById('request-model-number')?.value = "";
  document.getElementById('request-price')?.value = "";
  document.getElementById('request-qty')?.value = "";
  if (selectEl) selectEl.value = "";
}

// ---------------- DISTRIBUTOR ---------------- //
async function loadDistributorStock() {
  if (!distributor_id) return;
  const res = await fetch(`${DISTRIBUTOR_URL}/stock/${distributor_id}`);
  const stock = await res.json();
  const table = document.getElementById("distributor-stock-table");
  if (!table) return;

  table.innerHTML = "<tr><th>Model</th><th>Model No.</th><th>Price</th><th>Quantity</th><th>Actions</th></tr>";

  stock.forEach(item => {
    table.innerHTML += `
      <tr>
        <td>${item.blanket_model}</td>
        <td>${item.model_number || "-"}</td>
        <td>${item.price || "-"}</td>
        <td>${item.quantity}</td>
        <td>
          <button class="btn" onclick="editDistributorStock(${item.id}, ${item.quantity})">Edit</button>
          <button class="btn cancel" onclick="deleteDistributorStock(${item.id})">Delete</button>
        </td>
      </tr>`;
  });
}

async function editDistributorStock(stock_id, current_qty) {
  const new_qty = prompt("Enter new quantity:", current_qty);
  if (!new_qty) return;
  await fetch(`${DISTRIBUTOR_URL}/stock/${stock_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: parseInt(new_qty) })
  });
  loadDistributorStock();
}

async function deleteDistributorStock(stock_id) {
  if (!confirm("Are you sure?")) return;
  await fetch(`${DISTRIBUTOR_URL}/stock/${stock_id}`, { method: "DELETE" });
  loadDistributorStock();
}

async function addDistributorStock() {
  const blanket_model = document.getElementById('add-model')?.value.trim() || "";
  const model_number = document.getElementById('add-model-number')?.value.trim() || "";
  const price = parseFloat(document.getElementById('add-price')?.value) || null;
  const quantity = parseInt(document.getElementById('add-qty')?.value);

  if (!distributor_id) return alert("Distributor ID missing. Please log in again.");
  if (!blanket_model || isNaN(quantity) || quantity < 0) return alert("Enter valid details.");

  const res = await fetch(`${DISTRIBUTOR_URL}/stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ distributor_id: parseInt(distributor_id), blanket_model, model_number, price, quantity })
  });
  const data = await res.json();

  if (res.ok) {
    alert(data.msg || "Stock item added!");
    hideAddStockPopup();
    loadDistributorStock();
  } else {
    alert("Failed to add stock: " + (data.msg || "Unknown error"));
  }
}

async function loadPendingRequests() {
  const res = await fetch(`${DISTRIBUTOR_URL}/seller-requests/${distributor_id}`);
  const data = await res.json();
  const table = document.getElementById("pending-requests");
  if (!table) return;

  if (data.length === 0) {
    table.innerHTML = "<p>No pending requests.</p>";
    return;
  }

  table.innerHTML = "<tr><th>Model</th><th>Model No.</th><th>Price</th><th>Qty</th><th>Seller</th><th>Status</th><th>Actions</th></tr>";
  data.forEach(r => {
    table.innerHTML += `
      <tr>
        <td>${r.blanket_model}</td>
        <td>${r.model_number || "-"}</td>
        <td>${r.price || "-"}</td>
        <td>${r.quantity}</td>
        <td>${r.seller_name || r.seller_id}</td>
        <td>${r.status || 'Pending'}</td>
        <td>
          <button onclick="updateRequestStatus(${r.id}, 'Completed')">Complete</button>
          <button onclick="updateRequestStatus(${r.id}, 'Denied')">Deny</button>
          <button onclick="updateRequestStatus(${r.id}, 'Pending')">Pending</button>
        </td>
      </tr>`;
  });
}

async function updateRequestStatus(request_id, status) {
  await fetch(`${DISTRIBUTOR_URL}/seller-requests/${request_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status })
  });
  loadPendingRequests();
  loadDistributorRequestHistory();
}

async function loadDistributorRequestHistory() {
  const res = await fetch(`${DISTRIBUTOR_URL}/seller-request-history/${distributor_id}`);
  const data = await res.json();
  const table = document.getElementById("request-history");
  if (!table) return;

  if (data.length === 0) {
    table.innerHTML = "<p>No completed or denied requests.</p>";
    return;
  }

  table.innerHTML = "<tr><th>Model</th><th>Model No.</th><th>Price</th><th>Qty</th><th>Seller</th><th>Status</th></tr>";
  data.forEach(r => {
    table.innerHTML += `
      <tr>
        <td>${r.blanket_model}</td>
        <td>${r.model_number || "-"}</td>
        <td>${r.price || "-"}</td>
        <td>${r.quantity}</td>
        <td>${r.seller_name || r.seller_id}</td>
        <td>${r.status}</td>
      </tr>`;
  });
}

async function loadDistributorLowStock() {
  const res = await fetch(`${DISTRIBUTOR_URL}/check-low-stock/${distributor_id}`);
  const data = await res.json();
  const div = document.getElementById("distributor-low-stock");
  if (!div) return;
  div.innerHTML = data.low_stock.length === 0 ?
    "<p>No low stock items.</p>" :
    `<table><tr><th>Model</th><th>Model No.</th><th>Price</th><th>Qty</th></tr>` +
    data.low_stock.map(i => `<tr><td>${i.blanket_model}</td><td>${i.model_number || "-"}</td><td>${i.price || "-"}</td><td>${i.quantity}</td></tr>`).join('') +
    `</table>`;
}

async function sendManufacturerRequest() {
  const blanket_model = (document.getElementById('request-model')?.value || "").trim();
  const model_number = (document.getElementById('request-model-number')?.value || "").trim() || null;
  const priceRaw = document.getElementById('request-price')?.value;
  const price = priceRaw !== undefined && priceRaw !== "" ? parseFloat(priceRaw) : null;
  const qtyRaw = document.getElementById('request-qty')?.value;
  const quantity = qtyRaw ? parseInt(qtyRaw) : NaN;

  if (!blanket_model || isNaN(quantity) || quantity <= 0) {
    alert("Enter valid request details.");
    return;
  }

  await fetch(`${DISTRIBUTOR_URL}/request-manufacturer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ distributor_id, blanket_model, model_number, price, quantity })
  });

  alert("Request sent to Manufacturer");

  // Clear if they exist
  document.getElementById('request-model')?.value = "";
  document.getElementById('request-model-number')?.value = "";
  document.getElementById('request-price')?.value = "";
  document.getElementById('request-qty')?.value = "";
}

// ---------------- MANUFACTURER ---------------- //
async function loadManufacturerStock() {
  try {
    const res = await fetch(`${MANUFACTURER_URL}/blankets`);
    const stock = await res.json();

    const table = document.getElementById("manufacturer-stock-table");
    if (!table) return;

    table.innerHTML = `
      <tr>
        <th>Model</th>
        <th>Model #</th>
        <th>Material</th>
        <th>Price</th>
        <th>Quantity</th>
        <th>Production Days</th>
        <th>Min Required</th>
        <th>Actions</th>
      </tr>
    `;

    stock.forEach(item => {
      const price =
        (item.price !== undefined && item.price !== null && !Number.isNaN(Number(item.price)))
          ? Number(item.price).toFixed(2)
          : "-";
      const modelNumber = item.model_number ?? "-";
      const material = item.material ?? "-";
      const productionDays = item.production_days ?? "-";
      const minRequired = item.min_required ?? "-";

      table.innerHTML += `
        <tr>
          <td>${item.model}</td>
          <td>${modelNumber}</td>
          <td>${material}</td>
          <td>${price}</td>
          <td>${item.quantity}</td>
          <td>${productionDays}</td>
          <td>${minRequired}</td>
          <td>
            <button class="btn" onclick="editManufacturerStock(${item.id}, ${item.quantity})">Edit</button>
            <button class="btn cancel" onclick="deleteManufacturerStock(${item.id})">Delete</button>
          </td>
        </tr>`;
    });
  } catch (err) {
    console.error("Failed to load manufacturer stock:", err);
  }
}

async function addManufacturerStock() {
  const blanket_model = document.getElementById('add-model')?.value.trim() || "";
  const model_number = document.getElementById('add-model-number')?.value.trim() || "";
  const price = parseFloat(document.getElementById('add-price')?.value) || null;
  const quantity = parseInt(document.getElementById('add-qty')?.value);

  if (!blanket_model || isNaN(quantity) || quantity < 0) {
    alert("Please enter a valid model and quantity.");
    return;
  }

  await fetch(`${MANUFACTURER_URL}/blankets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: blanket_model, model_number, price, material: "Cotton", quantity, production_days: 7 })
  });

  alert("Manufacturer stock item added!");
  hideAddStockPopup();
  loadManufacturerStock();
}

async function editManufacturerStock(blanket_id, current_qty) {
  const new_qty = prompt("Enter new quantity:", current_qty);
  if (!new_qty) return;
  await fetch(`${MANUFACTURER_URL}/blankets/${blanket_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: parseInt(new_qty) })
  });
  loadManufacturerStock();
}

async function deleteManufacturerStock(blanket_id) {
  if (!confirm("Are you sure?")) return;
  await fetch(`${MANUFACTURER_URL}/blankets/${blanket_id}`, { method: "DELETE" });
  loadManufacturerStock();
}

async function loadDistributorRequests() {
  const res = await fetch(`${MANUFACTURER_URL}/distributor-requests`);
  const data = await res.json();
  const table = document.getElementById("distributor-requests");
  if (!table) return;

  if (data.length === 0) {
    table.innerHTML = "<p>No distributor requests.</p>";
    return;
  }

  table.innerHTML = "<tr><th>Model</th><th>Model No.</th><th>Price</th><th>Qty</th><th>Distributor</th><th>Status</th></tr>";
  data.forEach(r => {
    table.innerHTML += `
      <tr>
        <td>${r.blanket_model}</td>
        <td>${r.model_number || "-"}</td>
        <td>${r.price || "-"}</td>
        <td>${r.quantity}</td>
        <td>${r.distributor_id}</td>
        <td>
          <select onchange="updateDistributorRequestStatus(${r.id}, this.value)">
            <option value="" disabled selected>${r.status || "Pending"}</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Denied">Denied</option>
          </select>
        </td>
      </tr>`;
  });
}

async function updateDistributorRequestStatus(request_id, new_status) {
  await fetch(`${MANUFACTURER_URL}/distributor-requests/${request_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: new_status })
  });
  alert("Status updated!");
  loadDistributorRequests();
  loadDistributorRequestHistory();
}

async function loadDistributorRequestHistory() {
  const res = await fetch(`${MANUFACTURER_URL}/distributor-request-history`);
  const data = await res.json();
  const table = document.getElementById("distributor-request-history");
  if (!table) return;

  if (data.length === 0) {
    table.innerHTML = "<p>No completed or denied requests.</p>";
    return;
  }

  table.innerHTML = "<tr><th>Model</th><th>Model No.</th><th>Price</th><th>Qty</th><th>Distributor</th><th>Status</th></tr>";
  data.forEach(r => {
    table.innerHTML += `
      <tr>
        <td>${r.blanket_model}</td>
        <td>${r.model_number || "-"}</td>
        <td>${r.price || "-"}</td>
        <td>${r.quantity}</td>
        <td>${r.distributor_id}</td>
        <td>${r.status}</td>
      </tr>`;
  });
}

async function loadLowStockAlerts() {
  const res = await fetch(`${MANUFACTURER_URL}/check-low-stock`);
  const data = await res.json();
  const div = document.getElementById("low-stock-alerts");
  if (!div) return;

  div.innerHTML = data.low_stock.length === 0 ?
    "<p>No low stock alerts.</p>" :
    `<table><tr><th>Model</th><th>Model No.</th><th>Price</th><th>Qty</th></tr>` +
    data.low_stock.map(i => `<tr><td>${i.model}</td><td>${i.model_number || "-"}</td><td>${i.price || "-"}</td><td>${i.quantity}</td></tr>`).join('') +
    `</table>`;
}

async function autoLoadLowStockAlerts() {
  await loadLowStockAlerts();
  setInterval(loadLowStockAlerts, 10000);
}

// ---------------- ADMIN ---------------- //
async function registerUser() {
  const username = document.getElementById('new-username')?.value.trim() || "";
  const password = document.getElementById('new-password')?.value.trim() || "";
  const role = document.getElementById('new-role')?.value.trim() || "";

  if (!username || !password || !role) return alert("Please fill all fields.");

  const res = await fetch(`${AUTH_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem('token')
    },
    body: JSON.stringify({ username, password, role })
  });
  const data = await res.json();
  alert(data.msg || "User registered");
  loadAllUsers();
}

async function loadAllUsers() {
  const token = localStorage.getItem("token");
  const usersTable = document.getElementById("usersTableBody");
  if (!usersTable) return;
  usersTable.innerHTML = "";

  const response = await fetch(`${AUTH_URL}/all_users`, {
    method: "GET",
    headers: { "Authorization": `Bearer ${token}` }
  });
  const data = await response.json();

  if (response.ok && data.users) {
    data.users.forEach(user => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${user.username}</td>
        <td>${user.role}</td>
        <td><button class="btn cancel" onclick="deleteUserFromTable('${user.username}')">Delete</button></td>
      `;
      usersTable.appendChild(row);
    });
  } else {
    usersTable.innerHTML = `<tr><td colspan="3">Failed to load users</td></tr>`;
  }
}

async function deleteUserFromTable(username) {
  const token = localStorage.getItem("token");
  if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

  const response = await fetch(`${AUTH_URL}/delete_user`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({ username })
  });
  const data = await response.json();

  if (response.ok) {
    alert(data.message || "User deleted");
    loadAllUsers();
  } else {
    alert(data.error || "Failed to delete user");
  }
}

//  Logout
function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

//  Universal Add Stock Popups
function showAddStockPopup() {
  const popup = document.getElementById('popup-form');
  if (!popup) return;
  popup.classList.add('active');

  const modelInput = document.getElementById('add-model');
  const modelNumberInput = document.getElementById('add-model-number');
  const priceInput = document.getElementById('add-price');
  const qtyInput = document.getElementById('add-qty');

  if (modelInput) modelInput.value = '';
  if (modelNumberInput) modelNumberInput.value = '';
  if (priceInput) priceInput.value = '';
  if (qtyInput) qtyInput.value = '';
}

function hideAddStockPopup() {
  const popup = document.getElementById('popup-form');
  if (popup) popup.classList.remove('active');
}

/* =========================
   EXPOSE FUNCTIONS GLOBALLY
   ========================= */
Object.assign(window, {
  // Auth
  login,
  logout,

  // Seller
  loadSellerStock,
  addSellerStock,
  editStock,
  deleteStock,
  loadDistributors,
  sendStockRequest,

  // Distributor
  loadDistributorStock,
  addDistributorStock,
  editDistributorStock,
  deleteDistributorStock,
  loadPendingRequests,
  updateRequestStatus,
  loadDistributorRequestHistory,
  loadDistributorLowStock,
  sendManufacturerRequest,

  // Manufacturer
  loadManufacturerStock,
  addManufacturerStock,
  editManufacturerStock,
  deleteManufacturerStock,
  loadDistributorRequests,
  updateDistributorRequestStatus,
  loadLowStockAlerts,
  autoLoadLowStockAlerts,

  // Admin
  registerUser,
  loadAllUsers,
  deleteUserFromTable,

  // Shared UI
  showAddStockPopup,
  hideAddStockPopup
});

