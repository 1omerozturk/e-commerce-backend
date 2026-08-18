import express from 'express'
import Category from '../models/Category.js'
import { collection } from '../lib/firestore.js'
import cloudinary from '../lib/cloudinary.js'
import protectedAdminRoute from '../middleware/auth.admin.middleware.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const categories = await Category.findAll()
    const products = collection('products')
    const result = await Promise.all(categories.map(async (category) => {
      const count = await products.where('category', '==', category._id).count().get()
      return { ...category, productCount: count.data().count }
    }))
    res.json(result)
  } catch (error) { res.status(500).json({ message: 'Error fetching categories' }) }
})

router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ message: 'Category not found' })
    res.json(category)
  } catch (error) { res.status(500).json({ message: 'Error fetching category' }) }
})

router.post('/', protectedAdminRoute, async (req, res) => {
  try {
    const { name, description, image } = req.body
    if (!name) return res.status(400).json({ message: 'Please provide all fields.' })
    res.status(201).json(await Category.create({ name, description, image }))
  } catch (error) { res.status(500).json({ message: 'Error adding category' }) }
})

router.put('/:id', protectedAdminRoute, async (req, res) => {
  try {
    const category = await Category.update(req.params.id, req.body)
    if (!category) return res.status(404).json({ message: 'Category not found' })
    res.json(category)
  } catch (error) { res.status(500).json({ message: 'Error updating category' }) }
})

router.delete('/:id', protectedAdminRoute, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ message: 'Category not found' })
    if (category.image?.includes('cloudinary')) {
      const publicId = category.image.split('/').pop().split('.')[0]
      await cloudinary.uploader.destroy(publicId).catch(() => {})
    }
    await Category.remove(req.params.id)
    res.json({ message: 'Category deleted successfully.' })
  } catch (error) { res.status(500).json({ message: 'Error deleting category' }) }
})

export default router
