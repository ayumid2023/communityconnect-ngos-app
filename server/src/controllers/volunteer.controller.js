const Volunteer = require('../models/Volunteer');
const User = require('../models/User');
const { sendVolunteerWelcome } = require('../services/email.service');
const logger = require('../utils/logger');

/**
 * @route GET /api/volunteers
 * @desc Get all volunteers
 */
exports.getAllVolunteers = async (req, res) => {
  try {
    const { status, skill, search } = req.query;
    const query = { orgId: req.user.orgId };
    
    if (status) query.status = status;
    if (skill) query.skills = skill;
    
    let volunteers = await Volunteer.find(query)
      .populate('userId', 'email profile')
      .sort({ createdAt: -1 });
    
    // Search by name or email
    if (search) {
      volunteers = volunteers.filter(v => {
        const name = `${v.userId?.profile?.firstName || ''} ${v.userId?.profile?.lastName || ''}`.toLowerCase();
        const email = (v.userId?.email || '').toLowerCase();
        return name.includes(search.toLowerCase()) || email.includes(search.toLowerCase());
      });
    }
    
    res.json(volunteers);
  } catch (error) {
    logger.error('Get volunteers error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /api/volunteers/:id
 * @desc Get a single volunteer
 */
exports.getVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({
      _id: req.params.id,
      orgId: req.user.orgId,
    }).populate('userId', 'email profile');
    
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    
    res.json(volunteer);
  } catch (error) {
    logger.error('Get volunteer error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /api/volunteers
 * @desc Register a new volunteer
 */
exports.registerVolunteer = async (req, res) => {
  try {
    const { email, profile, skills, availability, certifications } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    // Find or create user
    let user = await User.findOne({ email, orgId: req.user.orgId });
    if (!user) {
      user = await User.create({
        email,
        orgId: req.user.orgId,
        role: 'volunteer',
        profile: profile || { firstName: email.split('@')[0] },
        password: Math.random().toString(36).slice(-8),
      });
    } else if (user.role !== 'volunteer') {
      user.role = 'volunteer';
      await user.save();
    }
    
    // Check if volunteer profile already exists
    let volunteer = await Volunteer.findOne({ userId: user._id, orgId: req.user.orgId });
    
    if (volunteer) {
      // Update existing profile
      volunteer.skills = skills || volunteer.skills;
      volunteer.availability = availability || volunteer.availability;
      volunteer.certifications = certifications || volunteer.certifications;
      await volunteer.save();
    } else {
      // Create new volunteer profile
      volunteer = await Volunteer.create({
        userId: user._id,
        orgId: req.user.orgId,
        skills: skills || [],
        availability: availability || { days: [], preferredHours: { start: '', end: '' } },
        certifications: certifications || [],
        status: 'active',
      });
    }
    
    // Send welcome email
    try {
      await sendVolunteerWelcome(volunteer, user);
    } catch (emailError) {
      logger.error('Failed to send volunteer welcome:', emailError);
    }
    
    res.status(201).json(volunteer);
  } catch (error) {
    logger.error('Register volunteer error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route PUT /api/volunteers/:id
 * @desc Update a volunteer
 */
exports.updateVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOneAndUpdate(
      { _id: req.params.id, orgId: req.user.orgId },
      req.body,
      { new: true, runValidators: true }
    ).populate('userId', 'email profile');
    
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    
    res.json(volunteer);
  } catch (error) {
    logger.error('Update volunteer error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route DELETE /api/volunteers/:id
 * @desc Delete a volunteer
 */
exports.deleteVolunteer = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOneAndDelete({
      _id: req.params.id,
      orgId: req.user.orgId,
    });
    
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    
    res.json({ message: 'Volunteer removed successfully' });
  } catch (error) {
    logger.error('Delete volunteer error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /api/volunteers/:id/assign
 * @desc Assign a task to a volunteer
 */
exports.assignTask = async (req, res) => {
  try {
    const { task, description, dueDate, hours } = req.body;
    
    if (!task) {
      return res.status(400).json({ error: 'Task description is required' });
    }
    
    const volunteer = await Volunteer.findOne({
      _id: req.params.id,
      orgId: req.user.orgId,
    });
    
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    
    volunteer.assignments.push({
      task,
      description: description || '',
      dueDate: dueDate ? new Date(dueDate) : null,
      hoursCompleted: hours || 0,
      status: 'assigned',
    });
    
    await volunteer.save();
    res.json(volunteer);
  } catch (error) {
    logger.error('Assign task error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route GET /api/volunteers/:id/assignments
 * @desc Get all assignments for a volunteer
 */
exports.getAssignments = async (req, res) => {
  try {
    const volunteer = await Volunteer.findOne({
      _id: req.params.id,
      orgId: req.user.orgId,
    });
    
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    
    res.json(volunteer.assignments || []);
  } catch (error) {
    logger.error('Get assignments error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /api/volunteers/:id/log-hours
 * @desc Log hours for a volunteer
 */
exports.logHours = async (req, res) => {
  try {
    const { assignmentId, hours } = req.body;
    
    if (!hours || hours <= 0) {
      return res.status(400).json({ error: 'Valid hours are required' });
    }
    
    const volunteer = await Volunteer.findOne({
      _id: req.params.id,
      orgId: req.user.orgId,
    });
    
    if (!volunteer) {
      return res.status(404).json({ error: 'Volunteer not found' });
    }
    
    if (assignmentId) {
      // Update specific assignment
      const assignment = volunteer.assignments.id(assignmentId);
      if (!assignment) {
        return res.status(404).json({ error: 'Assignment not found' });
      }
      assignment.hoursCompleted = (assignment.hoursCompleted || 0) + hours;
      assignment.status = 'completed';
    }
    
    // Update total hours
    volunteer.hoursWorked = (volunteer.hoursWorked || 0) + hours;
    await volunteer.save();
    
    res.json({ 
      hoursWorked: volunteer.hoursWorked,
      message: 'Hours logged successfully' 
    });
  } catch (error) {
    logger.error('Log hours error:', error);
    res.status(500).json({ error: error.message });
  }
};
