import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function ToolInventory({ userRole, userBranchId }) {
  const [inventory, setInventory] = useState([])
  const [branches, setBranches] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTool, setNewTool] = useState({
    branch_id: '',
    tool_name: 'Jute Bag',
    quantity: '',
    unit_cost: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    // Load branches
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])

    // Load inventory
    const { data: inventoryData } = await supabase
      .from('tools_inventory')
      .select(`
        *,
        branches (name, location)
      `)
      .order('branches(name)')
    
    setInventory(inventoryData || [])
  }

  async function handleAddTool(e) {
    e.preventDefault()
    
    const toolData = {
      branch_id: newTool.branch_id || userBranchId,
      tool_name: newTool.tool_name,
      quantity: parseInt(newTool.quantity),
      unit_cost: parseFloat(newTool.unit_cost || 0)
    }

    const { error } = await supabase.from('tool_procurements').insert([toolData])
    
    if (!error) {
      setNewTool({
        branch_id: '',
        tool_name: 'Jute Bag',
        quantity: '',
        unit_cost: ''
      })
      setShowAddForm(false)
      loadData()
      alert('Tool stock added successfully!\n\nThis will automatically update the branch inventory.')
    } else {
      alert('Error: ' + error.message)
    }
  }

  // Calculate total inventory value
  const totalValue = inventory.reduce((sum, item) => {
    return sum + (item.current_quantity * (item.unit_cost || 0))
  }, 0)

  // Count low stock items
  const lowStockItems = inventory.filter(item => item.current_quantity <= item.reorder_level)

  return (
    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Tool Inventory</h2>
        {userRole === 'super_admin' && (
          <button onClick={() => setShowAddForm(!showAddForm)} style={{ padding: '8px 15px', backgroundColor: '#16a085', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {showAddForm ? 'Cancel' : '+ Add Stock'}
          </button>
        )}
      </div>

      {showAddForm && (
        <form onSubmit={handleAddTool} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
          <h3 style={{ marginTop: 0, color: '#16a085' }}>Add Tool Stock (Procurement)</h3>
          
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tool Type</label>
          <select value={newTool.tool_name} onChange={(e) => setNewTool({...newTool, tool_name: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="Jute Bag">Jute Bag</option>
            <option value="Weighing Scale">Weighing Scale</option>
            <option value="Tarpaulin">Tarpaulin</option>
            <option value="Other">Other</option>
          </select>

          {userRole === 'super_admin' && (
            <>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Branch *</label>
              <select value={newTool.branch_id} onChange={(e) => setNewTool({...newTool, branch_id: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
                <option value="">Select Branch</option>
                {branches.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </>
          )}

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Quantity *</label>
          <input type="number" placeholder="Number of units" value={newTool.quantity} onChange={(e) => setNewTool({...newTool, quantity: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Unit Cost (₦)</label>
          <input type="number" step="0.01" placeholder="Cost per unit" value={newTool.unit_cost} onChange={(e) => setNewTool({...newTool, unit_cost: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Add Stock</button>
        </form>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ padding: '15px', backgroundColor: '#e8f6f3', borderRadius: '5px', borderLeft: '4px solid #16a085' }}>
          <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Total Inventory Value</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a085' }}>₦{totalValue.toLocaleString()}</div>
        </div>
        <div style={{ padding: '15px', backgroundColor: '#fef9e7', borderRadius: '5px', borderLeft: '4px solid #f39c12' }}>
          <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Low Stock Alerts</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f39c12' }}>{lowStockItems.length}</div>
        </div>
      </div>

      {/* Inventory List */}
      {inventory.length === 0 ? <p>No tools in inventory yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {inventory.map((item) => (
            <li key={item.id} style={{ 
              padding: '12px', 
              marginBottom: '8px', 
              backgroundColor: 'white', 
              borderRadius: '5px', 
              borderLeft: item.current_quantity <= item.reorder_level ? '4px solid #e74c3c' : '4px solid #16a085'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '16px' }}>{item.tool_name}</strong>
                  <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                    {item.branches?.name} {item.branches?.location && `• ${item.branches.location}`}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '24px', 
                    fontWeight: 'bold', 
                    color: item.current_quantity <= item.reorder_level ? '#e74c3c' : '#27ae60'
                  }}>
                    {item.current_quantity}
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>in stock</div>
                  {item.current_quantity <= item.reorder_level && (
                    <div style={{ fontSize: '11px', color: '#e74c3c', fontWeight: 'bold' }}>⚠️ Low Stock!</div>
                  )}
                </div>
              </div>
              {item.unit_cost > 0 && (
                <div style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '8px', borderTop: '1px solid #ecf0f1', paddingTop: '8px' }}>
                  Unit Cost: ₦{parseFloat(item.unit_cost).toLocaleString()} • Total Value: ₦{(item.current_quantity * item.unit_cost).toLocaleString()}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
