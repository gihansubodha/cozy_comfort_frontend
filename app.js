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
    showWelcome();

    if (window.location.pathname.includes("seller.html")) {
        loadSellerStock();
        autoLoadLowStock();
        loadDistributors(); //  Load distributors for dropdown

    } else if (window.location.pathname.includes("distributor.html")) {
        loadDistributorStock();
        loadPendingRequests();
        loadDistributorLowStock();
        loadDistributorRequestHistory(); //  Load history on distributor dashboard
        setInterval(loadDistributorLowStock, 10000);
        setInterval(loadPendingRequests, 10000);

    } else if (window.location.pathname.includes("manufacturer.html")) {
        loadManufacturerStock();
        autoLoadLowStockAlerts();
        loadDistributorRequests();
        loadDistributorRequestHistory(); //  Load history on manufacturer dashboard

    } else if (window.location.pathname.includes("admin.html")) {
        loadAllUsers();
    }
});

//  Login Function
async function login() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

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
            document.getElementById('login-msg').innerText = data.msg;
        }
    } catch (err) {
        console.error("Login Error:", err);
        document.getElementById('login-msg').innerText = "Login failed. Check server.";
    }
}

//  Welcome Message
function showWelcome() {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const msg = document.getElementById('welcome-msg');
    if (msg && username && role) msg.innerText = `Welcome, ${username} | ${role}`;
}

/* =========================
   Helpers
   ========================= */
function fmtPrice(p) {
  const n = Number(p);
  return Number.isFinite(n) ? n.toFixed(2) : "-";
}
function safe(val, fallback = "-") {
  return (val === null || val === undefined || val === "") ? fallback : val;
}

/* =========================
   SELLER
   ========================= */
async function loadSellerStock() {
    if (!seller_id) return;
    const res = await fetch(`${SELLER_URL}/stock/${seller_id}`);
    const stock = await res.json();
    const table = document.getElementById("seller-stock-table");
    if (!table) return;

    // Now shows Model / Model # / Price / Quantity
    table.innerHTML = `
      <tr>
        <th>Model</th>
        <th>Model No.</th>
        <th>Price</th>
        <th>Quantity</th>
        <th>Actions</th>
      </tr>`;

    stock.forEach(item => {
        const price = fmtPrice(item.price);
        const modelNumber = safe(item.model_number);
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
    const blanket_model = document.getElementById('add-model')?.value.trim() || "";
    const model_number = document.getElementById('add-model-number')?.value.trim() || "";
    const priceRaw = document.getElementById('add-price')?.value;
    const price = priceRaw !== undefined && priceRaw !== "" ? parseFloat(priceRaw) : null;
    const quantity = parseInt(document.getElementById('add-qty')?.value);

    if (!seller_id) {
        alert("Seller ID missing. Please log in again.");
        return;
    }
    if (!blanket_model || isNaN(quantity) || quantity < 0) {
        alert("Please enter a valid model and quantity.");
        return;
    }

    try {
        const res = await fetch(`${SELLER_URL}/stock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seller_id: parseInt(seller_id), blanket_model, model_number, price, quantity })
        });
        const data = await res.json();

        if (res.ok) {
            alert(data.msg || "Stock item added!");
            hideAddStockPopup();
            loadSellerStock();
        } else {
            alert("Failed to add stock: " + (data.msg || "Unknown error"));
        }
    } catch (err) {
        console.error("Add Seller Stock Error:", err);
        alert("Server error while adding stock.");
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

    // Table layout with safe defaults
    if (!data.low_stock || data.low_stock.length === 0) {
      div.innerHTML = "<p>No low stock items.</p>";
      return;
    }

    const rows = data.low_stock.map(i => {
      return `<tr>
        <td>${safe(i.blanket_model)}</td>
        <td>${safe(i.model_number)}</td>
        <td>${fmtPrice(i.price)}</td>
        <td>${safe(i.quantity)}</td>
      </tr>`;
    }).join("");

    div.innerHTML = `
      <table>
        <tr><th>Model</th><th>Model No.</th><th>Price</th><th>Qty</th></tr>
        ${rows}
      </table>`;
}

//  Load Distributor List for Dropdown
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
    const distributor_id = parseInt(document.getElementById('distributor-select')?.value);
    const blanket_model = document.getElementById('request-model')?.value.trim() || "";
    const model_number = document.getElementById('request-model-number')?.value.trim() || null;
    const priceRaw = document.getElementById('request-price')?.value;
    const price = priceRaw !== undefined && priceRaw !== "" ? parseFloat(priceRaw) : null;
    const quantity = parseInt(document.getElementById('request-qty')?.value);

    if (!distributor_id || !blanket_model || isNaN(quantity) || quantity <= 0) {
        alert("Select a distributor and enter valid details.");
        return;
    }

    await fetch(`${SELLER_URL}/request-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_id, distributor_id, blanket_model, model_number, price, quantity })
    });

    document.getElementById('request-msg') && (document.getElementById('request-msg').innerText = "Stock request saved to database!");
    document.getElementById('request-model') && (document.getElementById('request-model').value = "");
    document.getElementById('request-model-number') && (document.getElementById('request-model-number').value = "");
    document.getElementById('request-price') && (document.getElementById('request-price').value = "");
    document.getElementById('request-qty') && (document.getElementById('request-qty').value = "");
    const sel = document.getElementById('distributor-select');
    if (sel) sel.value = "";
}

