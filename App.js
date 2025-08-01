let token = "", role="";

async function doLogin(){
  const res = await fetch("https://your-auth-url/login", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body:JSON.stringify({username:document.getElementById("u").value,
                        password:document.getElementById("p").value})
  });
  const j = await res.json();
  if(res.ok){ token = j.token; role = j.role; localStorage.setItem("tk",token);
    document.getElementById("loginDiv").style.display="none";
    document.getElementById("panel").style.display="block";
    document.getElementById("roleSpan").innerText = role;
    showArea();
  } else alert(j.error);
}

function logout(){
  token=""; role=""; localStorage.removeItem("tk");
  location.reload();
}

function showArea(){
  document.getElementById("adminArea").style.display = (role==="admin")?"block":"none";
  document.getElementById("manufacturerArea").style.display = (role==="manufacturer")?"block":"none";
  document.getElementById("distributorArea").style.display = (role==="distributor")?"block":"none";
  document.getElementById("sellerArea").style.display = (role==="seller")?"block":"none";
}

function authFetch(url,opts={}){
  opts.headers = opts.headers || {};
  opts.headers["Authorization"] = "Bearer "+localStorage.getItem("tk");
  return fetch(url,opts);
}

// you would then implement functions like createUser(), loadBlankets(), addBlanket(), manLoadOrders(), etc. calling authFetch to the corresponding APIs
