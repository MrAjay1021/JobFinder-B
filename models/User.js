const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  mobile: { type: String },
  skills: { type: [String] }, // e.g., ["CSS", "React", "Node.js"]
  postedJobs: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Job" 
  }], // Jobs posted by the user
  applications: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Application" 
  }], // Jobs the user applied to
});

module.exports = mongoose.model('User', UserSchema); 