import { Router } from 'express'
import { getProfile, saveBudget, updateAwareness } from '../controllers/userController.js'

const router = Router()

router.get('/:userId', getProfile)
router.put('/:userId/awareness', updateAwareness)
router.put('/:userId/budgets', saveBudget)

export default router