/* =========================
   DISTRIBUTOR
   ========================= */
async function loadDistributorStock() {
    if (!distributor_id) return;
    const res = await fetch(`${DISTRIBUTOR_URL}/stock/${distributor_id}`);
    const stock = await res.json();
    const table = document.getElementById("distributor-stock-table");
    if (!table) return;

    // Now shows Model / Model # / Price / Quantity
    table.innerHTML = "<tr><th>Model</th><th>Model No.</th><th>Price</th><th>Quantity</th><th>Actions</th></tr>";

    stock.forEach(item => {
        table.innerHTML += `
            <tr>
                <td>${item.blanket_model}</td>
                <td>${safe(item.model_number)}</td>
                <td>${fmtPrice(item.price)}</td>
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
    const priceRaw = document.getElementById('add-price')?.value;
    const price = priceRaw !== undefined && priceRaw !== "" ? parseFloat(priceRaw) : null;
    const quantity = parseInt(document.getElementById('add-qty')?.value);

    if (!distributor_id) {
        alert("Distributor ID missing. Please log in again.");
        return;
    }
    if (!blanket_model || isNaN(quantity) || quantity < 0) {
        alert("Please enter a valid model and quantity.");
        return;
    }

    try {
        const res = await fetch(`${DISTRIBUTOR_URL}/stock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ distributor_id: parseInt(distributor_id), blanket_model, model_number, price, quantity })
        });
        const data = await res.json();

        if (res.ok) {
            alert(data.msg || "Distributor stock item added!");
            hideAddStockPopup();
            loadDistributorStock();
        } else {
            alert("Failed to add stock: " + (data.msg || "Unknown error"));
        }
    } catch (err) {
        console.error("Add Distributor Stock Error:", err);
        alert("Server error while adding distributor stock.");
    }
}

