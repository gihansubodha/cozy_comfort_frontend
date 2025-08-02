const AUTH_URL = "https://auth-service-okqn.onrender.com";
const SELLER_URL = "https://seller-service-viqu.onrender.com";

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

    if (data.role === "seller") window.location.href = "seller.html";
    if (data.role === "distributor") window.location.href = "distributor.html";
    if (data.role === "manufacturer") window.location.href = "manufacturer.html";
  } else {
    document.getElementById('login-msg').innerText = data.msg;
  }
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
  const seller_id = 2; // replace with logged-in seller ID
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
}

//  Check Low Stock
async function checkLowStock() {
  const seller_id = 2; // replace with logged-in seller ID
  const res = await fetch(`${SELLER_URL}/check-low-stock/${seller_id}`);
  const data = await res.json();
  document.getElementById('low-stock-msg').innerText = JSON.stringify(data.low_stock);
}

//  Send Stock Request
async function sendStockRequest() {
  const seller_id = 2; // replace with logged-in seller ID
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
