const request = require('supertest')
const express = require('express')

// Mocks
const mockInsertOne = jest.fn()
const mockFindOneAndUpdate = jest.fn()
const mockFindOneAndDelete = jest.fn()

jest.mock('../src/mongo', () => ({
  getCollection: async (name) => {
    if (name === 'expenses') {
      return {
        find: () => ({ toArray: async () => [{ _id: '1', concept: 'Test', amount: 10, date: new Date().toISOString(), isExpense: true }] }),
        insertOne: mockInsertOne,
        findOneAndUpdate: mockFindOneAndUpdate,
        findOneAndDelete: mockFindOneAndDelete,
      }
    }
    return {}
  }
}))

// Stub auth middleware
jest.mock('../src/middleware/verifyToken', () => (req, res, next) => { req.user = { uid: 'user-1' }; next() })

describe('expenses API (Jest)', () => {
  let app
  beforeEach(async () => {
    app = express()
    app.use(express.json())
    const expensesRouter = require('../src/routes/expenses')
    app.use('/api/expenses', expensesRouter)
    mockInsertOne.mockReset()
    mockFindOneAndUpdate.mockReset()
    mockFindOneAndDelete.mockReset()
  })

  test('GET / returns expenses', async () => {
    const res = await request(app).get('/api/expenses')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('expenses')
    expect(Array.isArray(res.body.expenses)).toBe(true)
  })

  test('POST / creates an expense', async () => {
    mockInsertOne.mockResolvedValue({ acknowledged: true, insertedId: 'new-1' })
    const payload = { concept: 'Lunch', amount: 12.5, classifierId: null, isExpense: true }
    const res = await request(app).post('/api/expenses').send(payload)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('expense')
    expect(mockInsertOne).toHaveBeenCalled()
  })

  test('PUT /:id updates an expense', async () => {
    const validId = '64f1f1f1f1f1f1f1f1f1f1f1'
    mockFindOneAndUpdate.mockResolvedValue({ value: { _id: validId, concept: 'Updated', amount: 5 } })
    const res = await request(app).put(`/api/expenses/${validId}`).send({ concept: 'Updated', amount: 5, isExpense: true })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('expense')
  })

  test('DELETE /:id deletes an expense', async () => {
    const validId = '64f1f1f1f1f1f1f1f1f1f1f1'
    mockFindOneAndDelete.mockResolvedValue({ value: { _id: validId, concept: 'Test' } })
    const res = await request(app).delete(`/api/expenses/${validId}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('deleted')
  })
})
