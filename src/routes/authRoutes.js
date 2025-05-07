import express from 'express'
import User from '../models/User.js'
import jwt from 'jsonwebtoken'
import 'dotenv/config'
import bcrypt from 'bcryptjs'
import protectedUserRoute from '../middleware/auth.user.middleware.js'

const router = express.Router()

const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '15d' })
}

router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body

    if (!username || !email || !password)
      return res
        .status(400)
        .json({ message: 'All fields are required (email,username, password)' })

    if (password.length < 8)
      return res
        .status(400)
        .json({ message: 'Password should be at least 8 characters long' })

    if (username.length < 3)
      return res
        .status(400)
        .json({ message: 'Username should be at least 3 characters long' })

    const existingEmail = await User.findOne({ email })
    if (existingEmail)
      return res.status(400).json({ message: 'Email already exists' })

    const existingUserName = await User.findOne({ username })
    if (existingUserName)
      return res.status(400).json({ message: 'Username already exists' })

    // get random avatar
    const profileImage = `https://api.dicebear.com/7.x/avataaars/png?seed=${username}`
    const user = new User({
      email,
      username,
      password,
      profileImage,
      role,
    })
    await user.save()

    const token = generateToken(user._id)

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
      },
    })
  } catch (error) {
    console.log('Error in user register', error)
    res
      .status(500)
      .json({ message: 'Interval server error in register' + error })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password)
      return res
        .status(400)
        .json({ message: 'All fields are required (email, password)' })

    const user = await User.findOne({ email })
    if (!user)
      return res
        .status(400)
        .json({ message: 'Invalid credentials, try again.' })

    const isPasswordCorrect = await user.comparePassword(password)

    if (!isPasswordCorrect)
      return res
        .status(400)
        .json({ message: 'Invalid credentials, try again.' })

    const token = generateToken(user._id)

    res.status(200).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profileImage: user.profileImage,
        role: user.role,
        shippingAddresses: user.shippingAddresses,
      },
    })
  } catch (error) {
    console.error('Error in login', error)
    res.status(500).json({ message: 'Internal server error in login' })
  }
})

router.post('/update-password', protectedUserRoute, async (req, res) => {
  try {
    const { email, password, newpassword } = req.body

    if (!email || !password || !newpassword)
      return res.status(400).json({
        message: 'All fields are required (email, password, new password)',
      })

    if (newpassword.length < 8)
      return res
        .status(400)
        .json({ message: 'New password should be at least 8 characters long' })

    const user = await User.findOne({ email })
    if (!user) return res.status(400).json({ message: 'User not found.' })

    const isPasswordCorrect = await user.comparePassword(password)
    if (!isPasswordCorrect)
      return res.status(400).json({ message: 'Invalid credentials.' })

    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(newpassword, salt)

    const updatedUser = await User.findOneAndUpdate(
      { email },
      { $set: { password: hashedPassword } },
      { new: true }, // Bu seçenek, güncellenmiş kullanıcıyı döndürür
    )

    if (updatedUser) {
      return res.status(200).json({ message: 'Password changed successfully' })
    } else {
      return res.status(500).json({ message: 'Failed to update password.' })
    }
  } catch (error) {
    console.error('Error updating password:', error)
    res
      .status(500)
      .json({ message: 'Internal server error in updating password.' })
  }
})

export default router
