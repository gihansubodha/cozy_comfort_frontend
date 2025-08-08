// 🔗 API URLs
const AUTH_URL = "https://auth-service-okqn.onrender.com";
const SELLER_URL = "https://seller-service-viqu.onrender.com";
const DISTRIBUTOR_URL = "https://distributor-service-smne.onrender.com";
const MANUFACTURER_URL = "https://manufacturer-api-ez0s.onrender.com";

// 🔑 Always read latest IDs from localStorage
const getSellerId = () => {
  const v = localStorage.getItem('seller_id');
  return v ? parseInt(v, 10) : null;
};
const getDistributorId = () => {
  const v = localStorage.getItem('distributor_id');
  return v ? parseInt(v, 10) : null;
};
const getManufacturerId = () => {
  const v = localStorage.getItem('manufacturer_id');
  return v ? parseInt(v, 10) : null;
};

// 🚀 Dashboard Loader
document.addEventListener("DOMContentLoaded", () => {
  showWelcome();

  const path = window.location.pathname;

  if (path.includes("seller.html")) {
    loadSellerStock();
    autoLoadLowStock();
    loadDistributors();

  } else if (path.includes("distributor.html")) {
    loadDistributorStock();
    loadPendingRequests();
    loadDistributorLowStock();
    loadDistributorRequestHistory();
    setInterval(loadDistributorLowStock, 10000);
    setInterval(loadPendingRequests, 10000);

  } else if (path.includes("manufacturer.html")) {
    loadManufacturerStock();
    autoLoadLowStockAlerts();
    loadDistributorRequests();
    loadDistributorRequestHistory();

  } else if (path.includes("admin.html")) {
    loadAllUsers();
  }
});

/* =====================
   AUTH
   ===================== */

async function login() {
  const username = document.getElementById('username')?.value.trim() || "";
  const password = document.getElementById('password')?.value.trim() || "";

  if (!username || !password) {
    document.getElementById('login-msg')?.innerText = "Please enter username and password.";
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
      document.getElementById('login-msg')?.innerText = data.msg || "Login failed.";
    }
  } catch (err) {
    console.error("Login Error:", err);
    document.getElementById('login-msg')?.innerText = "Login failed. Check server.";
  }
}

function showWelcome() {
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role');
  const msg = document.getElementById('welcome-msg');
  if (msg && username && role) msg.innerText = `Welcome, ${username} | ${role}`;
}

/* =====================
   SELLER
   ===================== */

async function loadSellerStock() {
  const seller_id = getSellerId();
  if (!seller_id) return;

  const res = await fetch(`${SELLER_URL}/stock/${seller_id}`);
  const stock = await res.json();
  const table = document.getElementById("seller-stock-table");
  if (!table) return;

  table.innerHTML = `
    <tr>
      <th>Model</th>
      <th>Model No.</th>
      <th>Price</th>
      <th>Quantity</th>
      <th>Actions</th>
    </tr>`;

  stock.forEach(item => {
    const price = (item.price ?? "") !== "" && !Number.isNaN(Number(item.price))
      ? Number(item.price).toFixed(2) : "-";
    const modelNumber = item.model_number ?? "-";
    table.innerHTML += `
      <tr>
        <td>${item.blanket_model}</td>
        <td>${modelNumber}</td>
        <td>${price}</td>
        <td>${item.quantity}</td>
        <td>
          <button class="btn" onclick="editStock(${item.id}, ${item.quantity})">Edit</button>
          <button class="btn cancel" onclick="deleteStock(${item.id})">Delete</button>
        </td>
      </tr>`;
  });
}

