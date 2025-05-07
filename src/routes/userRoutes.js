import express from 'express'
import User from '../models/User.js'
import protectedAdminRoute from '../middleware/auth.admin.middleware.js'
import protectedUserRoute from '../middleware/auth.user.middleware.js'

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

// Get user's shipping addresses
router.get('/addresses', protectedUserRoute, async (req, res) => {
  const user = await User.findById(req.user.id).select('shippingAddresses')
  res.json(user.shippingAddresses)
})

// Add new address
router.post('/addresses', protectedUserRoute, async (req, res) => {
  const user = await User.findById(req.user.id)
  user.shippingAddresses.push(req.body)
  await user.save()
  res.status(201).json(user.shippingAddresses)
})

// Update address
router.put('/addresses/:id', protectedUserRoute, async (req, res) => {
  const user = await User.findById(req.user.id)
  const index = user.shippingAddresses.findIndex(
    (addr) => addr._id.toString() === req.params.id,
  )
  if (index === -1)
    return res.status(404).json({ message: 'Address not found' })
  user.shippingAddresses[index] = { _id: req.params.id, ...req.body }
  await user.save()
  res.json(user.shippingAddresses)
})

// Delete address
router.delete('/addresses/:id', protectedUserRoute, async (req, res) => {
  const user = await User.findById(req.user.id)
  user.shippingAddresses = user.shippingAddresses.filter(
    (addr) => addr._id.toString() !== req.params.id,
  )
  await user.save()
  res.json(user.shippingAddresses)
})

export default router
