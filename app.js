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
  const usernameEl = document.getElementById('username');
  const passwordEl = document.getElementById('password');
  const msg = document.getElementById('login-msg');

  const username = (usernameEl?.value || "").trim();
  const password = (passwordEl?.value || "").trim();

  if (!username || !password) {
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

    if (!res.ok) {
      if (msg) msg.innerText = data.msg || "Login failed.";
      return;
    }

    // get user id/role details
    const userRes = await fetch(`${AUTH_URL}/get_user/${encodeURIComponent(username)}`);
    const userData = await userRes.json();

    // save auth + identity
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('username', username);

    if (data.role === "seller")       localStorage.setItem('seller_id', userData.id);
    if (data.role === "distributor")  localStorage.setItem('distributor_id', userData.id);
    if (data.role === "manufacturer") localStorage.setItem('manufacturer_id', userData.id);

    // route by role
    if (data.role === "seller")        window.location.href = "seller.html";
    else if (data.role === "distributor") window.location.href = "distributor.html";
    else if (data.role === "manufacturer") window.location.href = "manufacturer.html";
    else if (data.role === "admin")      window.location.href = "admin.html";
    else if (msg) msg.innerText = "Unknown role.";
  } catch (err) {
    console.error("Login Error:", err);
    if (msg) msg.innerText = "Login failed. Check server.";
  }
}

// make it available for onclick="login()"
window.login = login;

//  Welcome Message
function showWelcome() {
    const username = localStorage.getItem('username');
    const role = localStorage.getItem('role');
    const msg = document.getElementById('welcome-msg');
    if (msg && username && role) msg.innerText = Welcome, ${username} | ${role};
}

// ---------------- SELLER ---------------- //
async function loadSellerStock() {
    if (!seller_id) return;
    const res = await fetch(${SELLER_URL}/stock/${seller_id});
    const stock = await res.json();
    const table = document.getElementById("seller-stock-table");
    table.innerHTML = "<tr><th>Model</th><th>Quantity</th><th>Actions</th></tr>";
    stock.forEach(item => {
        table.innerHTML += 
            <tr>
                <td>${item.blanket_model}</td>
                <td>${item.quantity}</td>
                <td>
                    <button class="btn" onclick="editStock(${item.id}, ${item.quantity})">Edit</button>
                    <button class="btn cancel" onclick="deleteStock(${item.id})">Delete</button>
                </td>
            </tr>;
    });
}

async function addSellerStock() {
    const blanket_model = document.getElementById('add-model').value.trim();
    const quantity = parseInt(document.getElementById('add-qty').value);

    if (!seller_id) {
        alert("Seller ID missing. Please log in again.");
        return;
    }
    if (!blanket_model || isNaN(quantity) || quantity < 0) {
        alert("Please enter a valid model and quantity.");
        return;
    }

    try {
        const res = await fetch(${SELLER_URL}/stock, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seller_id: parseInt(seller_id), blanket_model, quantity })
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
    await fetch(${SELLER_URL}/stock/${stock_id}, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: parseInt(new_qty) })
    });
    loadSellerStock();
}

async function deleteStock(stock_id) {
    if (!confirm("Are you sure?")) return;
    await fetch(${SELLER_URL}/stock/${stock_id}, { method: "DELETE" });
    loadSellerStock();
}

async function autoLoadLowStock() {
    await loadLowStock();
    setInterval(loadLowStock, 10000);
}

async function loadLowStock() {
    if (!seller_id) return;
    const res = await fetch(${SELLER_URL}/check-low-stock/${seller_id});
    const data = await res.json();
    const listDiv = document.getElementById('low-stock-list');
    listDiv.innerHTML = data.low_stock.length === 0 ?
        "<p>No low stock items.</p>" :
        data.low_stock.map(i => <p><strong>${i.blanket_model}</strong> - ${i.quantity} left</p>).join('');
}

