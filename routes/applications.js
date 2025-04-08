const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/applications
// @desc    Submit a job application
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { jobId, resumeUrl } = req.body;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      job: jobId,
      candidate: req.user.id
    });

    if (existingApplication) {
      return res.status(400).json({ message: 'Already applied to this job' });
    }

    const application = new Application({
      job: jobId,
      candidate: req.user.id,
      resumeUrl
    });

    await application.save();

    // Add application to job's applicants
    await Job.findByIdAndUpdate(
      jobId,
      { $push: { applicants: application._id } }
    );

    // Add application to user's applications
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { applications: application._id } }
    );

    res.json(application);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/applications
// @desc    Get user's applications
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const applications = await Application.find({ candidate: req.user.id })
      .populate('job')
      .sort({ appliedAt: -1 });
    res.json(applications);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/applications/:id
// @desc    Get application by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('job')
      .populate('candidate', 'name email');

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is the candidate or the job poster
    const job = await Job.findById(application.job);
    if (
      application.candidate._id.toString() !== req.user.id &&
      job.postedBy.toString() !== req.user.id
    ) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    res.json(application);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/applications/:id/status
// @desc    Update application status
// @access  Private
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Check if user is the job poster
    const job = await Job.findById(application.job);
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    application.status = status;
    await application.save();

    res.json(application);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 