async function addSellerStock() {
  const seller_id = getSellerId();
  const blanket_model = document.getElementById('add-model')?.value.trim() || "";
  const model_number = document.getElementById('add-model-number')?.value.trim() || "";
  const priceRaw = document.getElementById('add-price')?.value;
  const price = priceRaw !== undefined && priceRaw !== "" ? parseFloat(priceRaw) : null;
  const quantity = parseInt(document.getElementById('add-qty')?.value);

  if (!seller_id) return alert("Seller ID missing. Please log in again.");
  if (!blanket_model || isNaN(quantity) || quantity < 0) return alert("Enter valid details.");

  const res = await fetch(`${SELLER_URL}/stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seller_id, blanket_model, model_number, price, quantity })
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
  const seller_id = getSellerId();
  if (!seller_id) return;

  const res = await fetch(`${SELLER_URL}/check-low-stock/${seller_id}`);
  const data = await res.json();
  const div = document.getElementById('low-stock-list');
  if (!div) return;

  const rows = data.low_stock.map(i => `
    <tr>
      <td>${i.blanket_model}</td>
      <td>${i.model_number ?? "-"}</td>
      <td>${(i.price ?? "") !== "" && !Number.isNaN(Number(i.price)) ? Number(i.price).toFixed(2) : "-"}</td>
      <td>${i.quantity}</td>
    </tr>`).join('');

  div.innerHTML = data.low_stock.length === 0
    ? "<p>No low stock items.</p>"
    : `<table><tr><th>Model</th><th>Model No.</th><th>Price</th><th>Qty</th></tr>${rows}</table>`;
}

async function loadDistributors() {
  try {
    const res = await fetch(`${DISTRIBUTOR_URL}/all`);
    const distributors = await res.json();
    const select = document.getElementById("distributor-select");
    if (!select) return;

    select.innerHTML = `<option value="">Select Distributor</option>`;
    distributors.forEach(d => {
      select.innerHTML += `<option value="${d.id}">${d.name}</option>`;
    });
  } catch (err) {
    console.error("Failed to load distributors:", err);
  }
}

async function sendStockRequest() {
  const seller_id = getSellerId();
  const selectEl = document.getElementById('distributor-select');
  const distributor_id = selectEl ? parseInt(selectEl.value) : NaN;
  const blanket_model = (document.getElementById('request-model')?.value || "").trim();
  const model_number = (document.getElementById('request-model-number')?.value || "").trim() || null;
  const priceRaw = document.getElementById('request-price')?.value;
  const price = priceRaw !== undefined && priceRaw !== "" ? parseFloat(priceRaw) : null;
  const qtyRaw = document.getElementById('request-qty')?.value;
  const quantity = qtyRaw ? parseInt(qtyRaw) : NaN;

  if (!seller_id || !distributor_id || !blanket_model || isNaN(quantity) || quantity <= 0) {
    alert("Select a distributor and enter valid details.");
    return;
  }

  await fetch(`${SELLER_URL}/request-stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seller_id, distributor_id, blanket_model, model_number, price, quantity })
  });

  document.getElementById('request-msg')?.innerText = "Stock request saved to database!";
  document.getElementById('request-model')?.value = "";
  document.getElementById('request-model-number')?.value = "";
  document.getElementById('request-price')?.value = "";
  document.getElementById('request-qty')?.value = "";
  if (selectEl) selectEl.value = "";
}

/* =====================
   DISTRIBUTOR
   ===================== */

