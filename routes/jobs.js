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
    console.log('Received job data:', req.body);
    
    // Map fields from frontend to ensure compatibility
    const jobData = {
      title: req.body.title,
      companyName: req.body.companyName,
      location: req.body.location,
      // Handle different field name possibilities for logo
      logoUrl: req.body.logoUrl || req.body.companyLogoUrl,
      // Make sure monthlySalary is a number
      monthlySalary: Number(req.body.monthlySalary) || 0,
      // Use the jobType sent from frontend - our schema now supports both formats
      jobType: req.body.jobType,
      // Handle remote field in different formats
      remoteOffice: req.body.remoteOffice,
      isRemote: req.body.isRemote || req.body.remoteOffice === 'Remote',
      description: req.body.description,
      aboutCompany: req.body.aboutCompany || req.body.companyName, // Fallback if not provided
      skillsRequired: req.body.skillsRequired || [],
      additionalInfo: req.body.additionalInfo,
      companySize: req.body.companySize || '11-50',
      postedBy: req.user.id
    };

    const job = new Job(jobData);

    const savedJob = await job.save();

    // Add job to user's posted jobs
    await User.findByIdAndUpdate(
      req.user.id,
      { $push: { postedJobs: savedJob._id } }
    );

    res.status(201).json(savedJob);
  } catch (error) {
    console.error('Error creating job:', error);
    
    // Improved error handling
    if (error.name === 'ValidationError') {
      // Handle validation errors specifically
      const validationErrors = {};
      
      // Extract specific validation error messages
      for (const field in error.errors) {
        validationErrors[field] = error.errors[field].message;
      }
      
      return res.status(400).json({
        message: 'Validation error',
        errors: validationErrors
      });
    }
    
    res.status(500).json({ 
      message: 'Server error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
});

// @route   GET api/jobs
// @desc    Get all jobs with filters
// @access  Public
router.get('/', async (req, res) => {
  console.log('GET /api/jobs route hit', { query: req.query });
  
  try {
    const {
      jobType,
      remoteOffice,
      location,
      skills,
      minSalary,
      maxSalary,
      title
    } = req.query;

    let query = {};

    // Add title search if provided
    if (title) query.title = new RegExp(title, 'i');
    if (jobType) query.jobType = jobType;
    if (remoteOffice) query.remoteOffice = remoteOffice;
    if (location) query.location = new RegExp(location, 'i');
    if (skills) query.skillsRequired = { $in: skills.split(',') };
    if (minSalary || maxSalary) {
      query.monthlySalary = {};
      if (minSalary) query.monthlySalary.$gte = Number(minSalary);
      if (maxSalary) query.monthlySalary.$lte = Number(maxSalary);
    }

    console.log('Job search query:', query);

    const jobs = await Job.find(query)
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });

    console.log(`Found ${jobs.length} jobs`);
    
    res.json(jobs);
  } catch (error) {
    console.error('Error in GET /api/jobs:', error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET api/jobs/user
// @desc    Get jobs posted by the authenticated user
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    console.log('Fetching jobs for authenticated user:', { 
      userId: req.user.id, 
      userName: req.user.name,
      userEmail: req.user.email 
    });
    
    const {
      jobType,
      remoteOffice,
      location,
      skills,
      minSalary,
      maxSalary,
      title
    } = req.query;

    // Start with base query that filters by user
    let query = { postedBy: req.user.id };

    // Add any additional filters
    if (jobType) query.jobType = jobType;
    if (remoteOffice) query.remoteOffice = remoteOffice;
    if (location) query.location = new RegExp(location, 'i');
    if (title) query.title = new RegExp(title, 'i');
    if (skills) query.skillsRequired = { $in: skills.split(',') };
    if (minSalary || maxSalary) {
      query.monthlySalary = {};
      if (minSalary) query.monthlySalary.$gte = Number(minSalary);
      if (maxSalary) query.monthlySalary.$lte = Number(maxSalary);
    }
    
    const jobs = await Job.find(query)
      .populate('postedBy', 'name email')
      .sort({ createdAt: -1 });
    
    console.log(`Found ${jobs.length} jobs for user ${req.user.id}`);
    
    res.json(jobs);
  } catch (error) {
    console.error('Error fetching user jobs:', error.message);
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

    // Using deleteOne instead of deprecated remove() method
    await Job.deleteOne({ _id: req.params.id });

    // Remove job from user's posted jobs
    await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { postedJobs: req.params.id } }
    );

    res.json({ message: 'Job removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 