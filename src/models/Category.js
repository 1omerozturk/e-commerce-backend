import { collection, findById, serverTimestamp, toPlainDocument } from '../lib/firestore.js'

const categories = collection('categories')

const Category = {
  async findById(id) { return findById('categories', id) },
  async findAll() {
    const snapshot = await categories.get()
    return snapshot.docs.map(toPlainDocument)
  },
  async create({ name, description = '', image = '' }) {
    const reference = categories.doc()
    const timestamp = serverTimestamp()
    const category = { name, description, image, createdAt: timestamp, updatedAt: timestamp }
    await reference.set(category)
    return { _id: reference.id, ...category }
  },
  async update(id, values) {
    const reference = categories.doc(id)
    if (!(await reference.get()).exists) return null
    await reference.update({ ...values, updatedAt: serverTimestamp() })
    return findById('categories', id)
  },
  async remove(id) {
    const reference = categories.doc(id)
    if (!(await reference.get()).exists) return null
    await reference.delete()
    return true
  },
}

export default Category
