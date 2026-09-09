import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Advances({ userRole, userBranchId }) {
  const [advances, setAdvances] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newAdvance, setNewAdvance] = useState({
    supplier_id: '',
    amount: '',
    method: 'cash',
    funding_source: 'owner_central',
    recorded_by_branch_id: '',
    owner_instruction_notes: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    // Load suppliers
    const { data: suppliersData } = await supabase.from('suppliers').select('*').order('name')
    setSuppliers(suppliersData || [])

    // Load branches (for dropdown if super_admin)
    if (userRole === 'super_admin') {
      const { data: branchesData } = await supabase.from('branches').select('*')
      setBranches(branchesData || [])
    }

    // Load advances
    const { data: advancesData, error } = await supabase
      .from('advances')
      .select(`
        *,
        suppliers (name),
        branches (name)
      `)
      .order('created_at', { ascending: false })
    
    if (!error) setAdvances(advancesData || [])
    setLoading(false)
  }

  async function handleAddAdvance(e) {
    e.preventDefault()
    
    const advanceData = {
      supplier_id: newAdvance.supplier_id,
      amount: parseFloat(newAdvance.amount),
      method: newAdvance.method,
      funding_source: newAdvance.funding_source,
      recorded_by_branch_id: newAdvance.recorded_by_branch_id || userBranchId,
      owner_instruction_notes: newAdvance.owner_instruction_notes,
      approval_status: 'approved',
      date: new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase.from('advances').insert([advanceData])
    
    if (!error) {
      setNewAdvance({
        supplier_id: '',
        amount: '',
        method: 'cash',
        funding_source: 'owner_central',
        recorded_by_branch_id: '',
        owner_instruction_notes: ''
      })
      setShowForm(false)
      loadData()
      alert('Advance recorded successfully!')
    } else {
      alert('Error: ' + error.message)
    }
  }

  const selectedSupplier = suppliers.find(s => s.id === newAdvance.supplier_id)

  return (
    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Advances to Suppliers</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 15px', backgroundColor: '#9b59b6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ Record Advance'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddAdvance} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
          <h3 style={{ marginTop: 0, color: '#8e44ad' }}>Record New Advance</h3>
          
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Supplier *</label>
          <select value={newAdvance.supplier_id} onChange={(e) => setNewAdvance({...newAdvance, supplier_id: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Supplier</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Amount (₦) *</label>
          <input type="number" placeholder="Enter amount" value={newAdvance.amount} onChange={(e) => setNewAdvance({...newAdvance, amount: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Payment Method *</label>
          <select value={newAdvance.method} onChange={(e) => setNewAdvance({...newAdvance, method: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="cash">Cash</option>
            <option value="transfer">Bank Transfer</option>
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Funding Source *</label>
          <select value={newAdvance.funding_source} onChange={(e) => setNewAdvance({...newAdvance, funding_source: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="owner_central">Owner's Central Funds</option>
            <option value="branch_cash">Branch Cash Box (Owner Instructed)</option>
          </select>

          {userRole === 'super_admin' && newAdvance.funding_source === 'branch_cash' && (
            <>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Branch *</label>
              <select value={newAdvance.recorded_by_branch_id} onChange={(e) => setNewAdvance({...newAdvance, recorded_by_branch_id: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
                <option value="">Select Branch</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </>
          )}

          {newAdvance.funding_source === 'branch_cash' && (
            <>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Owner's Instruction Notes</label>
              <textarea placeholder="e.g., Approved via phone call on Tuesday" value={newAdvance.owner_instruction_notes} onChange={(e) => setNewAdvance({...newAdvance, owner_instruction_notes: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box', minHeight: '80px' }} />
            </>
          )}

          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save Advance</button>
        </form>
      )}

      {loading ? <p>Loading advances...</p> : advances.length === 0 ? <p>No advances recorded yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {advances.map((advance) => (
            <li key={advance.id} style={{ padding: '12px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', borderLeft: '4px solid #9b59b6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <strong>{advance.suppliers?.name}</strong>
                <span style={{ fontWeight: 'bold', color: '#27ae60' }}>₦{parseFloat(advance.amount).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '5px' }}>
                {advance.method} • {advance.funding_source === 'branch_cash' ? ' ' + advance.branches?.name : '👤 Owner'}
                {advance.funding_source === 'branch_cash' && advance.owner_instruction_notes && (
                  <div style={{ fontStyle: 'italic', marginTop: '5px' }}>📝 {advance.owner_instruction_notes}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
