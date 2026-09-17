const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const expenses = require('./routes/expenses')
app.use('/api/expenses', expenses)

const port = process.env.PORT || 4000
app.listen(port, () => {
	console.log(`Backend listening on http://localhost:${port}`)
})
