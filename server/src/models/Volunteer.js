const mongoose = require('mongoose');

const AssignmentSchema = new mongoose.Schema({
  task: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  assignedAt: {
    type: Date,
    default: Date.now,
  },
  dueDate: {
    type: Date,
  },
  hoursCompleted: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['assigned', 'in-progress', 'completed', 'cancelled'],
    default: 'assigned',
  },
  feedback: {
    type: String,
  },
});

const VolunteerSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
    },
    skills: [
      {
        type: String,
      },
    ],
    availability: {
      days: [
        {
          type: String,
          enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        },
      ],
      preferredHours: {
        start: {
          type: String,
        },
        end: {
          type: String,
        },
      },
    },
    hoursWorked: {
      type: Number,
      default: 0,
    },
    certifications: [
      {
        name: {
          type: String,
          required: true,
        },
        issuedDate: {
          type: Date,
        },
        expiryDate: {
          type: Date,
        },
        fileUrl: {
          type: String,
        },
      },
    ],
    assignments: [AssignmentSchema],
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending'],
      default: 'pending',
    },
    notes: {
      type: String,
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

VolunteerSchema.index({ orgId: 1, status: 1 });
VolunteerSchema.index({ skills: 1 });

module.exports = mongoose.model('Volunteer', VolunteerSchema);
