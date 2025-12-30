import { Router } from 'express'
import { getKeystrokes, saveKeystrokes } from '../controllers/keystrokeController.js'

const router = Router()

router.post('/', saveKeystrokes)
router.get('/:sessionId', getKeystrokes)

export default router
