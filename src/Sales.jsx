import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Sales({ userRole, userBranchId }) {
  const [sales, setSales] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [filterBranch, setFilterBranch] = useState('all')
  const [newSale, setNewSale] = useState({ branch_id: '', produce_type: '', mould: '', weight_kg: '', price_per_kg: '', buyer_name: '' })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])
    const { data: salesData } = await supabase.from('sales').select('*, branches (name)').order('created_at', { ascending: false })
    setSales(salesData || [])
    setLoading(false)
  }

  async function handleAddSale(e) {
    e.preventDefault()
    const totalAmount = parseFloat(newSale.weight_kg) * parseFloat(newSale.price_per_kg)
    const saleData = {
      branch_id: newSale.branch_id || userBranchId,
      produce_type: newSale.produce_type, mould: newSale.mould,
      weight_kg: parseFloat(newSale.weight_kg), price_per_kg: parseFloat(newSale.price_per_kg),
      total_amount: totalAmount, buyer_name: newSale.buyer_name,
      date: new Date().toISOString().split('T')[0]
    }
    const { error } = await supabase.from('sales').insert([saleData])
    if (!error) {
      setNewSale({ branch_id: '', produce_type: '', mould: '', weight_kg: '', price_per_kg: '', buyer_name: '' })
      setShowForm(false); loadData()
      alert('Sale recorded successfully!')
    } else { alert('Error: ' + error.message) }
  }

  const filteredSales = sales.filter(s => filterBranch === 'all' || s.branch_id === filterBranch)

  return (
    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Sales to Exporters</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
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
        <form onSubmit={handleAddSale} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
          <h3 style={{ marginTop: 0, color: '#27ae60' }}>Record Sale to Exporter</h3>
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
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Selling Price per kg (₦) *</label>
          <input type="number" step="0.01" placeholder="Enter selling price" value={newSale.price_per_kg} onChange={(e) => setNewSale({...newSale, price_per_kg: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          <div style={{ padding: '12px', backgroundColor: '#d5f5e3', borderRadius: '5px', marginBottom: '15px', border: '2px solid #27ae60' }}>
            <h3 style={{ margin: 0, color: '#27ae60' }}>Total Sale Amount: ₦{(parseFloat(newSale.weight_kg || 0) * parseFloat(newSale.price_per_kg || 0)).toLocaleString()}</h3>
          </div>
          <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold' }}>Save Sale</button>
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
              <div style={{ fontSize: '13px', color: '#7f8c8d', borderTop: '1px solid #ecf0f1', paddingTop: '8px' }}>
                {sale.branches?.name} • {sale.date}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
