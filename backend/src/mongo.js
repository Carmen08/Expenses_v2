const { MongoClient } = require('mongodb')

const uri = process.env.MONGODB_URI
if(!uri) {
  console.warn('MONGODB_URI not set — MongoDB features will fail until configured')
}

const dbName = process.env.MONGODB_DB_NAME || 'expenses'

let connectPromise = null
if(uri){
  connectPromise = (async () => {
    const client = new MongoClient(uri)
    await client.connect()
    const db = client.db(dbName)
    console.log('Connected to MongoDB:', uri, 'db:', dbName)
    return { client, db }
  })()
}

async function getCollection(name){
  if(!connectPromise) throw new Error('MongoDB not configured (MONGODB_URI missing)')
  const { db } = await connectPromise
  return db.collection(name)
}

module.exports = { getCollection }
