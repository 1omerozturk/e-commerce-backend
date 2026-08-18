import express from 'express'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import User from '../models/User.js'
import protectedUserRoute from '../middleware/auth.user.middleware.js'

const router = express.Router()
const verificationCodes = new Map()
const tokenFor = (id) => jwt.sign({ userId: id }, process.env.JWT_SECRET, { expiresIn: '15d' })
const publicUser = (user) => User.withoutPassword(user)

router.post('/register', async (req, res) => {
  try {
    const { email, firstname_lastname, password } = req.body
    if (!email || !firstname_lastname || !password) return res.status(400).json({ message: 'All fields are required' })
    if (password.length < 8) return res.status(400).json({ message: 'Password should be at least 8 characters long' })
    if (await User.findByEmail(email)) return res.status(400).json({ message: 'Email already exists' })
    const profileImage = `https://api.dicebear.com/7.x/avataaars/png?seed=${encodeURIComponent(firstname_lastname)}`
    const user = await User.create({ email, firstname_lastname, password, profileImage })
    res.status(201).json({ token: tokenFor(user._id), user: publicUser(user) })
  } catch (error) { res.status(500).json({ message: 'Internal server error in register' }) }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    const user = email ? await User.findByEmail(email) : null
    if (!user || !(await User.comparePassword(user, password || ''))) return res.status(400).json({ message: 'Invalid credentials, try again.' })
    res.json({ token: tokenFor(user._id), user: publicUser(user) })
  } catch (error) { res.status(500).json({ message: 'Internal server error in login' }) }
})

router.post('/update-password', protectedUserRoute, async (req, res) => {
  try {
    const { email, password, newpassword } = req.body
    const user = await User.findByEmail(email)
    if (!user || user._id !== req.user._id || !(await User.comparePassword(user, password))) return res.status(400).json({ message: 'Invalid credentials.' })
    if (!newpassword || newpassword.length < 8) return res.status(400).json({ message: 'New password should be at least 8 characters long' })
    const bcrypt = await import('bcryptjs')
    await User.update(user._id, { password: await bcrypt.default.hash(newpassword, 10) })
    res.json({ message: 'Password changed successfully' })
  } catch (error) { res.status(500).json({ message: 'Internal server error in updating password.' }) }
})

router.post('/send-reset-code', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })
    if (!(await User.findByEmail(email))) return res.status(404).json({ message: 'User not found.' })
    const code = crypto.randomInt(100000, 999999).toString()
    verificationCodes.set(email, { code, expires: Date.now() + 300000 })
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD } })
    await transporter.sendMail({ from: process.env.EMAIL_USER, to: email, subject: 'Password Reset Code', text: `Your verification code is: ${code}` })
    res.json({ message: 'Verification code sent successfully' })
  } catch (error) { res.status(500).json({ message: 'Internal Server Error' }) }
})

export default router
