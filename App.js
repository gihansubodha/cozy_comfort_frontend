const AUTH_API = "https://auth-service-okqn.onrender.com/register"; // replace with actual Auth API URL

document.addEventListener("DOMContentLoaded", () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  if (token && role) {
    showDashboard(role);
  }

  // Login form submit
  document.getElementById("loginForm").addEventListener("submit", async function (e) {
    e.preventDefault();
    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    const res = await fetch(`${AUTH_API}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (res.ok) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      showDashboard(data.role);
    } else {
      document.getElementById("loginError").textContent = data.message || "Login failed";
    }
  });

  // Admin create user
  document.getElementById("createUserForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const username = document.getElementById("newUsername").value.trim();
    const password = document.getElementById("newPassword").value.trim();
    const role = document.getElementById("newRole").value;

    const res = await fetch(`${AUTH_API}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ username, password, role }),
    });

    const data = await res.json();
    alert(data.message || "User created");
  });

  // Admin delete user
  document.getElementById("deleteUserForm")?.addEventListener("submit", async function (e) {
    e.preventDefault();
    const token = localStorage.getItem("token");
    const username = document.getElementById("deleteUsername").value.trim();

    const res = await fetch(`${AUTH_API}/delete_user`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({ username }),
    });

    const data = await res.json();
    alert(data.message || "User deleted");
  });
});

function showDashboard(role) {
  document.getElementById("loginContainer").style.display = "none";

  if (role === "admin") {
    document.getElementById("adminDashboard").style.display = "block";
  } else if (role === "manufacturer") {
    document.getElementById("manufacturerDashboard").style.display = "block";
    loadManufacturerUI();
  } else if (role === "distributor") {
    document.getElementById("distributorDashboard").style.display = "block";
    loadDistributorUI();
  } else if (role === "seller") {
    document.getElementById("sellerDashboard").style.display = "block";
    loadSellerUI();
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  location.reload();
}

// The following 3 functions can later be used to inject specific forms/UI
function loadManufacturerUI() {
  document.getElementById("manufacturerContent").innerHTML = `<p>✔ Add/edit/delete blankets, handle distributor orders, low stock alerts.</p>`;
}
function loadDistributorUI() {
  document.getElementById("distributorContent").innerHTML = `<p>✔ Manage inventory, handle seller orders, request from manufacturer, low stock alerts.</p>`;
}
function loadSellerUI() {
  document.getElementById("sellerContent").innerHTML = `<p>✔ Manage orders, request from distributor, customer list, low stock alerts.</p>`;
}
