import KeystrokeLog from '../models/KeystrokeLog.js'

export async function saveKeystrokes(req, res) {
  const { sessionId, userId, page, events, metadata } = req.body

  if (!sessionId) {
    return res.status(400).json({ message: 'sessionId is required' })
  }

  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ message: 'events must be a non-empty array' })
  }

  try {
    const keystrokeLog = await KeystrokeLog.create({
      sessionId,
      userId,
      page,
      events,
      metadata,
    })

    return res.status(201).json({
      id: keystrokeLog.id,
      createdAt: keystrokeLog.createdAt,
    })
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to save keystrokes',
      error: error.message,
    })
  }
}

export async function getKeystrokes(req, res) {
  const { sessionId } = req.params

  try {
    const logs = await KeystrokeLog.find({ sessionId }).sort({ createdAt: -1 }).limit(20)
    return res.json(logs)
  } catch (error) {
    return res.status(500).json({
      message: 'Failed to fetch keystrokes',
      error: error.message,
    })
  }
}
