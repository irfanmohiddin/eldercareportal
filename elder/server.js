// ✅ ElderCare Backend with post-OTP database insertion
const express = require("express");
const sgMail = require("@sendgrid/mail");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const path = require("path");

const app = express();

// ✅ Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ✅ MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB Connected"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// ✅ Schemas
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
});
const User = mongoose.model("User", UserSchema);

const SupportRequestSchema = new mongoose.Schema({
  name: String,
  email: String,
  title: String,
  description: String,
  category: String,
  location: String,
  phone: String,
  status: { type: String, default: "Pending" },
});
const SupportRequest = mongoose.model("SupportRequest", SupportRequestSchema);

const FeedbackSchema = new mongoose.Schema({
  requestId: mongoose.Schema.Types.ObjectId,
  feedback: String,
});
const Feedback = mongoose.model("Feedback", FeedbackSchema);

// ✅ OTP Logic
let otpStore = {}; // Store OTPs and pending users per email
 
// -------------------- SEND OTP --------------------
// -------------------- SEND OTP --------------------
app.post("/send-otp", async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!email) return res.json({ success: false, message: "Email is required" });

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.json({
        success: false,
        message: "You already have an account with this email. Please use a different email.",
      });
    }

    const generatedOtp = Math.floor(100000 + Math.random() * 900000);

    // Store pending user & OTP per email
    otpStore[email] = { generatedOtp, pendingUser: { name, email, password, phone }, timestamp: Date.now() };

    console.log(`Generated OTP for ${email}: ${generatedOtp}`);
    console.log("Attempting to send email...");
    console.log("From email:", process.env.OTP_EMAIL);
    console.log("API Key exists:", !!process.env.SENDGRID_API_KEY);

    await sgMail.send({
      to: email,
      from: {
        email: process.env.OTP_EMAIL,
        name: "ElderCare Support Portal",
      },
      subject: "Your OTP Code",
      text: `Your OTP is: ${generatedOtp}`,
      html: `<h2>Your OTP is: ${generatedOtp}</h2><p>Valid for 5 minutes</p>`,
    });

    console.log("✅ Email sent successfully to:", email);
    res.json({ success: true, message: "OTP sent successfully" });
  } catch (error) {
    console.error("❌ SENDGRID ERROR:", error);
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    if (error.response) {
      console.error("Response body:", JSON.stringify(error.response.body, null, 2));
    }
    res.json({ success: false, message: error.message || "Failed to send email" });
  }
});

// -------------------- VERIFY OTP --------------------
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!otp || !email || !otpStore[email]) {
    return res.json({ success: false, message: "Invalid or expired OTP" });
  }

  const { generatedOtp, pendingUser, timestamp } = otpStore[email];

  // OTP expires in 5 minutes
  if (Date.now() - timestamp > 5 * 60 * 1000) {
    delete otpStore[email];
    return res.json({ success: false, message: "OTP expired" });
  }

  if (parseInt(otp) !== generatedOtp) {
    return res.json({ success: false, message: "Invalid OTP" });
  }

  try {
    await User.create(pendingUser);
    delete otpStore[email]; // clear pending user & OTP
    res.json({ success: true, message: "User verified and registered successfully" });
  } catch (err) {
    console.error("Error saving verified user:", err);
    res.json({ success: false, message: "Failed to save user" });
  }
});


app.post("/elder-login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email, password });
    if (!user) {
      return res.json({ success: false, message: "Invalid credentials" });
    }
    res.json({ success: true, name: user.name });
  } catch (err) {
    console.error("Login error:", err);
    res.json({ success: false });
  }
});

// ✅ GET user profile
app.get("/get-user", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ success: false, message: "Email is required" });

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user: { name: user.name, email: user.email } });
  } catch (err) {
    console.error("Error fetching user:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ POST support request
app.post("/support-request", async (req, res) => {
  const { name, email, phone, title, description, category, location } = req.body;
  try {
    const newRequest = new SupportRequest({ name, email, phone, title, description, category, location });
    await newRequest.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving support request:", error);
    res.json({ success: false });
  }
});

// ✅ GET all support requests for a user
app.get("/get-requests", async (req, res) => {
  const { email } = req.query;
  try {
    const requests = await SupportRequest.find({ email });
    res.json(requests);
  } catch (error) {
    console.error("Error fetching requests:", error);
    res.status(500).json({ success: false });
  }
});

// ✅ POST feedback
app.post("/submit-feedback", async (req, res) => {
  const { requestId, feedback } = req.body;
  try {
    await Feedback.create({ requestId, feedback });
    await SupportRequest.findByIdAndUpdate(requestId, { status: "Completed" });
    res.json({ success: true });
  } catch (error) {
    console.error("Error saving feedback:", error);
    res.json({ success: false });
  }
});

// ✅ Serve transition.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "transition.html"));
});

// ✅ Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));


