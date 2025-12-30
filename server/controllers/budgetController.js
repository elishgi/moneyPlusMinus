import BudgetSnapshot from '../models/BudgetSnapshot.js'

export async function createBudgetSnapshot(req, res) {
  const { monthLabel, totalIncome, totalExpenses, remaining } = req.body || {}

  if (!monthLabel || typeof monthLabel !== 'string') {
    return res.status(400).json({ message: 'monthLabel is required' })
  }

  const numbers = [totalIncome, totalExpenses, remaining].map((value) => Number(value))

  if (numbers.some((value) => Number.isNaN(value))) {
    return res.status(400).json({ message: 'Numeric totals are required' })
  }

  try {
    const snapshot = await BudgetSnapshot.create({
      monthLabel: monthLabel.trim(),
      totalIncome: numbers[0],
      totalExpenses: numbers[1],
      remaining: numbers[2],
    })

    return res.status(201).json({
      id: snapshot.id,
      createdAt: snapshot.createdAt,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to save budget snapshot',
      error: error.message,
    })
  }
}
