const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/verifyToken')
const { getCollection } = require('../mongo')
const { ObjectId } = require('mongodb')

function normalizeClassifier(item){
  if(!item) return item

  const normalized = { ...item }
  if(normalized._id && typeof normalized._id !== 'string') {
    normalized._id = normalized._id.toString()
  }
  if(normalized.id && typeof normalized.id !== 'string') {
    normalized.id = normalized.id.toString()
  }
  if(normalized._id && !normalized.id) {
    normalized.id = normalized._id
  }
  return normalized
}

router.get('/', verifyToken, async (req, res) => {
  try{
    const col = await getCollection('classifiers')
    const items = await col.find({ userId: req.user.uid }).sort({ description: 1 }).toArray()
    return res.json({ user: req.user, classifiers: items.map(normalizeClassifier) })
  }catch(err){
    console.error('Error fetching classifiers:', err && err.message)
    return res.status(500).json({ error: 'Failed to fetch classifiers' })
  }
})

router.post('/', verifyToken, async (req, res) => {
  try{
    const { description } = req.body || {}
    if(!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing description' })
    }

    const trimmed = description.trim()
    if(!trimmed) return res.status(400).json({ error: 'Description cannot be empty' })

    const col = await getCollection('classifiers')
    const doc = {
      description: trimmed,
      userId: req.user.uid,
      createdAt: new Date()
    }

    const result = await col.insertOne(doc)
    const created = normalizeClassifier({ ...doc, _id: result.insertedId, id: result.insertedId })
    return res.status(201).json({ success: true, classifier: created })
  }catch(err){
    console.error('Error creating classifier:', err && err.message)
    return res.status(500).json({ error: 'Failed to create classifier' })
  }
})

router.put('/:id', verifyToken, async (req, res) => {
  try{
    const { id } = req.params
    if(!id) return res.status(400).json({ error: 'Missing id parameter' })
    if(!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' })

    const { description } = req.body || {}
    if(!description || typeof description !== 'string') {
      return res.status(400).json({ error: 'Invalid or missing description' })
    }

    const trimmed = description.trim()
    if(!trimmed) return res.status(400).json({ error: 'Description cannot be empty' })

    const col = await getCollection('classifiers')
    const filter = { _id: new ObjectId(id), userId: req.user.uid }
    const update = { $set: { description: trimmed, updatedAt: new Date() } }

    const result = await col.findOneAndUpdate(filter, update, { returnDocument: 'after' })
    if(!result.value) return res.status(404).json({ error: 'Not found or not authorized' })

    return res.json({ success: true, classifier: normalizeClassifier(result.value) })
  }catch(err){
    console.error('Error updating classifier:', err && err.message)
    return res.status(500).json({ error: 'Failed to update classifier' })
  }
})

router.delete('/:id', verifyToken, async (req, res) => {
  try{
    const { id } = req.params
    if(!id) return res.status(400).json({ error: 'Missing id parameter' })
    if(!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' })

    const col = await getCollection('classifiers')
    const filter = { _id: new ObjectId(id), userId: req.user.uid }
    const result = await col.findOneAndDelete(filter)
    if(!result.value) return res.status(404).json({ error: 'Not found or not authorized' })

    return res.json({ success: true, deleted: normalizeClassifier(result.value) })
  }catch(err){
    console.error('Error deleting classifier:', err && err.message)
    return res.status(500).json({ error: 'Failed to delete classifier' })
  }
})

module.exports = router
