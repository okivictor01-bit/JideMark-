import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function ToolTransfers({ userRole }) {
  const [transfers, setTransfers] = useState([])
  const [branches, setBranches] = useState([])
  const [inventory, setInventory] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [newTransfer, setNewTransfer] = useState({
    tool_name: '',
    from_branch_id: '',
    to_branch_id: '',
    quantity: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    // Load branches
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])

    // Load inventory (to populate tool dropdown)
    const { data: inventoryData } = await supabase.from('tools_inventory').select('*')
    setInventory(inventoryData || [])

    // Load transfers
    const { data: transfersData } = await supabase
      .from('tool_transfers')
      .select('*')
      .order('created_at', { ascending: false })
    
    setTransfers(transfersData || [])
  }

  async function handleTransfer(e) {
    e.preventDefault()
    
    const transferData = {
      from_branch_id: newTransfer.from_branch_id,
      to_branch_id: newTransfer.to_branch_id,
      tool_name: newTransfer.tool_name,
      quantity: parseInt(newTransfer.quantity),
      date: new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase.from('tool_transfers').insert([transferData])
    
    if (!error) {
      setNewTransfer({
        tool_name: '',
        from_branch_id: '',
        to_branch_id: '',
        quantity: ''
      })
      setShowForm(false)
      loadData()
      alert('Transfer successful!\n\nInventory has been automatically updated for both branches.')
    } else {
      alert('Error: ' + error.message)
    }
  }

  // Helper to get branch name by ID
  function getBranchName(id) {
    const branch = branches.find(b => b.id === id)
    return branch ? branch.name : 'Unknown'
  }

  return (
    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Tool Transfers</h2>
        {userRole === 'super_admin' && (
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 15px', backgroundColor: '#8e44ad', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {showForm ? 'Cancel' : '+ Transfer Tools'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleTransfer} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
          <h3 style={{ marginTop: 0, color: '#8e44ad' }}>Transfer Tools Between Branches</h3>
          
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tool Name *</label>
          <select value={newTransfer.tool_name} onChange={(e) => setNewTransfer({...newTransfer, tool_name: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Tool</option>
            {/* Get unique tool names from inventory */}
            {[...new Set(inventory.map(item => item.tool_name))].map(tool => (
              <option key={tool} value={tool}>{tool}</option>
            ))}
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>From Branch (Source) *</label>
          <select value={newTransfer.from_branch_id} onChange={(e) => setNewTransfer({...newTransfer, from_branch_id: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Source Branch</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>To Branch (Destination) *</label>
          <select value={newTransfer.to_branch_id} onChange={(e) => setNewTransfer({...newTransfer, to_branch_id: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Destination Branch</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Quantity *</label>
          <input type="number" placeholder="Number of units to transfer" value={newTransfer.quantity} onChange={(e) => setNewTransfer({...newTransfer, quantity: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#8e44ad', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Confirm Transfer</button>
        </form>
      )}

      {transfers.length === 0 ? <p>No transfers recorded yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {transfers.map((transfer) => (
            <li key={transfer.id} style={{ padding: '12px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', borderLeft: '4px solid #8e44ad' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '16px' }}>{transfer.tool_name}</strong>
                  <div style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '5px' }}>
                     {getBranchName(transfer.from_branch_id)} ➡️ 📥 {getBranchName(transfer.to_branch_id)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#8e44ad' }}>
                    {transfer.quantity}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>units</div>
                </div>
              </div>
              <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '8px', borderTop: '1px solid #ecf0f1', paddingTop: '8px' }}>
                Date: {transfer.date}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