// Pending Seller Requests -> table with actions
async function loadPendingRequests() {
    const res = await fetch(`${DISTRIBUTOR_URL}/seller-requests/${distributor_id}`);
    const data = await res.json();
    const table = document.getElementById("pending-requests");
    if (!table) return;

    if (!Array.isArray(data) || data.length === 0) {
        table.innerHTML = "<p>No pending requests.</p>";
        return;
    }

    table.innerHTML = `
      <tr>
        <th>Model</th>
        <th>Model No.</th>
        <th>Price</th>
        <th>Qty</th>
        <th>Seller</th>
        <th>Status</th>
        <th>Actions</th>
      </tr>`;

    data.forEach(r => {
        table.innerHTML += `
          <tr>
            <td>${safe(r.blanket_model)}</td>
            <td>${safe(r.model_number)}</td>
            <td>${fmtPrice(r.price)}</td>
            <td>${safe(r.quantity)}</td>
            <td>${safe(r.seller_name || r.seller_id)}</td>
            <td>${safe(r.status || 'Pending')}</td>
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

// Request History -> table with price formatting
async function loadDistributorRequestHistory() {
    const res = await fetch(`${DISTRIBUTOR_URL}/seller-request-history/${distributor_id}`);
    const data = await res.json();
    const table = document.getElementById("request-history");
    if (!table) return;

    if (!Array.isArray(data) || data.length === 0) {
        table.innerHTML = "<p>No completed or denied requests.</p>";
        return;
    }

    table.innerHTML = `
      <tr>
        <th>Model</th>
        <th>Model No.</th>
        <th>Price</th>
        <th>Qty</th>
        <th>Seller</th>
        <th>Status</th>
      </tr>`;

    data.forEach(r => {
        table.innerHTML += `
          <tr>
            <td>${safe(r.blanket_model)}</td>
            <td>${safe(r.model_number)}</td>
            <td>${fmtPrice(r.price)}</td>
            <td>${safe(r.quantity)}</td>
            <td>${safe(r.seller_name || r.seller_id)}</td>
            <td>${safe(r.status)}</td>
          </tr>`;
    });
}

async function loadDistributorLowStock() {
    const res = await fetch(`${DISTRIBUTOR_URL}/check-low-stock/${distributor_id}`);
    const data = await res.json();
    const div = document.getElementById("distributor-low-stock");
    if (!div) return;

    if (!data.low_stock || data.low_stock.length === 0) {
      div.innerHTML = "<p>No low stock items.</p>";
      return;
    }

    const rows = data.low_stock.map(i => `
      <tr>
        <td>${safe(i.blanket_model)}</td>
        <td>${safe(i.model_number)}</td>
        <td>${fmtPrice(i.price)}</td>
        <td>${safe(i.quantity)}</td>
      </tr>
    `).join("");

    div.innerHTML = `
      <table>
        <tr><th>Model</th><th>Model No.</th><th>Price</th><th>Qty</th></tr>
        ${rows}
      </table>`;
}

async function sendManufacturerRequest() {
    const blanket_model = document.getElementById('request-model')?.value.trim() || "";
    const model_number = document.getElementById('request-model-number')?.value.trim() || null;
    const priceRaw = document.getElementById('request-price')?.value;
    const price = priceRaw !== undefined && priceRaw !== "" ? parseFloat(priceRaw) : null;
    const quantity = parseInt(document.getElementById('request-qty')?.value);

    if (!blanket_model || isNaN(quantity) || quantity <= 0) {
        alert("Enter valid request details.");
        return;
    }

    await fetch(`${DISTRIBUTOR_URL}/request-manufacturer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distributor_id, blanket_model, model_number, price, quantity })
    });

    document.getElementById('request-msg') && (document.getElementById('request-msg').innerText = "Stock request saved to database!");
    document.getElementById('request-model') && (document.getElementById('request-model').value = "");
    document.getElementById('request-model-number') && (document.getElementById('request-model-number').value = "");
    document.getElementById('request-price') && (document.getElementById('request-price').value = "");
    document.getElementById('request-qty') && (document.getElementById('request-qty').value = "");
}

/* =========================
   MANUFACTURER
   ========================= */
