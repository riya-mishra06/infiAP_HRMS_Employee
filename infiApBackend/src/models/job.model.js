const mongoose = require("mongoose");

// Job schema definition matching the frontend form fields
const jobSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    department: { type: String, required: true },
    type: {
      type: String,
      enum: ["Full-time", "Part-time", "Contract", "Internship", "Remote"],
      default: "Full-time",
    },
    experience: { type: String }, // e.g., "Mid (3-5 years)"
    salary: { type: String }, // e.g., "$120k - $160k"
    location: { type: String },
    deadline: { type: Date }, // application deadline
    description: { type: String },
    skills: [{ type: String }], // required skills list
    status: {
      type: String,
      enum: ["Open", "Filled", "Closed", "On Hold"],
      default: "Open",
    },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    closingDate: { type: Date }, // optional explicit closing date
  },
  { timestamps: true }
);

module.exports = mongoose.model("Job", jobSchema);
