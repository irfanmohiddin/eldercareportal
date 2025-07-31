// ✅ ElderCare Backend with post-OTP database insertion
const express = require("express");
const nodemailer = require("nodemailer");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();
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
let generatedOtp = null;
let pendingUser = null;

app.post("/send-otp", async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!email) return res.json({ success: false, message: "Email is required" });

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.json({ success: false, message: "You already have an account with this email. Please use a different email." });
  }

  generatedOtp = Math.floor(100000 + Math.random() * 900000);
  pendingUser = { name, email, password, phone };
  console.log(`Generated OTP for ${email}: ${generatedOtp}`);

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.OTP_EMAIL,
      pass: process.env.OTP_PASS,
    },
  });

  const mailOptions = {
    from: `"ElderCare OTP" <${process.env.OTP_EMAIL}>`,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP is: ${generatedOtp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (error) {
    console.error("Error sending mail:", error);
    res.json({ success: false });
  }
});

app.post("/verify-otp", async (req, res) => {
  const { otp } = req.body;
  if (parseInt(otp) !== generatedOtp || !pendingUser) {
    return res.json({ success: false, message: "Invalid or expired OTP" });
  }

  try {
    await User.create(pendingUser);
    pendingUser = null;
    generatedOtp = null;
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving verified user:", err);
    res.json({ success: false });
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
