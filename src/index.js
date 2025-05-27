import express from 'express'
import 'dotenv/config'
import authRoutes from './routes/authRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import productRoutes from './routes/productRoutes.js'
import userRoutes from './routes/userRoutes.js'
import orderRoutes from './routes/orderRoutes.js'

import { connectDB } from './lib/db.js'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 2626

// cron function
// import job from './lib/cron.js'
// job.start()

app.use(express.json({ limit: '20mb' }))
app.use(express.urlencoded({ limit: '20mb', extended: true }))
app.use(cors())

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)
app.use('/api/user', userRoutes)
app.use('/api/orders', orderRoutes)

console.log(PORT)
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
  connectDB()
})
