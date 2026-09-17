const admin = require('../firebaseAdmin')

module.exports = async function verifyToken(req, res, next){
  try{
    const authHeader = req.get('Authorization') || ''
    const match = authHeader.match(/^Bearer\s+(.*)$/i)
    if(!match) return res.status(401).json({ error: 'No token provided' })
    const idToken = match[1]
    const decoded = await admin.auth().verifyIdToken(idToken)
    req.user = decoded
    next()
  }catch(err){
    console.error('Token verification failed:', err && err.message)
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}
