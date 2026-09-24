const request = require('supertest')
const express = require('express')

//Mocks
const mockInsertOne = jest.fn()
const mockFindOneAndUpdate = jest.fn()
const mockFindOneAndDelete = jest.fn()
const mockFindOne = jest.fn()

const mockExpensesFindOne = jest.fn()

jest.mock('../src/mongo', () => ({
    getCollection: async (name) => {
        if (name === 'classifiers'){
            return {
                find: () => ({
                    sort: () => ({ toArray: async () => [{ _id: '1', description: 'Test Classifier', userId: 'user-1', createdAt: new Date() }] })
                }),
                insertOne: mockInsertOne,
                findOneAndUpdate: mockFindOneAndUpdate,
                findOneAndDelete: mockFindOneAndDelete,
                findOne: mockFindOne,
            }
        } else if(name === 'expenses'){
            return{
                findOne: mockExpensesFindOne,
            }
        }
        return {}
    }
}))

//Stub auth middleware
jest.mock('../src/middleware/verifyToken', () => (req, res, next) => { req.user = { uid: 'user-1' }; next() })

describe('classifiers API (Jest)', () => {
    let app
    beforeEach(async () => {
        app = express()
        app.use(express.json())
        const expenseRouter = require('../src/routes/classifiers')
        app.use('/api/classifiers', expenseRouter)
        mockInsertOne.mockReset()
        mockFindOneAndUpdate.mockReset()
        mockFindOneAndDelete.mockReset()
        mockFindOne.mockReset()
    })

    //GET /api/classifiers
    test('GET / returns classifiers', async () => {
        const res = await request(app).get('/api/classifiers')
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('classifiers')
        expect(Array.isArray(res.body.classifiers)).toBe(true)
    })

    //POST /api/classifiers
    test('POST creates a classifier', async () => {
        mockInsertOne.mockResolvedValue({ acknowledged: true, insertedId: 'new-1' })
        const classifier = { description: 'New Classifier' }
        const res = await request(app).post('/api/classifiers').send(classifier)
        expect(res.status).toBe(201)
        expect(res.body).toHaveProperty('classifier')
        expect(mockInsertOne).toHaveBeenCalled()
    })

    test('POST / with invalid description returns 400', async () => {
        const classifier = { description: '' }
        const res = await request(app).post('/api/classifiers').send(classifier)
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    test(`POST / with invalid description returns 400`, async () => {
        const classifier = { description: null }
        const res = await request(app).post('/api/classifiers').send(classifier)
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    test(`POST / existing classifier returns 409`, async () => {
        mockFindOne.mockResolvedValue({ _id: '1', description: 'Test Classifier', userId: 'user-1', createdAt: new Date() })
        const classifier = { description: 'Test Classifier' }
        const res = await request(app).post('/api/classifiers').send(classifier)
        expect(res.status).toBe(409)
        expect(res.body).toHaveProperty('error')
    })

    //PUT /api/classifiers/:id
    test('PUT /:id updates a classifier', async () => {
        const validId = '64f1f1f1f1f1f1f1f1f1f1f1'
        mockFindOneAndUpdate.mockResolvedValue({ value: { _id: validId, description: 'Updated Classifier' } })
        const res = await request(app).put(`/api/classifiers/${validId}`).send({ description: 'Updated Classifier' })
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('classifier')
    })

    test('PUT /:id with missing id returns 400', async () => {
        const res = await request(app).put('/api/classifiers/').send({ description: 'Updated Classifier' })
        expect(res.status).toBe(404) // Express returns 404 for missing route params
    })

    test('PUT /:id with invalid id returns 400', async () => {
        const invalidId = 'invalid-id'
        const res = await request(app).put(`/api/classifiers/${invalidId}`).send({ description: 'Updated Classifier' })
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    test('PUT /:id with missing description returns 400', async () => {
        const validId = '64f1f1f1f1f1f1f1f1f1f1f1'
        const res = await request(app).put(`/api/classifiers/${validId}`).send({})
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    test('PUT /:id duplicated description returns 409', async () => {
        mockFindOne.mockResolvedValue({ _id: '2', description: 'Existing Classifier', userId: 'user-1', createdAt: new Date() })
        const validId = '64f1f1f1f1f1f1f1f1f1f1f1'
        const res = await request(app).put(`/api/classifiers/${validId}`).send({ description: 'Existing Classifier' })
        expect(res.status).toBe(409)
        expect(res.body).toHaveProperty('error')        
    })

    test('PUT /:id non-existing classifier returns 404', async () => {
        mockFindOneAndUpdate.mockResolvedValue({ value: null })
        const validId = '64f1f1f1f1f1f1f1f1f1f1f1'
        const res = await request(app).put(`/api/classifiers/${validId}`).send({ description: 'Updated Classifier' })
        expect(res.status).toBe(404)
        expect(res.body).toHaveProperty('error')  
    })

    //DELETE /api/classifiers/:id
    test('DELETE /:id deletes a classifier', async () => {
        const validId = '64f1f1f1f1f1f1f1f1f1f1f1'
        mockFindOne.mockResolvedValue({ value: null })
        mockFindOneAndDelete.mockResolvedValue({ value: { _id: validId, description: 'Deleted Classifier' } })
        const res = await request(app).delete(`/api/classifiers/${validId}`)
        expect(res.status).toBe(200)
        expect(res.body).toHaveProperty('success', true)
    })

    test('DELETE /:id with missing id returns 400', async () => {
        const invalidId = null
        const res = await request(app).delete(`/api/classifiers/${invalidId}`)
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    test('DELETE /:id with invalid id returns 400', async () => {
        const invalidId = 'invalid-id'
        const res = await request(app).delete(`/api/classifiers/${invalidId}`)
        expect(res.status).toBe(400)
        expect(res.body).toHaveProperty('error')
    })

    test('DELETE /:id used in expenses returns 409', async () => {
        mockExpensesFindOne.mockResolvedValue({ _id: 'expense-1', concept: 'Test Expense', classifierId: '64f1f1f1f1f1f1f1f1f1f1f1' })
        const validId = '64f1f1f1f1f1f1f1f1f1f1f1'
        const res = await request(app).delete(`/api/classifiers/${validId}`)
        expect(res.status).toBe(409)
        expect(res.body).toHaveProperty('error')
    })

    test('DELETE /:id non-existing classifier returns 404', async () => {
        mockExpensesFindOne.mockResolvedValue(null)
        mockFindOneAndDelete.mockResolvedValue({ value: null })
        const validId = '64f1f1f1f1f1f1f1f1f1f1f1'
        const res = await request(app).delete(`/api/classifiers/${validId}`)
        expect(res.status).toBe(404)
        expect(res.body).toHaveProperty('error')
    })
})