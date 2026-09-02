const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { sendDonationReceipt } = require('./email.service');
const logger = require('../utils/logger');

/**
 * Create a payment intent
 */
const createPaymentIntent = async ({
  amount,
  currency = 'usd',
  campaignId,
  donorEmail,
  donorName,
  isRecurring = false,
  interval = 'month',
}) => {
  try {
    const paymentIntentData = {
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        campaignId: campaignId || '',
        donorEmail: donorEmail || '',
        donorName: donorName || '',
        isRecurring: String(isRecurring),
      },
      receipt_email: donorEmail,
    };

    let paymentIntent;

    if (isRecurring) {
      // Create a customer for recurring payments
      let customer;
      if (donorEmail) {
        const customers = await stripe.customers.list({ email: donorEmail, limit: 1 });
        customer = customers.data[0] || await stripe.customers.create({ email: donorEmail });
      } else {
        customer = await stripe.customers.create();
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [
          {
            price_data: {
              currency,
              product_data: {
                name: `Donation - ${campaignId || 'General'}`,
              },
              unit_amount: Math.round(amount * 100),
              recurring: {
                interval: interval,
              },
            },
          },
        ],
        metadata: {
          campaignId: campaignId || '',
          donorEmail: donorEmail || '',
          donorName: donorName || '',
        },
      });

      paymentIntent = subscription.latest_invoice.payment_intent;
      return {
        clientSecret: paymentIntent.client_secret,
        subscriptionId: subscription.id,
        paymentIntentId: paymentIntent.id,
      };
    } else {
      paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
      return {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        subscriptionId: null,
      };
    }
  } catch (error) {
    logger.error('Stripe payment intent error:', error);
    throw error;
  }
};

/**
 * Handle Stripe webhook events
 */
const handleWebhookEvent = async (event) => {
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
    case 'invoice.payment_succeeded':
      await handleRecurringPaymentSuccess(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCancellation(event.data.object);
      break;
    default:
      logger.info(`Unhandled Stripe event: ${event.type}`);
  }
};

/**
 * Handle successful one-time payment
 */
const handlePaymentSuccess = async (paymentIntent) => {
  try {
    const { campaignId, donorEmail, donorName, isRecurring } = paymentIntent.metadata;
    const amount = paymentIntent.amount / 100;
    const currency = paymentIntent.currency;

    // Find or create donor
    let donor = null;
    if (donorEmail) {
      donor = await User.findOne({ email: donorEmail });
      if (!donor) {
        donor = await User.create({
          email: donorEmail,
          role: 'donor',
          profile: { firstName: donorName || '' },
        });
        logger.info(`Created new donor: ${donorEmail}`);
      }
    }

    // Create donation record
    const donation = await Donation.create({
      donorId: donor ? donor._id : null,
      donorEmail: donorEmail || 'anonymous',
      donorName: donorName || 'Anonymous Donor',
      amount,
      currency,
      paymentMethod: 'stripe',
      stripePaymentIntentId: paymentIntent.id,
      status: 'completed',
      campaignId: campaignId || null,
      isRecurring: isRecurring === 'true',
    });

    // Update campaign progress
    if (campaignId) {
      const campaign = await Campaign.findByIdAndUpdate(
        campaignId,
        {
          $inc: { raised: amount, donorCount: 1 },
        },
        { new: true }
      );
      logger.info(`Campaign ${campaignId} updated: raised ${campaign.raised}`);
    }

    // Send receipt email
    try {
      await sendDonationReceipt(donation, donor);
    } catch (emailError) {
      logger.error('Failed to send donation receipt:', emailError);
    }

    logger.info(`Donation processed successfully: ${donation._id}`);
    return donation;
  } catch (error) {
    logger.error('Error handling payment success:', error);
    throw error;
  }
};

/**
 * Handle failed payment
 */
const handlePaymentFailure = async (paymentIntent) => {
  try {
    await Donation.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      { status: 'failed' }
    );
    logger.info(`Payment failed recorded: ${paymentIntent.id}`);
  } catch (error) {
    logger.error('Error handling payment failure:', error);
  }
};

/**
 * Handle recurring payment success
 */
const handleRecurringPaymentSuccess = async (invoice) => {
  try {
    const subscriptionId = invoice.subscription;
    const paymentIntentId = invoice.payment_intent;
    const amount = invoice.amount_paid / 100;
    const currency = invoice.currency;

    // Find the original donation
    const existingDonation = await Donation.findOne({
      stripeSubscriptionId: subscriptionId,
      status: 'completed',
    });

    // Create a new donation record for this recurring payment
    const donation = await Donation.create({
      orgId: existingDonation?.orgId || null,
      donorId: existingDonation?.donorId || null,
      donorEmail: existingDonation?.donorEmail || 'anonymous',
      donorName: existingDonation?.donorName || 'Anonymous Donor',
      amount,
      currency,
      paymentMethod: 'stripe',
      stripePaymentIntentId: paymentIntentId,
      stripeSubscriptionId: subscriptionId,
      status: 'completed',
      campaignId: existingDonation?.campaignId || null,
      isRecurring: true,
      recurringInterval: invoice.lines?.data?.[0]?.price?.recurring?.interval || 'month',
      nextDonationDate: new Date(invoice.next_payment_attempt),
    });

    // Update campaign
    if (donation.campaignId) {
      await Campaign.findByIdAndUpdate(
        donation.campaignId,
        { $inc: { raised: amount, donorCount: 1 } }
      );
    }

    logger.info(`Recurring donation recorded: ${donation._id}`);
  } catch (error) {
    logger.error('Error handling recurring payment:', error);
  }
};

/**
 * Handle subscription cancellation
 */
const handleSubscriptionCancellation = async (subscription) => {
  try {
    await Donation.updateMany(
      { stripeSubscriptionId: subscription.id },
      { isRecurring: false }
    );
    logger.info(`Subscription cancelled: ${subscription.id}`);
  } catch (error) {
    logger.error('Error handling subscription cancellation:', error);
  }
};

module.exports = {
  createPaymentIntent,
  handleWebhookEvent,
};
