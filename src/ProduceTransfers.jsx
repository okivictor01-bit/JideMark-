import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function ProduceTransfers({ userRole }) {
  const [transfers, setTransfers] = useState([])
  const [branches, setBranches] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [newTransfer, setNewTransfer] = useState({
    produce_type: '', mould: '', from_branch_id: '', to_branch_id: '', quantity: ''
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])

    const { data: transfersData } = await supabase
      .from('produce_transfers')
      .select('*, branches!produce_transfers_from_branch_id_fkey(name), branches!produce_transfers_to_branch_id_fkey(name)')
      .order('created_at', { ascending: false })
    
    setTransfers(transfersData || [])
  }

  async function handleTransfer(e) {
    e.preventDefault()
    
    const transferData = {
      from_branch_id: newTransfer.from_branch_id,
      to_branch_id: newTransfer.to_branch_id,
      produce_type: newTransfer.produce_type,
      mould: newTransfer.mould,
      quantity_kg: parseFloat(newTransfer.quantity),
      date: new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase.from('produce_transfers').insert([transferData])
    
    if (!error) {
      setNewTransfer({ produce_type: '', mould: '', from_branch_id: '', to_branch_id: '', quantity: '' })
      setShowForm(false)
      loadData()
      alert('Produce transferred successfully!\n\nStock has been automatically updated for both branches.')
    } else {
      alert('Error: ' + error.message)
    }
  }

  function getBranchName(id) {
    const branch = branches.find(b => b.id === id)
    return branch ? branch.name : 'Unknown'
  }

  return (
    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Produce Stock Transfers</h2>
        {userRole !== 'clerk' && (
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 15px', backgroundColor: '#8e44ad', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {showForm ? 'Cancel' : '+ Transfer Stock'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleTransfer} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
          <h3 style={{ marginTop: 0, color: '#8e44ad' }}>Transfer Produce Between Branches</h3>
          
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Produce Type *</label>
          <select value={newTransfer.produce_type} onChange={(e) => setNewTransfer({...newTransfer, produce_type: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Produce</option>
            <option value="Cocoa">Cocoa</option>
            <option value="Palm kernel">Palm kernel</option>
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mould/Grade *</label>
          <input type="text" placeholder="e.g., Grade A" value={newTransfer.mould} onChange={(e) => setNewTransfer({...newTransfer, mould: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>From Branch (Source) *</label>
          <select value={newTransfer.from_branch_id} onChange={(e) => setNewTransfer({...newTransfer, from_branch_id: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Source Branch</option>
            {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>To Branch (Destination) *</label>
          <select value={newTransfer.to_branch_id} onChange={(e) => setNewTransfer({...newTransfer, to_branch_id: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Destination Branch</option>
            {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Quantity (kg) *</label>
          <input type="number" step="0.01" placeholder="Weight in kg" value={newTransfer.quantity} onChange={(e) => setNewTransfer({...newTransfer, quantity: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#8e44ad', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Confirm Transfer</button>
        </form>
      )}

      {transfers.length === 0 ? <p>No transfers recorded yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {transfers.map((transfer) => (
            <li key={transfer.id} style={{ padding: '12px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', borderLeft: '4px solid #8e44ad' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '16px' }}>{transfer.produce_type} • {transfer.mould}</strong>
                  <div style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '5px' }}>
                     {getBranchName(transfer.from_branch_id)} ➡️ 📥 {getBranchName(transfer.to_branch_id)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8e44ad' }}>
                    {transfer.quantity_kg}kg
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>{transfer.date}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
