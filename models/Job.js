const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  companyName: { type: String, required: true },
  location: { type: String, required: true },
  monthlySalary: { type: Number, required: true },
  jobType: { 
    type: String, 
    enum: ["Full Time", "Part Time", "Internship"], 
    required: true 
  },
  remoteOffice: { 
    type: String, 
    enum: ["Remote", "Office", "Hybrid"] 
  },
  description: { type: String, required: true },
  skillsRequired: { type: [String] }, // e.g., ["JavaScript", "WordPress"]
  postedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  }, // User who posted the job
  applicants: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Application" 
  }], // All applications for this job
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Job', JobSchema); 