//  Load Distributor List for Dropdown
async function loadDistributors() {
    try {
        const res = await fetch(${DISTRIBUTOR_URL}/all);
        const distributors = await res.json();

        const select = document.getElementById("distributor-select");
        select.innerHTML = <option value="">Select Distributor</option>;
        distributors.forEach(d => {
            select.innerHTML += <option value="${d.id}">${d.name}</option>;
        });
    } catch (err) {
        console.error("Failed to load distributors:", err);
    }
}

async function sendStockRequest() {
    const distributor_id = parseInt(document.getElementById('distributor-select').value);
    const blanket_model = document.getElementById('request-model').value.trim();
    const quantity = parseInt(document.getElementById('request-qty').value);

    if (!distributor_id || !blanket_model || isNaN(quantity) || quantity <= 0) {
        alert("Select a distributor and enter valid details.");
        return;
    }

    await fetch(${SELLER_URL}/request-stock, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_id, distributor_id, blanket_model, quantity })
    });

    document.getElementById('request-msg').innerText = "Stock request saved to database!";
    document.getElementById('request-model').value = "";
    document.getElementById('request-qty').value = "";
    document.getElementById('distributor-select').value = "";
}

// ---------------- DISTRIBUTOR ---------------- //
async function loadDistributorStock() {
    if (!distributor_id) return;
    const res = await fetch(${DISTRIBUTOR_URL}/stock/${distributor_id});
    const stock = await res.json();
    const table = document.getElementById("distributor-stock-table");
    table.innerHTML = "<tr><th>Model</th><th>Quantity</th><th>Actions</th></tr>";

    stock.forEach(item => {
        table.innerHTML += 
            <tr>
                <td>${item.blanket_model}</td>
                <td>${item.quantity}</td>
                <td>
                    <button class="btn" onclick="editDistributorStock(${item.id}, ${item.quantity})">Edit</button>
                    <button class="btn cancel" onclick="deleteDistributorStock(${item.id})">Delete</button>
                </td>
            </tr>;
    });
}

async function editDistributorStock(stock_id, current_qty) {
    const new_qty = prompt("Enter new quantity:", current_qty);
    if (!new_qty) return;
    await fetch(${DISTRIBUTOR_URL}/stock/${stock_id}, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: parseInt(new_qty) })
    });
    loadDistributorStock();
}

async function deleteDistributorStock(stock_id) {
    if (!confirm("Are you sure?")) return;
    await fetch(${DISTRIBUTOR_URL}/stock/${stock_id}, { method: "DELETE" });
    loadDistributorStock();
}

async function addDistributorStock() {
    const blanket_model = document.getElementById('add-model').value.trim();
    const quantity = parseInt(document.getElementById('add-qty').value);

    if (!distributor_id) {
        alert("Distributor ID missing. Please log in again.");
        return;
    }
    if (!blanket_model || isNaN(quantity) || quantity < 0) {
        alert("Please enter a valid model and quantity.");
        return;
    }

    try {
        const res = await fetch(${DISTRIBUTOR_URL}/stock, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ distributor_id: parseInt(distributor_id), blanket_model, quantity })
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

//  Load Pending Seller Requests with Actions
async function loadPendingRequests() {
    const res = await fetch(${DISTRIBUTOR_URL}/seller-requests/${distributor_id});
    const data = await res.json();
    const div = document.getElementById("pending-requests");

    div.innerHTML = data.length === 0 ? "<p>No pending requests.</p>" :
        data.map(r => 
            <p>
                ${r.blanket_model} - ${r.quantity} (Seller: ${r.seller_name || r.seller_id}) 
                [Status: ${r.status || 'Pending'}]
                <button onclick="updateRequestStatus(${r.id}, 'Completed')">Complete</button>
                <button onclick="updateRequestStatus(${r.id}, 'Denied')">Deny</button>
                <button onclick="updateRequestStatus(${r.id}, 'Pending')">Pending</button>
            </p>
        ).join('');
}

// Update Request Status and Refresh
async function updateRequestStatus(request_id, status) {
    await fetch(${DISTRIBUTOR_URL}/seller-requests/${request_id}, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
    });
    loadPendingRequests();
    loadDistributorRequestHistory();
}

