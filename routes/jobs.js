const express = require('express');
const router = express.Router();
const Job = require('../models/Job');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   POST api/jobs
// @desc    Create a job posting
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const {
      title,
      companyName,
      location,
      monthlySalary,
      jobType,
      remoteOffice,
      description,
      skillsRequired
    } = req.body;

    const job = new Job({
      title,
      companyName,
      location,
      monthlySalary,
      jobType,
      remoteOffice,
      description,
      skillsRequired,
      postedBy: req.user.id
    });

    await job.save();

    // Add job to user's posted jobs
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { postedJobs: job._id } }
    );

    res.json(job);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/jobs
// @desc    Get all jobs with filters
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      jobType,
      remoteOffice,
      location,
      skills,
      minSalary,
      maxSalary
    } = req.query;

    let query = {};

    if (jobType) query.jobType = jobType;
    if (remoteOffice) query.remoteOffice = remoteOffice;
    if (location) query.location = new RegExp(location, 'i');
    if (skills) query.skillsRequired = { $in: skills.split(',') };
    if (minSalary || maxSalary) {
      query.monthlySalary = {};
      if (minSalary) query.monthlySalary.$gte = Number(minSalary);
      if (maxSalary) query.monthlySalary.$lte = Number(maxSalary);
    }

    const jobs = await Job.find(query)
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(jobs);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/jobs/:id
// @desc    Get job by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('postedBy', 'name email')
      .populate('applicants');
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    res.json(job);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT api/jobs/:id
// @desc    Update job posting
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user owns the job
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    job = await Job.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(job);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE api/jobs/:id
// @desc    Delete job posting
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Check if user owns the job
    if (job.postedBy.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    await job.remove();

    // Remove job from user's posted jobs
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { postedJobs: job._id } }
    );

    res.json({ message: 'Job removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 