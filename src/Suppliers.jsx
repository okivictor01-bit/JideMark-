import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

// Added onViewSupplier prop
export default function Suppliers({ userRole, onViewSupplier }) {
  const [suppliers, setSuppliers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newSupplier, setNewSupplier] = useState({ name: '', phone: '', location: '' })

  useEffect(() => {
    getSuppliers()
  }, [])

  async function getSuppliers() {
    const { data, error } = await supabase.from('suppliers').select('*').order('name')
    if (!error) setSuppliers(data || [])
    setLoading(false)
  }

  async function handleAddSupplier(e) {
    e.preventDefault()
    const { error } = await supabase.from('suppliers').insert([newSupplier])
    if (!error) {
      setNewSupplier({ name: '', phone: '', location: '' })
      setShowForm(false)
      getSuppliers()
      alert('Supplier added successfully!')
    } else {
      alert('Error: ' + error.message)
    }
  }

  return (
    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Suppliers/Farmers</h2>
        {userRole === 'super_admin' && (
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {showForm ? 'Cancel' : '+ Add Supplier'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAddSupplier} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
          <h3 style={{ marginTop: 0 }}>Add New Supplier</h3>
          <input type="text" placeholder="Full Name" value={newSupplier.name} onChange={(e) => setNewSupplier({...newSupplier, name: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          <input type="tel" placeholder="Phone Number" value={newSupplier.phone} onChange={(e) => setNewSupplier({...newSupplier, phone: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          <input type="text" placeholder="Location" value={newSupplier.location} onChange={(e) => setNewSupplier({...newSupplier, location: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save Supplier</button>
        </form>
      )}

      {loading ? <p>Loading suppliers...</p> : suppliers.length === 0 ? <p>No suppliers yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {suppliers.map((supplier) => (
            <li 
              key={supplier.id} 
              onClick={() => onViewSupplier && onViewSupplier(supplier.id)}
              style={{ 
                padding: '12px', 
                marginBottom: '8px', 
                backgroundColor: 'white', 
                borderRadius: '5px', 
                borderLeft: '4px solid #27ae60',
                cursor: 'pointer' // Makes it look clickable
              }}
            >
              <strong>{supplier.name}</strong><br/>
              {supplier.phone && <span> {supplier.phone}</span>}
              {supplier.location && <span> • {supplier.location}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
