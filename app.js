document.addEventListener("DOMContentLoaded", function () {
  let token = "";
  let userRole = "";

  const BASE_URLS = {
    auth: "https://auth-service-okqn.onrender.com",
    manufacturer: "https://manufacturer-api-ez0s.onrender.com",
    distributor: "https://distributor-service-smne.onrender.com",
    seller: "https://seller-service-viqu.onrender.com",
  };

  function showDashboard(role) {
    document.querySelectorAll(".dashboard").forEach(d => d.style.display = "none");
    document.getElementById(`${role}Dashboard`).style.display = "block";
  }

  function logout() {
    token = "";
    userRole = "";
    document.querySelectorAll(".dashboard").forEach(d => d.style.display = "none");
    document.getElementById("loginContainer").style.display = "block";
  }
  window.logout = logout;

  // Login
  document.getElementById("loginForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    fetch(`${BASE_URLS.auth}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    })
    .then(res => res.json())
    .then(data => {
      if (data.token) {
        token = data.token;
        userRole = data.role;
        document.getElementById("loginContainer").style.display = "none";
        showDashboard(userRole);

        if (userRole === "admin") loadUsers();
        if (userRole === "manufacturer") { loadManufacturerInventory(); loadManufacturerOrders(); }
        if (userRole === "distributor") { loadDistributorInventory(); loadSellerOrders(); }
        if (userRole === "seller") { loadSellerOrders(); }
      } else {
        document.getElementById("loginError").textContent = "Invalid username or password";
      }
    });
  });

  // Admin
  document.getElementById("createUserForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const username = document.getElementById("newUsername").value;
    const password = document.getElementById("newPassword").value;
    const role = document.getElementById("newRole").value;

    fetch(`${BASE_URLS.auth}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ username, password, role })
    })
    .then(res => res.json())
    .then(() => {
      alert("User created!");
      loadUsers();
    });
  });

  function loadUsers() {
    fetch(`${BASE_URLS.auth}/users`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      console.log("Users:", data);
    });
  }

  // Manufacturer
  document.getElementById("addBlanketForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("blanketName").value;
    const quantity = +document.getElementById("blanketQuantity").value;
    const min_stock = +document.getElementById("minStock").value;

    fetch(`${BASE_URLS.manufacturer}/blankets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, stock: quantity, min_stock })
    })
    .then(res => res.json())
    .then(() => {
      alert("Blanket added!");
      loadManufacturerInventory();
    });
  });

  function loadManufacturerInventory() {
    fetch(`${BASE_URLS.manufacturer}/blankets`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      const div = document.getElementById("manufacturerInventory");
      div.innerHTML = "";
      data.forEach(b => {
        const p = document.createElement("p");
        p.textContent = `${b.name} - Stock: ${b.stock}`;
        div.appendChild(p);
      });
    });
  }

  function loadManufacturerOrders() {
    fetch(`${BASE_URLS.manufacturer}/orders`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      const div = document.getElementById("manufacturerOrders");
      div.innerHTML = "";
      data.forEach(o => {
        const p = document.createElement("p");
        p.textContent = `${o.blanket_name} - Qty: ${o.quantity} - Status: ${o.status}`;
        div.appendChild(p);
      });
    });
  }

  // Distributor
  document.getElementById("addDistributorInventoryForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("distItemName").value;
    const quantity = +document.getElementById("distQuantity").value;
    const min_stock = +document.getElementById("distMinStock").value;

    fetch(`${BASE_URLS.distributor}/inventory`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, stock: quantity, min_stock })
    })
    .then(res => res.json())
    .then(() => {
      alert("Inventory added");
      loadDistributorInventory();
    });
  });

  function loadDistributorInventory() {
    fetch(`${BASE_URLS.distributor}/inventory`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      const div = document.getElementById("distributorInventory");
      div.innerHTML = "";
      data.forEach(i => {
        const p = document.createElement("p");
        p.textContent = `${i.name} - Stock: ${i.stock}`;
        div.appendChild(p);
      });
    });
  }

  function loadSellerOrders() {
    fetch(`${BASE_URLS.distributor}/seller_orders`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      const div = document.getElementById("sellerOrdersForDistributor");
      div.innerHTML = "";
      data.forEach(o => {
        const p = document.createElement("p");
        p.textContent = `${o.blanket_name} - Qty: ${o.quantity} - Status: ${o.status}`;
        div.appendChild(p);
      });
    });
  }

  // Seller
  document.getElementById("placeCustomerOrderForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("customerItem").value;
    const quantity = +document.getElementById("customerQty").value;

    fetch(`${BASE_URLS.seller}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ name, customer: "customer", quantity, min_stock: 0 })
    })
    .then(res => res.json())
    .then(() => {
      alert("Order placed");
      loadSellerOrders();
    });
  });

  function loadSellerOrders() {
    fetch(`${BASE_URLS.seller}/orders`, {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      const div = document.getElementById("sellerOrders");
      div.innerHTML = "";
      data.forEach(o => {
        const p = document.createElement("p");
        p.textContent = `${o.name} - Qty: ${o.quantity}`;
        div.appendChild(p);
      });
    });
  }

});
