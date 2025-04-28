import express from 'express'
import Category from '../models/Category.js'
import cloudinary from '../lib/cloudinary.js'
import protectedAdminRoute from '../middleware/auth.admin.middleware.js'

const router = express.Router()

// Get all categories
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find()
    res.status(200).json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    res.status(500).json({ message: 'Error fetching categories' })
  }
})

// get one category with id
router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) {
      return res.status(404).json({ message: 'Category not found' })
    }
    res.status(200).json(category)
  } catch (error) {
    console.error('Error fetching category:', error)
    res.status(500).json({ message: 'Error fetching category' })
  }
})

// Add category
router.post('/', protectedAdminRoute, async (req, res) => {
  try {
    const { name, description, image } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Please provide all filds.' })
    }

    // image if is exists upload to cloudinary
    if (image != '') {
      const uploadResponse = await cloudinary.uploader.upload(image)
      const imageUrl = uploadResponse.secure_url
      const newCategory = new Category({
        name,
        description,
        image: imageUrl,
      })
      await newCategory.save()
      res.status(201).json(newCategory)
    } else {
      const newCategory = new Category({
        name,
        description,
        image: imageUrl,
      })
      await newCategory.save()
      res.status(201).json(newCategory)
    }
  } catch (error) {
    console.error('Error adding category:', error)
    res.status(500).json({ message: 'Error adding category' })
  }
})

// Delete one category with id
router.delete('/:id', protectedAdminRoute, async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
       if (!category) return res.status(404).json({ message: 'Category not found' })
   
       if (category.image && category.image.includes('cloudinary')) {
         try {
           const publicId = category.image.split('/').pop().split('.')[0]
           await cloudinary.uploader.destroy(publicId)
         } catch (deleteError) {
           console.log('Error deleting image from cloudinary ', deleteError)
         }
       }
       await category.deleteOne()
       res.json({ message: 'Category deleted sueccessfully.' })
  } catch (error) {
    console.error('Error deleting category:', error)
    res.status(500).json({ message: 'Error deleting category' })
  }
})

// Update one category with id
router.put('/:id', protectedAdminRoute, async (req, res) => {
  try {
    const { name, description, image } = req.body
    const updatedCategory = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, image },
      { new: true },
    )
    if (!updatedCategory) {
      return res.status(404).json({ message: 'Category not found' })
    }
    res.status(200).json(updatedCategory)
  } catch (error) {
    console.error('Error updating category:', error)
    res.status(500).json({ message: 'Error updating category' })
  }
})

export default router
