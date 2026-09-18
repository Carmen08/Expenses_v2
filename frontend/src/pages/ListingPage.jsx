import React, { useEffect, useState } from 'react'
import { signOut } from 'firebase/auth'
import auth from '../firebase'
import { useNavigate } from 'react-router-dom'

export default function ListingPage(){
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  // filter state (default to current month) — use local dates (YYYY-MM-DD)
  const formatLocalDate = (d) => {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
  }
  const getMonthRange = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start: formatLocalDate(start), end: formatLocalDate(end) }
  }
  const monthRange = getMonthRange()
  // inputs (editable) and applied filters (used to filter)
  const [filterStartInput, setFilterStartInput] = useState(monthRange.start)
  const [filterEndInput, setFilterEndInput] = useState(monthRange.end)
  const [filterTextInput, setFilterTextInput] = useState('')
  const [filterStart, setFilterStart] = useState(monthRange.start)
  const [filterEnd, setFilterEnd] = useState(monthRange.end)
  const [filterText, setFilterText] = useState('')
  // create form state
  const [concept, setConcept] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState('')
  const [classifierDesc, setClassifierDesc] = useState('')
  const [isExpense, setIsExpense] = useState(true)
  const [editId, setEditId] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])

  useEffect(() => {
    let mounted = true
    async function fetchListings(){
      try{
        const currentUser = auth.currentUser
        if(!currentUser){
          navigate('/login')
          return
        }
        const token = await currentUser.getIdToken()
        // const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/expenses`, {
        const res = await fetch(`/api/expenses`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
        if(res.status === 401){
          // token invalid or expired
          navigate('/login')
          return
        }
        const data = await res.json()
        // backend may return { listings: [...] } or { expenses: [...] }
        if(mounted) setItems(data.expenses || [])
      }catch(err){
        console.error('Failed to fetch expenses', err)
      }finally{
        if(mounted) setLoading(false)
      }
    }
    fetchListings()
    return () => { mounted = false }
  }, [navigate])

  async function handleSignOut(){
    try{
      await signOut(auth)
      navigate('/login')
    }catch(err){
      console.error('Sign out failed', err)
    }
  }

  async function handleDelete(id){
    if(!confirm('Delete this item?')) return
    try{
      const currentUser = auth.currentUser
      if(!currentUser){
        navigate('/login')
        return
      }
      const token = await currentUser.getIdToken()
      // const res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/expenses/${id}`, {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if(res.status === 401){
        navigate('/login')
        return
      }
      if(!res.ok){
        const err = await res.json().catch(()=>({error:'Unknown'}))
        alert('Failed to delete: ' + (err.error||res.statusText))
        return
      }
      // remove locally
      setItems(prev => prev.filter(it => (it._id || it.id) !== id))
      setSelectedIds(prev => prev.filter(x => x !== id))
    }catch(err){
      console.error('Delete failed', err)
      alert('Delete failed')
    }
  }

  async function handleBulkDelete(){
    if(selectedIds.length === 0) return
    if(!confirm(`Delete ${selectedIds.length} selected item(s)?`)) return
    try{
      const currentUser = auth.currentUser
      if(!currentUser){ navigate('/login'); return }
      const token = await currentUser.getIdToken()
      // delete in parallel
      // const base = `${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/expenses/`
      const base = `/api/expenses/`
      const results = await Promise.all(selectedIds.map(id => fetch(base + id, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } }).then(r => ({id, ok: r.ok, status: r.status})).catch(e => ({id, ok:false}))))
      // if any unauthorized, redirect
      if(results.some(r => r.status === 401)) { navigate('/login'); return }
      const failed = results.filter(r => !r.ok)
      if(failed.length){ alert(`Failed to delete ${failed.length} item(s)`)}
      // remove successful
      const successIds = results.filter(r => r.ok).map(r=>r.id)
      setItems(prev => prev.filter(it => !successIds.includes(it._id || it.id)))
      setSelectedIds([])
    }catch(err){ console.error('Bulk delete failed', err); alert('Bulk delete failed') }
  }

  async function handleCreate(e){
    e.preventDefault()
    // basic client-side validation
    if(!concept || !amount) return alert('Concept and amount are required')
    const num = Number(amount)
    if(Number.isNaN(num)) return alert('Amount must be a number')

    try{
      const currentUser = auth.currentUser
      if(!currentUser){ navigate('/login'); return }
      const token = await currentUser.getIdToken()
      const payload = {
        concept: concept.trim(),
        amount: num,
        date: date || new Date().toISOString(),
        classifier: { description: classifierDesc || '' },
        isExpense: !!isExpense
      }
      let res
      if(editId){
        // res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/expenses/${editId}`, {
        res = await fetch(`/api/expenses/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        })
      }else{
        // res = await fetch(`${import.meta.env.VITE_API_BASE || 'http://localhost:4000'}/api/expenses`, {
        res = await fetch(`/api/expenses`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify(payload)
        })
      }
      if(res.status === 401){ navigate('/login'); return }
      if(!res.ok){ const err = await res.json().catch(()=>({error:'Unknown'})); return alert((editId?'Update':'Create')+' failed: '+(err.error||res.statusText)) }
      const data = await res.json()
      if(editId){
        const updated = data.expense
        if(updated && updated._id && updated._id.toString) updated._id = updated._id.toString()
        setItems(prev => prev.map(it => ((it._id||it.id) === (updated._id||updated.id) ? updated : it)))
      }else{
        const created = data.expense
        if(created && created._id && created._id.toString) created._id = created._id.toString()
        setItems(prev => [created, ...prev])
      }
      // reset form and close modal
      setConcept(''); setAmount(''); setDate(''); setClassifierDesc(''); setIsExpense(true)
      setEditId(null)
      setShowModal(false)
    }catch(err){ console.error('Create failed', err); alert('Create failed') }
  }

  function getToday(){
    return formatLocalDate(new Date())
  }

  function handleCancel(){
    setConcept('')
    setAmount('')
    setDate('')
    setClassifierDesc('')
    setIsExpense(true)
    setShowModal(false)
    setEditId(null)
  }

  function openEdit(it){
    setEditId(it._id || it.id)
    setConcept(it.concept || '')
    setAmount(it.amount != null ? String(it.amount) : '')
    setDate(it.date ? formatLocalDate(new Date(it.date)) : '')
    setClassifierDesc(it.classifier?.description || '')
    setIsExpense(!!it.isExpense)
    setShowModal(true)
  }

  function openCreate(){
    setEditId(null)
    setConcept('')
    setAmount('')
    setDate(getToday())
    setClassifierDesc('')
    setIsExpense(true)
    setShowModal(true)
  }

  function toggleRowSelection(it){
    const id = it._id || it.id
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  // derived filtered items and totals — uses applied filters, not inputs
  const parseYMD = (s) => {
    if(!s) return null
    const [y,m,d] = s.split('-').map(Number)
    return new Date(y, m-1, d, 0,0,0,0)
  }

  const filteredItems = items.filter(it => {
    try{
      const d = it.date ? new Date(it.date) : null
      if(!d) return false
      const start = filterStart ? parseYMD(filterStart) : null
      const end = filterEnd ? parseYMD(filterEnd) : null
      if(start && d < start) return false
      if(end){
        const endDay = new Date(end); endDay.setHours(23,59,59,999)
        if(d > endDay) return false
      }
      if(filterText){
        const text = filterText.toLowerCase()
        const desc = (it.classifier && it.classifier.description) ? it.classifier.description.toLowerCase() : ''
        const concept = (it.concept || '').toLowerCase()
        if(!desc.includes(text) && !concept.includes(text)) return false
      }
      return true
    }catch(e){ return false }
  })

  const totals = filteredItems.reduce((acc, it) => {
    const amt = typeof it.amount === 'number' ? it.amount : Number(it.amount) || 0
    if(it.isExpense) acc.expense += amt
    else acc.income += amt
    return acc
  }, { income: 0, expense: 0 })

  return (
    <div style={{padding:24}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <h1>Expenses</h1>
        <div style={{fontSize:13,color:'#005bee'}} className="signout-link" onClick={handleSignOut}>Sign out</div>
      </div>
      <div className="filters" style={{marginTop:12,marginBottom:12}}>
        <label>From <input type="date" value={filterStartInput} onChange={e=>setFilterStartInput(e.target.value)} /></label>
        <label>To <input type="date" value={filterEndInput} onChange={e=>setFilterEndInput(e.target.value)} /></label>
        <label>Text filter <input placeholder="Search concept or classifier" value={filterTextInput} onChange={e=>{ setFilterTextInput(e.target.value); setFilterText(e.target.value); }} /></label>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
          <button type="button" onClick={() => {
            const s = filterStartInput
            let e = filterEndInput
            if(s && e && e < s){
              e = s
              setFilterEndInput(s)
            }
            setFilterStart(s)
            setFilterEnd(e)
          }}>Apply</button>
          <button type="button" onClick={() => { setFilterStart(monthRange.start); setFilterEnd(monthRange.end); setFilterText(''); setFilterStartInput(monthRange.start); setFilterEndInput(monthRange.end); setFilterTextInput('') }}>Reset</button>
        </div>
        <div className="totals" style={{marginLeft:'auto',display:'flex',gap:12,alignItems:'center'}}>
          <div className="total-income">Income: {totals.income.toFixed(2)} €</div>
          <div className="total-expense">Expense: {totals.expense.toFixed(2)} €</div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <button title="Add expense" onClick={openCreate} style={{background:'transparent',border:'none',cursor:'pointer'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 5v14M5 12h14" stroke="#005bee" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button title="Edit selected" disabled={selectedIds.length !== 1} onClick={() => {
              if(selectedIds.length !== 1) return
              const id = selectedIds[0]
              const it = items.find(x => (x._id||x.id) === id)
              if(it) openEdit(it)
            }} style={{background:'transparent',border:'none',cursor: selectedIds.length===1 ? 'pointer' : 'not-allowed'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21v-3.75L14.81 5.44a2 2 0 012.83 0l1.92 1.92a2 2 0 010 2.83L7.75 21H3z" stroke="#333" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
            <button title="Delete selected" disabled={selectedIds.length===0} onClick={handleBulkDelete} style={{background:'transparent',border:'none',cursor: selectedIds.length>0 ? 'pointer' : 'not-allowed'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 6h18M8 6v12a2 2 0 002 2h4a2 2 0 002-2V6M10 6V4a2 2 0 012-2h0a2 2 0 012 2v2" stroke="#b00" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </button>
          </div>
        </div>
      </div>
      {loading ? <p>Loading...</p> : (
        <div>
          {/* Modal */}
          {showModal && (
            <div className="modal-overlay" onMouseDown={handleCancel}>
              <div className="modal" onMouseDown={e=>e.stopPropagation()}>
                <h3>Create Expense</h3>
                <form onSubmit={handleCreate} style={{display:'grid',gap:8}}>
                  <label>Concept
                    <input value={concept} onChange={e=>setConcept(e.target.value)} />
                  </label>
                  <label>Amount
                    <input type="number" step="0.01" value={amount} onChange={e=>setAmount(e.target.value)} />
                  </label>
                  <label>Date
                    <input type="date" value={date} onChange={e=>setDate(e.target.value)} />
                  </label>
                  <label>Classifier
                    <input value={classifierDesc} onChange={e=>setClassifierDesc(e.target.value)} />
                  </label>
                  <label>Type
                    <select value={isExpense? 'expense' : 'income'} onChange={e=>setIsExpense(e.target.value==='expense')}>
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </label>
                  <div style={{display:'flex',gap:8,justifyContent:'flex-end',marginTop:8}}>
                    <button type="button" className="cancel-btn" onClick={handleCancel}>Cancel</button>
                    <button type="submit" className="create-btn">Create</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <table className="table-reset" id="tabla">
            <thead className="grid-header">
              <tr>
                <th style={{width:36}}>
                  <input
                    type="checkbox"
                    checked={filteredItems.length>0 && selectedIds.length === filteredItems.length}
                    onChange={(e) => {
                      if(e.target.checked){
                        setSelectedIds(filteredItems.map(it => it._id || it.id))
                      }else{
                        setSelectedIds([])
                      }
                    }}
                  />
                </th>
                <th className="grid-lbl date">Date</th>
                <th className="grid-lbl concept">Concept</th>
                <th className="grid-lbl amount">Amount</th>
                <th className="grid-lbl classifier">Classifier</th>
                
              </tr>
            </thead>
            <tbody id="table-body">
              {filteredItems.map(it => (
                <tr key={it._id || it.id} onClick={()=>toggleRowSelection(it)}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(it._id || it.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        const id = it._id || it.id
                        setSelectedIds(prev => {
                          if(prev.includes(id)) return prev.filter(x=>x!==id)
                          return [...prev, id]
                        })
                      }}
                    />
                  </td>
                  <td>{it.date ? new Date(it.date).toLocaleDateString() : ''}</td>
                  <td>{it.concept || it.title || ''}</td>
                  <td>{typeof it.amount === 'number' ? `${it.amount.toFixed(2)} €` : it.amount}</td>
                  <td>{it.classifier?.description || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
        </div>
      )}
    </div>
  )
}
