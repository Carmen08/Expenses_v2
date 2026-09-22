import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Navigate, useLocation } from 'react-router-dom'

export default function RequireAuth({ children }){
  const { user, loading } = useAuth()
  const location = useLocation()

  if(loading) return <div className="page-loading">Loading...</div>
  if(!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}
