import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import 'dotenv/config'

const protectedAdminRoute = async (req, res, next) => {
  try {
    // get token
    const token = req.header('Authorization').replace('Bearer ', '')
    if (!token)
      return res
        .status(401)
        .json({ message: 'No authentication token, access denied' })

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // find user
    const user = await User.findById(decoded.userId).select('-password')

    if (!user) return res.status(401).json({ message: 'Token is not valid.' })

    if (user && user.role !== 'admin')
      return res.status(401).json({ message: 'Access denied. Admins only' })
    next()
  } catch (error) {
    console.error('Authentication Error: ', error.message)
    res.status(401).json({ message: 'Token is not valid.' })
  }
}

export default protectedAdminRoute
