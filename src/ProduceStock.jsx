import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function ProduceStock({ userRole, userBranchId }) {
  const [stock, setStock] = useState([])
  const [transactions, setTransactions] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterBranch, setFilterBranch] = useState('all')
  const [showTransactions, setShowTransactions] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])
    
    const { data: stockData } = await supabase
      .from('produce_stock')
      .select('*, branches(name)')
      .order('branches(name)')
    setStock(stockData || [])
    
    const { data: txData } = await supabase
      .from('stock_transactions')
      .select('*, branches(name)')
      .order('created_at', { ascending: false })
      .limit(50)
    setTransactions(txData || [])
    
    setLoading(false)
  }

  const filteredStock = stock.filter(s => filterBranch === 'all' || s.branch_id === filterBranch)
  
  // Calculate totals
  const totalCocoa = filteredStock.filter(s => s.produce_type === 'Cocoa').reduce((sum, s) => sum + parseFloat(s.quantity_kg || 0), 0)
  const totalPalmKernel = filteredStock.filter(s => s.produce_type === 'Palm kernel').reduce((sum, s) => sum + parseFloat(s.quantity_kg || 0), 0)
  const totalValue = filteredStock.reduce((sum, s) => sum + (parseFloat(s.quantity_kg || 0) * parseFloat(s.average_cost_per_kg || 0)), 0)

  return (
    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Produce Stock Inventory</h2>
        <button 
          onClick={() => setShowTransactions(!showTransactions)}
          style={{ padding: '8px 15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          {showTransactions ? 'Hide Transactions' : '📋 View Transactions'}
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

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ padding: '15px', backgroundColor: '#e8f6f3', borderRadius: '5px', borderLeft: '4px solid #16a085' }}>
          <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Total Cocoa</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a085' }}>{(totalCocoa / 1000).toFixed(2)}T</div>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>({totalCocoa.toLocaleString()} kg)</div>
        </div>
        <div style={{ padding: '15px', backgroundColor: '#fef9e7', borderRadius: '5px', borderLeft: '4px solid #f39c12' }}>
          <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Total Palm Kernel</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f39c12' }}>{(totalPalmKernel / 1000).toFixed(2)}T</div>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>({totalPalmKernel.toLocaleString()} kg)</div>
        </div>
      </div>
      
      <div style={{ padding: '15px', backgroundColor: '#eaf2f8', borderRadius: '5px', marginBottom: '20px', borderLeft: '4px solid #3498db' }}>
        <div style={{ fontSize: '14px', color: '#7f8c8d' }}>Total Stock Value</div>
        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>₦{totalValue.toLocaleString()}</div>
      </div>

      {/* Stock List */}
      <h3 style={{ color: '#34495e', marginTop: '20px', marginBottom: '15px' }}>Current Stock Levels</h3>
      {filteredStock.length === 0 ? <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No stock recorded yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredStock.map((item) => (
            <li key={item.id} style={{ padding: '12px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', borderLeft: item.produce_type === 'Cocoa' ? '4px solid #16a085' : '4px solid #f39c12' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '16px' }}>{item.produce_type}</strong>
                  <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                    {item.mould} • {item.branches?.name}
                  </div>
                  <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '3px' }}>
                    Avg Cost: ₦{parseFloat(item.average_cost_per_kg || 0).toLocaleString()}/kg
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: 'bold', color: item.produce_type === 'Cocoa' ? '#16a085' : '#f39c12' }}>
                    {item.quantity_kg}kg
                  </div>
                  <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                    Value: ₦{(item.quantity_kg * (item.average_cost_per_kg || 0)).toLocaleString()}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Transactions */}
      {showTransactions && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Recent Stock Transactions</h3>
          {transactions.length === 0 ? <p>No transactions yet.</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {transactions.map((tx) => (
                <li key={tx.id} style={{ padding: '12px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', borderLeft: tx.transaction_type === 'purchase' ? '4px solid #27ae60' : tx.transaction_type === 'sale' ? '4px solid #e74c3c' : '4px solid #f39c12' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{tx.produce_type} • {tx.mould}</strong>
                      <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                        {tx.branches?.name} • {tx.date}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '18px', fontWeight: 'bold', color: tx.transaction_type === 'purchase' ? '#27ae60' : '#e74c3c' }}>
                        {tx.transaction_type === 'purchase' ? '+' : '-'}{Math.abs(tx.quantity_kg)}kg
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d', textTransform: 'capitalize' }}>
                        {tx.transaction_type}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
