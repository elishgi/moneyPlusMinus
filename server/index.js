import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

import { connectToDatabase } from './config/database.js'
import keystrokeRoutes from './routes/keystrokeRoutes.js'
import budgetRoutes from './routes/budgetRoutes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',').map((origin) => origin.trim()) || '*',
}))
app.use(express.json({ limit: '1mb' }))

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/keystrokes', keystrokeRoutes)
app.use('/api/budgets', budgetRoutes)

async function startServer() {
  try {
    await connectToDatabase(process.env.MONGODB_URI)
    app.listen(PORT, () => {
      // eslint-disable-next-line no-console
      console.log(`Server listening on port ${PORT}`)
    })
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to start server', error)
    process.exit(1)
  }
}

startServer()
