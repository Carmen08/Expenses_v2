import React, { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import auth from '../firebase'
import { Link, useNavigate } from 'react-router-dom'

export default function LoginPage(){
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleSubmit(e){
    e.preventDefault()
    setError('')

    if(!email || !password){
      setError('Email and password are required')
      return
    }

    setLoading(true)
    try{
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      console.log('Logged in:', userCredential.user)
      navigate('/expenses')
    }catch(err){
      console.error(err)
      setError(err.message || 'Login failed')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <form className="card" onSubmit={handleSubmit}>
        <h2>Login</h2>
        {error && <div className="error">{error}</div>}
        <label>
          Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Logging...' : 'Login'}</button>
        <div style={{marginTop:12,fontSize:14,textAlign:'center'}}>
          No account? <Link to="/signup">Sign up</Link>
        </div>
      </form>
    </div>
  )
}
