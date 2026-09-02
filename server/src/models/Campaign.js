const mongoose = require('mongoose');

const CampaignSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    slug: {
      type: String,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
    },
    goal: {
      type: Number,
      required: true,
      min: 1,
    },
    raised: {
      type: Number,
      default: 0,
    },
    imageUrl: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'cancelled'],
      default: 'draft',
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    donorCount: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Generate slug from name
CampaignSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  this.updatedAt = new Date();
  next();
});

CampaignSchema.index({ orgId: 1, status: 1 });
CampaignSchema.index({ slug: 1 });

module.exports = mongoose.model('Campaign', CampaignSchema);
