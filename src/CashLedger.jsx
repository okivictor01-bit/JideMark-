import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function CashLedger({ userRole }) {
  const [transactions, setTransactions] = useState([])
  const [branches, setBranches] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filterBranch, setFilterBranch] = useState('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [newTx, setNewTx] = useState({
    branch_id: '', transaction_type: 'inflow', category: 'owner_funding', amount: '', description: ''
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])

    // Load manual cash transactions
    const { data: txData } = await supabase
      .from('branch_cash_ledger')
      .select('*, branches(name)')
      .order('date', { ascending: false })
    
    // Load purchases (as outflows)
    const { data: purchasesData } = await supabase
      .from('purchases')
      .select('*, branches(name), suppliers(name)')
      .order('date', { ascending: false })
    
    // Load advances (as outflows)
    const { data: advancesData } = await supabase
      .from('advances')
      .select('*, branches(name), suppliers(name)')
      .eq('approval_status', 'approved')
      .order('date', { ascending: false })

    // Load sales (as inflows)
    const { data: salesData } = await supabase
      .from('sales')
      .select('*, branches(name)')
      .order('date', { ascending: false })

    // Combine all transactions
    const allTransactions = []
    
    txData?.forEach(tx => {
      allTransactions.push({
        id: tx.id,
        date: tx.date,
        branch_id: tx.branch_id,
        branch_name: tx.branches?.name,
        type: tx.transaction_type,
        category: tx.category,
        amount: parseFloat(tx.amount),
        description: tx.description || '',
        source: 'manual'
      })
    })

    purchasesData?.forEach(p => {
      allTransactions.push({
        id: p.id,
        date: p.date,
        branch_id: p.branch_id,
        branch_name: p.branches?.name,
        type: 'outflow',
        category: 'produce_purchase',
        amount: parseFloat(p.net_payable || 0),
        description: `Purchase: ${p.produce_type} ${p.mould} - ${p.weight_kg}kg from ${p.suppliers?.name}`,
        source: 'purchase'
      })
    })

    advancesData?.forEach(a => {
      allTransactions.push({
        id: a.id,
        date: a.date,
        branch_id: a.recorded_by_branch_id,
        branch_name: a.branches?.name,
        type: 'outflow',
        category: 'advance',
        amount: parseFloat(a.amount),
        description: `Advance to ${a.suppliers?.name}: ${a.owner_instruction_notes || ''}`,
        source: 'advance'
      })
    })

    salesData?.forEach(s => {
      allTransactions.push({
        id: s.id,
        date: s.date,
        branch_id: s.branch_id,
        branch_name: s.branches?.name,
        type: 'inflow',
        category: 'sales_revenue',
        amount: parseFloat(s.total_amount),
        description: `Sale: ${s.produce_type} ${s.mould} - ${s.weight_kg}kg to ${s.buyer_name}`,
        source: 'sale'
      })
    })

    // Sort by date descending
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))
    setTransactions(allTransactions)
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
      setShowForm(false); loadData()
      alert('Cash transaction recorded successfully!')
    } else { alert('Error: ' + error.message) }
  }

  // Apply filters
  const filteredTransactions = transactions.filter(tx => {
    if (filterBranch !== 'all' && tx.branch_id !== filterBranch) return false
    if (startDate && tx.date < startDate) return false
    if (endDate && tx.date > endDate) return false
    return true
  })

  // Calculate filtered totals per branch
  const branchBalances = branches.map(branch => {
    const branchTxs = filteredTransactions.filter(tx => tx.branch_id === branch.id)
    const inflow = branchTxs.filter(tx => tx.type === 'inflow').reduce((sum, tx) => sum + tx.amount, 0)
    const outflow = branchTxs.filter(tx => tx.type === 'outflow').reduce((sum, tx) => sum + tx.amount, 0)
    return { ...branch, inflow, outflow, balance: inflow - outflow }
  })

  const totalInflow = filteredTransactions.filter(tx => tx.type === 'inflow').reduce((sum, tx) => sum + tx.amount, 0)
  const totalOutflow = filteredTransactions.filter(tx => tx.type === 'outflow').reduce((sum, tx) => sum + tx.amount, 0)
  const netBalance = totalInflow - totalOutflow

  // Print function
  function handlePrint() {
    const printWindow = window.open('', '_blank')
    if (!printWindow) { alert('Please allow popups to print the report') ; return }
    
    let html = `
      <html>
      <head>
        <title>JideMark Cash Ledger Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #2c3e50; border-bottom: 3px solid #2c3e50; padding-bottom: 10px; }
          h2 { color: #34495e; margin-top: 30px; }
          .header { background: #2c3e50; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .summary { display: flex; gap: 15px; margin: 20px 0; }
          .summary-card { flex: 1; padding: 15px; border-radius: 5px; border-left: 4px solid; }
          .inflow { background: #d5f5e3; border-color: #27ae60; }
          .outflow { background: #fdedec; border-color: #e74c3c; }
          .balance { background: #eaf2f8; border-color: #3498db; }
          .amount { font-size: 24px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th { background: #2c3e50; color: white; padding: 10px; text-align: left; }
          td { padding: 10px; border-bottom: 1px solid #ddd; }
          tr:nth-child(even) { background: #f9f9f9; }
          .positive { color: #27ae60; font-weight: bold; }
          .negative { color: #e74c3c; font-weight: bold; }
          .footer { margin-top: 40px; text-align: center; color: #7f8c8d; font-size: 12px; border-top: 1px solid #ddd; padding-top: 10px; }
          @media print { body { padding: 10px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 style="color: white; border: none; margin: 0;">JideMark Cash Ledger Report</h1>
          <p style="margin: 5px 0 0 0;">Generated: ${new Date().toLocaleString()}</p>
          <p style="margin: 5px 0 0 0;">Period: ${startDate || 'All time'} to ${endDate || 'Present'}</p>
        </div>

        <div class="summary">
          <div class="summary-card inflow">
            <div>Total Inflow</div>
            <div class="amount positive">₦${totalInflow.toLocaleString()}</div>
          </div>
          <div class="summary-card outflow">
            <div>Total Outflow</div>
            <div class="amount negative">₦${totalOutflow.toLocaleString()}</div>
          </div>
          <div class="summary-card balance">
            <div>Net Balance</div>
            <div class="amount" style="color: ${netBalance >= 0 ? '#27ae60' : '#e74c3c'}">₦${netBalance.toLocaleString()}</div>
          </div>
        </div>

        <h2>Branch Balances</h2>
        <table>
          <tr><th>Branch</th><th>Inflow</th><th>Outflow</th><th>Balance</th></tr>
          ${branchBalances.map(b => `
            <tr>
              <td><strong>${b.name}</strong></td>
              <td class="positive">₦${b.inflow.toLocaleString()}</td>
              <td class="negative">₦${b.outflow.toLocaleString()}</td>
              <td style="color: ${b.balance >= 0 ? '#27ae60' : '#e74c3c'}; font-weight: bold;">₦${b.balance.toLocaleString()}</td>
            </tr>
          `).join('')}
        </table>

        <h2>Transaction Details (${filteredTransactions.length} transactions)</h2>
        <table>
          <tr><th>Date</th><th>Branch</th><th>Category</th><th>Description</th><th style="text-align: right;">Amount</th></tr>
          ${filteredTransactions.map(tx => `
            <tr>
              <td>${tx.date}</td>
              <td>${tx.branch_name}</td>
              <td>${tx.category.replace(/_/g, ' ').toUpperCase()}</td>
              <td>${tx.description}</td>
              <td style="text-align: right;" class="${tx.type === 'inflow' ? 'positive' : 'negative'}">
                ${tx.type === 'inflow' ? '+' : '-'}₦${tx.amount.toLocaleString()}
              </td>
            </tr>
          `).join('')}
        </table>

        <div class="footer">
          <p>JideMark Business Management System • Confidential Report</p>
        </div>
      </body>
      </html>
    `
    
    printWindow.document.write(html)
    printWindow.document.close()
    setTimeout(() => { printWindow.print() }, 500)
  }

  return (
    <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Branch Cash Ledger</h2>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {userRole === 'super_admin' && (
            <button onClick={() => setShowFilters(!showFilters)} style={{ padding: '8px 15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              {showFilters ? 'Hide Filters' : '🔍 Filter'}
            </button>
          )}
          <button onClick={handlePrint} style={{ padding: '8px 15px', backgroundColor: '#8e44ad', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            🖨️ Print Report
          </button>
          {userRole === 'super_admin' && (
            <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 15px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
              {showForm ? 'Cancel' : '+ Record Cash'}
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
          <h4 style={{ marginTop: 0, color: '#34495e' }}>Filter Transactions</h4>
          {userRole === 'super_admin' && (
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Branch</label>
              <select value={filterBranch} onChange={(e) => setFilterBranch(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
                <option value="all">All Branches</option>
                {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
            </div>
          </div>
          <button onClick={() => { setFilterBranch('all'); setStartDate(''); setEndDate(''); }} style={{ padding: '8px 15px', backgroundColor: '#95a5a6', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', width: '100%' }}>
            Clear All Filters
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ padding: '12px', backgroundColor: '#d5f5e3', borderRadius: '5px', borderLeft: '4px solid #27ae60' }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Total Inflow</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#27ae60' }}>₦{totalInflow.toLocaleString()}</div>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#fdedec', borderRadius: '5px', borderLeft: '4px solid #e74c3c' }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Total Outflow</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#e74c3c' }}>₦{totalOutflow.toLocaleString()}</div>
        </div>
        <div style={{ padding: '12px', backgroundColor: '#eaf2f8', borderRadius: '5px', borderLeft: '4px solid #3498db' }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Net Balance</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: netBalance >= 0 ? '#27ae60' : '#e74c3c' }}>₦{netBalance.toLocaleString()}</div>
        </div>
      </div>

      {/* Branch Balances */}
      {filterBranch === 'all' && (
        <div style={{ marginBottom: '20px' }}>
          <h3 style={{ color: '#34495e', marginTop: 0, marginBottom: '10px' }}>Branch Balances</h3>
          {branchBalances.map(branch => (
            <div key={branch.id} style={{ padding: '12px', backgroundColor: 'white', borderRadius: '5px', marginBottom: '8px', borderLeft: branch.balance >= 0 ? '4px solid #27ae60' : '4px solid #e74c3c' }}>
              <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>{branch.name}</h4>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#7f8c8d', marginBottom: '5px' }}>
                <span>Inflow: <strong style={{ color: '#27ae60' }}>₦{branch.inflow.toLocaleString()}</strong></span>
                <span>Outflow: <strong style={{ color: '#e74c3c' }}>₦{branch.outflow.toLocaleString()}</strong></span>
              </div>
              <div style={{ fontSize: '20px', fontWeight: 'bold', color: branch.balance >= 0 ? '#27ae60' : '#e74c3c' }}>
                Balance: ₦{branch.balance.toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manual Cash Form */}
      {showForm && (
        <form onSubmit={handleAddTx} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
          <h3 style={{ marginTop: 0, color: '#2980b9' }}>Record Cash Movement</h3>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Branch *</label>
          <select value={newTx.branch_id} onChange={(e) => setNewTx({...newTx, branch_id: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">Select Branch</option>
            {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Type *</label>
          <select value={newTx.transaction_type} onChange={(e) => setNewTx({...newTx, transaction_type: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="inflow">Inflow (Money In)</option>
            <option value="outflow">Outflow (Money Out)</option>
          </select>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Category *</label>
          <select value={newTx.category} onChange={(e) => setNewTx({...newTx, category: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
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
          <input type="number" placeholder="Enter amount" value={newTx.amount} onChange={(e) => setNewTx({...newTx, amount: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
          <input type="text" placeholder="Optional note" value={newTx.description} onChange={(e) => setNewTx({...newTx, description: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#2980b9', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Save Transaction</button>
        </form>
      )}

      {/* Transactions List */}
      <h3 style={{ color: '#34495e', marginTop: '20px' }}>Recent Transactions ({filteredTransactions.length})</h3>
      {filteredTransactions.length === 0 ? <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No transactions found for the selected filters.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredTransactions.map((tx) => (
            <li key={tx.id} style={{ padding: '12px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', borderLeft: tx.type === 'inflow' ? '4px solid #27ae60' : '4px solid #e74c3c' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ textTransform: 'capitalize', fontSize: '15px' }}>{tx.category.replace(/_/g, ' ')}</strong>
                  <div style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '3px' }}>{tx.branch_name} • {tx.date}</div>
                  {tx.description && <div style={{ fontSize: '12px', color: '#95a5a6', fontStyle: 'italic', marginTop: '3px' }}>{tx.description}</div>}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: tx.type === 'inflow' ? '#27ae60' : '#e74c3c', minWidth: '100px', textAlign: 'right' }}>
                  {tx.type === 'inflow' ? '+' : '-'}₦{tx.amount.toLocaleString()}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
