import UserProfile from '../models/UserProfile.js'

export async function getProfile(req, res) {
  const { userId } = req.params

  try {
    const profile = await UserProfile.findById(userId)

    if (!profile) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.json({
      id: profile.id,
      name: profile.name,
      awarenessCompleted: profile.awarenessCompleted,
      awarenessData: profile.awarenessData || {},
      budgets: profile.budgets || [],
      lastSelectedMonth: profile.lastSelectedMonth || '',
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch profile',
      error: error.message,
    })
  }
}

export async function updateAwareness(req, res) {
  const { userId } = req.params
  const { awarenessData, completed } = req.body || {}

  try {
    const profile = await UserProfile.findById(userId)

    if (!profile) {
      return res.status(404).json({ message: 'User not found' })
    }

    profile.awarenessData = awarenessData || {}
    profile.awarenessCompleted = Boolean(completed)
    await profile.save()

    return res.json({ message: 'Awareness saved', completed: profile.awarenessCompleted })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to save awareness',
      error: error.message,
    })
  }
}

export async function saveBudget(req, res) {
  const { userId } = req.params
  const { monthLabel, incomes, expenses, previousCredit } = req.body || {}

  if (!monthLabel || typeof monthLabel !== 'string' || !monthLabel.trim()) {
    return res.status(400).json({ message: 'monthLabel is required' })
  }

  try {
    const profile = await UserProfile.findById(userId)

    if (!profile) {
      return res.status(404).json({ message: 'User not found' })
    }

    const cleanMonth = monthLabel.trim()
    const nextBudget = {
      monthLabel: cleanMonth,
      incomes: incomes || [],
      expenses: expenses || [],
      previousCredit: previousCredit || [],
    }

    const existingIndex = (profile.budgets || []).findIndex(
      (budget) => budget.monthLabel === cleanMonth
    )

    if (existingIndex >= 0) {
      profile.budgets[existingIndex] = nextBudget
    } else {
      profile.budgets.push(nextBudget)
    }

    profile.lastSelectedMonth = cleanMonth
    await profile.save()

    return res.json({ message: 'Budget saved', lastSelectedMonth: profile.lastSelectedMonth })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to save budget',
      error: error.message,
    })
  }
}
