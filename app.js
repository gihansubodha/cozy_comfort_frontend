document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm");
  const loginSection = document.getElementById("login-section");
  const dashboard = document.getElementById("dashboard");
  const loginError = document.getElementById("loginError");
  const logoutBtns = document.querySelectorAll("#logout-btn");

  let token = "";
  let role = "";

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const res = await fetch("https://auth-service-<your>.onrender.com/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (res.ok) {
        token = data.token;
        role = data.role;
        showDashboard(role);
        loginSection.style.display = "none";
        dashboard.style.display = "block";
        loginError.textContent = "";
        loadDashboard(role);
      } else {
        loginError.textContent = data.error || "Invalid credentials";
      }
    } catch (err) {
      loginError.textContent = "Login error: " + err.message;
    }
  });

  logoutBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      token = "";
      role = "";
      document.getElementById("dashboard").style.display = "none";
      document.getElementById("login-section").style.display = "block";
    });
  });

  function showDashboard(role) {
    const dashboards = ["admin", "manufacturer", "distributor", "seller"];
    dashboards.forEach((r) => {
      document.getElementById(`${r}-dashboard`).style.display = (r === role) ? "block" : "none";
    });
  }

  // ====================
  // Admin Dashboard
  // ====================
  const createUserForm = document.getElementById("createUserForm");
  const userList = document.getElementById("user-list");

  if (createUserForm) {
    createUserForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const newUser = {
        username: document.getElementById("new-username").value.trim(),
        password: document.getElementById("new-password").value.trim(),
        role: document.getElementById("new-role").value
      };

      const res = await fetch("https://auth-service-<your>.onrender.com/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser),
      });

      const data = await res.json();
      if (res.ok) {
        alert("User created!");
        loadUsers();
        createUserForm.reset();
      } else {
        alert(data.error || "Failed to create user");
      }
    });
  }

  async function loadUsers() {
    const res = await fetch("https://auth-service-<your>.onrender.com/users", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const users = await res.json();
    userList.innerHTML = "";
    users.forEach(user => {
      const li = document.createElement("li");
      li.textContent = `${user.username} (${user.role})`;
      userList.appendChild(li);
    });
  }

  // ====================
  // Manufacturer Dashboard
  // ====================
  const addBlanketForm = document.getElementById("addBlanketForm");
  const manufacturerTable = document.getElementById("manufacturer-inventory");

  if (addBlanketForm) {
    addBlanketForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const blanket = {
        name: document.getElementById("blanket-name").value.trim(),
        material: document.getElementById("blanket-material").value.trim(),
        stock: parseInt(document.getElementById("blanket-stock").value),
        min_stock: parseInt(document.getElementById("blanket-min").value)
      };

      const res = await fetch("https://manufacturer-service-<your>.onrender.com/blankets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(blanket),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Blanket added");
        loadManufacturerInventory();
        addBlanketForm.reset();
      } else {
        alert(data.error || "Error adding blanket");
      }
    });
  }

  async function loadManufacturerInventory() {
    const res = await fetch("https://manufacturer-service-<your>.onrender.com/blankets", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    manufacturerTable.innerHTML = "<tr><th>Name</th><th>Material</th><th>Stock</th><th>Min</th></tr>";
    data.forEach((item) => {
      manufacturerTable.innerHTML += `
        <tr>
          <td>${item.name}</td>
          <td>${item.material}</td>
          <td>${item.stock}</td>
          <td>${item.min_stock}</td>
        </tr>`;
    });
  }

  // ====================
  // Distributor Dashboard
  // ====================
  const addInventoryForm = document.getElementById("addInventoryForm");
  const distributorTable = document.getElementById("distributor-inventory");

  if (addInventoryForm) {
    addInventoryForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const item = {
        name: document.getElementById("inventory-name").value.trim(),
        stock: parseInt(document.getElementById("inventory-stock").value),
        min_stock: parseInt(document.getElementById("inventory-min").value)
      };

      const res = await fetch("https://distributor-service-<your>.onrender.com/inventory", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(item),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Item added");
        loadDistributorInventory();
        addInventoryForm.reset();
      } else {
        alert(data.error || "Error adding inventory");
      }
    });
  }

  async function loadDistributorInventory() {
    const res = await fetch("https://distributor-service-<your>.onrender.com/inventory", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    distributorTable.innerHTML = "<tr><th>Name</th><th>Stock</th><th>Min</th></tr>";
    data.forEach((item) => {
      distributorTable.innerHTML += `
        <tr>
          <td>${item.name}</td>
          <td>${item.stock}</td>
          <td>${item.min_stock}</td>
        </tr>`;
    });
  }

  // ====================
  // Seller Dashboard
  // ====================
  const placeOrderForm = document.getElementById("placeOrderForm");
  const sellerTable = document.getElementById("seller-inventory");

  if (placeOrderForm) {
    placeOrderForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const order = {
        name: document.getElementById("order-name").value.trim(),
        quantity: parseInt(document.getElementById("order-qty").value),
        customer: document.getElementById("order-customer").value.trim()
      };

      const res = await fetch("https://seller-service-<your>.onrender.com/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(order),
      });

      const data = await res.json();
      if (res.ok) {
        alert("Order placed");
        loadSellerInventory();
        placeOrderForm.reset();
      } else {
        alert(data.error || "Error placing order");
      }
    });
  }

  async function loadSellerInventory() {
    const res = await fetch("https://seller-service-<your>.onrender.com/orders", {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    sellerTable.innerHTML = "<tr><th>Item</th><th>Qty</th><th>Customer</th></tr>";
    data.forEach((item) => {
      sellerTable.innerHTML += `
        <tr>
          <td>${item.name}</td>
          <td>${item.quantity}</td>
          <td>${item.customer}</td>
        </tr>`;
    });
  }

  // ================
  // Load dashboards
  // ================
  function loadDashboard(role) {
    if (role === "admin") loadUsers();
    if (role === "manufacturer") loadManufacturerInventory();
    if (role === "distributor") loadDistributorInventory();
    if (role === "seller") loadSellerInventory();
  }
});