async function loadManufacturerStock() {
    try {
        const res = await fetch(`${MANUFACTURER_URL}/blankets`);
        const stock = await res.json();
        const table = document.getElementById("manufacturer-stock-table");
        if (!table) return;

        // Rich table: Model, Model #, Material, Price, Quantity, Production Days, Min Required
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
            table.innerHTML += `
                <tr>
                    <td>${safe(item.model)}</td>
                    <td>${safe(item.model_number)}</td>
                    <td>${safe(item.material)}</td>
                    <td>${fmtPrice(item.price)}</td>
                    <td>${safe(item.quantity)}</td>
                    <td>${safe(item.production_days)}</td>
                    <td>${safe(item.min_required)}</td>
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
    const priceRaw = document.getElementById('add-price')?.value;
    const price = priceRaw !== undefined && priceRaw !== "" ? parseFloat(priceRaw) : null;
    const quantity = parseInt(document.getElementById('add-qty')?.value);

    if (!blanket_model || isNaN(quantity) || quantity < 0) {
        alert("Please enter a valid model and quantity.");
        return;
    }

    try {
        const res = await fetch(`${MANUFACTURER_URL}/blankets`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: blanket_model, model_number, price, material: "Cotton", quantity, production_days: 7 })
        });
        const data = await res.json();

        if (res.ok) {
            alert(data.msg || "Manufacturer stock item added!");
            hideAddStockPopup();
            loadManufacturerStock();
        } else {
            alert("Failed to add stock: " + (data.msg || "Unknown error"));
        }
    } catch (err) {
        console.error("Add Manufacturer Stock Error:", err);
        alert("Server error while adding manufacturer stock.");
    }
}

//  Edit Manufacturer Stock
async function editManufacturerStock(blanket_id, current_qty) {
    const new_qty = prompt("Enter new quantity:", current_qty);
    if (!new_qty) return;

    try {
        const res = await fetch(`${MANUFACTURER_URL}/blankets/${blanket_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: parseInt(new_qty) })
        });
        const data = await res.json();
        alert(data.msg || "Stock updated!");
        loadManufacturerStock();
    } catch (err) {
        console.error("Edit Manufacturer Stock Error:", err);
        alert("Failed to update stock.");
    }
}

//  Delete Manufacturer Stock
async function deleteManufacturerStock(blanket_id) {
    if (!confirm("Are you sure you want to delete this model?")) return;

    try {
        const res = await fetch(`${MANUFACTURER_URL}/blankets/${blanket_id}`, { method: "DELETE" });
        const data = await res.json();
        alert(data.msg || "Model deleted!");
        loadManufacturerStock();
    } catch (err) {
        console.error("Delete Manufacturer Stock Error:", err);
        alert("Failed to delete model.");
    }
}

// Distributor Requests -> table with status select
async function loadDistributorRequests() {
    try {
        const res = await fetch(`${MANUFACTURER_URL}/distributor-requests`);
        const data = await res.json();
        const table = document.getElementById("distributor-requests");
        if (!table) return;

        if (!Array.isArray(data) || data.length === 0) {
            table.innerHTML = "<p>No distributor requests.</p>";
            return;
        }

        table.innerHTML = `
          <tr>
            <th>Model</th>
            <th>Model No.</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Distributor</th>
            <th>Status</th>
          </tr>`;

        data.forEach(r => {
            table.innerHTML += `
              <tr>
                <td>${safe(r.blanket_model)}</td>
                <td>${safe(r.model_number)}</td>
                <td>${fmtPrice(r.price)}</td>
                <td>${safe(r.quantity)}</td>
                <td>${safe(r.distributor_id)}</td>
                <td>
                  <select onchange="updateDistributorRequestStatus(${r.id}, this.value)">
                    <option value="" disabled selected>${safe(r.status || "Pending")}</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Denied">Denied</option>
                  </select>
                </td>
              </tr>`;
        });
    } catch (err) {
        console.error("Failed to load distributor requests:", err);
    }
}

