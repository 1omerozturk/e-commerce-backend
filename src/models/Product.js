import { collection, findById, serverTimestamp, toPlainDocument } from '../lib/firestore.js'
import Category from './Category.js'

const products = collection('products')
const withCategory = async (product) => product ? { ...product, category: product.category ? await Category.findById(product.category) : null } : null

const Product = {
  async findById(id) { return withCategory(await findById('products', id)) },
  async findPage(page = 1, limit = 5) {
    const snapshot = await products.orderBy('createdAt', 'desc').get()
    const allProducts = await Promise.all(snapshot.docs.map((doc) => withCategory(toPlainDocument(doc))))
    const start = (page - 1) * limit
    return { products: allProducts.slice(start, start + limit), totalProducts: allProducts.length }
  },
  async create(values) {
    const reference = products.doc()
    const timestamp = serverTimestamp()
    const product = { ...values, createdAt: timestamp, updatedAt: timestamp }
    await reference.set(product)
    return withCategory({ _id: reference.id, ...product })
  },
  async update(id, values) {
    const reference = products.doc(id)
    if (!(await reference.get()).exists) return null
    await reference.update({ ...values, updatedAt: serverTimestamp() })
    return Product.findById(id)
  },
  async remove(id) {
    const product = await findById('products', id)
    if (!product) return null
    await products.doc(id).delete()
    return product
  },
}

export default Product
