// 🔗 API URLs
const AUTH_URL = "https://auth-service-okqn.onrender.com";
const SELLER_URL = "https://seller-service-viqu.onrender.com";
const DISTRIBUTOR_URL = "https://distributor-service-abc.onrender.com";
const MANUFACTURER_URL = "https://manufacturer-service-xyz.onrender.com";

// ✅ Dynamic IDs
const seller_id = localStorage.getItem('seller_id');
const distributor_id = localStorage.getItem('distributor_id');
const manufacturer_id = localStorage.getItem('manufacturer_id');

// ✅ Login Function
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

// ✅ Welcome Message
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
    table.innerHTML = "<tr><th>Model</th><th>Quantity</th><th>Actions</th></tr>";
    stock.forEach(item => {
        table.innerHTML += `
            <tr>
                <td>${item.blanket_model}</td>
                <td>${item.quantity}</td>
                <td>
                    <button class="btn" onclick="editStock(${item.id}, ${item.quantity})">Edit</button>
                    <button class="btn cancel" onclick="deleteStock(${item.id})">Delete</button>
                </td>
            </tr>`;
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
        const res = await fetch(`${SELLER_URL}/stock`, {
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
    const listDiv = document.getElementById('low-stock-list');
    listDiv.innerHTML = data.low_stock.length === 0 ?
        "<p>No low stock items.</p>" :
        data.low_stock.map(i => `<p><strong>${i.blanket_model}</strong> - ${i.quantity} left</p>`).join('');
}

async function sendStockRequest() {
    const distributor_id = parseInt(document.getElementById('distributor-id').value);
    const blanket_model = document.getElementById('request-model').value.trim();
    const quantity = parseInt(document.getElementById('request-qty').value);

    if (!blanket_model || isNaN(quantity) || quantity <= 0) {
        alert("Enter valid request details.");
        return;
    }

    await fetch(`${SELLER_URL}/request-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_id, distributor_id, blanket_model, quantity })
    });
    document.getElementById('request-msg').innerText = "Request sent!";
}

// ---------------- DISTRIBUTOR ---------------- //
async function loadDistributorStock() {
    if (!distributor_id) return;
    const res = await fetch(`${DISTRIBUTOR_URL}/stock/${distributor_id}`);
    const stock = await res.json();
    const table = document.getElementById("distributor-stock-table");
    table.innerHTML = "<tr><th>Model</th><th>Quantity</th></tr>";
    stock.forEach(item => {
        table.innerHTML += `<tr><td>${item.blanket_model}</td><td>${item.quantity}</td></tr>`;
    });
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
        const res = await fetch(`${DISTRIBUTOR_URL}/stock`, {
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

async function loadPendingRequests() {
    const res = await fetch(`${DISTRIBUTOR_URL}/pending-requests/${distributor_id}`);
    const data = await res.json();
    const div = document.getElementById("pending-requests");
    div.innerHTML = data.length === 0 ? "<p>No pending requests.</p>" :
        data.map(r => `<p>${r.blanket_model} - ${r.quantity} (Seller ${r.seller_id})</p>`).join('');
}

async function loadDistributorLowStock() {
    const res = await fetch(`${DISTRIBUTOR_URL}/check-low-stock/${distributor_id}`);
    const data = await res.json();
    const div = document.getElementById("distributor-low-stock");
    div.innerHTML = data.low_stock.length === 0 ?
        "<p>No low stock items.</p>" :
        data.low_stock.map(i => `<p><strong>${i.blanket_model}</strong> - ${i.quantity} left</p>`).join('');
}

async function sendManufacturerRequest() {
    const blanket_model = document.getElementById('request-model').value.trim();
    const quantity = parseInt(document.getElementById('request-qty').value);

    if (!blanket_model || isNaN(quantity) || quantity <= 0) {
        alert("Enter valid request details.");
        return;
    }

    await fetch(`${DISTRIBUTOR_URL}/request-manufacturer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distributor_id, blanket_model, quantity })
    });
    document.getElementById('request-msg').innerText = "Request sent!";
}

