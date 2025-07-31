const mongoose = require("mongoose");

const VolunteerSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  // ✅ include phone if needed
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Request" }],
  completedTasks: { type: Number, default: 0 },
  badges: [String],
});

module.exports = mongoose.model("Volunteer", VolunteerSchema);