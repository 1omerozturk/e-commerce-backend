import express from 'express'
import 'dotenv/config'
import authRoutes from './routes/authRoutes.js'
import categoryRoutes from './routes/categoryRoutes.js'
import productRoutes from './routes/productRoutes.js'
// import job from './lib/cron.js'

import { connectDB } from './lib/db.js'
import cors from 'cors'

const app = express()
const PORT = process.env.PORT || 2626

// job.start()
app.use(express.json())
app.use(cors())

app.use('/api/auth', authRoutes)
app.use('/api/products', productRoutes)
app.use('/api/categories', categoryRoutes)

console.log(PORT)
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
  connectDB()
})