// Update Distributor Request Status and refresh lists
async function updateDistributorRequestStatus(request_id, new_status) {
    try {
        const res = await fetch(`${MANUFACTURER_URL}/distributor-requests/${request_id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: new_status })
        });
        const data = await res.json();
        alert(data.msg || "Status updated!");
        loadDistributorRequests();
        loadDistributorRequestHistory();
    } catch (err) {
        console.error("Update Distributor Request Status Error:", err);
        alert("Failed to update request status.");
    }
}

// Distributor Request History -> table
async function loadDistributorRequestHistory() {
    try {
        const res = await fetch(`${MANUFACTURER_URL}/distributor-request-history`);
        const data = await res.json();
        const table = document.getElementById("distributor-request-history");
        if (!table) return;

        if (!Array.isArray(data) || data.length === 0) {
            table.innerHTML = "<p>No completed or denied requests.</p>";
            return;
        }

        table.innerHTML = `
          <tr>
            <th>Model</th>
            <th>Model No.</th>
            <th>Price</th>
            <th>Qty</th>
            <th>Distributor</th>
            <th>Status</th>
          </tr>`;

        data.forEach(r => {
            table.innerHTML += `
              <tr>
                <td>${safe(r.blanket_model)}</td>
                <td>${safe(r.model_number)}</td>
                <td>${fmtPrice(r.price)}</td>
                <td>${safe(r.quantity)}</td>
                <td>${safe(r.distributor_id)}</td>
                <td>${safe(r.status)}</td>
              </tr>`;
        });
    } catch (err) {
        console.error("Load Distributor Request History Error:", err);
    }
}

// Low Stock Alerts -> table
async function loadLowStockAlerts() {
    try {
        const res = await fetch(`${MANUFACTURER_URL}/check-low-stock`);
        const data = await res.json();
        const div = document.getElementById("low-stock-alerts");
        if (!div) return;

        if (!data.low_stock || data.low_stock.length === 0) {
          div.innerHTML = "<p>No low stock alerts.</p>";
          return;
        }

        const rows = data.low_stock.map(i => `
          <tr>
            <td>${safe(i.model)}</td>
            <td>${safe(i.model_number)}</td>
            <td>${fmtPrice(i.price)}</td>
            <td>${safe(i.quantity)}</td>
          </tr>
        `).join("");

        div.innerHTML = `
          <table>
            <tr><th>Model</th><th>Model No.</th><th>Price</th><th>Qty</th></tr>
            ${rows}
          </table>`;
    } catch (err) {
        console.error("Failed to load low stock alerts:", err);
    }
}

async function autoLoadLowStockAlerts() {
    await loadLowStockAlerts();
    setInterval(loadLowStockAlerts, 10000);
}

/* =========================
   ADMIN (unchanged logic, already with Bearer + error handling)
   ========================= */
async function registerUser() {
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value.trim();
    const role = document.getElementById('new-role').value.trim();

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
    document.getElementById('register-msg').innerText = data.msg;
    loadAllUsers();
}

async function loadAllUsers() {
    const token = localStorage.getItem("token");
    const usersTable = document.getElementById("usersTableBody");
    usersTable.innerHTML = ""; //  Prevent duplicates

    try {
        const response = await fetch(`${AUTH_URL}/all_users`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`
            }
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
            loadAllUsers(); // Refresh table
        } else {
            alert(data.error || "Failed to delete user");
        }
    } catch (error) {
        console.error("Delete error:", error);
        alert("Error deleting user");
    }
}

//  Logout
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

//  Universal Add Stock Popups (clears all fields + contextual placeholder)
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

    if (modelInput) {
      if (window.location.pathname.includes("seller.html")) {
          modelInput.placeholder = "Enter Blanket Model";
      } else if (window.location.pathname.includes("distributor.html")) {
          modelInput.placeholder = "Enter Stock Model";
      } else if (window.location.pathname.includes("manufacturer.html")) {
          modelInput.placeholder = "Enter Production Model";
      }
    }
}

function hideAddStockPopup() {
    const el = document.getElementById('popup-form');
    if (el) el.classList.remove('active');
}
