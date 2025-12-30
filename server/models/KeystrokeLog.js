import mongoose from 'mongoose'

const keystrokeEventSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    inputValue: {
      type: String,
      required: true,
    },
    fieldName: {
      type: String,
      trim: true,
    },
    eventType: {
      type: String,
      enum: ['keydown', 'keyup', 'input', 'paste', 'unknown'],
      default: 'input',
    },
    typedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
)

const keystrokeLogSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    userId: {
      type: String,
      trim: true,
    },
    page: {
      type: String,
      trim: true,
    },
    events: {
      type: [keystrokeEventSchema],
      default: [],
      validate: [Array.isArray, 'Events must be an array'],
    },
    metadata: {
      type: Map,
      of: String,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      immutable: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  }
)

keystrokeLogSchema.index({ sessionId: 1, createdAt: -1 })

const KeystrokeLog = mongoose.model('KeystrokeLog', keystrokeLogSchema)

export default KeystrokeLog
