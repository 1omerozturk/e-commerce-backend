import express from 'express'
import Product from '../models/Product.js'
import Category from '../models/Category.js'
import protectedAdminRoute from '../middleware/auth.admin.middleware.js'
import cloudinary from '../lib/cloudinary.js'

const router = express.Router()

// Get all products
// pagination => infinite loading
// example call from frontend
// const response=await fetch("http://localhost:3000/api/products?page=1&limit=5")

router.get('/', async (req, res) => {
  try {
    const page = req.query.page || 1
    const limit = req.query.limit || 5
    const skip = (page - 1) * limit

    const products = await Product.find()
      .sort({ createdAt: -1 }) // desc
      .skip(skip)
      .limit(limit)
      .populate('category')

    const totalProducts = await Product.countDocuments()
    res.send({
      products,
      currentPage: page,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
    })
  } catch (error) {
    console.error('Error fetching products:', error)
    res.status(500).json({ message: 'Error fetching products' })
  }
})

// Get one product with id
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate('category')
    if (!product) {
      return res.status(404).json({ message: 'Product not found' })
    }
    res.status(200).json(product)
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({ message: 'Error fetching product' })
  }
})

router.post('/', protectedAdminRoute, async (req, res) => {
  try {
    const { name, price, description, images, stock, category } = req.body

    // Kategorinin var olup olmadığını kontrol et
    const existingCategory = await Category.findById(category)
    if (!existingCategory) {
      return res.status(400).json({ message: 'Invalid category ID' })
    }

    // Resimleri Cloudinary'e yükle
    const imageUrls = []
    if (images && images.length > 0) {
      for (const image of images) {
        try {
          const uploadResponse = await cloudinary.uploader.upload(image)
          imageUrls.push(uploadResponse.secure_url) // Yüklenen URL'leri listeye ekle
        } catch (error) {
          console.error('Error uploading image:', error)
          return res
            .status(500)
            .json({ message: 'Error uploading one of the images' })
        }
      }
    }

    // Yeni ürünü oluştur ve veritabanına kaydet
    const newProduct = new Product({
      name,
      price,
      description,
      images: imageUrls, // Resim URL'lerini kaydet
      stock,
      category,
    })

    await newProduct.save()
    res.status(201).json(newProduct)
  } catch (error) {
    console.error('Error adding product:', error)
    res.status(500).json({ message: 'Product add error' })
  }
})

// Update product with id
router.put('/:id', protectedAdminRoute, async (req, res) => {
  try {
    const { name, price, description, image, stock, category } = req.body

    if (category) {
      const existingCategory = await Category.findById(category)
      if (!existingCategory) {
        return res.status(400).json({ message: 'Category does not found' })
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { name, price, description, image, stock, category },
      { new: true }, // Güncellenen ürünü döndür
    )

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' })
    }

    res.status(200).json(updatedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    res.status(500).json({ message: 'Product update error' })
  }
})

// Delete one product with id
router.delete('/:id', protectedAdminRoute, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })

    if (product.image && product.image.includes('cloudinary')) {
      try {
        const publicId = product.image.split('/').pop().split('.')[0]
        await cloudinary.uploader.destroy(publicId)
      } catch (deleteError) {
        console.log('Error deleting image from cloudinary ', deleteError)
      }
    }

    await product.deleteOne()
    res.json({ message: 'Product deleted sueccessfully.' })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({ message: 'Product delete error' })
  }
})

export default router