// ---------------- MANUFACTURER ---------------- //
async function loadManufacturerStock() {
    if (!manufacturer_id) return;
    const res = await fetch(`${MANUFACTURER_URL}/stock/${manufacturer_id}`);
    const stock = await res.json();
    const table = document.getElementById("manufacturer-stock-table");
    table.innerHTML = "<tr><th>Model</th><th>Quantity</th></tr>";
    stock.forEach(item => {
        table.innerHTML += `<tr><td>${item.blanket_model}</td><td>${item.quantity}</td></tr>`;
    });
}

async function addManufacturerStock() {
    const blanket_model = document.getElementById('add-model').value.trim();
    const quantity = parseInt(document.getElementById('add-qty').value);

    if (!manufacturer_id) {
        alert("Manufacturer ID missing. Please log in again.");
        return;
    }
    if (!blanket_model || isNaN(quantity) || quantity < 0) {
        alert("Please enter a valid model and quantity.");
        return;
    }

    try {
        const res = await fetch(`${MANUFACTURER_URL}/stock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ manufacturer_id: parseInt(manufacturer_id), blanket_model, quantity })
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

async function loadDistributorRequests() {
    const res = await fetch(`${MANUFACTURER_URL}/distributor-requests/${manufacturer_id}`);
    const data = await res.json();
    const div = document.getElementById("distributor-requests");
    div.innerHTML = data.length === 0 ? "<p>No distributor requests.</p>" :
        data.map(r => `<p>${r.blanket_model} - ${r.quantity} (Distributor ${r.distributor_id})</p>`).join('');
}

async function loadLowStockAlerts() {
    const res = await fetch(`${MANUFACTURER_URL}/check-low-stock/${manufacturer_id}`);
    const data = await res.json();
    const div = document.getElementById("low-stock-alerts");
    div.innerHTML = data.low_stock.length === 0 ?
        "<p>No low stock alerts.</p>" :
        data.low_stock.map(i => `<p><strong>${i.blanket_model}</strong> - ${i.quantity} left</p>`).join('');
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

async function deleteUser() {
    const username = document.getElementById('delete-username').value.trim();
    if (!username) {
        alert("Enter a username to delete.");
        return;
    }

    const res = await fetch(`${AUTH_URL}/delete_user`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem('token')
        },
        body: JSON.stringify({ username })
    });
    const data = await res.json();
    document.getElementById('delete-msg').innerText = data.msg;
    loadAllUsers();
}

async function loadAllUsers() {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch(`${AUTH_API}/all_users`, {
            method: 'GET',
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const err = await response.json();
            console.error("Error loading users:", err);
            throw new Error(err.msg || "Failed to load users");
        }

        const data = await response.json();
        const users = data.users;

        const usersTable = document.getElementById("usersTableBody");
        usersTable.innerHTML = "";

        users.forEach(user => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${user.username}</td>
                <td>${user.role}</td>
                <td><button class="deleteUserBtn" data-username="${user.username}">Delete</button></td>
            `;
            usersTable.appendChild(row);
        });

    } catch (error) {
        console.error("loadAllUsers failed:", error);
    }
}


// ✅ Logout
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// ✅ Universal Add Stock Popups (Seller / Distributor / Manufacturer)
function showAddStockPopup() {
    const popup = document.getElementById('popup-form');
    popup.classList.add('active');

    // ✅ Clear previous values every time popup opens
    const modelInput = document.getElementById('add-model');
    const qtyInput = document.getElementById('add-qty');
    if (modelInput) modelInput.value = '';
    if (qtyInput) qtyInput.value = '';

    // ✅ Dynamic placeholder based on dashboard
    if (window.location.pathname.includes("seller.html")) {
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


// ✅ Dashboard Loader
document.addEventListener("DOMContentLoaded", () => {
    showWelcome();
    if (window.location.pathname.includes("seller.html")) {
        loadSellerStock();
        autoLoadLowStock();
    } else if (window.location.pathname.includes("distributor.html")) {
        loadDistributorStock();
        loadPendingRequests();
        loadDistributorLowStock();
        setInterval(loadDistributorLowStock, 10000);
    } else if (window.location.pathname.includes("manufacturer.html")) {
        loadManufacturerStock();
        loadDistributorRequests();
        loadLowStockAlerts();
        setInterval(loadLowStockAlerts, 10000);
    } else if (window.location.pathname.includes("admin.html")) {
        loadAllUsers();
    }
});

