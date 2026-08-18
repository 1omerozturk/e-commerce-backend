import bcrypt from 'bcryptjs'
import { collection, findById, serverTimestamp, toPlainDocument } from '../lib/firestore.js'

const users = collection('users')
const withoutPassword = (user) => {
  if (!user) return null
  const { password, ...safeUser } = user
  return safeUser
}

const User = {
  async findById(id) { return findById('users', id) },
  async findByEmail(email) {
    const snapshot = await users.where('email', '==', email).limit(1).get()
    return snapshot.empty ? null : toPlainDocument(snapshot.docs[0])
  },
  async findNonAdmins() {
    const snapshot = await users.get()
    return snapshot.docs.map(toPlainDocument).filter((user) => user.role !== 'admin').map(withoutPassword)
  },
  async create({ email, firstname_lastname, password, profileImage = '', role = 'user' }) {
    const reference = users.doc()
    const timestamp = serverTimestamp()
    const user = { email, firstname_lastname, password: await bcrypt.hash(password, 10), profileImage, role, shippingAddresses: [], createdAt: timestamp, updatedAt: timestamp }
    await reference.set(user)
    return { _id: reference.id, ...user }
  },
  async update(id, values) {
    const reference = users.doc(id)
    if (!(await reference.get()).exists) return null
    await reference.update({ ...values, updatedAt: serverTimestamp() })
    return findById('users', id)
  },
  comparePassword(user, password) { return bcrypt.compare(password, user.password) },
  withoutPassword,
}

export default User
