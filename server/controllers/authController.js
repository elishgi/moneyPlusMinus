import UserProfile from '../models/UserProfile.js'

export async function login(req, res) {
  const { name } = req.body || {}

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ message: 'name is required' })
  }

  try {
    const normalizedName = name.trim()
    let profile = await UserProfile.findOne({ name: normalizedName })

    if (!profile) {
      profile = await UserProfile.create({ name: normalizedName })
    } else {
      profile.lastVisitedAt = new Date()
      await profile.save()
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
      message: 'Failed to login or create profile',
      error: error.message,
    })
  }
}
