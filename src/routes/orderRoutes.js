import express from 'express'
import Order from '../models/Orders.js'
import Product from '../models/Product.js'
import User from '../models/User.js'
import protectedAdminRoute from '../middleware/auth.admin.middleware.js'
import protectedUserRoute from '../middleware/auth.user.middleware.js'
import protectedOwnerOrAdminRoute from '../middleware/auth.isOwnerOrAdmin.middleware.js'

const router = express.Router()

router.post('/', protectedUserRoute, async (req, res) => {
  try {
    const { user, items, shippingAddress } = req.body
    if (user !== req.user._id) return res.status(403).json({ message: 'Access denied' })
    const products = await Promise.all(items.map((item) => Product.findById(item.product)))
    if (products.some((product) => !product)) return res.status(400).json({ message: 'Product not found' })
    const totalAmount = items.reduce((total, item, index) => total + products[index].price * item.quantity, 0)
    res.status(201).json(await Order.create({ user, items, totalAmount, shippingAddress }))
  } catch (error) { res.status(500).json({ message: 'Order creation error' }) }
})

router.get('/user/:userId', protectedOwnerOrAdminRoute, async (req, res) => {
  try { res.json(await Order.findByUser(req.params.userId)) } catch (error) { res.status(500).json({ message: 'Error fetching user orders.' }) }
})

router.get('/', protectedAdminRoute, async (req, res) => {
  try { res.json(await Order.findAll()) } catch (error) { res.status(500).json({ message: 'Error fetching orders.' }) }
})

router.patch('/:id', protectedAdminRoute, async (req, res) => {
  try {
    const order = await Order.updateStatus(req.params.id, { paymentStatus: req.body.paymentStatus, deliveryStatus: req.body.deliveryStatus })
    if (!order) return res.status(404).json({ message: 'Order not found' })
    res.json(order)
  } catch (error) { res.status(500).json({ message: 'Error updating order' }) }
})

export default router
