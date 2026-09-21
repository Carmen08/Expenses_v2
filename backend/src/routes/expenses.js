const express = require('express')
const router = express.Router()

let verifyToken = null
try {
  verifyToken = require('../middleware/verifyToken')
}catch(err){
  verifyToken = (req, res, next) => next()
}

const { getCollection } = require('../mongo')
const { ObjectId } = require('mongodb')

function normalizeClassifierId(rawValue){
  if(rawValue === undefined || rawValue === null || rawValue === '') return null

  if(typeof rawValue === 'string'){
    const cleaned = rawValue.trim()
    return ObjectId.isValid(cleaned) ? cleaned : null
  }

  if(typeof rawValue === 'object'){
    if(rawValue.classifierId && typeof rawValue.classifierId === 'string'){
      const cleaned = rawValue.classifierId.trim()
      return ObjectId.isValid(cleaned) ? cleaned : null
    }
    if(rawValue._id && typeof rawValue._id === 'string'){
      const cleaned = rawValue._id.trim()
      return ObjectId.isValid(cleaned) ? cleaned : null
    }
    if(rawValue.id && typeof rawValue.id === 'string'){
      const cleaned = rawValue.id.trim()
      return ObjectId.isValid(cleaned) ? cleaned : null
    }
    if(rawValue.classifier) return normalizeClassifierId(rawValue.classifier)
  }

  return null
}

function buildExpensePayload({ concept, amount, date, classifierId, isExpense }){
  const normalizedAmount = Number(amount)
  return {
    concept: String(concept || '').trim(),
    amount: normalizedAmount,
    date: date ? new Date(date) : new Date(),
    classifierId: normalizeClassifierId(classifierId),
    isExpense: !!isExpense,
    updatedAt: new Date()
  }
}

function normalizeExpense(item){
  if(!item) return item
  const normalized = { ...item }

  if(normalized._id && typeof normalized._id !== 'string') normalized._id = normalized._id.toString()
  if(normalized.id && typeof normalized.id !== 'string') normalized.id = normalized.id.toString()
  if(normalized.classifierId && typeof normalized.classifierId !== 'string') normalized.classifierId = normalized.classifierId.toString()

  if(!normalized.classifierId && normalized.classifier && typeof normalized.classifier === 'object'){
    const legacyId = normalizeClassifierId(normalized.classifier)
    if(legacyId) normalized.classifierId = legacyId
  }

  return normalized
}

const authMiddleware = verifyToken || ((req, res, next) => next())

router.get('/', authMiddleware, async (req, res) => {
  try{
    const col = await getCollection('expenses')
    const items = await col.find({ userId: req.user.uid }).toArray()
    res.json({ user: req.user, expenses: items.map(normalizeExpense) })
  }catch(err){
    console.error('Error fetching expenses from MongoDB:', err && err.message)
    return res.status(500).json({ error: 'Failed to fetch expenses' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try{
    const { concept, amount, date, classifierId, classifier, isExpense } = req.body || {}
    if(!concept || typeof concept !== 'string') return res.status(400).json({ error: 'Invalid or missing concept' })

    const parsedAmount = Number(amount)
    if(amount === undefined || Number.isNaN(parsedAmount)) return res.status(400).json({ error: 'Invalid or missing amount' })

    const normalizedClassifierId = normalizeClassifierId(classifierId ?? classifier)
    const col = await getCollection('expenses')
    const doc = {
      concept: concept.trim(),
      amount: parsedAmount,
      date: date ? new Date(date) : new Date(),
      classifierId: normalizedClassifierId,
      isExpense: !!isExpense,
      userId: req.user.uid,
      createdAt: new Date()
    }

    const result = await col.insertOne(doc)
    if(!result.acknowledged) return res.status(500).json({ error: 'Insert failed' })

    const created = normalizeExpense({ ...doc, _id: result.insertedId, id: result.insertedId })
    return res.status(201).json({ success: true, expense: created })
  }catch(err){
    console.error('Error creating expense:', err && err.message)
    return res.status(500).json({ error: 'Failed to create expense' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  try{
    const { id } = req.params
    if(!id) return res.status(400).json({ error: 'Missing id parameter' })
    if(!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' })

    const { concept, amount, date, classifierId, classifier, isExpense } = req.body || {}
    if(!concept || typeof concept !== 'string') return res.status(400).json({ error: 'Invalid or missing concept' })

    const parsedAmount = Number(amount)
    if(amount === undefined || Number.isNaN(parsedAmount)) return res.status(400).json({ error: 'Invalid or missing amount' })

    const normalizedClassifierId = normalizeClassifierId(classifierId ?? classifier)
    const col = await getCollection('expenses')
    const filter = { _id: new ObjectId(id), userId: req.user.uid }
    const update = {
      $set: {
        concept: concept.trim(),
        amount: parsedAmount,
        isExpense: !!isExpense,
        date: date ? new Date(date) : new Date(),
        classifierId: normalizedClassifierId,
        updatedAt: new Date()
      }
    }

    const result = await col.findOneAndUpdate(filter, update, { returnDocument: 'after' })
    if(!result.value) return res.status(404).json({ error: 'Not found or not authorized' })

    const updated = normalizeExpense(result.value)
    return res.json({ success: true, expense: updated })
  }catch(err){
    console.error('Error updating expense:', err && err.message)
    return res.status(500).json({ error: 'Failed to update expense' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try{
    const { id } = req.params
    if(!id) return res.status(400).json({ error: 'Missing id parameter' })
    if(!ObjectId.isValid(id)) return res.status(400).json({ error: 'Invalid id' })

    const col = await getCollection('expenses')
    const filter = { _id: new ObjectId(id), userId: req.user.uid }

    const result = await col.findOneAndDelete(filter)
    if(!result.value) return res.status(404).json({ error: 'Not found or not authorized' })

    const deleted = normalizeExpense(result.value)
    return res.json({ success: true, deleted })
  }catch(err){
    console.error('Error deleting expense:', err && err.message)
    return res.status(500).json({ error: 'Failed to delete expense' })
  }
})

module.exports = router
module.exports.normalizeClassifierId = normalizeClassifierId
module.exports.buildExpensePayload = buildExpensePayload
