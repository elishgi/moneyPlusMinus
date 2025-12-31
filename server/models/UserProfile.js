import mongoose from 'mongoose'

const budgetSchema = new mongoose.Schema(
  {
    monthLabel: {
      type: String,
      required: true,
      trim: true,
    },
    incomes: {
      type: Array,
      default: [],
    },
    expenses: {
      type: Array,
      default: [],
    },
    previousCredit: {
      type: Array,
      default: [],
    },
  },
  { _id: false }
)

const userProfileSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    awarenessData: {
      type: Object,
      default: {},
    },
    awarenessCompleted: {
      type: Boolean,
      default: false,
    },
    lastSelectedMonth: {
      type: String,
      default: '',
      trim: true,
    },
    budgets: {
      type: [budgetSchema],
      default: [],
    },
    lastVisitedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

userProfileSchema.index({ name: 1 })
userProfileSchema.index({ lastVisitedAt: -1 })

const UserProfile = mongoose.model('UserProfile', userProfileSchema)

export default UserProfile
