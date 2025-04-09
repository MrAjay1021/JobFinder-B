const mongoose = require('mongoose');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  companyName: { type: String, required: true },
  logoUrl: { type: String },
  companyLogoUrl: { type: String },
  companySize: { type: String, default: '11-50' },
  location: { type: String, required: true },
  monthlySalary: { type: Number, required: true },
  duration: { type: String, default: '6 Months' },
  jobType: { 
    type: String, 
    enum: ["Full Time", "Part Time", "Internship", "Contract", "Freelance", "Full-time", "Part-time"], 
    required: true 
  },
  remoteOffice: { 
    type: String, 
    enum: ["Remote", "Office", "Hybrid"] 
  },
  isRemote: { type: Boolean, default: false },
  description: { type: String, required: true },
  aboutCompany: { type: String, required: true },
  skillsRequired: { type: [String] }, // e.g., ["JavaScript", "WordPress"]
  additionalInfo: { type: String },
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