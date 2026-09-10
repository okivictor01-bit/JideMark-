import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function ProduceTransfers({ userRole }) {
  const [transfers, setTransfers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newTransfer, setNewTransfer] = useState({
    produce_type: '', mould: '', from_branch_id: '', to_branch_id: '', quantity: ''
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    setLoading(true)
    
    // Load branches
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])

    // Load transfers with branch details
    const { data: transfersData, error } = await supabase
      .from('produce_transfers')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Error loading transfers:', error)
    } else {
      setTransfers(transfersData || [])
    }
    
    setLoading(false)
  }

  async function handleTransfer(e) {
    e.preventDefault()
    
    if (newTransfer.from_branch_id === newTransfer.to_branch_id) {
      alert('Source and destination branches must be different!')
      return
    }
    
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
      await loadData() // Refresh the list
      alert('Produce transferred successfully!\n\nStock has been automatically updated for both branches.')
    } else {
      alert('Error: ' + error.message)
    }
  }

  function getBranchName(id) {
    const branch = branches.find(b => b.id === id)
    return branch ? branch.name : 'Unknown Branch'
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

      {loading ? <p>Loading transfers...</p> : transfers.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: '#7f8c8d', backgroundColor: 'white', borderRadius: '5px' }}>
          <p style={{ margin: 0, fontSize: '16px' }}>📦 No transfers recorded yet.</p>
          <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>Use the "+ Transfer Stock" button to move produce between branches.</p>
        </div>
      ) : (
        <div>
          <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Transfer History ({transfers.length})</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {transfers.map((transfer) => (
              <li key={transfer.id} style={{ padding: '15px', marginBottom: '10px', backgroundColor: 'white', borderRadius: '8px', borderLeft: '5px solid #8e44ad', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                      <strong style={{ fontSize: '16px', color: '#2c3e50' }}>{transfer.produce_type}</strong>
                      <span style={{ padding: '3px 8px', backgroundColor: '#f39c12', color: 'white', borderRadius: '3px', fontSize: '12px', fontWeight: 'bold' }}>
                        {transfer.mould}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '5px' }}>
                      <div style={{ marginBottom: '5px' }}>
                        <span style={{ color: '#e74c3c', fontWeight: 'bold' }}>📤 {getBranchName(transfer.from_branch_id)}</span>
                        <span style={{ margin: '0 8px' }}>➡️</span>
                        <span style={{ color: '#27ae60', fontWeight: 'bold' }}>📥 {getBranchName(transfer.to_branch_id)}</span>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#95a5a6' }}>
                      📅 {transfer.date}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '100px' }}>
                    <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#8e44ad' }}>
                      {transfer.quantity_kg}kg
                    </div>
                    <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                      Quantity
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