//  Load Distributor Request History (Completed/Denied Requests)
async function loadDistributorRequestHistory() {
    const res = await fetch(${DISTRIBUTOR_URL}/seller-request-history/${distributor_id});
    const data = await res.json();
    const historyDiv = document.getElementById("request-history");

    historyDiv.innerHTML = data.length === 0 ? "<p>No completed or denied requests.</p>" :
        data.map(r => <p>${r.blanket_model} - ${r.quantity} (Seller: ${r.seller_name || r.seller_id}) - <strong>${r.status}</strong></p>).join('');
}

async function loadDistributorLowStock() {
    const res = await fetch(${DISTRIBUTOR_URL}/check-low-stock/${distributor_id});
    const data = await res.json();
    const div = document.getElementById("distributor-low-stock");
    div.innerHTML = data.low_stock.length === 0 ?
        "<p>No low stock items.</p>" :
        data.low_stock.map(i => <p><strong>${i.blanket_model}</strong> - ${i.quantity} left</p>).join('');
}

async function sendManufacturerRequest() {
    const blanket_model = document.getElementById('request-model').value.trim();
    const quantity = parseInt(document.getElementById('request-qty').value);

    if (!blanket_model || isNaN(quantity) || quantity <= 0) {
        alert("Enter valid request details.");
        return;
    }

    await fetch(${DISTRIBUTOR_URL}/request-manufacturer, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distributor_id, blanket_model, quantity })
    });

    document.getElementById('request-msg').innerText = "Stock request saved to database!";
    document.getElementById('request-model').value = "";
    document.getElementById('request-qty').value = "";
}

// ---------------- MANUFACTURER ---------------- //
async function loadManufacturerStock() {
    try {
        const res = await fetch(${MANUFACTURER_URL}/blankets);
        const stock = await res.json();
        const table = document.getElementById("manufacturer-stock-table");
        table.innerHTML = "<tr><th>Model</th><th>Quantity</th><th>Actions</th></tr>";

        stock.forEach(item => {
            table.innerHTML += 
                <tr>
                    <td>${item.model}</td>
                    <td>${item.quantity}</td>
                    <td>
                        <button class="btn" onclick="editManufacturerStock(${item.id}, ${item.quantity})">Edit</button>
                        <button class="btn cancel" onclick="deleteManufacturerStock(${item.id})">Delete</button>
                    </td>
                </tr>;
        });
    } catch (err) {
        console.error("Failed to load manufacturer stock:", err);
    }
}

