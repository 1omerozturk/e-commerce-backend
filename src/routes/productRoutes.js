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
    let { name, price, description, images, stock, category } = req.body

    // Kategori kontrolü
    const existingCategory = await Category.findById(category)
    if (!existingCategory) {
      return res.status(400).json({ message: 'Geçersiz kategori ID' })
    }

    // string olarak geldiyse parse et
    if (typeof images === 'string') {
      try {
        images = JSON.parse(images)
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: 'Resim formatı geçersiz (JSON parse hatası)',
        })
      }
    }

    if (!Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ message: 'Images alanı boş veya geçersiz' })
    }

    const imageUrls = []

    for (const image of images) {
      try {
        const imageUrl = image.startsWith('data:image/')
          ? image
          : `data:image/jpeg;base64,${image}`
        const uploadResponse = await cloudinary.uploader.upload(imageUrl, {
          folder: 'products',
        })
        imageUrls.push(uploadResponse.secure_url)
      } catch (err) {
        return res.status(500).json({
          message: 'Bir resim yüklenemedi',
          detail: err.message,
        })
      }
    }

    const newProduct = new Product({
      name,
      price,
      description,
      images: imageUrls,
      stock,
      category,
    })

    await newProduct.save()
    return res.status(201).json(newProduct)
  } catch (error) {
    console.error('Ürün ekleme hatası:', error)
    return res
      .status(500)
      .json({ message: 'Sunucu hatası', detail: error.message })
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

    // Cloudinary'den tüm resimleri sil
    if (Array.isArray(product.images)) {
      for (const imageUrl of product.images) {
        if (imageUrl.includes('cloudinary')) {
          try {
            const urlParts = imageUrl.split('/upload/')
            if (urlParts.length === 2) {
              const pathWithVersion = urlParts[1] // "v1746260032/products/yl8dp1vf9n3tdvzsld6e.jpg"
              const pathSegments = pathWithVersion.split('/')

              // "vXXXX" olan versiyonu çıkar (ilk segment)
              pathSegments.shift() // Remove "v1746260032"

              // Kalan kısmı birleştir ve uzantıyı çıkar
              const fileWithExt = pathSegments.join('/') // "products/yl8dp1vf9n3tdvzsld6e.jpg"
              const publicId = fileWithExt.replace(/\.[^/.]+$/, '') // "products/yl8dp1vf9n3tdvzsld6e"

              await cloudinary.uploader.destroy(publicId)
            }
          } catch (deleteErr) {
            console.warn('Cloudinary silme hatası:', deleteErr.message)
          }
        }
      }
    }

    // Veritabanından ürünü sil
    await product.deleteOne()
    res.json({ message: 'Product deleted successfully.' })
  } catch (error) {
    console.error('Error deleting product:', error)
    res.status(500).json({ message: 'Product delete error' })
  }
})

export default router
