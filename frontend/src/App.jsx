import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignUpPage from './pages/SignUpPage'
import ListingPage from './pages/ListingPage'
import ClassifiersPage from './pages/ClassifiersPage'
import { AuthProvider } from './contexts/AuthContext'
import RequireAuth from './components/RequireAuth'
import AppLayout from './components/AppLayout'

export default function App(){
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />

          <Route element={<RequireAuth><AppLayout /></RequireAuth>}>
            <Route path="/expenses" element={<ListingPage />} />
            <Route path="/classifiers" element={<ClassifiersPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
