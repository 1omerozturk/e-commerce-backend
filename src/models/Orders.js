import { collection, findById, serverTimestamp, toPlainDocument } from '../lib/firestore.js'
import Product from './Product.js'
import User from './User.js'

const orders = collection('orders')
const populateOrder = async (order) => {
  if (!order) return null
  const user = order.user ? await User.findById(order.user) : null
  const items = await Promise.all((order.items || []).map(async (item) => ({ ...item, product: await Product.findById(item.product) })))
  return { ...order, user: user ? User.withoutPassword(user) : null, items }
}

const Order = {
  async create(values) {
    const reference = orders.doc()
    const timestamp = serverTimestamp()
    const order = { ...values, paymentStatus: 'pending', deliveryStatus: 'processing', createdAt: timestamp, updatedAt: timestamp }
    await reference.set(order)
    return populateOrder({ _id: reference.id, ...order })
  },
  async findByUser(userId) {
    const snapshot = await orders.where('user', '==', userId).get()
    return Promise.all(snapshot.docs.map((doc) => populateOrder(toPlainDocument(doc))))
  },
  async findAll() {
    const snapshot = await orders.orderBy('createdAt', 'desc').get()
    return Promise.all(snapshot.docs.map((doc) => populateOrder(toPlainDocument(doc))))
  },
  async updateStatus(id, values) {
    const reference = orders.doc(id)
    if (!(await reference.get()).exists) return null
    await reference.update({ ...values, updatedAt: serverTimestamp() })
    return populateOrder(await findById('orders', id))
  },
}

export default Order
