import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Purchases({ userRole, userBranchId }) {
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [branches, setBranches] = useState([])
  const [moulds, setMoulds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterBranch, setFilterBranch] = useState('all')
  const [editingId, setEditingId] = useState(null)
  const [currentUserBranchId, setCurrentUserBranchId] = useState(null) // New state
  const [supplierAdvance, setSupplierAdvance] = useState(0)
  const [newPurchase, setNewPurchase] = useState({
    branch_id: '', supplier_id: '', produce_type: '', mould: '',
    weight_kg: '', price_per_kg: '', advance_applied: '', tools_consumed: ''
  })

  useEffect(() => { 
    loadData()
    getCurrentUserBranch() // Get user's branch on load
  }, [])

  async function getCurrentUserBranch() {
    const { data: profile } = await supabase
      .from('profiles')
      .select('branch_id')
      .eq('id', (await supabase.auth.getUser()).data.user.id)
      .single()
    
    if (profile?.branch_id) {
      setCurrentUserBranchId(profile.branch_id)
      // If not super admin, set their branch as default
      if (userRole !== 'super_admin') {
        setNewPurchase(prev => ({ ...prev, branch_id: profile.branch_id }))
        setFilterBranch(profile.branch_id) // Auto-filter to their branch
      }
    }
  }

  async function loadData() {
    const { data: suppliersData } = await supabase.from('suppliers').select('*').order('name')
    setSuppliers(suppliersData || [])
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])
    const { data: mouldsData } = await supabase.from('produce_moulds').select('*')
    setMoulds(mouldsData || [])
    const { data: purchasesData } = await supabase.from('purchases').select('*, suppliers (name), branches (name)').order('created_at', { ascending: false })
    setPurchases(purchasesData || [])
    setLoading(false)
  }

  async function checkSupplierAdvance(supplierId) {
    const { data: advances } = await supabase.from('advances').select('amount').eq('supplier_id', supplierId).eq('approval_status', 'approved')
    const { data: purchases } = await supabase.from('purchases').select('advance_applied').eq('supplier_id', supplierId)
    const totalAdvances = advances?.reduce((sum, a) => sum + parseFloat(a.amount), 0) || 0
    const totalApplied = purchases?.reduce((sum, p) => sum + parseFloat(p.advance_applied || 0), 0) || 0
    setSupplierAdvance(totalAdvances - totalApplied)
  }

  async function handleSavePurchase(e) {
    e.preventDefault()
    
    // Ensure branch_id is set
    const branchIdToUse = newPurchase.branch_id || currentUserBranchId || userBranchId
    if (!branchIdToUse) {
      alert('Error: No branch assigned. Please contact admin.')
      return
    }
    
    const grossTotal = parseFloat(newPurchase.weight_kg) * parseFloat(newPurchase.price_per_kg)
    const advanceApplied = parseFloat(newPurchase.advance_applied || 0)
    const netPayable = grossTotal - advanceApplied
    
    const purchaseData = {
      branch_id: branchIdToUse,
      supplier_id: newPurchase.supplier_id,
      produce_type: newPurchase.produce_type, mould: newPurchase.mould,
      weight_kg: parseFloat(newPurchase.weight_kg), price_per_kg: parseFloat(newPurchase.price_per_kg),
      gross_total: grossTotal, advance_applied: advanceApplied, net_payable: netPayable,
      tools_consumed: parseInt(newPurchase.tools_consumed || 0), date: new Date().toISOString().split('T')[0]
    }

    let error;
    if (editingId) {
      const res = await supabase.from('purchases').update(purchaseData).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('purchases').insert([purchaseData])
      error = res.error
    }

    if (!error) {
      setNewPurchase({ branch_id: '', supplier_id: '', produce_type: '', mould: '', weight_kg: '', price_per_kg: '', advance_applied: '', tools_consumed: '' })
      setEditingId(null); setSupplierAdvance(0); setShowForm(false); loadData()
      alert(editingId ? 'Purchase updated successfully!' : 'Purchase recorded successfully!')
    } else { alert('Error: ' + error.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this purchase? This cannot be undone.')) return
    
    const { error } = await supabase.from('purchases').delete().eq('id', id)
    if (!error) {
      alert('Purchase deleted successfully!')
      loadData()
    } else { alert('Error deleting: ' + error.message) }
  }

  function handleEdit(purchase) {
    setEditingId(purchase.id)
    setNewPurchase({
      branch_id: purchase.branch_id,
      supplier_id: purchase.supplier_id,
      produce_type: purchase.produce_type,
      mould: purchase.mould,
      weight_kg: purchase.weight_kg.toString(),
      price_per_kg: purchase.price_per_kg.toString(),
      advance_applied: purchase.advance_applied ? purchase.advance_applied.toString() : '',
      tools_consumed: purchase.tools_consumed ? purchase.tools_consumed.toString() : ''
    })
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  function handleSupplierChange(supplierId) {
    setNewPurchase({...newPurchase, supplier_id: supplierId})
    if (supplierId) checkSupplierAdvance(supplierId)
    else setSupplierAdvance(0)
  }

  const filteredPurchases = purchases.filter(p => {
    if (filterBranch === 'all') return true
    return p.branch_id === filterBranch
  })

  return (
    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Produce Purchases</h2>
        <button onClick={() => { setShowForm(!showForm); if(showForm) { setEditingId(null); setNewPurchase({ branch_id: currentUserBranchId || '', supplier_id: '', produce_type: '', mould: '', weight_kg: '', price_per_kg: '', advance_applied: '', tools_consumed: '' })} }} style={{ padding: '8px 15px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ Record Purchase'}
        </button>
      </div>

      {userRole === 'super_admin' && (
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Filter by Branch:</label>
          <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="all">All Branches</option>
            {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSavePurchase} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px', border: '2px solid #e67e22' }}>
          <h3 style={{ marginTop: 0, color: '#d35400' }}>{editingId ? 'Edit Purchase' : 'Record New Purchase'}</h3>
          
          {/* Only show branch dropdown for super admins */}
          {userRole === 'super_admin' && (
            <>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Branch *</label>
              <select value={newPurchase.branch_id} onChange={(e) => setNewPurchase({...newPurchase, branch_id: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
                <option value="">Select Branch</option>
                {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </>
          )}
          
          {/* For branch managers/clerks, show their branch name */}
          {userRole !== 'super_admin' && currentUserBranchId && (
            <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e8f6f3', borderRadius: '5px' }}>
              <strong>Branch:</strong> {branches.find(b => b.id === currentUserBranchId)?.name || 'Loading...'}
            </div>
          )}

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Supplier/Farmer *</label>
          <select value={newPurchase.supplier_id} onChange={(e) => handleSupplierChange(e.target.value)} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Supplier</option>
            {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
          </select>
          {supplierAdvance > 0 && !editingId && (
            <div style={{ padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px', marginBottom: '15px', borderLeft: '4px solid #f39c12' }}>
              <strong>️ Outstanding Advance:</strong> {supplierAdvance.toLocaleString()}
            </div>
          )}
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Produce Type *</label>
          <select value={newPurchase.produce_type} onChange={(e) => setNewPurchase({...newPurchase, produce_type: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Produce</option>
            <option value="Cocoa">Cocoa</option>
            <option value="Palm kernel">Palm kernel</option>
          </select>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mould/Grade *</label>
          <select value={newPurchase.mould} onChange={(e) => setNewPurchase({...newPurchase, mould: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Mould</option>
            {moulds.filter(m => m.produce_type === newPurchase.produce_type).map(m => (<option key={m.id} value={m.mould_name}>{m.mould_name}</option>))}
          </select>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Weight (kg) *</label>
          <input type="number" step="0.01" placeholder="Enter weight in kg" value={newPurchase.weight_kg} onChange={(e) => setNewPurchase({...newPurchase, weight_kg: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Price per kg (₦) *</label>
          <input type="number" step="0.01" placeholder="Enter price per kg" value={newPurchase.price_per_kg} onChange={(e) => setNewPurchase({...newPurchase, price_per_kg: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          <div style={{ padding: '12px', backgroundColor: '#e8f6f3', borderRadius: '5px', marginBottom: '15px' }}>
            <strong>Gross Total: ₦{(parseFloat(newPurchase.weight_kg || 0) * parseFloat(newPurchase.price_per_kg || 0)).toLocaleString()}</strong>
          </div>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Advance to Deduct (₦)</label>
          <input type="number" step="0.01" placeholder="Enter amount to deduct" value={newPurchase.advance_applied} onChange={(e) => setNewPurchase({...newPurchase, advance_applied: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Jute Bags Used</label>
          <input type="number" placeholder="Number of jute bags" value={newPurchase.tools_consumed} onChange={(e) => setNewPurchase({...newPurchase, tools_consumed: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
              {editingId ? 'Update Purchase' : 'Save Purchase'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setShowForm(false); }} style={{ padding: '12px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {loading ? <p>Loading...</p> : filteredPurchases.length === 0 ? <p>No purchases recorded yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredPurchases.map((purchase) => (
            <li key={purchase.id} style={{ padding: '12px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', borderLeft: '4px solid #e67e22' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <strong>{purchase.suppliers?.name}</strong><br/>
                  <small style={{ color: '#7f8c8d' }}>{purchase.produce_type} • {purchase.mould} • {purchase.weight_kg}kg</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#e67e22' }}>₦{parseFloat(purchase.gross_total).toLocaleString()}</div>
                  {purchase.advance_applied > 0 && (<div style={{ fontSize: '12px', color: '#e74c3c' }}>-₦{parseFloat(purchase.advance_applied).toLocaleString()} (advance)</div>)}
                  <div style={{ fontWeight: 'bold', color: '#27ae60' }}>₦{parseFloat(purchase.net_payable).toLocaleString()}</div>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#7f8c8d', borderTop: '1px solid #ecf0f1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{purchase.branches?.name} • Price: {parseFloat(purchase.price_per_kg).toLocaleString()}/kg {purchase.tools_consumed > 0 && ` • Bags: ${purchase.tools_consumed}`}</span>
                {(userRole === 'super_admin' || userRole === 'branch_manager') && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(purchase)} style={{ padding: '5px 10px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>✏️ Edit</button>
                    <button onClick={() => handleDelete(purchase.id)} style={{ padding: '5px 10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>🗑️ Delete</button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
