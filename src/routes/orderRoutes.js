import express from 'express'
import Order from '../models/Orders.js'
import Product from '../models/Product.js'
import protectedAdminRoute from '../middleware/auth.admin.middleware.js'
import protectedUserRoute from '../middleware/auth.user.middleware.js'
import protectedOwnerOrAdminRoute from '../middleware/auth.isOwnerOrAdmin.middleware.js'

const router = express.Router()

// customer order create

router.post('/', protectedUserRoute, async (req, res) => {
  try {
    const { user, items, shippingAddress } = req.body

    let totalAmount = 0
    for (const item of items) {
      const product = await Product.findById(item.product)

      if (!product) {
        return res
          .status(400)
          .json({ message: `Product not found: ${item.product}` })
      }
      totalAmount += product.price * item.quantity
    }
    const newOrder = new Order({
      user,
      items,
      totalAmount,
      shippingAddress,
    })
    await newOrder.save()
    res.status(201).json(newOrder)
  } catch (error) {
    console.error('Order creation error: ', error)
  }
})

// get Orders by User ID

router.get('/user/:userId', protectedOwnerOrAdminRoute, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.params.userId }).populate(
      'items.product',
      'name price',
    )

    res.status(200).json(orders)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user orders.' })
  }
})

// admin protected the get all orders

router.get('/', protectedAdminRoute, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'username email')
      .populate('items.product', 'name price')
    res.status(200).json(orders)
  } catch (error) {
    res.status(500).json({ message: 'Error fetching orders.' })
  }
})

// admin update order status
router.patch('/:id', protectedAdminRoute, async (req, res) => {
  try {
    const { paymentStatus, deliveryStatus } = req.body
    const updateOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { paymentStatus, deliveryStatus },
      { new: true },
    )
    if (!updateOrder)
      return res.status(404).json({ message: 'Order not found' })
    res.status(200).json(updateOrder)
  } catch (error) {
    res.status(500).json({ message: 'Error updating order' })
  }
})

export default router