async function addManufacturerStock() {
    const blanket_model = document.getElementById('add-model').value.trim();
    const quantity = parseInt(document.getElementById('add-qty').value);

    if (!blanket_model || isNaN(quantity) || quantity < 0) {
        alert("Please enter a valid model and quantity.");
        return;
    }

    try {
        const res = await fetch(${MANUFACTURER_URL}/blankets, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ model: blanket_model, material: "Cotton", quantity, production_days: 7 })
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
        const res = await fetch(${MANUFACTURER_URL}/blankets/${blanket_id}, {
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
        const res = await fetch(${MANUFACTURER_URL}/blankets/${blanket_id}, { method: "DELETE" });
        const data = await res.json();
        alert(data.msg || "Model deleted!");
        loadManufacturerStock();
    } catch (err) {
        console.error("Delete Manufacturer Stock Error:", err);
        alert("Failed to delete model.");
    }
}

//  Load Distributor Requests with Status Dropdown
async function loadDistributorRequests() {
    try {
        const res = await fetch(${MANUFACTURER_URL}/distributor-requests);
        const data = await res.json();
        const div = document.getElementById("distributor-requests");

        if (data.length === 0) {
            div.innerHTML = "<p>No distributor requests.</p>";
            return;
        }

        div.innerHTML = data.map(r => 
            <div class="request-item">
                <p><strong>${r.blanket_model}</strong> - ${r.quantity} (Distributor ${r.distributor_id})</p>
                <select onchange="updateDistributorRequestStatus(${r.id}, this.value)">
                    <option value="" disabled selected>${r.status || "Pending"}</option>
                    <option value="Pending">Pending</option>
                    <option value="Completed">Completed</option>
                    <option value="Denied">Denied</option>
                </select>
            </div>
        ).join('');
    } catch (err) {
        console.error("Failed to load distributor requests:", err);
    }
}

//  Update Distributor Request Status and Move to History
async function updateDistributorRequestStatus(request_id, new_status) {
    try {
        const res = await fetch(${MANUFACTURER_URL}/distributor-requests/${request_id}, {
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

//  Load Distributor Request History (Completed/Denied)
async function loadDistributorRequestHistory() {
    try {
        const res = await fetch(${MANUFACTURER_URL}/distributor-request-history);
        const data = await res.json();
        const historyDiv = document.getElementById("distributor-request-history");

        historyDiv.innerHTML = data.length === 0
            ? "<p>No completed or denied requests.</p>"
            : data.map(r => <p>${r.blanket_model} - ${r.quantity} (Distributor ${r.distributor_id}) - <strong>${r.status}</strong></p>).join('');
    } catch (err) {
        console.error("Load Distributor Request History Error:", err);
    }
}

//  Low Stock Alerts
async function loadLowStockAlerts() {
    try {
        const res = await fetch(${MANUFACTURER_URL}/check-low-stock);
        const data = await res.json();
        const div = document.getElementById("low-stock-alerts");
        div.innerHTML = data.low_stock.length === 0 ?
            "<p>No low stock alerts.</p>" :
            data.low_stock.map(i => <p><strong>${i.model}</strong> - ${i.quantity} left</p>).join('');
    } catch (err) {
        console.error("Failed to load low stock alerts:", err);
    }
}

async function autoLoadLowStockAlerts() {
    await loadLowStockAlerts();
    setInterval(loadLowStockAlerts, 10000);
}

// ---------------- ADMIN ---------------- //
async function registerUser() {
    const username = document.getElementById('new-username').value.trim();
    const password = document.getElementById('new-password').value.trim();
    const role = document.getElementById('new-role').value.trim();

    if (!username || !password || !role) {
        alert("Please fill all fields.");
        return;
    }

    const res = await fetch(${AUTH_URL}/register, {
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
        const response = await fetch(${AUTH_URL}/all_users, {
            method: "GET",
            headers: {
                "Authorization": Bearer ${token}
            }
        });

        const data = await response.json();

        if (response.ok && data.users) {
            data.users.forEach(user => {
                const row = document.createElement("tr");

                row.innerHTML = 
                    <td>${user.username}</td>
                    <td>${user.role}</td>
                    <td><button class="btn cancel" onclick="deleteUserFromTable('${user.username}')">Delete</button></td>
                ;

                usersTable.appendChild(row);
            });
        } else {
            usersTable.innerHTML = <tr><td colspan="3">Failed to load users</td></tr>;
        }
    } catch (err) {
        console.error("loadAllUsers failed:", err);
        usersTable.innerHTML = <tr><td colspan="3">Error loading users</td></tr>;
    }
}

async function deleteUserFromTable(username) {
    const token = localStorage.getItem("token");
    if (!confirm(Are you sure you want to delete user "${username}"?)) return;

    try {
        const response = await fetch(${AUTH_URL}/delete_user, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": Bearer ${token}
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

//  Universal Add Stock Popups
function showAddStockPopup() {
    const popup = document.getElementById('popup-form');
    popup.classList.add('active');

    const modelInput = document.getElementById('add-model');
    const qtyInput = document.getElementById('add-qty');
    if (modelInput) modelInput.value = '';
    if (qtyInput) qtyInput.value = '';

    if (window.location.pathname.includes("seller.html"))
 {
        modelInput.placeholder = "Enter Blanket Model";
    } else if (window.location.pathname.includes("distributor.html")) {
        modelInput.placeholder = "Enter Stock Model";
    } else if (window.location.pathname.includes("manufacturer.html")) {
        modelInput.placeholder = "Enter Production Model";
    }
}

function hideAddStockPopup() {
    document.getElementById('popup-form').classList.remove('active');
}

