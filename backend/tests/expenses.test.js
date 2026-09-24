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

  //GET /api/expenses
  test('GET / returns expenses', async () => {
    const res = await request(app).get('/api/expenses')
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('expenses')
    expect(Array.isArray(res.body.expenses)).toBe(true)
  })

  //POST /api/expenses
  test('POST creates an expense', async () => {
    mockInsertOne.mockResolvedValue({ acknowledged: true, insertedId: 'new-1' })
    const expense = { concept: 'Lunch', amount: 12.5, classifierId: null, isExpense: true }
    const res = await request(app).post('/api/expenses').send(expense)
    expect(res.status).toBe(201)
    expect(res.body).toHaveProperty('expense')
    expect(mockInsertOne).toHaveBeenCalled()
  })

  test('POST / with invalid concept returns 400', async () => {
    const res = await request(app).post('/api/expenses').send({ concept: '', amount: 10})
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  test('POST / with invalid amount returns 400', async () => {
    const res = await request(app).post('/api/expenses').send({ concept: 'Test', amount: 'abc' })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  test('POST / not acknowledged', async () => {
    mockInsertOne.mockResolvedValue({ acknowledged: false })
    const expense = { concept: 'Dinner', amount: 20, classifierId: null, isExpense: true }
    const res = await request(app).post('/api/expenses').send(expense)
    expect(res.status).toBe(500)
    expect(res.body).toHaveProperty('error')
    expect(mockInsertOne).toHaveBeenCalled()
  })

  //PUT /api/expenses/:id
  test('PUT /:id updates an expense', async () => {
    const validId = '64f1f1f1f1f1f1f1f1f1f1f1'
    mockFindOneAndUpdate.mockResolvedValue({ value: { _id: validId, concept: 'Updated', amount: 5 } })
    const res = await request(app).put(`/api/expenses/${validId}`).send({ concept: 'Updated', amount: 5, isExpense: true })
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('expense')
  })

  test('PUT / missing :id', async () => {
    const invalidId = null
    mockFindOneAndUpdate.mockResolvedValue({ value: {_id: invalidId, concept: 'Updated', amount: 5 } })
    const res = await request(app).put(`/api/expenses/${invalidId}`).send({ concept: 'Updated', amount: 5, isExpense: true })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  test('PUT /:id not found', async () => {
    const invalidId = '64f1f1f1f1f1f1f1f1f1f1f1'
    mockFindOneAndUpdate.mockResolvedValue({ value: null })
    const res = await request(app).put(`/api/expenses/${invalidId}`).send({ concept: 'Updated', amount: 5, isExpense: true })
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })

  test('PUT /:id invalid concept', async () => {
    const validId = '64f1f1f1f1f1f1f1f1f1f1f1'
    const res = await request(app).put(`/api/expenses/${validId}`).send({ concept: '', amount: 5, isExpense: true })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  test('PUT /:id invalid amount', async () => {
    const validId = '64f1f1f1f1f1f1f1f1f1f1f1'
    const res = await request(app).put(`/api/expenses/${validId}`).send({ concept: 'Updated', amount: 'abc', isExpense: true })
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })

  test('PUT /:id not found or not authorized', async () => {
    const validId = '64f1f1f1f1f1f1f1f1f1f1f1'
    mockFindOneAndUpdate.mockResolvedValue({ value: null })
    const res = await request(app).put(`/api/expenses/${validId}`).send({ concept: 'Updated', amount: 5, isExpense: true })
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })

  //DELETE /api/expenses/:id
  test('DELETE /:id deletes an expense', async () => {
    const validId = '64f1f1f1f1f1f1f1f1f1f1f1'
    mockFindOneAndDelete.mockResolvedValue({ value: { _id: validId, concept: 'Test' } })
    const res = await request(app).delete(`/api/expenses/${validId}`)
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('deleted')
  })

  test('DELETE /:id invalid id', async () => {
    const invalidId = 'invalid-id'
    const res = await request(app).delete(`/api/expenses/${invalidId}`)
    expect(res.status).toBe(400)
    expect(res.body).toHaveProperty('error')
  })
  
  test('DELETE /:id not found or not authorized', async () => {
    const validId = '64f1f1f1f1f1f1f1f1f1f1f1'
    mockFindOneAndDelete.mockResolvedValue({ value: null })
    const res = await request(app).delete(`/api/expenses/${validId}`)
    expect(res.status).toBe(404)
    expect(res.body).toHaveProperty('error')
  })
})

