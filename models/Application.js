const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  job: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Job", 
    required: true 
  },
  candidate: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  status: { 
    type: String, 
    enum: ["Pending", "Accepted", "Rejected"], 
    default: "Pending" 
  },
  appliedAt: { type: Date, default: Date.now },
  resumeUrl: { type: String }, // Link to resume/CV
});

module.exports = mongoose.model('Application', ApplicationSchema); 