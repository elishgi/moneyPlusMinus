import mongoose from 'mongoose'

const budgetSnapshotSchema = new mongoose.Schema(
  {
    monthLabel: {
      type: String,
      required: true,
      trim: true,
    },
    totalIncome: {
      type: Number,
      required: true,
      min: [0, 'Income cannot be negative'],
    },
    totalExpenses: {
      type: Number,
      required: true,
      min: [0, 'Expenses cannot be negative'],
    },
    remaining: {
      type: Number,
      required: true,
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

budgetSnapshotSchema.index({ monthLabel: 1, createdAt: -1 })

const BudgetSnapshot = mongoose.model('BudgetSnapshot', budgetSnapshotSchema)

export default BudgetSnapshot