async function loadDistributorStock() {
  const distributor_id = getDistributorId();
  if (!distributor_id) return;

  const res = await fetch(`${DISTRIBUTOR_URL}/stock/${distributor_id}`);
  const stock = await res.json();
  const table = document.getElementById("distributor-stock-table");
  if (!table) return;

  table.innerHTML = `
    <tr>
      <th>Model</th>
      <th>Model No.</th>
      <th>Price</th>
      <th>Quantity</th>
      <th>Actions</th>
    </tr>`;

  stock.forEach(item => {
    const price = (item.price ?? "") !== "" && !Number.isNaN(Number(item.price))
      ? Number(item.price).toFixed(2) : "-";
    const modelNumber = item.model_number ?? "-";

    table.innerHTML += `
      <tr>
        <td>${item.blanket_model}</td>
        <td>${modelNumber}</td>
        <td>${price}</td>
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
  const distributor_id = getDistributorId();
  const blanket_model = document.getElementById('add-model')?.value.trim() || "";
  const model_number = document.getElementById('add-model-number')?.value.trim() || "";
  const priceRaw = document.getElementById('add-price')?.value;
  const price = priceRaw !== undefined && priceRaw !== "" ? parseFloat(priceRaw) : null;
  const quantity = parseInt(document.getElementById('add-qty')?.value);

  if (!distributor_id) return alert("Distributor ID missing. Please log in again.");
  if (!blanket_model || isNaN(quantity) || quantity < 0) return alert("Enter valid details.");

  const res = await fetch(`${DISTRIBUTOR_URL}/stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ distributor_id, blanket_model, model_number, price, quantity })
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
  const distributor_id = getDistributorId();
  if (!distributor_id) return;

  const res = await fetch(`${DISTRIBUTOR_URL}/seller-requests/${distributor_id}`);
  const data = await res.json();
  const el = document.getElementById("pending-requests");
  if (!el) return;

  if (el.tagName === "TABLE") {
    if (data.length === 0) {
      el.innerHTML = "<tr><td colspan='7'>No pending requests.</td></tr>";
      return;
    }
    el.innerHTML = "<tr><th>Model</th><th>Model No.</th><th>Price</th><th>Qty</th><th>Seller</th><th>Status</th><th>Actions</th></tr>";
    data.forEach(r => {
      const price = (r.price ?? "") !== "" && !Number.isNaN(Number(r.price))
        ? Number(r.price).toFixed(2) : "-";
      el.innerHTML += `
        <tr>
          <td>${r.blanket_model}</td>
          <td>${r.model_number ?? "-"}</td>
          <td>${price}</td>
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
  } else {
    el.innerHTML = data.length === 0 ? "<p>No pending requests.</p>" :
      data.map(r => `
        <p>
          ${r.blanket_model} (${r.model_number ?? "-"}) - ${r.quantity}
          ${r.price ? ` @ ${Number(r.price).toFixed(2)}` : ""}
          (Seller: ${r.seller_name || r.seller_id})
          [Status: ${r.status || 'Pending'}]
          <button onclick="updateRequestStatus(${r.id}, 'Completed')">Complete</button>
          <button onclick="updateRequestStatus(${r.id}, 'Denied')">Deny</button>
          <button onclick="updateRequestStatus(${r.id}, 'Pending')">Pending</button>
        </p>`).join('');
  }
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
  const distributor_id = getDistributorId();
  if (!distributor_id) return;

  const res = await fetch(`${DISTRIBUTOR_URL}/seller-request-history/${distributor_id}`);
  const data = await res.json();
  const el = document.getElementById("request-history");
  if (!el) return;

  if (el.tagName === "TABLE") {
    if (data.length === 0) {
      el.innerHTML = "<tr><td colspan='6'>No completed or denied requests.</td></tr>";
      return;
    }
    el.innerHTML = "<tr><th>Model</th><th>Model No.</th><th>Price</th><th>Qty</th><th>Seller</th><th>Status</th></tr>";
    data.forEach(r => {
      const price = (r.price ?? "") !== "" && !Number.isNaN(Number(r.price))
        ? Number(r.price).toFixed(2) : "-";
      el.innerHTML += `
        <tr>
          <td>${r.blanket_model}</td>
          <td>${r.model_number ?? "-"}</td>
          <td>${price}</td>
          <td>${r.quantity}</td>
          <td>${r.seller_name || r.seller_id}</td>
          <td>${r.status}</td>
        </tr>`;
    });
  } else {
    el.innerHTML = data.length === 0 ? "<p>No completed or denied requests.</p>" :
      data.map(r => `<p>${r.blanket_model} (${r.model_number ?? "-"}) - ${r.quantity} ${r.price ? `@ ${Number(r.price).toFixed(2)}` : ""} (Seller: ${r.seller_name || r.seller_id}) - <strong>${r.status}</strong></p>`).join('');
  }
}

async function loadDistributorLowStock() {
  const distributor_id = getDistributorId();
  if (!distributor_id) return;

  const res = await fetch(`${DISTRIBUTOR_URL}/check-low-stock/${distributor_id}`);
  const data = await res.json();
  const div = document.getElementById("distributor-low-stock");
  if (!div) return;

  const rows = data.low_stock.map(i => `
    <tr>
      <td>${i.blanket_model}</td>
      <td>${i.model_number ?? "-"}</td>
      <td>${(i.price ?? "") !== "" && !Number.isNaN(Number(i.price)) ? Number(i.price).toFixed(2) : "-"}</td>
      <td>${i.quantity}</td>
    </tr>`).join('');

  div.innerHTML = data.low_stock.length === 0
    ? "<p>No low stock items.</p>"
    : `<table><tr><th>Model</th><th>Model No.</th><th>Price</th><th>Qty</th></tr>${rows}</table>`;
}

async function sendManufacturerRequest() {
  const distributor_id = getDistributorId();
  const blanket_model = (document.getElementById('request-model')?.value || "").trim();
  const model_number = (document.getElementById('request-model-number')?.value || "").trim() || null;
  const priceRaw = document.getElementById('request-price')?.value;
  const price = priceRaw !== undefined && priceRaw !== "" ? parseFloat(priceRaw) : null;
  const qtyRaw = document.getElementById('request-qty')?.value;
  const quantity = qtyRaw ? parseInt(qtyRaw) : NaN;

  if (!distributor_id || !blanket_model || isNaN(quantity) || quantity <= 0) {
    alert("Enter valid request details.");
    return;
  }

  await fetch(`${DISTRIBUTOR_URL}/request-manufacturer`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ distributor_id, blanket_model, model_number, price, quantity })
  });

  document.getElementById('request-msg')?.innerText = "Stock request saved to database!";
  document.getElementById('request-model')?.value = "";
  document.getElementById('request-model-number')?.value = "";
  document.getElementById('request-price')?.value = "";
  document.getElementById('request-qty')?.value = "";
}

/* =====================
   MANUFACTURER
   ===================== */

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
      </tr>`;

    stock.forEach(item => {
      const price = (item.price ?? "") !== "" && !Number.isNaN(Number(item.price))
        ? Number(item.price).toFixed(2) : "-";
      table.innerHTML += `
        <tr>
          <td>${item.model}</td>
          <td>${item.model_number ?? "-"}</td>
          <td>${item.material ?? "-"}</td>
          <td>${price}</td>
          <td>${item.quantity}</td>
          <td>${item.production_days ?? "-"}</td>
          <td>${item.min_required ?? "-"}</td>
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
  const model = document.getElementById('add-model')?.value.trim() || "";
  const model_number = document.getElementById('add-model-number')?.value.trim() || "";
  const priceRaw = document.getElementById('add-price')?.value;
  const price = priceRaw !== undefined && priceRaw !== "" ? parseFloat(priceRaw) : null;
  const quantity = parseInt(document.getElementById('add-qty')?.value);

  if (!model || isNaN(quantity) || quantity < 0) {
    alert("Please enter a valid model and quantity.");
    return;
  }

  await fetch(`${MANUFACTURER_URL}/blankets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, model_number, price, material: "Cotton", quantity, production_days: 7 })
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
  if (!confirm("Are you sure you want to delete this model?")) return;
  await fetch(`${MANUFACTURER_URL}/blankets/${blanket_id}`, { method: "DELETE" });
  loadManufacturerStock();
}

async function loadDistributorRequests() {
  const res = await fetch(`${MANUFACTURER_URL}/distributor-requests`);
  const data = await res.json();
  const el = document.getElementById("distributor-requests");
  if (!el) return;

  if (el.tagName === "TABLE") {
    if (data.length === 0) {
      el.innerHTML = "<tr><td colspan='6'>No distributor requests.</td></tr>";
      return;
    }
    el.innerHTML = "<tr><th>Model</th><th>Model No.</th><th>Price</th><th>Quantity</th><th>Distributor</th><th>Status</th></tr>";
    data.forEach(r => {
      const price = (r.price ?? "") !== "" && !Number.isNaN(Number(r.price)) ? Number(r.price).toFixed(2) : "-";
      el.innerHTML += `
        <tr>
          <td>${r.blanket_model}</td>
          <td>${r.model_number ?? "-"}</td>
          <td>${price}</td>
          <td>${r.quantity}</td>
          <td>${r.distributor_name || r.distributor_id}</td>
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
  } else {
    el.innerHTML = data.length === 0 ? "<p>No distributor requests.</p>" :
      data.map(r => `
        <div class="request-item">
          <p><strong>${r.blanket_model}</strong> (${r.model_number ?? "-"}) - ${r.quantity} ${r.price ? `@ ${Number(r.price).toFixed(2)}` : ""} (Distributor ${r.distributor_name || r.distributor_id})</p>
          <select onchange="updateDistributorRequestStatus(${r.id}, this.value)">
            <option value="" disabled selected>${r.status || "Pending"}</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Denied">Denied</option>
          </select>
        </div>`).join('');
  }
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
  const el = document.getElementById("distributor-request-history");
  if (!el) return;

  if (el.tagName === "TABLE") {
    if (data.length === 0) {
      el.innerHTML = "<tr><td colspan='6'>No completed or denied requests.</td></tr>";
      return;
    }
    el.innerHTML = "<tr><th>Model</th><th>Model No.</th><th>Price</th><th>Quantity</th><th>Distributor</th><th>Status</th></tr>";
    data.forEach(r => {
      const price = (r.price ?? "") !== "" && !Number.isNaN(Number(r.price)) ? Number(r.price).toFixed(2) : "-";
      el.innerHTML += `
        <tr>
          <td>${r.blanket_model}</td>
          <td>${r.model_number ?? "-"}</td>
          <td>${price}</td>
          <td>${r.quantity}</td>
          <td>${r.distributor_name || r.distributor_id}</td>
          <td>${r.status}</td>
        </tr>`;
    });
  } else {
    el.innerHTML = data.length === 0
      ? "<p>No completed or denied requests.</p>"
      : data.map(r => `<p>${r.blanket_model} (${r.model_number ?? "-"}) - ${r.quantity} ${r.price ? `@ ${Number(r.price).toFixed(2)}` : ""} (Distributor ${r.distributor_name || r.distributor_id}) - <strong>${r.status}</strong></p>`).join('');
  }
}

async function loadLowStockAlerts() {
  const res = await fetch(`${MANUFACTURER_URL}/check-low-stock`);
  const data = await res.json();
  const div = document.getElementById("low-stock-alerts");
  if (!div) return;

  const rows = data.low_stock.map(i => `
    <tr>
      <td>${i.model}</td>
      <td>${i.model_number ?? "-"}</td>
      <td>${(i.price ?? "") !== "" && !Number.isNaN(Number(i.price)) ? Number(i.price).toFixed(2) : "-"}</td>
      <td>${i.quantity}</td>
    </tr>`).join('');

  div.innerHTML = data.low_stock.length === 0
    ? "<p>No low stock alerts.</p>"
    : `<table><tr><th>Model</th><th>Model No.</th><th>Price</th><th>Qty</th></tr>${rows}</table>`;
}

async function autoLoadLowStockAlerts() {
  await loadLowStockAlerts();
  setInterval(loadLowStockAlerts, 10000);
}

/* =====================
   ADMIN
   ===================== */

async function registerUser() {
  const username = document.getElementById('new-username')?.value.trim() || "";
  const password = document.getElementById('new-password')?.value.trim() || "";
  const role = document.getElementById('new-role')?.value.trim() || "";

  if (!username || !password || !role) {
    alert("Please fill all fields.");
    return;
  }

  const res = await fetch(`${AUTH_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + localStorage.getItem('token')
    },
    body: JSON.stringify({ username, password, role })
  });
  const data = await res.json();
  const msg = document.getElementById('register-msg');
  if (msg) msg.innerText = data.msg || "User registered";
  loadAllUsers();
}

async function loadAllUsers() {
  const token = localStorage.getItem("token");
  const usersTable = document.getElementById("usersTableBody");
  if (!usersTable) return;

  usersTable.innerHTML = "";

  try {
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
  } catch (err) {
    console.error("loadAllUsers failed:", err);
    usersTable.innerHTML = `<tr><td colspan="3">Error loading users</td></tr>`;
  }
}

async function deleteUserFromTable(username) {
  const token = localStorage.getItem("token");
  if (!confirm(`Are you sure you want to delete user "${username}"?`)) return;

  try {
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
  } catch (error) {
    console.error("Delete error:", error);
    alert("Error deleting user");
  }
}

/* =====================
   SHARED UI
   ===================== */

function logout() {
  localStorage.clear();
  window.location.href = "index.html";
}

function showAddStockPopup() {
  const popup = document.getElementById('popup-form');
  if (!popup) return;
  popup.classList.add('active');

  ['add-model','add-model-number','add-price','add-qty'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  const modelInput = document.getElementById('add-model');
  if (modelInput) {
    const p = window.location.pathname;
    if (p.includes("seller.html")) modelInput.placeholder = "Enter Blanket Model";
    else if (p.includes("distributor.html")) modelInput.placeholder = "Enter Stock Model";
    else if (p.includes("manufacturer.html")) modelInput.placeholder = "Enter Production Model";
  }
}

function hideAddStockPopup() {
  const popup = document.getElementById('popup-form');
  if (popup) popup.classList.remove('active');
}

/* =========================
   MAKE FUNCTIONS GLOBAL
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
  loadDistributorRequestHistory,
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
