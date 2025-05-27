import express from 'express'
import User from '../models/User.js'
import protectedAdminRoute from '../middleware/auth.admin.middleware.js'
import protectedUserRoute from '../middleware/auth.user.middleware.js'
import protectedOwnerOrAdminRoute from '../middleware/auth.isOwnerOrAdmin.middleware.js'

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
router.get('/:userId', protectedUserRoute, async (req, res) => {
  try {
    const { userId } = req.params

    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' })
    }

    // Kullanıcı kendi bilgisine mi erişiyor kontrolü
    if (req.user._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: 'Access denied' })
    }

    const user = await User.findById(userId).select('-password')
    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({
      user: {
        id: user._id,
        firstname_lastname: user.firstname_lastname,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        shippingAddresses: user.shippingAddresses,
      },
    })
  } catch (error) {
    console.error('User fetch error:', error)
    res.status(500).json({ message: 'An error occurred while fetching user' })
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
  if (!user) {
    return res.status(404).json({ message: 'User not found' })
  }
  user.shippingAddresses.push(req.body)
  await user.save()
  res.status(201).json({ message: 'The address added successfully.' })
})

// Update address
router.put('/addresses/:id', protectedUserRoute, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(404).json({ message: 'User not found' })

    const address = user.shippingAddresses.id(req.params.id)
    if (!address) return res.status(404).json({ message: 'Address not found' })
    // Alanları güncelle
    Object.assign(address, req.body)

    await user.save()
    res.json({
      success: true,
      message: 'Address updated',
      addresses: user.shippingAddresses,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, message: 'Server error' })
  }
})

// Delete address
router.delete('/addresses/:id', protectedUserRoute, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return res.status(400).json({ message: 'User not found' })

    user.shippingAddresses = user.shippingAddresses.filter(
      (addr) => addr._id.toString() !== req.params.id,
    )
    await user.save()
    res.json(user.shippingAddresses)
  } catch (error) {
    console.error(error)
  }
})

export default router
