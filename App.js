document.addEventListener("DOMContentLoaded", function () {
  const loginForm = document.getElementById("loginForm");

  // Handle Login
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    const res = await fetch("https://your-auth-api.onrender.com/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();

    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      showDashboard(data.role);
    } else {
      alert("Login failed. Check username/password.");
    }
  });

  function showDashboard(role) {
    document.getElementById("loginSection").style.display = "none";

    if (role === "admin") loadAdminUI();
    else if (role === "manufacturer") loadManufacturerUI();
    else if (role === "distributor") loadDistributorUI();
    else if (role === "seller") loadSellerUI();
  }

  // ========== ADMIN DASHBOARD ==========
  async function loadAdminUI() {
    document.getElementById("adminContent").style.display = "block";

    // Register new user
    document.getElementById("registerUserForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("newUsername").value;
      const password = document.getElementById("newPassword").value;
      const role = document.getElementById("newRole").value;
      const token = localStorage.getItem("token");

      const res = await fetch("https://your-auth-api.onrender.com/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await res.json();
      alert(data.message);
    });

    // Delete user
    document.getElementById("deleteUserForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("deleteUsername").value;
      const token = localStorage.getItem("token");

      const res = await fetch(`https://your-auth-api.onrender.com/delete/${username}`, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      });

      const data = await res.json();
      alert(data.message);
    });
  }

  // ========== MANUFACTURER ==========
  async function loadManufacturerUI() {
    document.getElementById("manufacturerContent").style.display = "block";
    const token = localStorage.getItem("token");

    // Add Blanket
    document.getElementById("addBlanketForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("blanketName").value;
      const quantity = document.getElementById("blanketQuantity").value;
      const min_stock = document.getElementById("minStock").value;

      const res = await fetch("https://your-manufacturer-api.onrender.com/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ name, quantity, min_stock }),
      });

      const data = await res.json();
      alert(data.message);
      loadManufacturerInventory();
    });

    loadManufacturerInventory();
    loadManufacturerOrders();
  }

  async function loadManufacturerInventory() {
    const token = localStorage.getItem("token");
    const res = await fetch("https://your-manufacturer-api.onrender.com/view", {
      headers: { Authorization: "Bearer " + token },
    });
    const items = await res.json();

    const container = document.getElementById("manufacturerInventory");
    container.innerHTML = "";
    items.forEach((item) => {
      const status = item.quantity <= item.min_stock ? "⚠️ Low Stock" : "";
      container.innerHTML += `<p>${item.name} - ${item.quantity} ${status}</p>`;
    });
  }

  async function loadManufacturerOrders() {
    const token = localStorage.getItem("token");
    const res = await fetch("https://your-manufacturer-api.onrender.com/orders", {
      headers: { Authorization: "Bearer " + token },
    });
    const orders = await res.json();

    const container = document.getElementById("manufacturerOrders");
    container.innerHTML = "";
    orders.forEach((order) => {
      container.innerHTML += `<p>Distributor: ${order.distributor} requested ${order.item} (${order.quantity}) - Status: ${order.status}</p>`;
    });
  }

  // ========== DISTRIBUTOR ==========
  async function loadDistributorUI() {
    document.getElementById("distributorContent").style.display = "block";
    const token = localStorage.getItem("token");

    // Add to Inventory
    document.getElementById("addDistributorInventoryForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = document.getElementById("distItemName").value;
      const quantity = document.getElementById("distQuantity").value;
      const min_stock = document.getElementById("distMinStock").value;

      const res = await fetch("https://your-distributor-api.onrender.com/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ name, quantity, min_stock }),
      });

      const data = await res.json();
      alert(data.message);
      loadDistributorInventory();
    });

    // Request from Manufacturer
    document.getElementById("requestManufacturerForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const item = document.getElementById("manufacturerItemName").value;
      const quantity = document.getElementById("manufacturerRequestQty").value;

      const res = await fetch("https://your-distributor-api.onrender.com/request-manufacturer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ item, quantity }),
      });

      const data = await res.json();
      alert(data.message);
    });

    loadDistributorInventory();
    loadSellerOrdersForDistributor();
  }

  async function loadDistributorInventory() {
    const token = localStorage.getItem("token");
    const res = await fetch("https://your-distributor-api.onrender.com/view", {
      headers: { Authorization: "Bearer " + token },
    });
    const items = await res.json();

    const container = document.getElementById("distributorInventory");
    container.innerHTML = "";
    items.forEach((item) => {
      const status = item.quantity <= item.min_stock ? "⚠️ Low Stock" : "";
      container.innerHTML += `<p>${item.name} - ${item.quantity} ${status}</p>`;
    });
  }

  async function loadSellerOrdersForDistributor() {
    const token = localStorage.getItem("token");
    const res = await fetch("https://your-distributor-api.onrender.com/orders", {
      headers: { Authorization: "Bearer " + token },
    });
    const orders = await res.json();

    const container = document.getElementById("sellerOrdersForDistributor");
    container.innerHTML = "";
    orders.forEach((order) => {
      container.innerHTML += `<p>Seller: ${order.seller} requested ${order.item} (${order.quantity}) - Status: ${order.status}</p>`;
    });
  }

  // ========== SELLER ==========
  async function loadSellerUI() {
    document.getElementById("sellerContent").style.display = "block";
    const token = localStorage.getItem("token");

    // Customer Order
    document.getElementById("placeCustomerOrderForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const item = document.getElementById("customerItem").value;
      const quantity = document.getElementById("customerQty").value;

      const res = await fetch("https://your-seller-api.onrender.com/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ item, quantity }),
      });

      const data = await res.json();
      alert(data.message);
      loadSellerOrders();
    });

    // Request from Distributor
    document.getElementById("requestFromDistributorForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const item = document.getElementById("distributorItem").value;
      const quantity = document.getElementById("distributorQty").value;

      const res = await fetch("https://your-seller-api.onrender.com/request-distributor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify({ item, quantity }),
      });

      const data = await res.json();
      alert(data.message);
    });

    loadSellerOrders();
  }

  async function loadSellerOrders() {
    const token = localStorage.getItem("token");
    const res = await fetch("https://your-seller-api.onrender.com/orders", {
      headers: { Authorization: "Bearer " + token },
    });
    const orders = await res.json();

    const container = document.getElementById("sellerOrders");
    container.innerHTML = "";
    orders.forEach((order) => {
      container.innerHTML += `<p>Item: ${order.item} - ${order.quantity} - Status: ${order.status}</p>`;
    });
  }

  // Auto-login if already logged in
  const savedToken = localStorage.getItem("token");
  const savedRole = localStorage.getItem("role");
  if (savedToken && savedRole) showDashboard(savedRole);
});
