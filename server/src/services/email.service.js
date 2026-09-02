const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

// Create transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Load email template
 */
const loadTemplate = (templateName, data) => {
  try {
    const templatePath = path.join(__dirname, '../templates/email', `${templateName}.html`);
    let template = fs.readFileSync(templatePath, 'utf8');

    // Replace template variables
    Object.keys(data).forEach((key) => {
      template = template.replace(new RegExp(`{{${key}}}`, 'g'), data[key]);
    });

    return template;
  } catch (error) {
    logger.error(`Failed to load email template ${templateName}:`, error);
    return null;
  }
};

/**
 * Send email
 */
const sendEmail = async ({ to, subject, template, data, attachments }) => {
  try {
    const html = loadTemplate(template, data);

    if (!html) {
      throw new Error(`Email template "${template}" not found`);
    }

    const mailOptions = {
      from: `CommunityConnect <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
      attachments,
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Failed to send email to ${to}:`, error);
    throw error;
  }
};

/**
 * Send donation receipt
 */
const sendDonationReceipt = async (donation, donor) => {
  const data = {
    donorName: donation.donorName || 'Valued Donor',
    amount: donation.amount,
    currency: donation.currency,
    date: new Date(donation.createdAt).toLocaleDateString(),
    transactionId: donation._id,
    campaignName: donation.campaignId?.name || 'General Donation',
    receiptUrl: donation.receiptUrl || '',
  };

  return sendEmail({
    to: donation.donorEmail,
    subject: 'Thank You for Your Donation - CommunityConnect',
    template: 'donation-receipt',
    data,
  });
};

/**
 * Send volunteer welcome email
 */
const sendVolunteerWelcome = async (volunteer, user) => {
  const data = {
    name: user.profile.firstName || 'Volunteer',
    loginUrl: `${process.env.CLIENT_URL}/login`,
  };

  return sendEmail({
    to: user.email,
    subject: 'Welcome to CommunityConnect Volunteering',
    template: 'volunteer-welcome',
    data,
  });
};

module.exports = {
  sendEmail,
  sendDonationReceipt,
  sendVolunteerWelcome,
};
