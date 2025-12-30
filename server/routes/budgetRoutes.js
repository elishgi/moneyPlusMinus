import { Router } from 'express'
import { createBudgetSnapshot } from '../controllers/budgetController.js'

const router = Router()

router.post('/', createBudgetSnapshot)

export default router
