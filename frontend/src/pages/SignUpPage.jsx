import React, { useState } from 'react'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import auth from '../firebase'
import { Link, useNavigate } from 'react-router-dom'

export default function SignUpPage(){
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      console.log('User created:', userCredential.user)
      navigate('/expenses')
    }catch(err){
      console.error(err)
      setError(err.message || 'Sign up failed')
    }finally{
      setLoading(false)
    }
  }

  return (
    <div className="container">
      <form className="card" onSubmit={handleSubmit}>
        <h2>Sign Up</h2>
        {error && <div className="error">{error}</div>}
        <label>
          Email
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </label>
        <button type="submit" disabled={loading}>{loading ? 'Creating...' : 'Create account'}</button>
        <div style={{marginTop:12,fontSize:14,textAlign:'center'}}>
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </form>
    </div>
  )
}
