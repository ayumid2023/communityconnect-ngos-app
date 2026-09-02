const mongoose = require('mongoose');

const ImpactSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    metrics: {
      peopleHelped: {
        type: Number,
        default: 0,
      },
      volunteersEngaged: {
        type: Number,
        default: 0,
      },
      fundsRaised: {
        type: Number,
        default: 0,
      },
    },
    location: {
      lat: {
        type: Number,
      },
      lng: {
        type: Number,
      },
      address: {
        type: String,
      },
    },
    images: [
      {
        type: String,
      },
    ],
    videoUrl: {
      type: String,
    },
    date: {
      type: Date,
      default: Date.now,
    },
    relatedCampaignId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Campaign',
    },
    isPublished: {
      type: Boolean,
      default: false,
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

ImpactSchema.index({ orgId: 1, isPublished: 1, date: -1 });
ImpactSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Impact', ImpactSchema);
