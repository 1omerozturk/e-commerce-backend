import express from 'express'
import User from '../models/User.js'
import protectedAdminRoute from '../middleware/auth.admin.middleware.js'

const router = express.Router()

router.get('/', protectedAdminRoute, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } }).select(
      '-password',
    )
    res.status(200).json(users)
  } catch (error) {
    console.error('User fetch error:', error)
    res.status(500).json({ message: 'Users could not be fetched.' })
  }
})

export default router
