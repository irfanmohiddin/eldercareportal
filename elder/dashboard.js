document.addEventListener("DOMContentLoaded", async () => {
  const name = localStorage.getItem("name");
  const email = localStorage.getItem("email");
  const phone = localStorage.getItem("phone");

  document.getElementById("userName").textContent = name;
  document.getElementById("userEmail").textContent = email;
  document.getElementById("userPhone").textContent = phone;

  loadRequests();

  document.getElementById("supportForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;

    const response = await fetch("https://eldercaresupportportal-1.onrender.com/support-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, title, description })
    });

    const result = await response.json();
    if (result.success) {
      alert("Request posted successfully!");
      loadRequests();
    }
  });

  document.getElementById("feedbackForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const requestId = document.getElementById("requestId").value;
    const feedbackText = document.getElementById("feedbackText").value;

    const response = await fetch("https://eldercaresupportportal-1.onrender.com/submit-feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, feedback: feedbackText })
    });

    const result = await response.json();
    if (result.success) {
      alert("Feedback submitted!");
      document.getElementById("feedbackForm").reset();
    }
  });
});

async function loadRequests() {
  const email = localStorage.getItem("email");
  const res = await fetch(`https://eldercaresupportportal-1.onrender.com/get-requests?email=${email}`);
  const data = await res.json();
  const list = document.getElementById("requestList");
  const dropdown = document.getElementById("requestId");

  list.innerHTML = "";
  dropdown.innerHTML = '<option value="">Select Completed Request</option>';

  data.forEach((req) => {
    const div = document.createElement("div");
    div.className = "request-card";
    div.innerHTML = `
      <strong>${req.title}</strong><br>
      ${req.description}<br>
      Status: ${req.status}
    `;
    list.appendChild(div);

    if (req.status && req.status.toLowerCase() === "completed") {
      const opt = document.createElement("option");
      opt.value = req._id;
      opt.text = req.title;
      dropdown.appendChild(opt);
    }
  });
}
