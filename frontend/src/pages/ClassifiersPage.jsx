import React, { useEffect, useState } from 'react'
import auth from '../firebase'
import { useNavigate } from 'react-router-dom'

function formatClassifierText(value){
  if(typeof value !== 'string') return ''

  const normalized = value.replace(/\s+/g, ' ').trim()
  if(!normalized) return ''

  return normalized
    .split(' ')
    .filter(Boolean)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

export default function ClassifiersPage(){
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [description, setDescription] = useState('')
  const [editId, setEditId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    let mounted = true

    async function fetchClassifiers(){
      try{
        const currentUser = auth.currentUser
        if(!currentUser){
          navigate('/login')
          return
        }

        const token = await currentUser.getIdToken()
        const res = await fetch('/api/classifiers', {
          headers: { Authorization: `Bearer ${token}` }
        })

        if(res.status === 401){
          navigate('/login')
          return
        }

        const data = await res.json()
        if(mounted) setItems((data.classifiers || []).sort((a, b) => (a.description || '').localeCompare(b.description || '')))
      }catch(err){
        console.error('Failed to fetch classifiers', err)
      }finally{
        if(mounted) setLoading(false)
      }
    }

    fetchClassifiers()
    return () => { mounted = false }
  }, [navigate])

  async function handleSubmit(e){
    e.preventDefault()
    const formatted = formatClassifierText(description)
    if(!formatted) return alert('Description is required')

    try{
      const currentUser = auth.currentUser
      if(!currentUser){ navigate('/login'); return }
      const token = await currentUser.getIdToken()

      const payload = { description: formatted }
      let res
      if(editId){
        res = await fetch(`/api/classifiers/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        })
      }else{
        res = await fetch('/api/classifiers', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        })
      }

      if(res.status === 401){ navigate('/login'); return }
      if(!res.ok){
        const err = await res.json().catch(() => ({ error: 'Unknown' }))
        alert((editId ? 'Update' : 'Create') + ' failed: ' + (err.error || res.statusText))
        return
      }

      const data = await res.json()
      const item = data.classifier

      setItems(prev => {
        const next = editId
          ? prev.map(it => ((it._id || it.id) === (item._id || item.id) ? item : it))
          : [item, ...prev]
        return next.sort((a, b) => (a.description || '').localeCompare(b.description || ''))
      })

      setDescription('')
      setEditId(null)
      setShowModal(false)
    }catch(err){
      console.error('Save classifier failed', err)
      alert('Save classifier failed')
    }
  }

  async function handleDelete(id){
    if(!confirm('Delete this classifier?')) return
    try{
      const currentUser = auth.currentUser
      if(!currentUser){ navigate('/login'); return }
      const token = await currentUser.getIdToken()
      const res = await fetch(`/api/classifiers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if(res.status === 401){ navigate('/login'); return }
      if(!res.ok){
        const err = await res.json().catch(() => ({ error: 'Unknown' }))
        alert('Failed to delete: ' + (err.error || res.statusText))
        return
      }

      setItems(prev => prev.filter(it => (it._id || it.id) !== id))
      setSelectedIds(prev => prev.filter(x => x !== id))
    }catch(err){
      console.error('Delete classifier failed', err)
      alert('Delete classifier failed')
    }
  }

  function openCreate(){
    setEditId(null)
    setDescription('')
    setShowModal(true)
  }

  function openEdit(item){
    setEditId(item._id || item.id)
    setDescription(item.description || '')
    setShowModal(true)
  }

  function handleCancel(){
    setEditId(null)
    setDescription('')
    setShowModal(false)
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h1 style={{ margin: 0 }}>Classifiers</h1>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button title="Add classifier" onClick={openCreate} style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: 'auto', margin: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12h14" stroke="#005bee" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button title="Edit selected" disabled={selectedIds.length !== 1} onClick={() => {
            if(selectedIds.length !== 1) return
            const id = selectedIds[0]
            const item = items.find(x => (x._id || x.id) === id)
            if(item) openEdit(item)
          }} style={{ background: 'transparent', border: 'none', cursor: selectedIds.length === 1 ? 'pointer' : 'not-allowed', width: 'auto', margin: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21v-3.75L14.81 5.44a2 2 0 012.83 0l1.92 1.92a2 2 0 010 2.83L7.75 21H3z" stroke="#333" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
          <button title="Delete selected" disabled={selectedIds.length === 0} onClick={() => {
            if(selectedIds.length === 0) return
            selectedIds.forEach(id => handleDelete(id))
          }} style={{ background: 'transparent', border: 'none', cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed', width: 'auto', margin: 0, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6M10 6V4a2 2 0 012-2h0a2 2 0 012 2v2" stroke="#b00" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onMouseDown={handleCancel}>
          <div className="modal" onMouseDown={e => e.stopPropagation()}>
            <h3>{editId ? 'Edit classifier' : 'Create classifier'}</h3>
            <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 8 }}>
              <label>Description
                <input
                  value={description}
                  //onChange={e => setDescription(formatClassifierText(e.target.value))}
                  onChange={e => setDescription(e.target.value)}
                />
              </label>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
                <button type="submit" className="create-btn">{editId ? 'Save' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {loading ? <p>Loading...</p> : (
        <table className="table-reset" style={{ width: '100%' }}>
          <thead className="grid-header">
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  checked={items.length > 0 && selectedIds.length === items.length}
                  onChange={(e) => {
                    if(e.target.checked){
                      setSelectedIds(items.map(it => it._id || it.id))
                    }else{
                      setSelectedIds([])
                    }
                  }}
                />
              </th>
              <th className="grid-lbl concept">Description</th>
            </tr>
          </thead>
          <tbody>
            {items.map(it => (
              <tr key={it._id || it.id}>
                <td onClick={(e) => {
                  e.stopPropagation()
                  const id = it._id || it.id
                  setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
                }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(it._id || it.id)}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                      e.stopPropagation()
                      const id = it._id || it.id
                      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
                    }}
                  />
                </td>
                <td>{it.description || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
