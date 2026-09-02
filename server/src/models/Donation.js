const mongoose = require('mongoose');

const DonationSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    donorEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    donorName: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    paymentMethod: {
      type: String,
      enum: ['stripe', 'paypal', 'cash', 'bank_transfer', 'crypto'],
      required: true,
    },
    stripePaymentIntentId: {
      type: String,
    },
    stripeSubscriptionId: {
      type: String,
    },
    cryptocurrencyType: {
      type: String,
    },
    transactionHash: {
      type: String,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending',
    },
    campaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurringInterval: {
      type: String,
      enum: ['monthly', 'quarterly', 'yearly'],
    },
    nextDonationDate: {
      type: Date,
    },
    receiptSent: {
      type: Boolean,
      default: false,
    },
    receiptUrl: {
      type: String,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for common queries
DonationSchema.index({ orgId: 1, status: 1, createdAt: -1 });
DonationSchema.index({ campaignId: 1 });
DonationSchema.index({ donorEmail: 1 });

module.exports = mongoose.model('Donation', DonationSchema);
