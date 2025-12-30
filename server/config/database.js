import mongoose from 'mongoose'

export async function connectToDatabase(connectionString) {
  if (!connectionString) {
    throw new Error('MONGODB_URI is missing. Please set it in your environment variables.')
  }

  mongoose.set('strictQuery', false)

  await mongoose.connect(connectionString)
}
