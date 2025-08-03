// 🔗 API URLs
const AUTH_URL = "https://auth-service-okqn.onrender.com";
const SELLER_URL = "https://seller-service-viqu.onrender.com";
const DISTRIBUTOR_URL = "https://distributor-service-abc.onrender.com"; // Replace with your actual URL
const MANUFACTURER_URL = "https://manufacturer-service-xyz.onrender.com"; // Replace with your actual URL

// ✅ Dynamic IDs from login
const seller_id = localStorage.getItem('seller_id');
const distributor_id = localStorage.getItem('distributor_id');
const manufacturer_id = localStorage.getItem('manufacturer_id');

// ✅ Login Function
async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const res = await fetch(`${AUTH_URL}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (res.ok) {
            // ✅ Fetch user details
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

            // ✅ Redirect based on role
            if (data.role === "seller") window.location.href = "seller.html";
            else if (data.role === "distributor") window.location.href = "distributor.html";
            else if (data.role === "manufacturer") window.location.href = "manufacturer.html";
            else if (data.role === "admin") window.location.href = "register.html";
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

// ---------------- SELLER FUNCTIONS ---------------- //
async function loadSellerStock() {
    if (!seller_id) return;
    try {
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
    } catch (err) { console.error("Seller Stock Error:", err); }
}

async function addSellerStock() {
    if (!seller_id) return alert("Seller ID missing. Login again.");
    const blanket_model = document.getElementById('add-model').value;
    const quantity = parseInt(document.getElementById('add-qty').value);
    try {
        const res = await fetch(`${SELLER_URL}/stock`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ seller_id, blanket_model, quantity })
        });
        const data = await res.json();
        alert(data.msg);
        hideAddStockPopup();
        loadSellerStock();
    } catch (err) { console.error("Add Seller Stock Error:", err); }
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
    try {
        const res = await fetch(`${SELLER_URL}/check-low-stock/${seller_id}`);
        const data = await res.json();
        const listDiv = document.getElementById('low-stock-list');
        listDiv.innerHTML = data.low_stock.length === 0 ?
            "<p>No low stock items.</p>" :
            data.low_stock.map(i => `<p><strong>${i.blanket_model}</strong> - ${i.quantity} left</p>`).join('');
    } catch (err) { console.error("Low Stock Error:", err); }
}

async function sendStockRequest() {
    if (!seller_id) return;
    const distributor_id = parseInt(document.getElementById('distributor-id').value);
    const blanket_model = document.getElementById('request-model').value;
    const quantity = parseInt(document.getElementById('request-qty').value);
    await fetch(`${SELLER_URL}/request-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seller_id, distributor_id, blanket_model, quantity })
    });
    document.getElementById('request-msg').innerText = "Request sent!";
}

// ---------------- DISTRIBUTOR FUNCTIONS ---------------- //
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
    const blanket_model = document.getElementById('add-model').value;
    const quantity = parseInt(document.getElementById('add-qty').value);
    await fetch(`${DISTRIBUTOR_URL}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distributor_id, blanket_model, quantity })
    });
    hideAddStockPopup();
    loadDistributorStock();
}

async function loadPendingRequests() {
    const res = await fetch(`${DISTRIBUTOR_URL}/pending-requests/${distributor_id}`);
    const data = await res.json();
    const div = document.getElementById("pending-requests");
    div.innerHTML = data.length === 0 ? "<p>No pending requests.</p>" :
        data.map(r => `<p>${r.blanket_model} - ${r.quantity} (Seller ${r.seller_id})</p>`).join('');
}

async function sendManufacturerRequest() {
    const blanket_model = document.getElementById('request-model').value;
    const quantity = parseInt(document.getElementById('request-qty').value);
    await fetch(`${DISTRIBUTOR_URL}/request-manufacturer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ distributor_id, blanket_model, quantity })
    });
    document.getElementById('request-msg').innerText = "Request sent!";
}

// ---------------- MANUFACTURER FUNCTIONS ---------------- //
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
    const blanket_model = document.getElementById('add-model').value;
    const quantity = parseInt(document.getElementById('add-qty').value);
    await fetch(`${MANUFACTURER_URL}/stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ manufacturer_id, blanket_model, quantity })
    });
    hideAddStockPopup();
    loadManufacturerStock();
}

async function loadDistributorRequests() {
    const res = await fetch(`${MANUFACTURER_URL}/distributor-requests/${manufacturer_id}`);
    const data = await res.json();
    const div = document.getElementById("distributor-requests");
    div.innerHTML = data.length === 0 ? "<p>No distributor requests.</p>" :
        data.map(r => `<p>${r.blanket_model} - ${r.quantity} (Distributor ${r.distributor_id})</p>`).join('');
}

async function autoLoadLowStockAlerts() {
    await loadLowStockAlerts();
    setInterval(loadLowStockAlerts, 10000);
}

async function loadLowStockAlerts() {
    const res = await fetch(`${MANUFACTURER_URL}/check-low-stock/${manufacturer_id}`);
    const data = await res.json();
    const div = document.getElementById("low-stock-alerts");
    div.innerHTML = data.low_stock.length === 0 ?
        "<p>No low stock alerts.</p>" :
        data.low_stock.map(i => `<p><strong>${i.blanket_model}</strong> - ${i.quantity} left</p>`).join('');
}

// ✅ Logout Function
function logout() {
    localStorage.clear();
    window.location.href = "index.html";
}

// ✅ Run on Dashboard Load
document.addEventListener("DOMContentLoaded", () => {
    showWelcome();
    if (window.location.pathname.includes("seller.html")) {
        loadSellerStock();
        autoLoadLowStock();
    } else if (window.location.pathname.includes("distributor.html")) {
        loadDistributorStock();
        loadPendingRequests();
    } else if (window.location.pathname.includes("manufacturer.html")) {
        loadManufacturerStock();
        loadDistributorRequests();
        autoLoadLowStockAlerts();
    }
});
