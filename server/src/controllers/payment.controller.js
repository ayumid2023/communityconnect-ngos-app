const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Donation = require('../models/Donation');
const Campaign = require('../models/Campaign');
const User = require('../models/User');
const { sendDonationReceipt } = require('../services/email.service');
const logger = require('../utils/logger');

/**
 * @route GET /api/payments/config
 * @desc Get Stripe publishable key
 */
exports.getConfig = async (req, res) => {
  res.json({ publishableKey: process.env.STRIPE_PUBLISHABLE_KEY });
};

/**
 * @route POST /api/payments/create-intent
 * @desc Create a payment intent
 */
exports.createPaymentIntent = async (req, res) => {
  try {
    const { 
      amount, 
      currency = 'usd', 
      campaignId, 
      donorEmail, 
      donorName,
      isRecurring = false,
      interval = 'month'
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    let paymentIntent;
    let subscriptionId = null;

    if (isRecurring) {
      // Create or find customer
      let customer;
      if (donorEmail) {
        const customers = await stripe.customers.list({ 
          email: donorEmail, 
          limit: 1 
        });
        customer = customers.data[0] || await stripe.customers.create({ 
          email: donorEmail,
          name: donorName,
        });
      } else {
        customer = await stripe.customers.create({
          name: donorName || 'Anonymous',
        });
      }

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price_data: {
            currency: currency || 'usd',
            product_data: {
              name: `Donation${campaignId ? ` - ${campaignId}` : ''}`,
            },
            unit_amount: Math.round(amount * 100),
            recurring: {
              interval: interval,
            },
          },
        }],
        metadata: {
          campaignId: campaignId || '',
          donorEmail: donorEmail || '',
          donorName: donorName || '',
        },
      });

      paymentIntent = subscription.latest_invoice.payment_intent;
      subscriptionId = subscription.id;
    } else {
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100),
        currency: currency || 'usd',
        metadata: {
          campaignId: campaignId || '',
          donorEmail: donorEmail || '',
          donorName: donorName || '',
          isRecurring: 'false',
        },
        receipt_email: donorEmail,
      });
    }

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      subscriptionId: subscriptionId,
    });
  } catch (error) {
    logger.error('Create payment intent error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * @route POST /api/payments/webhook
 * @desc Handle Stripe webhook events
 */
exports.webhookHandler = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object;
        await handlePaymentSuccess(paymentIntent);
        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object;
        await handlePaymentFailure(paymentIntent);
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;
        await handleRecurringPaymentSuccess(invoice);
        break;
      }
      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        await handleSubscriptionCancellation(subscription);
        break;
      }
      default:
        logger.info(`Unhandled Stripe event: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent) {
  try {
    const { campaignId, donorEmail, donorName } = paymentIntent.metadata;
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
      orgId: donor?.orgId || null,
      donorId: donor ? donor._id : null,
      donorEmail: donorEmail || 'anonymous',
      donorName: donorName || 'Anonymous Donor',
      amount,
      currency,
      paymentMethod: 'stripe',
      stripePaymentIntentId: paymentIntent.id,
      status: 'completed',
      campaignId: campaignId || null,
      isRecurring: false,
    });

    // Update campaign progress
    if (campaignId) {
      await Campaign.findByIdAndUpdate(
        campaignId,
        { $inc: { raised: amount, donorCount: 1 } }
      );
    }

    // Send receipt email
    try {
      await sendDonationReceipt(donation, donor);
    } catch (emailError) {
      logger.error('Failed to send donation receipt:', emailError);
    }

    logger.info(`Donation processed: ${donation._id}`);
  } catch (error) {
    logger.error('Payment success handler error:', error);
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent) {
  try {
    await Donation.findOneAndUpdate(
      { stripePaymentIntentId: paymentIntent.id },
      { status: 'failed' }
    );
    logger.info(`Payment failure recorded: ${paymentIntent.id}`);
  } catch (error) {
    logger.error('Payment failure handler error:', error);
  }
}

/**
 * Handle recurring payment success
 */
async function handleRecurringPaymentSuccess(invoice) {
  try {
    const subscriptionId = invoice.subscription;
    const paymentIntentId = invoice.payment_intent;
    const amount = invoice.amount_paid / 100;
    const currency = invoice.currency;

    const existingDonation = await Donation.findOne({
      stripeSubscriptionId: subscriptionId,
      status: 'completed',
    });

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
      nextDonationDate: invoice.next_payment_attempt ? new Date(invoice.next_payment_attempt) : null,
    });

    if (donation.campaignId) {
      await Campaign.findByIdAndUpdate(
        donation.campaignId,
        { $inc: { raised: amount, donorCount: 1 } }
      );
    }

    logger.info(`Recurring donation recorded: ${donation._id}`);
  } catch (error) {
    logger.error('Recurring payment handler error:', error);
  }
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancellation(subscription) {
  try {
    await Donation.updateMany(
      { stripeSubscriptionId: subscription.id },
      { isRecurring: false }
    );
    logger.info(`Subscription cancelled: ${subscription.id}`);
  } catch (error) {
    logger.error('Subscription cancellation handler error:', error);
  }
}
