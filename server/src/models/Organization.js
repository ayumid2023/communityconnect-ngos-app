const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    logo: {
      type: String,
      default: '',
    },
    primaryColor: {
      type: String,
      default: '#2563eb',
    },
    settings: {
      currency: {
        type: String,
        default: 'USD',
      },
      language: {
        type: String,
        default: 'en',
      },
      timezone: {
        type: String,
        default: 'UTC',
      },
      enableCrypto: {
        type: Boolean,
        default: false,
      },
    },
    isActive: {
      type: Boolean,
      default: true,
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

// Update timestamp on save
OrganizationSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Organization', OrganizationSchema);
