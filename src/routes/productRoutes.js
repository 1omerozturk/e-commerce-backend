import express from 'express'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import protectedAdminRoute from '../middleware/auth.admin.middleware.js'
import cloudinary from '../lib/cloudinary.js'

const router = express.Router()

const uploadImages = async (images) => {
  const values = typeof images === 'string' ? JSON.parse(images) : images
  if (!Array.isArray(values) || values.length === 0) throw new Error('Images alanı boş veya geçersiz')
  return Promise.all(values.map(async (image) => {
    const source = image.startsWith('data:image/') ? image : `data:image/jpeg;base64,${image}`
    const result = await cloudinary.uploader.upload(source, { folder: 'products' })
    return result.secure_url
  }))
}

router.get('/', async (req, res) => {
  try {
    const page = Number(req.query.page || 1)
    const limit = Number(req.query.limit || 5)
    const result = await Product.findPage(page, limit)
    res.json({ ...result, currentPage: page, totalPages: Math.ceil(result.totalProducts / limit) })
  } catch (error) { res.status(500).json({ message: 'Error fetching products' }) }
})

router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json(product)
  } catch (error) { res.status(500).json({ message: 'Error fetching product' }) }
})

router.post('/', protectedAdminRoute, async (req, res) => {
  try {
    const { name, price, description, stock, category } = req.body
    if (!(await Category.findById(category))) return res.status(400).json({ message: 'Geçersiz kategori ID' })
    const images = await uploadImages(req.body.images)
    res.status(201).json(await Product.create({ name, price: Number(price), description: description || '', images, stock: Number(stock || 0), category }))
  } catch (error) { res.status(500).json({ message: error.message || 'Product creation error' }) }
})

router.put('/:id', protectedAdminRoute, async (req, res) => {
  try {
    const { name, price, description, image, images, stock, category } = req.body
    if (category && !(await Category.findById(category))) return res.status(400).json({ message: 'Category does not exist' })
    const product = await Product.update(req.params.id, { name, price: Number(price), description, image, images, stock: Number(stock), category })
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json(product)
  } catch (error) { res.status(500).json({ message: 'Product update error' }) }
})

router.delete('/:id', protectedAdminRoute, async (req, res) => {
  try {
    const product = await Product.remove(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    for (const image of product.images || []) {
      if (image.includes('cloudinary')) await cloudinary.uploader.destroy(image).catch(() => {})
    }
    res.json({ message: 'Product deleted successfully.' })
  } catch (error) { res.status(500).json({ message: 'Product delete error' }) }
})

export default router
