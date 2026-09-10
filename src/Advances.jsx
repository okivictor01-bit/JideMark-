import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Advances({ userRole, userBranchId }) {
  const [advances, setAdvances] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newAdvance, setNewAdvance] = useState({
    supplier_id: '', amount: '', method: 'cash', funding_source: 'owner_central', recorded_by_branch_id: '', owner_instruction_notes: ''
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])

    // FIXED: Filter suppliers by branch for non-super-admins
    let suppliersQuery = supabase.from('suppliers').select('*').order('name')
    
    if (userRole !== 'super_admin' && userBranchId) {
      suppliersQuery = suppliersQuery.eq('branch_id', userBranchId)
    }
    
    const { data: suppliersData } = await suppliersQuery
    setSuppliers(suppliersData || [])

    // FIXED: Filter advances by branch for non-super-admins
    let advancesQuery = supabase.from('advances').select('*, suppliers (name), branches (name)').order('created_at', { ascending: false })
    
    if (userRole !== 'super_admin' && userBranchId) {
      advancesQuery = advancesQuery.eq('recorded_by_branch_id', userBranchId)
    }
    
    const { data: advancesData } = await advancesQuery
    setAdvances(advancesData || [])
    
    setLoading(false)
  }

  async function handleSaveAdvance(e) {
    e.preventDefault()
    
    let finalFundingSource = newAdvance.funding_source;
    let finalBranchId = newAdvance.recorded_by_branch_id;

    if (userRole !== 'super_admin') {
      finalFundingSource = 'branch_cash';
      finalBranchId = userBranchId;
      
      if (!newAdvance.owner_instruction_notes) {
        alert('Please enter the Owner\'s instruction note.');
        return;
      }
    }

    const advanceData = {
      supplier_id: newAdvance.supplier_id, amount: parseFloat(newAdvance.amount), method: newAdvance.method,
      funding_source: finalFundingSource, recorded_by_branch_id: finalBranchId,
      owner_instruction_notes: newAdvance.owner_instruction_notes, approval_status: 'approved', date: new Date().toISOString().split('T')[0]
    }

    let error;
    if (editingId) {
      const res = await supabase.from('advances').update(advanceData).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('advances').insert([advanceData])
      error = res.error
    }

    if (!error) {
      setNewAdvance({ supplier_id: '', amount: '', method: 'cash', funding_source: 'owner_central', recorded_by_branch_id: '', owner_instruction_notes: '' })
      setEditingId(null); setShowForm(false); loadData()
      alert(editingId ? 'Advance updated successfully!' : 'Advance recorded successfully!')
    } else { alert('Error: ' + error.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this advance?')) return
    const { error } = await supabase.from('advances').delete().eq('id', id)
    if (!error) { alert('Advance deleted successfully!'); loadData() }
    else { alert('Error deleting: ' + error.message) }
  }

  function handleEdit(advance) {
    setEditingId(advance.id)
    setNewAdvance({
      supplier_id: advance.supplier_id, amount: advance.amount.toString(), method: advance.method,
      funding_source: advance.funding_source, recorded_by_branch_id: advance.recorded_by_branch_id || '',
      owner_instruction_notes: advance.owner_instruction_notes || ''
    })
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  return (
    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Advances to Suppliers</h2>
        <button onClick={() => { setShowForm(!showForm); if(showForm) { setEditingId(null); setNewAdvance({ supplier_id: '', amount: '', method: 'cash', funding_source: 'owner_central', recorded_by_branch_id: '', owner_instruction_notes: '' })} }} style={{ padding: '8px 15px', backgroundColor: '#9b59b6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ Record Advance'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSaveAdvance} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px', border: '2px solid #9b59b6' }}>
          <h3 style={{ marginTop: 0, color: '#8e44ad' }}>{editingId ? 'Edit Advance' : 'Record New Advance'}</h3>
          
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Supplier *</label>
          <select value={newAdvance.supplier_id} onChange={(e) => setNewAdvance({...newAdvance, supplier_id: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Supplier</option>
            {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Amount (₦) *</label>
          <input type="number" placeholder="Enter amount" value={newAdvance.amount} onChange={(e) => setNewAdvance({...newAdvance, amount: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Payment Method *</label>
          <select value={newAdvance.method} onChange={(e) => setNewAdvance({...newAdvance, method: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="cash">Cash</option>
            <option value="transfer">Bank Transfer</option>
          </select>

          {userRole === 'super_admin' && (
            <>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Funding Source *</label>
              <select value={newAdvance.funding_source} onChange={(e) => setNewAdvance({...newAdvance, funding_source: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
                <option value="owner_central">Owner's Central Funds</option>
                <option value="branch_cash">Branch Cash Box (Manager Instructed)</option>
              </select>
            </>
          )}

          {userRole === 'super_admin' && newAdvance.funding_source === 'branch_cash' && (
            <>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Branch *</label>
              <select value={newAdvance.recorded_by_branch_id} onChange={(e) => setNewAdvance({...newAdvance, recorded_by_branch_id: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
                <option value="">Select Branch</option>
                {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </>
          )}

          {(newAdvance.funding_source === 'branch_cash' || userRole !== 'super_admin') && (
            <>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', color: '#e74c3c' }}>Owner's Instruction Note * (Required)</label>
              <textarea placeholder="e.g., 'Approved by Boss via WhatsApp on 10/09'" value={newAdvance.owner_instruction_notes} onChange={(e) => setNewAdvance({...newAdvance, owner_instruction_notes: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box', minHeight: '80px' }} />
            </>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ flex: 1, padding: '10px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              {editingId ? 'Update Advance' : 'Save Advance'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setShowForm(false); }} style={{ padding: '10px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {loading ? <p>Loading advances...</p> : advances.length === 0 ? <p>No advances recorded yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {advances.map((advance) => (
            <li key={advance.id} style={{ padding: '12px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', borderLeft: '4px solid #9b59b6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <strong>{advance.suppliers?.name}</strong>
                  <div style={{ fontSize: '14px', color: '#7f8c8d', marginTop: '5px' }}>
                    {advance.method} • {advance.funding_source === 'branch_cash' ? advance.branches?.name : 'Owner'}
                  </div>
                  {advance.owner_instruction_notes && (
                    <div style={{ fontSize: '12px', color: '#7f8c8d', fontStyle: 'italic', marginTop: '5px' }}>📝 {advance.owner_instruction_notes}</div>
                  )}
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontWeight: 'bold', color: '#27ae60', fontSize: '18px' }}>₦{parseFloat(advance.amount).toLocaleString()}</span>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button onClick={() => handleEdit(advance)} style={{ padding: '5px 10px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>✏️ Edit</button>
                    <button onClick={() => handleDelete(advance.id)} style={{ padding: '5px 10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>🗑️ Delete</button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
