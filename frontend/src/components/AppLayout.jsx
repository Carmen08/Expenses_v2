import React, { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import auth from '../firebase'

export default function AppLayout(){
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const navItems = [
    { label: 'expenses', action: () => navigate('/expenses') },
    { label: 'classifiers', action: () => navigate('/classifiers') },
    {
      label: 'sign out',
      action: async () => {
        try{
          await signOut(auth)
          navigate('/login')
        }catch(err){
          console.error('Sign out failed', err)
        }
      }
    }
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6' }}>
      {menuOpen && (
        <div
          onClick={() => setMenuOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.2)',
            zIndex: 20
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', padding: '14px 24px 0' }}>
        <button
          type="button"
          aria-label="Open navigation menu"
          onClick={() => setMenuOpen(v => !v)}
          style={{
            width: 36,
            height: 36,
            margin: 0,
            padding: 0,
            borderRadius: 8,
            background: '#f3f4f6',
            color: '#1f2937',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'none',
            border: '1px solid #e5e7eb',
            cursor: 'pointer'
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 16 }}>
            <span style={{ display: 'block', height: 2, borderRadius: 99, background: '#1f2937' }} />
            <span style={{ display: 'block', height: 2, borderRadius: 99, background: '#1f2937' }} />
            <span style={{ display: 'block', height: 2, borderRadius: 99, background: '#1f2937' }} />
          </div>
        </button>
      </div>

      {menuOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          bottom: 0,
          width: 220,
          background: '#ffffff',
          borderRight: '1px solid #e5e7eb',
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          zIndex: 30,
          padding: '16px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          {navItems.map(item => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                setMenuOpen(false)
                item.action()
              }}
              style={{
                width: 'auto',
                margin: 0,
                padding: 0,
                background: 'transparent',
                color: '#111827',
                border: 'none',
                borderRadius: 0,
                boxShadow: 'none',
                fontWeight: 500,
                textAlign: 'left',
                textTransform: 'capitalize',
                textDecoration: 'none',
                transition: 'text-decoration-color 0.15s ease, text-decoration 0.15s ease',
                display: 'inline-block',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.textDecoration = 'underline'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.textDecoration = 'none'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      <main>
        <Outlet />
      </main>
    </div>
  )
}
