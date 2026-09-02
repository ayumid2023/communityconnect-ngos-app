const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

dotenv.config({ path: '../../.env' });

const Organization = require('../models/Organization');
const User = require('../models/User');
const Campaign = require('../models/Campaign');
const Donation = require('../models/Donation');
const Volunteer = require('../models/Volunteer');
const logger = require('../utils/logger');

const seedData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    logger.info('Connected to MongoDB');

    // Clear existing data
    await Organization.deleteMany({});
    await User.deleteMany({});
    await Campaign.deleteMany({});
    await Donation.deleteMany({});
    await Volunteer.deleteMany({});
    logger.info('Cleared existing data');

    // Create organization
    const organization = await Organization.create({
      name: 'CommunityConnect Demo',
      domain: 'demo.communityconnect.org',
      primaryColor: '#2563eb',
      settings: {
        currency: 'USD',
        language: 'en',
        timezone: 'UTC',
      },
    });
    logger.info(`Created organization: ${organization.name}`);

    // Create admin user
    const admin = await User.create({
      orgId: organization._id,
      email: 'admin@demo.org',
      password: 'Admin123!',
      role: 'admin',
      profile: {
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1234567890',
      },
      isActive: true,
      emailVerified: true,
    });
    logger.info(`Created admin user: ${admin.email}`);

    // Create donor users
    const donor1 = await User.create({
      orgId: organization._id,
      email: 'john.doe@example.com',
      password: 'Donor123!',
      role: 'donor',
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1234567891',
      },
      isActive: true,
      emailVerified: true,
    });

    const donor2 = await User.create({
      orgId: organization._id,
      email: 'jane.smith@example.com',
      password: 'Donor123!',
      role: 'donor',
      profile: {
        firstName: 'Jane',
        lastName: 'Smith',
        phone: '+1234567892',
      },
      isActive: true,
      emailVerified: true,
    });
    logger.info('Created donor users');

    // Create volunteer user
    const volunteerUser = await User.create({
      orgId: organization._id,
      email: 'volunteer@demo.org',
      password: 'Volunteer123!',
      role: 'volunteer',
      profile: {
        firstName: 'Volunteer',
        lastName: 'User',
        phone: '+1234567893',
      },
      isActive: true,
      emailVerified: true,
    });
    logger.info('Created volunteer user');

    // Create volunteer profile
    const volunteer = await Volunteer.create({
      userId: volunteerUser._id,
      orgId: organization._id,
      skills: ['Teaching', 'Event Management', 'Fundraising'],
      availability: {
        days: ['monday', 'wednesday', 'friday'],
        preferredHours: {
          start: '09:00',
          end: '17:00',
        },
      },
      hoursWorked: 25,
      status: 'active',
      assignments: [
        {
          task: 'Community Outreach Event',
          description: 'Help organize the annual community outreach event',
          assignedAt: new Date('2026-08-01'),
          dueDate: new Date('2026-09-15'),
          hoursCompleted: 5,
          status: 'completed',
        },
        {
          task: 'Fundraising Campaign Support',
          description: 'Assist with donor outreach for the education campaign',
          assignedAt: new Date('2026-08-15'),
          dueDate: new Date('2026-10-01'),
          hoursCompleted: 3,
          status: 'in-progress',
        },
      ],
    });
    logger.info('Created volunteer profile');

    // Create campaigns
    const campaign1 = await Campaign.create({
      orgId: organization._id,
      name: 'Education for All',
      description: 'Providing quality education to underprivileged children in rural communities.',
      goal: 50000,
      raised: 32500,
      status: 'active',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2026-12-31'),
      isFeatured: true,
    });

    const campaign2 = await Campaign.create({
      orgId: organization._id,
      name: 'Clean Water Initiative',
      description: 'Building sustainable water wells in communities without access to clean water.',
      goal: 75000,
      raised: 18000,
      status: 'active',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-11-30'),
      isFeatured: false,
    });

    const campaign3 = await Campaign.create({
      orgId: organization._id,
      name: 'Women Empowerment Program',
      description: 'Providing skills training and microloans to women entrepreneurs.',
      goal: 30000,
      raised: 30000,
      status: 'completed',
      startDate: new Date('2025-06-01'),
      endDate: new Date('2026-05-31'),
      isFeatured: false,
    });
    logger.info('Created campaigns');

    // Create donations
    const donations = [
      {
        orgId: organization._id,
        donorId: donor1._id,
        donorEmail: donor1.email,
        donorName: 'John Doe',
        amount: 1000,
        currency: 'USD',
        paymentMethod: 'stripe',
        status: 'completed',
        campaignId: campaign1._id,
      },
      {
        orgId: organization._id,
        donorId: donor2._id,
        donorEmail: donor2.email,
        donorName: 'Jane Smith',
        amount: 500,
        currency: 'USD',
        paymentMethod: 'stripe',
        status: 'completed',
        campaignId: campaign1._id,
      },
      {
        orgId: organization._id,
        donorId: donor1._id,
        donorEmail: donor1.email,
        donorName: 'John Doe',
        amount: 250,
        currency: 'USD',
        paymentMethod: 'stripe',
        status: 'completed',
        campaignId: campaign2._id,
      },
      {
        orgId: organization._id,
        donorId: donor2._id,
        donorEmail: donor2.email,
        donorName: 'Jane Smith',
        amount: 100,
        currency: 'USD',
        paymentMethod: 'stripe',
        status: 'pending',
        campaignId: campaign2._id,
      },
      {
        orgId: organization._id,
        donorEmail: 'anonymous@example.com',
        donorName: 'Anonymous Donor',
        amount: 2000,
        currency: 'USD',
        paymentMethod: 'cash',
        status: 'completed',
        campaignId: campaign1._id,
      },
      {
        orgId: organization._id,
        donorId: donor1._id,
        donorEmail: donor1.email,
        donorName: 'John Doe',
        amount: 1500,
        currency: 'USD',
        paymentMethod: 'stripe',
        status: 'completed',
        campaignId: campaign3._id,
      },
    ];

    for (const donationData of donations) {
      await Donation.create(donationData);
    }
    logger.info(`Created ${donations.length} donations`);

    // Update campaign donor counts
    await Campaign.findByIdAndUpdate(campaign1._id, { $set: { donorCount: 3 } });
    await Campaign.findByIdAndUpdate(campaign2._id, { $set: { donorCount: 2 } });
    await Campaign.findByIdAndUpdate(campaign3._id, { $set: { donorCount: 1 } });

    logger.info('✅ Seed data created successfully!');
    logger.info(`Organization ID: ${organization._id}`);
    logger.info(`Admin email: ${admin.email}`);
    logger.info(`Admin password: Admin123!`);

    process.exit(0);
  } catch (error) {
    logger.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
