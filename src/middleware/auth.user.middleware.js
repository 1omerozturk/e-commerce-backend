import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import 'dotenv/config'

const protectedUserRoute = async (req, res, next) => {
  try {
    // get token
    const authorization = req.header('Authorization')
    const token = authorization?.replace('Bearer ', '')
    if (!token)
      return res
        .status(401)
        .json({ message: 'No authentication token, access denied' })

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // find user
    const user = User.withoutPassword(await User.findById(decoded.userId))
    if (!user) return res.status(401).json({ message: 'Token is not valid.' })

    req.user = user
    req.user.id = user._id

    next()
  } catch (error) {
    console.error('Authentication Error: ', error.message)
    res.status(401).json({ message: 'Token is not valid.' })
  }
}

export default protectedUserRoute
