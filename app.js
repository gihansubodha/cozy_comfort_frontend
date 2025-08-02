// 🔗 API URLs
const AUTH_URL = "https://auth-service-okqn.onrender.com";
const SELLER_URL = "https://seller-service-viqu.onrender.com";

//  Temporary seller_id (will link to login later)
const seller_id = 3;

//  Login Function
async function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const res = await fetch(`${AUTH_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  const data = await res.json();

  if (res.ok) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('role', data.role);
    localStorage.setItem('username', username);

    if (data.role === "seller") {
      window.location.href = "seller.html";
    } else if (data.role === "distributor") {
      window.location.href = "distributor.html";
    } else if (data.role === "manufacturer") {
      window.location.href = "manufacturer.html";
    }
  } else {
    document.getElementById('login-msg').innerText = data.msg;
  }
}

// Load Seller Stock
async function loadSellerStock() {
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
      </tr>
    `;
  });
}

//  Show Add Stock Popup
function showAddStockPopup() {
  document.getElementById('popup-form').classList.add('active');
}

//  Hide Add Stock Popup
function hideAddStockPopup() {
  document.getElementById('popup-form').classList.remove('active');
}

//  Add Seller Stock
async function addSellerStock() {
  const blanket_model = document.getElementById('add-model').value;
  const quantity = parseInt(document.getElementById('add-qty').value);

  const res = await fetch(`${SELLER_URL}/stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seller_id, blanket_model, quantity })
  });
  const data = await res.json();
  alert(data.msg);
  hideAddStockPopup();
  loadSellerStock();
}

// Edit Stock
async function editStock(stock_id, current_qty) {
  const new_qty = prompt("Enter new quantity:", current_qty);
  if (!new_qty) return;

  const res = await fetch(`${SELLER_URL}/stock/${stock_id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quantity: parseInt(new_qty) })
  });
  const data = await res.json();
  alert(data.msg);
  loadSellerStock();
}

//  Delete Stock
async function deleteStock(stock_id) {
  if (!confirm("Are you sure you want to delete this item?")) return;

  const res = await fetch(`${SELLER_URL}/stock/${stock_id}`, { method: "DELETE" });
  const data = await res.json();
  alert(data.msg);
  loadSellerStock();
}

//  Check Low Stock
async function checkLowStock() {
  const res = await fetch(`${SELLER_URL}/check-low-stock/${seller_id}`);
  const data = await res.json();
  document.getElementById('low-stock-msg').innerText = 
    data.low_stock.length > 0 ? JSON.stringify(data.low_stock) : "No low stock items.";
}

// Send Stock Request
async function sendStockRequest() {
  const distributor_id = parseInt(document.getElementById('distributor-id').value);
  const blanket_model = document.getElementById('request-model').value;
  const quantity = parseInt(document.getElementById('request-qty').value);

  const res = await fetch(`${SELLER_URL}/request-stock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seller_id, distributor_id, blanket_model, quantity })
  });
  const data = await res.json();
  document.getElementById('request-msg').innerText = data.msg;
}
