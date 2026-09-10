import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Suppliers({ userRole, userBranchId, onViewSupplier }) {
  const [suppliers, setSuppliers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', location: '', branch_id: '' })

  useEffect(() => { 
    getSuppliers()
    if (userRole === 'super_admin') {
      supabase.from('branches').select('*').then(({ data }) => setBranches(data || []))
    }
  }, [])

  async function getSuppliers() {
    // RLS will automatically filter this based on the user's role!
    const { data, error } = await supabase.from('suppliers').select('*, branches(name)').order('name')
    if (!error) setSuppliers(data || [])
    setLoading(false)
  }

  async function handleAddSupplier(e) {
    e.preventDefault()
    
    // Determine which branch ID to use
    const branchIdToUse = userRole === 'super_admin' ? newSupplier.branch_id : userBranchId

    if (!branchIdToUse && userRole !== 'super_admin') {
      alert('Error: You are not assigned to a branch.');
      return;
    }

    const supplierData = {
      name: newSupplier.name,
      phone: newSupplier.phone,
      location: newSupplier.location,
      branch_id: branchIdToUse
    }

    const { error } = await supabase.from('suppliers').insert([supplierData])
    if (!error) {
      setNewSupplier({ name: '', phone: '', location: '', branch_id: '' }); 
      setShowForm(false); 
      getSuppliers()
      alert('Supplier added successfully!')
    } else { alert('Error: ' + error.message) }
  }

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.phone.includes(searchTerm) || 
    (s.location && s.location.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Suppliers/Farmers</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ Add Supplier'}
        </button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <input type="text" placeholder="🔍 Search by name, phone, or location..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '100%', padding: '12px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box', fontSize: '16px' }} />
      </div>

      {showForm && (
        <form onSubmit={handleAddSupplier} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
          <h3 style={{ marginTop: 0 }}>Add New Supplier</h3>
          
          <input type="text" placeholder="Full Name" value={newSupplier.name} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          <input type="tel" placeholder="Phone Number" value={newSupplier.phone} onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          <input type="text" placeholder="Location" value={newSupplier.location} onChange={(e) => setNewSupplier({...newSupplier, location: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          
          {/* Only Super Admin sees the Branch dropdown */}
          {userRole === 'super_admin' && (
            <select value={newSupplier.branch_id} onChange={(e) => setNewSupplier({...newSupplier, branch_id: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
              <option value="">Select Branch for this Supplier</option>
              {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
            </select>
          )}

          {/* Show auto-assignment message for staff */}
          {userRole !== 'super_admin' && (
            <div style={{ padding: '10px', backgroundColor: '#e8f6f3', borderRadius: '5px', marginBottom: '10px', fontSize: '14px' }}>
               This supplier will be added to your branch.
            </div>
          )}

          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save Supplier</button>
        </form>
      )}

      {loading ? <p>Loading suppliers...</p> : filteredSuppliers.length === 0 ? <p>No suppliers found.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredSuppliers.map((supplier) => (
            <li key={supplier.id} onClick={() => onViewSupplier && onViewSupplier(supplier.id)} style={{ padding: '12px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', borderLeft: '4px solid #27ae60', cursor: 'pointer' }}>
              <strong>{supplier.name}</strong><br/>
              {supplier.phone && <span>📱 {supplier.phone}</span>}
              {supplier.location && <span> • {supplier.location}</span>}
              {/* Show branch name if super admin */}
              {userRole === 'super_admin' && supplier.branches && (
                <div style={{ fontSize: '12px', color: '#7f8c8d', marginTop: '5px' }}>🏢 {supplier.branches.name}</div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
