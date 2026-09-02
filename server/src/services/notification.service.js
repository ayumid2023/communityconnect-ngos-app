const { sendEmail } = require('./email.service');
const logger = require('../utils/logger');

/**
 * Send notification to volunteer
 */
const notifyVolunteer = async (volunteer, assignment) => {
  try {
    const data = {
      name: volunteer.userId?.profile?.firstName || 'Volunteer',
      task: assignment.task,
      description: assignment.description || '',
      dueDate: assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'Not specified',
    };

    await sendEmail({
      to: volunteer.userId?.email,
      subject: `New Task Assignment: ${assignment.task}`,
      template: 'volunteer-assignment',
      data,
    });

    logger.info(`Notification sent to volunteer: ${volunteer.userId?.email}`);
  } catch (error) {
    logger.error('Failed to send volunteer notification:', error);
  }
};

/**
 * Send donation confirmation
 */
const notifyDonor = async (donation) => {
  try {
    const data = {
      name: donation.donorName,
      amount: donation.amount,
      currency: donation.currency,
      campaign: donation.campaignId?.name || 'General Donation',
      date: new Date(donation.createdAt).toLocaleDateString(),
      transactionId: donation._id,
    };

    await sendEmail({
      to: donation.donorEmail,
      subject: 'Thank You for Your Donation',
      template: 'donation-confirmation',
      data,
    });

    logger.info(`Donation confirmation sent to: ${donation.donorEmail}`);
  } catch (error) {
    logger.error('Failed to send donation confirmation:', error);
  }
};

/**
 * Send campaign update
 */
const notifyCampaignUpdate = async (campaign, donors) => {
  try {
    const data = {
      campaignName: campaign.name,
      raised: campaign.raised,
      goal: campaign.goal,
      progress: Math.round((campaign.raised / campaign.goal) * 100),
      description: campaign.description,
    };

    for (const donor of donors) {
      await sendEmail({
        to: donor.email,
        subject: `Campaign Update: ${campaign.name}`,
        template: 'campaign-update',
        data: { ...data, name: donor.profile?.firstName || 'Supporter' },
      });
    }

    logger.info(`Campaign update sent to ${donors.length} donors`);
  } catch (error) {
    logger.error('Failed to send campaign update:', error);
  }
};

module.exports = {
  notifyVolunteer,
  notifyDonor,
  notifyCampaignUpdate,
};
