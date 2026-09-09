import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function CashLedger({ userRole }) {
  const [transactions, setTransactions] = useState([])
  const [branches, setBranches] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [newTx, setNewTx] = useState({
    branch_id: '',
    transaction_type: 'inflow',
    category: 'owner_funding',
    amount: '',
    description: ''
  })

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])

    const { data: txData } = await supabase
      .from('branch_cash_ledger')
      .select(`
        *,
        branches (name)
      `)
      .order('date', { ascending: false })
    
    setTransactions(txData || [])
  }

  async function handleAddTx(e) {
    e.preventDefault()
    
    const txData = {
      branch_id: newTx.branch_id,
      transaction_type: newTx.transaction_type,
      category: newTx.category,
      amount: parseFloat(newTx.amount),
      description: newTx.description,
      date: new Date().toISOString().split('T')[0]
    }

    const { error } = await supabase.from('branch_cash_ledger').insert([txData])
    
    if (!error) {
      setNewTx({ branch_id: '', transaction_type: 'inflow', category: 'owner_funding', amount: '', description: '' })
      setShowForm(false)
      loadData()
      alert('Cash transaction recorded successfully!')
    } else {
      alert('Error: ' + error.message)
    }
  }

  // Calculate balance per branch
  const branchBalances = branches.map(branch => {
    const branchTxs = transactions.filter(tx => tx.branch_id === branch.id)
    const inflow = branchTxs.filter(tx => tx.transaction_type === 'inflow').reduce((sum, tx) => sum + tx.amount, 0)
    const outflow = branchTxs.filter(tx => tx.transaction_type === 'outflow').reduce((sum, tx) => sum + tx.amount, 0)
    return {
      ...branch,
      inflow,
      outflow,
      balance: inflow - outflow
    }
  })

  return (
    <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Branch Cash Ledger</h2>
        {userRole === 'super_admin' && (
          <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 15px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {showForm ? 'Cancel' : '+ Record Cash'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAddTx} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
          <h3 style={{ marginTop: 0, color: '#2980b9' }}>Record Cash Movement</h3>
          
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Branch *</label>
          <select value={newTx.branch_id} onChange={(e) => setNewTx({...newTx, branch_id: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Branch</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type *</label>
          <select value={newTx.transaction_type} onChange={(e) => setNewTx({...newTx, transaction_type: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="inflow">Inflow (Money In)</option>
            <option value="outflow">Outflow (Money Out)</option>
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category *</label>
          <select value={newTx.category} onChange={(e) => setNewTx({...newTx, category: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            {newTx.transaction_type === 'inflow' ? (
              <>
                <option value="owner_funding">Owner Funding</option>
                <option value="sales_revenue">Sales Revenue</option>
              </>
            ) : (
              <>
                <option value="local_expense">Local Expense</option>
                <option value="transport">Transport</option>
                <option value="other">Other</option>
              </>
            )}
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Amount (₦) *</label>
          <input type="number" placeholder="Enter amount" value={newTx.amount} onChange={(e) => setNewTx({...newTx, amount: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
          <input type="text" placeholder="Optional note" value={newTx.description} onChange={(e) => setNewTx({...newTx, description: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save Transaction</button>
        </form>
      )}

      {/* Branch Balance Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px', marginBottom: '20px' }}>
        {branchBalances.map(branch => (
          <div key={branch.id} style={{ padding: '15px', backgroundColor: 'white', borderRadius: '8px', borderLeft: branch.balance >= 0 ? '4px solid #27ae60' : '4px solid #e74c3c' }}>
            <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{branch.name}</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: '#7f8c8d', marginBottom: '10px' }}>
              <span>Inflow: <strong style={{ color: '#27ae60' }}>₦{branch.inflow.toLocaleString()}</strong></span>
              <span>Outflow: <strong style={{ color: '#e74c3c' }}>₦{branch.outflow.toLocaleString()}</strong></span>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: branch.balance >= 0 ? '#27ae60' : '#e74c3c' }}>
              Balance: ₦{branch.balance.toLocaleString()}
            </div>
          </div>
        ))}
      </div>

      {/* Recent Transactions */}
      <h3 style={{ color: '#34495e', marginTop: '20px' }}>Recent Transactions</h3>
      {transactions.length === 0 ? <p>No transactions recorded yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {transactions.slice(0, 10).map((tx) => (
            <li key={tx.id} style={{ 
              padding: '12px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', 
              borderLeft: tx.transaction_type === 'inflow' ? '4px solid #27ae60' : '4px solid #e74c3c'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ textTransform: 'capitalize' }}>{tx.category.replace('_', ' ')}</strong>
                  <div style={{ fontSize: '13px', color: '#7f8c8d' }}>{tx.branches?.name} • {tx.date}</div>
                  {tx.description && <div style={{ fontSize: '12px', color: '#95a5a6', fontStyle: 'italic' }}>{tx.description}</div>}
                </div>
                <div style={{ 
                  fontSize: '18px', fontWeight: 'bold', 
                  color: tx.transaction_type === 'inflow' ? '#27ae60' : '#e74c3c' 
                }}>
                  {tx.transaction_type === 'inflow' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
