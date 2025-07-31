const volunteerData = localStorage.getItem("volunteer");

if (!volunteerData) {
  alert("Session expired. Please login again.");
  window.location.href = "volunteer_login.html";
} else {
  const volunteer = JSON.parse(volunteerData);
  document.getElementById("volunteerName").textContent = volunteer.name;
  document.getElementById("volunteerEmail").textContent = volunteer.email;

  const logoutButton = document.createElement("button");
  logoutButton.textContent = "Logout";
  logoutButton.style.marginTop = "12px";
  logoutButton.onclick = () => {
    localStorage.clear();
    window.location.href = "volunteer_login.html";
  };
  document.getElementById("profile").appendChild(logoutButton);

  // ✅ Replace login check with GET profile fetch
  async function fetchProfile() {
    const email = volunteer.email;

    try {
      const res = await fetch(`https://eldercaresupportportal-2.onrender.com/get-volunteer?email=${email}`);
      const data = await res.json();

      if (data.success) {
        document.getElementById("completedTasks").textContent = data.volunteer.completedTasks;
        document.getElementById("badges").textContent = data.volunteer.badges.join(", ") || "None";

        // Optionally update localStorage with fresh data
        localStorage.setItem("volunteer", JSON.stringify(data.volunteer));
      } else {
        throw new Error("Volunteer not found");
      }
    } catch (error) {
      console.error("Fetch profile error:", error);
      alert("Error loading profile data. Please login again.");
      localStorage.clear();
      window.location.href = "volunteer_login.html";
    }
  }

  let currentPage = 1;
  const limit = 5;

  async function loadRequests(page = 1) {
    const category = document.getElementById("filterCategory").value;
    const location = document.getElementById("filterLocation").value;

    const res = await fetch(`https://eldercaresupportportal-2.onrender.com/requests?category=${category}&location=${location}`);
    const requests = await res.json();

    const list = document.getElementById("requestList");
    list.innerHTML = "";

    if (requests.length === 0) {
      list.innerHTML = "<p>No requests found.</p>";
      return;
    }

    const start = (page - 1) * limit;
    const paginated = requests.slice(start, start + limit);

    paginated.forEach(req => {
      const div = document.createElement("div");

      let actions = `
        <button onclick="handleAction('${req._id}', 'accept')">Accept</button>
        <button onclick="handleAction('${req._id}', 'decline')">Decline</button>
      `;

      div.className = "request-card";
      div.innerHTML = `
        <h4>${req.title}</h4>
        <p>${req.description}</p>
        <p>Category: ${req.category || "N/A"} | Location: ${req.location || "N/A"}</p>
        <p><strong>Phone:</strong> ${req.phone || "Not Provided"}</p>
        ${req.phone ? `<a href="tel:${req.phone}"><button>Call</button></a>` : ""}
        ${actions}
      `;
      list.appendChild(div);
    });

    const paginationControls = document.createElement("div");
    paginationControls.style.marginTop = "12px";
    paginationControls.innerHTML = `
      <button ${page === 1 ? "disabled" : ""} onclick="changePage(${page - 1})">Previous</button>
      <span> Page ${page} of ${Math.ceil(requests.length / limit)} </span>
      <button ${page >= Math.ceil(requests.length / limit) ? "disabled" : ""} onclick="changePage(${page + 1})">Next</button>
    `;
    list.appendChild(paginationControls);
  }

  window.changePage = (page) => {
    currentPage = page;
    loadRequests(currentPage);
  }

  async function loadAcceptedTasks() {
    const res = await fetch(`https://eldercaresupportportal-2.onrender.com/requests?assignedTo=${volunteer._id}&status=assigned`);
    const accepted = await res.json();

    const list = document.getElementById("acceptedTaskList");
    list.innerHTML = "";

    if (accepted.length === 0) {
      list.innerHTML = "<p>You have no accepted tasks.</p>";
      return;
    }

    accepted.forEach(req => {
      const div = document.createElement("div");
      div.className = "request-card";
      div.innerHTML = `
        <h4>${req.title}</h4>
        <p>${req.description}</p>
        <p>Category: ${req.category || "N/A"} | Location: ${req.location || "N/A"}</p>
        <p><strong>Phone:</strong> ${req.phone || "Not Provided"}</p>
        ${req.phone ? `<a href="tel:${req.phone}"><button>Call</button></a>` : ""}
        <button onclick="markCompleted('${req._id}')">Mark as Completed</button>
      `;
      list.appendChild(div);
    });
  }

  window.handleAction = async function (requestId, action) {
    const res = await fetch("https://eldercaresupportportal-2.onrender.com/request-action", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, action, volunteerId: volunteer._id })
    });

    const result = await res.json();
    if (result.success) {
      alert(`Request ${action}ed successfully!`);
      loadRequests(currentPage);
      loadAcceptedTasks();
    } else {
      alert("Action failed. Please try again.");
    }
  }

  window.markCompleted = async function (requestId) {
    const res = await fetch("https://eldercaresupportportal-2.onrender.com/complete-task", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, volunteerId: volunteer._id })
    });

    const result = await res.json();
    if (result.success) {
      alert("Task marked as completed!");
      fetchProfile();
      loadRequests(currentPage);
      loadAcceptedTasks();
    } else {
      alert("Failed to complete task.");
    }
  }

  // Initial load
  fetchProfile();
  loadRequests(currentPage);
  loadAcceptedTasks();
}
