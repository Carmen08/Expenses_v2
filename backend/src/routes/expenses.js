const express = require('express')
const router = express.Router()
const verifyToken = require('../middleware/verifyToken')
const { getCollection } = require('../mongo')
const { ObjectId } = require('mongodb')

// Protected route example — fetch listings from MongoDB
router.get('/', verifyToken, async (req, res) => {
  try{
    const col = await getCollection('expenses')
    // Optionally filter by user: { ownerUid: req.user.uid }
    const items = await col.find({ userId: req.user.uid }).toArray()
    res.json({ user: req.user, expenses: items })
  }catch(err){
    console.error('Error fetching expenses from MongoDB:', err && err.message)
    return res.status(500).json({ error: 'Failed to fetch expenses' })
  }
})

// Create an expense (protected) — validates input and assigns ownerUid
router.post('/', verifyToken, async (req, res) => {
  try{
    const { concept, amount, date, classifier } = req.body || {}
    // basic validation
    if(!concept || typeof concept !== 'string') return res.status(400).json({ error: 'Invalid or missing concept' })
    if(amount === undefined || typeof amount !== 'number') return res.status(400).json({ error: 'Invalid or missing amount' })

    const col = await getCollection('expenses')
    const doc = {
      concept: concept.trim(),
      amount,
      date: date ? new Date(date) : new Date(),
      classifier: classifier || null,
      userId: req.user.uid,
      createdAt: new Date()
    }

    const result = await col.insertOne(doc)
    if(!result.acknowledged) return res.status(500).json({ error: 'Insert failed' })

    // include the generated _id (as string) in the returned document
    doc._id = result.insertedId.toString()
    return res.status(201).json({ success: true, expense: doc })
  }catch(err){
    const { concept, amount, date, classifier, isExpense } = req.body || {}
    return res.status(500).json({ error: 'Failed to create expense' })
  }
})

// Update an expense by id (protected) — enforces ownership and returns updated document
router.put('/:id', verifyToken, async (req, res) => {
  try{
    const { id } = req.params
    if(!id) return res.status(400).json({ error: 'Missing id parameter' })
    if(!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' })

    const { concept, amount, date, classifier, isExpense } = req.body || {}
    if(!concept || typeof concept !== 'string') return res.status(400).json({ error: 'Invalid or missing concept' })
    if(amount === undefined || typeof amount !== 'number') return res.status(400).json({ error: 'Invalid or missing amount' })

    const col = await getCollection('expenses')
    const filter = { _id: new ObjectId(id), userId: req.user.uid }
    const update = {
      $set: {
        concept: concept.trim(),
        amount,
        isExpense: !!isExpense,
        date: date ? new Date(date) : new Date(),
        classifier: classifier && typeof classifier === 'string' ? { description: classifier } : (classifier || null),
        updatedAt: new Date()
      }
    }

    const result = await col.findOneAndUpdate(filter, update, { returnDocument: 'after' })
    if(!result.value) return res.status(404).json({ error: 'Not found or not authorized' })

    const updated = result.value
    if(updated._id && updated._id.toString) updated._id = updated._id.toString()
    return res.json({ success: true, expense: updated })
  }catch(err){
    console.error('Error updating expense:', err && err.message)
    return res.status(500).json({ error: 'Failed to update expense' })
  }
})

// Delete an expense by id (protected) — enforces ownership and returns deleted document
router.delete('/:id', verifyToken, async (req, res) => {
  try{
    const { id } = req.params
    if(!id) return res.status(400).json({ error: 'Missing id parameter' })
    if(!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' })

    const col = await getCollection('expenses')
    const filter = { _id: new ObjectId(id), userId: req.user.uid }

    const result = await col.findOneAndDelete(filter)
    if(!result.value) return res.status(404).json({ error: 'Not found or not authorized' })

    // normalize _id to string for the response
    const deleted = result.value
    if(deleted._id && deleted._id.toString) deleted._id = deleted._id.toString()

    return res.json({ success: true, deleted })
  }catch(err){
    console.error('Error deleting expense:', err && err.message)
    return res.status(500).json({ error: 'Failed to delete expense' })
  }
})

module.exports = router
