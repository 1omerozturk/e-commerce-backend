import dotenv from 'dotenv'
import { readFileSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { applicationDefault, cert, getApp, getApps, initializeApp } from 'firebase-admin/app'
import { getFirestore } from 'firebase-admin/firestore'

const backendDirectory = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
dotenv.config({ path: resolve(backendDirectory, '.env') })

const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS
  ? (isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
      ? process.env.GOOGLE_APPLICATION_CREDENTIALS
      : resolve(backendDirectory, process.env.GOOGLE_APPLICATION_CREDENTIALS))
  : null

const credential = credentialPath
  ? cert(JSON.parse(readFileSync(credentialPath, 'utf8')))
  : applicationDefault()

const firebaseApp = getApps().length
  ? getApp()
  : initializeApp({ credential })

export const firestore = getFirestore(firebaseApp)

export const verifyFirebaseConnection = async () => {
  await firestore.listCollections()
  console.log('Firebase Firestore bağlantısı başarılı.')
}