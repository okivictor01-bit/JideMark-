import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Purchases({ userRole, userBranchId }) {
  const [purchases, setPurchases] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [branches, setBranches] = useState([])
  const [moulds, setMoulds] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [supplierAdvance, setSupplierAdvance] = useState(0)
  const [newPurchase, setNewPurchase] = useState({
    branch_id: '',
    supplier_id: '',
    produce_type: '',
    mould: '',
    weight_kg: '',
    price_per_kg: '',
    advance_applied: '',
    tools_consumed: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    // Load suppliers
    const { data: suppliersData } = await supabase.from('suppliers').select('*').order('name')
    setSuppliers(suppliersData || [])

    // Load branches
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])

    // Load moulds
    const { data: mouldsData } = await supabase.from('produce_moulds').select('*')
    setMoulds(mouldsData || [])

    // Load purchases
    const { data: purchasesData } = await supabase
      .from('purchases')
      .select(`
        *,
        suppliers (name),
        branches (name)
      `)
      .order('created_at', { ascending: false })
    
    setPurchases(purchasesData || [])
    setLoading(false)
  }

  async function checkSupplierAdvance(supplierId) {
    // Get total advances given to this supplier
    const { data: advances } = await supabase
      .from('advances')
      .select('amount')
      .eq('supplier_id', supplierId)
      .eq('approval_status', 'approved')
    
    // Get total advances already applied to purchases
    const { data: purchases } = await supabase
      .from('purchases')
      .select('advance_applied')
      .eq('supplier_id', supplierId)
    
    const totalAdvances = advances?.reduce((sum, a) => sum + parseFloat(a.amount), 0) || 0
    const totalApplied = purchases?.reduce((sum, p) => sum + parseFloat(p.advance_applied || 0), 0) || 0
    
    setSupplierAdvance(totalAdvances - totalApplied)
  }

  async function handleAddPurchase(e) {
    e.preventDefault()
    
    const grossTotal = parseFloat(newPurchase.weight_kg) * parseFloat(newPurchase.price_per_kg)
    const advanceApplied = parseFloat(newPurchase.advance_applied || 0)
    const netPayable = grossTotal - advanceApplied

    const purchaseData = {
      branch_id: newPurchase.branch_id || userBranchId,
      supplier_id: newPurchase.supplier_id,
      produce_type: newPurchase.produce_type,
      mould: newPurchase.mould,
      weight_kg: parseFloat(newPurchase.weight_kg),
      price_per_kg: parseFloat(newPurchase.price_per_kg),
      gross_total: grossTotal,
      advance_applied: advanceApplied,
      net_payable: netPayable,
      tools_consumed: parseInt(newPurchase.tools_consumed || 0),
      date: new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase.from('purchases').insert([purchaseData])
    
    if (!error) {
      setNewPurchase({
        branch_id: '',
        supplier_id: '',
        produce_type: '',
        mould: '',
        weight_kg: '',
        price_per_kg: '',
        advance_applied: '',
        tools_consumed: ''
      })
      setSupplierAdvance(0)
      setShowForm(false)
      loadData()
      alert('Purchase recorded successfully!\n\nGross Total: ₦' + grossTotal.toLocaleString() + '\nAdvance Applied: ₦' + advanceApplied.toLocaleString() + '\nNet Payable: ₦' + netPayable.toLocaleString())
    } else {
      alert('Error: ' + error.message)
    }
  }

  function handleSupplierChange(supplierId) {
    setNewPurchase({...newPurchase, supplier_id: supplierId})
    if (supplierId) {
      checkSupplierAdvance(supplierId)
    } else {
      setSupplierAdvance(0)
    }
  }

  function handleMouldChange(mouldName) {
    setNewPurchase({...newPurchase, mould: mouldName})
    // Auto-fill price if mould has default price
    const selectedMould = moulds.find(m => m.mould_name === mouldName && m.produce_type === newPurchase.produce_type)
    if (selectedMould?.default_price_per_kg) {
      setNewPurchase(prev => ({...prev, price_per_kg: selectedMould.default_price_per_kg}))
    }
  }

  const grossTotal = parseFloat(newPurchase.weight_kg || 0) * parseFloat(newPurchase.price_per_kg || 0)
  const advanceApplied = parseFloat(newPurchase.advance_applied || 0)
  const netPayable = grossTotal - advanceApplied

  return (
    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Produce Purchases</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 15px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ Record Purchase'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleAddPurchase} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
          <h3 style={{ marginTop: 0, color: '#d35400' }}>Record New Purchase</h3>
          
          {userRole === 'super_admin' && (
            <>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Branch *</label>
              <select value={newPurchase.branch_id} onChange={(e) => setNewPurchase({...newPurchase, branch_id: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
                <option value="">Select Branch</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </>
          )}

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Supplier/Farmer *</label>
          <select value={newPurchase.supplier_id} onChange={(e) => handleSupplierChange(e.target.value)} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Supplier</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>

          {supplierAdvance > 0 && (
            <div style={{ padding: '10px', backgroundColor: '#fff3cd', borderRadius: '5px', marginBottom: '15px', borderLeft: '4px solid #f39c12' }}>
              <strong>⚠️ Outstanding Advance:</strong> ₦{supplierAdvance.toLocaleString()}
            </div>
          )}

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Produce Type *</label>
          <select value={newPurchase.produce_type} onChange={(e) => setNewPurchase({...newPurchase, produce_type: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Produce</option>
            <option value="Cocoa">Cocoa</option>
            <option value="Cashew">Cashew</option>
            <option value="Sesame">Sesame</option>
            <option value="Soybean">Soybean</option>
            <option value="Other">Other</option>
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mould/Grade *</label>
          <select value={newPurchase.mould} onChange={(e) => handleMouldChange(e.target.value)} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Mould</option>
            {moulds.filter(m => m.produce_type === newPurchase.produce_type).map(m => (
              <option key={m.id} value={m.mould_name}>{m.mould_name} {m.default_price_per_kg && `(${m.default_price_per_kg}/kg)`}</option>
            ))}
            <option value="Standard">Standard</option>
            <option value="Premium">Premium</option>
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Weight (kg) *</label>
          <input type="number" step="0.01" placeholder="Enter weight in kg" value={newPurchase.weight_kg} onChange={(e) => setNewPurchase({...newPurchase, weight_kg: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Price per kg (₦) *</label>
          <input type="number" step="0.01" placeholder="Enter price per kg" value={newPurchase.price_per_kg} onChange={(e) => setNewPurchase({...newPurchase, price_per_kg: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <div style={{ padding: '12px', backgroundColor: '#e8f6f3', borderRadius: '5px', marginBottom: '15px' }}>
            <strong>Gross Total: ₦{grossTotal.toLocaleString()}</strong>
          </div>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Advance to Deduct (₦)</label>
          <input type="number" step="0.01" placeholder="Enter amount to deduct from advance" value={newPurchase.advance_applied} onChange={(e) => setNewPurchase({...newPurchase, advance_applied: e.target.value})} max={supplierAdvance} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Jute Bags Used</label>
          <input type="number" placeholder="Number of jute bags consumed" value={newPurchase.tools_consumed} onChange={(e) => setNewPurchase({...newPurchase, tools_consumed: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <div style={{ padding: '15px', backgroundColor: '#d5f5e3', borderRadius: '5px', marginBottom: '15px', border: '2px solid #27ae60' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#27ae60' }}>Net Payable: ₦{netPayable.toLocaleString()}</h3>
            <small style={{ color: '#7f8c8d' }}>(Gross Total - Advance Applied)</small>
          </div>

          <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>Save Purchase</button>
        </form>
      )}

      {loading ? <p>Loading purchases...</p> : purchases.length === 0 ? <p>No purchases recorded yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {purchases.map((purchase) => (
            <li key={purchase.id} style={{ padding: '12px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', borderLeft: '4px solid #e67e22' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <strong>{purchase.suppliers?.name}</strong><br/>
                  <small style={{ color: '#7f8c8d' }}>{purchase.produce_type} • {purchase.mould} • {purchase.weight_kg}kg</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#e67e22' }}>₦{parseFloat(purchase.gross_total).toLocaleString()}</div>
                  {purchase.advance_applied > 0 && (
                    <div style={{ fontSize: '12px', color: '#e74c3c' }}>-₦{parseFloat(purchase.advance_applied).toLocaleString()} (advance)</div>
                  )}
                  <div style={{ fontWeight: 'bold', color: '#27ae60' }}>₦{parseFloat(purchase.net_payable).toLocaleString()}</div>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#7f8c8d', borderTop: '1px solid #ecf0f1', paddingTop: '8px' }}>
                {purchase.branches?.name} • Price: ₦{parseFloat(purchase.price_per_kg).toLocaleString()}/kg
                {purchase.tools_consumed > 0 && ` • Bags: ${purchase.tools_consumed}`}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
