// UI Toggle Logic (optional, for panel switching)
const signUpButton = document.getElementById('signUp');
const signInButton = document.getElementById('signIn');
const container = document.getElementById('container');

signUpButton?.addEventListener('click', () => {
  container?.classList.add("right-panel-active");
});

signInButton?.addEventListener('click', () => {
  container?.classList.remove("right-panel-active");
});

// ✅ Handle Registration - OTP Send

document.getElementById("registerForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("regName").value;
  const email = document.getElementById("regEmail").value;
  const password = document.getElementById("regPassword").value;
  const phone = document.getElementById("regPhone").value;

  try {
    const res = await fetch("https://eldercaresupportportal-1.onrender.com/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, phone }),
    });

    const data = await res.json();
    if (data.success) {
      // ✅ FIX: Save as "pendingEmail" to match OTP page
      localStorage.setItem("pendingEmail", email);
      localStorage.setItem("name", name);
      localStorage.setItem("phone", phone);
      localStorage.setItem("password", password);
      alert("OTP sent to your email");
      window.location.href = "otp.html"; // redirect to OTP page
    } else {
      alert(data.message || "Failed to send OTP. Try again.");
      container?.classList.add("right-panel-active"); // stay on register form
    }
  } catch (err) {
    console.error("Error during registration:", err);
    alert("Something went wrong during registration.");
  }
});

// ✅ Handle Login - Credential Check
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const res = await fetch("https://eldercaresupportportal-1.onrender.com/elder-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (data.success) {
      localStorage.setItem("email", email);
      localStorage.setItem("name", data.name);
      window.location.href = "dashboard.html"; // redirect to dashboard
    } else {
      alert("Invalid email or password.");
    }
  } catch (err) {
    console.error("Error during login:", err);
    alert("Login failed. Please try again.");
  }
});
