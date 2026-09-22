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
    <div className="app-layout">
      {menuOpen && <div className="app-layout__backdrop" onClick={() => setMenuOpen(false)} />}

      <div className="app-layout__topbar">
        <button
          type="button"
          aria-label="Open navigation menu"
          className="app-layout__menu-button"
          onClick={() => setMenuOpen(v => !v)}
        >
          <div className="app-layout__menu-icon">
            <span />
            <span />
            <span />
          </div>
        </button>
      </div>

      {menuOpen && (
        <div className="app-layout__drawer">
          {navItems.map(item => (
            <button
              key={item.label}
              type="button"
              className="app-layout__nav-button"
              onClick={() => {
                setMenuOpen(false)
                item.action()
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
