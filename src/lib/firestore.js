import { firestore } from './firebase.js'

export const serverTimestamp = () => new Date()

export const toPlainDocument = (snapshot) => {
  if (!snapshot.exists) return null
  const data = snapshot.data()
  return {
    _id: snapshot.id,
    ...data,
    createdAt: data.createdAt?.toDate?.().toISOString?.() ?? data.createdAt ?? null,
    updatedAt: data.updatedAt?.toDate?.().toISOString?.() ?? data.updatedAt ?? null,
  }
}

export const collection = (name) => firestore.collection(name)

export const findById = async (name, id) =>
  toPlainDocument(await collection(name).doc(id).get())

export const deleteById = async (name, id) => {
  await collection(name).doc(id).delete()
}