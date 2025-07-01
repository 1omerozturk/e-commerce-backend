import 'dotenv/config'
import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI)
    console.log(`Database connected: ${conn.connection.host}`)
  } catch (error) {
    console.error('Database Connection error: ', error)
    process.exit(1)
  }
}
