const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' })
})

const expenses = require('./routes/expenses')
app.use('/api/expenses', expenses)

const port = process.env.PORT || 4000
app.listen(port, '0.0.0.0', () => {
	console.log(`Backend listening on http://localhost:${port}`)
})
