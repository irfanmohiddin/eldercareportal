const express = require("express");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const PORT = process.env.PORT || 5000;

const Volunteer = require("./models/Volunteer");
const Request = require("./models/Request");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../frontend")));

let resetOtps = {};
let generatedOtp = null;
let pendingVolunteer = null;

// ✅ Send registration OTP
app.post("/send-otp", async (req, res) => {
  const { name, email, password } = req.body;

  const existing = await Volunteer.findOne({ email });
  if (existing) {
    return res.json({
      success: false,
      message: "You already have an account with this email. Please use a different email."
    });
  }

  generatedOtp = Math.floor(100000 + Math.random() * 900000);
  pendingVolunteer = { name, email, password };

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: 'ElderCare OTP <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP is: ${generatedOtp}`
    });
    res.json({ success: true });
  } catch (error) {
    console.error("OTP Send Error:", error);
    res.json({ success: false });
  }
});

// ✅ Verify OTP and create account
app.post("/verify-otp", async (req, res) => {
  const { otp } = req.body;

  if (parseInt(otp) === generatedOtp && pendingVolunteer) {
    try {
      const newVolunteer = new Volunteer({
        ...pendingVolunteer,
        tasks: [],
        completedTasks: 0,
        badges: []
      });

      await newVolunteer.save();
      pendingVolunteer = null;
      res.json({ success: true });
    } catch (err) {
      console.error("Volunteer save error:", err);
      res.json({ success: false, message: "OTP valid, but account creation failed." });
    }
  } else {
    res.json({ success: false, message: "Invalid OTP." });
  }
});

// ✅ Login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const volunteer = await Volunteer.findOne({ email, password });
  if (volunteer) res.json({ success: true, volunteer });
  else res.json({ success: false });
});

// ✅ Get Volunteer Profile (used in dashboard.js)
app.get("/get-volunteer", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.json({ success: false, message: "Email required" });

  try {
    const volunteer = await Volunteer.findOne({ email });
    if (!volunteer) return res.json({ success: false });
    res.json({ success: true, volunteer });
  } catch (err) {
    console.error("Fetch volunteer failed:", err);
    res.json({ success: false });
  }
});

// ✅ Forgot Password - Send OTP
app.post("/send-reset-otp", async (req, res) => {
  const { email } = req.body;
  const volunteer = await Volunteer.findOne({ email });
  if (!volunteer) return res.json({ success: false, message: "Email not found" });

  const otp = Math.floor(100000 + Math.random() * 900000);
  resetOtps[email] = otp;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  try {
    await transporter.sendMail({
      from: 'ElderCare Reset <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: "Reset Password OTP",
      text: `Your OTP to reset your password is: ${otp}`
    });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false });
  }
});

// ✅ Verify Reset OTP and Update Password
app.post("/verify-reset-otp", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (resetOtps[email] && resetOtps[email] == otp) {
    await Volunteer.findOneAndUpdate({ email }, { password: newPassword });
    delete resetOtps[email];
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// ✅ Get Requests with optional filters
app.get("/requests", async (req, res) => {
  const { category, location, assignedTo, status } = req.query;
  const query = {};

  if (category) query.category = category;
  if (location) query.location = location;
  if (assignedTo) query.assignedTo = assignedTo;
  if (status) query.status = status;
  else query.status = "Pending";

  const requests = await Request.find(query);
  res.json(requests);
});

// ✅ Accept / Decline
app.post("/request-action", async (req, res) => {
  const { requestId, action, volunteerId } = req.body;
  const request = await Request.findById(requestId);
  if (!request || request.status !== "Pending") return res.json({ success: false });

  if (action === "accept") {
    request.status = "assigned";
    request.assignedTo = volunteerId;
    await request.save();
    await Volunteer.findByIdAndUpdate(volunteerId, { $push: { tasks: request._id } });
  } else if (action === "decline") {
    request.status = "declined";
    await request.save();
  }

  res.json({ success: true });
});

// ✅ Mark Task as Completed
app.post("/complete-task", async (req, res) => {
  const { requestId, volunteerId } = req.body;
  const request = await Request.findById(requestId);
  if (request && String(request.assignedTo) === String(volunteerId)) {
    request.status = "completed";
    await request.save();

    const volunteer = await Volunteer.findById(volunteerId);
    volunteer.completedTasks += 1;

    if (volunteer.completedTasks >= 5 && !volunteer.badges.includes("Helping Hand")) {
      volunteer.badges.push("Helping Hand");
    }
    if (volunteer.completedTasks >= 10 && !volunteer.badges.includes("Gold Supporter")) {
      volunteer.badges.push("Gold Supporter");
    }

    await volunteer.save();
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

// ✅ Serve Login Page as Default
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/volunteer_login.html"));
});

// ✅ Connect to MongoDB and Start Server
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ Connected to MongoDB");
    app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
  })
  .catch(err => console.error("❌ MongoDB connection error:", err));
