const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema({
  title: String,
  category: String,
  location: String,
  description: String,
  status: { type: String, default: "Pending" },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "Volunteer", default: null }
});

module.exports = mongoose.model("SupportRequest", RequestSchema);
