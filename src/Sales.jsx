import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Sales({ userRole, userBranchId }) {
  const [sales, setSales] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterBranch, setFilterBranch] = useState('all')
  const [editingId, setEditingId] = useState(null) // New state for editing
  const [newSale, setNewSale] = useState({ branch_id: '', produce_type: '', mould: '', weight_kg: '', price_per_kg: '', buyer_name: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])
    const { data: salesData } = await supabase.from('sales').select('*, branches (name)').order('created_at', { ascending: false })
    setSales(salesData || [])
    setLoading(false)
  }

  async function handleSaveSale(e) {
    e.preventDefault()
    const totalAmount = parseFloat(newSale.weight_kg) * parseFloat(newSale.price_per_kg)
    const saleData = {
      branch_id: newSale.branch_id || userBranchId,
      produce_type: newSale.produce_type, mould: newSale.mould,
      weight_kg: parseFloat(newSale.weight_kg), price_per_kg: parseFloat(newSale.price_per_kg),
      total_amount: totalAmount, buyer_name: newSale.buyer_name,
      date: new Date().toISOString().split('T')[0]
    }

    let error;
    if (editingId) {
      const res = await supabase.from('sales').update(saleData).eq('id', editingId)
      error = res.error
    } else {
      const res = await supabase.from('sales').insert([saleData])
      error = res.error
    }

    if (!error) {
      setNewSale({ branch_id: '', produce_type: '', mould: '', weight_kg: '', price_per_kg: '', buyer_name: '' })
      setEditingId(null); setShowForm(false); loadData()
      alert(editingId ? 'Sale updated successfully!' : 'Sale recorded successfully!')
    } else { alert('Error: ' + error.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Are you sure you want to delete this sale? This cannot be undone.')) return
    const { error } = await supabase.from('sales').delete().eq('id', id)
    if (!error) { alert('Sale deleted successfully!'); loadData() }
    else { alert('Error deleting: ' + error.message) }
  }

  function handleEdit(sale) {
    setEditingId(sale.id)
    setNewSale({
      branch_id: sale.branch_id, produce_type: sale.produce_type, mould: sale.mould,
      weight_kg: sale.weight_kg.toString(), price_per_kg: sale.price_per_kg.toString(),
      buyer_name: sale.buyer_name
    })
    setShowForm(true)
    window.scrollTo(0, 0)
  }

  const filteredSales = sales.filter(s => filterBranch === 'all' || s.branch_id === filterBranch)

  return (
    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Sales to Exporters</h2>
        <button onClick={() => { setShowForm(!showForm); if(showForm) { setEditingId(null); setNewSale({ branch_id: '', produce_type: '', mould: '', weight_kg: '', price_per_kg: '', buyer_name: '' })} }} style={{ padding: '8px 15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ Record Sale'}
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
        <form onSubmit={handleSaveSale} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px', border: '2px solid #27ae60' }}>
          <h3 style={{ marginTop: 0, color: '#27ae60' }}>{editingId ? 'Edit Sale' : 'Record Sale to Exporter'}</h3>
          {userRole === 'super_admin' && (
            <>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Branch *</label>
              <select value={newSale.branch_id} onChange={(e) => setNewSale({...newSale, branch_id: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
                <option value="">Select Branch</option>
                {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </>
          )}
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Exporter/Buyer Name *</label>
          <input type="text" placeholder="e.g., Lagos Export Co." value={newSale.buyer_name} onChange={(e) => setNewSale({...newSale, buyer_name: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Produce Type *</label>
          <select value={newSale.produce_type} onChange={(e) => setNewSale({...newSale, produce_type: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Produce</option>
            <option value="Cocoa">Cocoa</option>
            <option value="Palm kernel">Palm kernel</option>
          </select>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Mould/Grade *</label>
          <input type="text" placeholder="e.g., Grade A" value={newSale.mould} onChange={(e) => setNewSale({...newSale, mould: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Weight (kg) *</label>
          <input type="number" step="0.01" placeholder="Enter weight in kg" value={newSale.weight_kg} onChange={(e) => setNewSale({...newSale, weight_kg: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Selling Price per kg () *</label>
          <input type="number" step="0.01" placeholder="Enter selling price" value={newSale.price_per_kg} onChange={(e) => setNewSale({...newSale, price_per_kg: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          <div style={{ padding: '12px', backgroundColor: '#d5f5e3', borderRadius: '5px', marginBottom: '15px', border: '2px solid #27ae60' }}>
            <h3 style={{ margin: 0, color: '#27ae60' }}>Total Sale Amount: ₦{(parseFloat(newSale.weight_kg || 0) * parseFloat(newSale.price_per_kg || 0)).toLocaleString()}</h3>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" style={{ flex: 1, padding: '12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>
              {editingId ? 'Update Sale' : 'Save Sale'}
            </button>
            {editingId && (
              <button type="button" onClick={() => { setEditingId(null); setShowForm(false); }} style={{ padding: '12px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {loading ? <p>Loading sales...</p> : filteredSales.length === 0 ? <p>No sales recorded yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredSales.map((sale) => (
            <li key={sale.id} style={{ padding: '12px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', borderLeft: '4px solid #27ae60' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div>
                  <strong>{sale.buyer_name}</strong><br/>
                  <small style={{ color: '#7f8c8d' }}>{sale.produce_type} • {sale.mould} • {sale.weight_kg}kg</small>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: '#27ae60', fontSize: '18px' }}>₦{parseFloat(sale.total_amount).toLocaleString()}</div>
                  <small style={{ color: '#7f8c8d' }}>@ ₦{parseFloat(sale.price_per_kg).toLocaleString()}/kg</small>
                </div>
              </div>
              <div style={{ fontSize: '13px', color: '#7f8c8d', borderTop: '1px solid #ecf0f1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>{sale.branches?.name} • {sale.date}</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => handleEdit(sale)} style={{ padding: '5px 10px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>️ Edit</button>
                  <button onClick={() => handleDelete(sale.id)} style={{ padding: '5px 10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>️ Delete</button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
