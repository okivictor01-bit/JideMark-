import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function SupplierDetail({ supplierId, onBack }) {
  const [supplier, setSupplier] = useState(null)
  const [advances, setAdvances] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)
  
  // Date filter states
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    if (supplierId) loadData()
  }, [supplierId])

  async function loadData() {
    setLoading(true)
    
    // 1. Get Supplier Info
    const { data: supplierData } = await supabase.from('suppliers').select('*').eq('id', supplierId).single()
    setSupplier(supplierData)

    // 2. Get Advances for this supplier
    const { data: advancesData } = await supabase
      .from('advances')
      .select('*, branches(name)')
      .eq('supplier_id', supplierId)
      .eq('approval_status', 'approved')
      .order('date', { ascending: false })
    setAdvances(advancesData || [])

    // 3. Get Purchases for this supplier
    const { data: purchasesData } = await supabase
      .from('purchases')
      .select('*, branches(name)')
      .eq('supplier_id', supplierId)
      .order('date', { ascending: false })
    setPurchases(purchasesData || [])

    setLoading(false)
  }

  // Filter functions
  function filterByDate(item) {
    if (!startDate && !endDate) return true
    const itemDate = new Date(item.date)
    const start = startDate ? new Date(startDate) : null
    const end = endDate ? new Date(endDate) : null
    
    if (start && itemDate < start) return false
    if (end && itemDate > end) return false
    return true
  }

  const filteredAdvances = advances.filter(filterByDate)
  const filteredPurchases = purchases.filter(filterByDate)

  // Calculate totals for filtered data
  const totalAdvances = filteredAdvances.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0)
  const totalApplied = filteredPurchases.reduce((sum, p) => sum + parseFloat(p.advance_applied || 0), 0)
  const outstandingBalance = totalAdvances - totalApplied
  const totalPurchasedValue = filteredPurchases.reduce((sum, p) => sum + parseFloat(p.gross_total || 0), 0)

  // Export to CSV function
  function exportToCSV() {
    let csvContent = "data:text/csv;charset=utf-8,"
    
    // Add headers
    csvContent += "JideMark - Supplier Transaction Report\n"
    csvContent += `Supplier: ${supplier.name}\n`
    csvContent += `Phone: ${supplier.phone || 'N/A'}\n`
    csvContent += `Location: ${supplier.location || 'N/A'}\n`
    csvContent += `Report Period: ${startDate || 'All time'} to ${endDate || 'All time'}\n`
    csvContent += `Generated: ${new Date().toLocaleString()}\n\n`
    
    // Add summary
    csvContent += "SUMMARY\n"
    csvContent += `Total Advances,₦${totalAdvances.toLocaleString()}\n`
    csvContent += `Total Applied,₦${totalApplied.toLocaleString()}\n`
    csvContent += `Outstanding Balance,₦${outstandingBalance.toLocaleString()}\n`
    csvContent += `Total Purchases,₦${totalPurchasedValue.toLocaleString()}\n\n`
    
    // Add advances header
    csvContent += "ADVANCES GIVEN\n"
    csvContent += "Date,Amount,Method,Branch,Notes\n"
    
    filteredAdvances.forEach(adv => {
      const row = [
        adv.date,
        adv.amount,
        adv.method,
        adv.funding_source === 'branch_cash' ? adv.branches?.name : 'Owner Funds',
        `"${adv.owner_instruction_notes || ''}"`
      ].join(",")
      csvContent += row + "\n"
    })
    
    csvContent += "\nPURCHASES MADE\n"
    csvContent += "Date,Produce,Mould,Weight(kg),Price/kg,Gross Total,Advance Applied,Net Payable,Branch\n"
    
    filteredPurchases.forEach(p => {
      const row = [
        p.date,
        p.produce_type,
        p.mould,
        p.weight_kg,
        p.price_per_kg,
        p.gross_total,
        p.advance_applied || 0,
        p.net_payable,
        p.branches?.name
      ].join(",")
      csvContent += row + "\n"
    })

    // Create download link
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `${supplier.name.replace(/\s+/g, '_')}_Transactions_${startDate || 'All'}_${endDate || 'All'}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading || !supplier) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading supplier details...</div>
  }

  return (
    <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      
      {/* Supplier Header */}
      <div style={{ backgroundColor: '#2c3e50', color: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '22px' }}>{supplier.name}</h2>
        {supplier.phone && <p style={{ margin: '5px 0', opacity: 0.9 }}>📱 {supplier.phone}</p>}
        {supplier.location && <p style={{ margin: '5px 0', opacity: 0.9 }}>📍 {supplier.location}</p>}
      </div>

      {/* Filter Controls */}
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={() => setShowFilters(!showFilters)}
          style={{ 
            padding: '10px 15px', 
            backgroundColor: '#3498db', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer',
            marginBottom: '10px',
            marginRight: '10px'
          }}
        >
          {showFilters ? 'Hide Filters' : '📅 Filter by Date'}
        </button>
        
        <button 
          onClick={exportToCSV}
          style={{ 
            padding: '10px 15px', 
            backgroundColor: '#27ae60', 
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer',
            marginBottom: '10px'
          }}
        >
          📥 Download CSV
        </button>

        {showFilters && (
          <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '5px', marginTop: '10px' }}>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Start Date</label>
              <input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}
              />
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>End Date</label>
              <input 
                type="date" 
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}
              />
            </div>
            <button 
              onClick={() => { setStartDate(''); setEndDate(''); }}
              style={{ 
                padding: '8px 15px', 
                backgroundColor: '#95a5a6', 
                color: 'white', 
                border: 'none', 
                borderRadius: '5px', 
                cursor: 'pointer',
                width: '100%'
              }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Financial Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ padding: '15px', backgroundColor: '#fdedec', borderRadius: '8px', borderLeft: '4px solid #e74c3c' }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Outstanding Advance</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c' }}>₦{outstandingBalance.toLocaleString()}</div>
        </div>
        <div style={{ padding: '15px', backgroundColor: '#e8f6f3', borderRadius: '8px', borderLeft: '4px solid #16a085' }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Total Purchases</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a085' }}>{totalPurchasedValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Advances Section */}
      <h3 style={{ color: '#34495e', borderBottom: '2px solid #9b59b6', paddingBottom: '5px', marginBottom: '15px' }}>💰 Advances Given ({filteredAdvances.length})</h3>
      {filteredAdvances.length === 0 ? <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No advances recorded{startDate && ' for this period'}.</p> : (
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '30px' }}>
          {filteredAdvances.map((adv) => (
            <li key={adv.id} style={{ padding: '12px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', borderLeft: '4px solid #9b59b6' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <strong style={{ fontSize: '16px', color: '#2c3e50' }}>₦{parseFloat(adv.amount).toLocaleString()}</strong>
                  <div style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '3px' }}>
                    {adv.method} • {adv.funding_source === 'branch_cash' ? adv.branches?.name : 'Owner Funds'}
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#95a5a6', textAlign: 'right' }}>
                  {adv.date}
                </div>
              </div>
              {adv.owner_instruction_notes && (
                <div style={{ fontSize: '12px', color: '#7f8c8d', fontStyle: 'italic', marginTop: '5px', borderTop: '1px solid #ecf0f1', paddingTop: '5px' }}>
                  📝 {adv.owner_instruction_notes}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Purchases Section */}
      <h3 style={{ color: '#34495e', borderBottom: '2px solid #e67e22', paddingBottom: '5px', marginBottom: '15px' }}> Purchases Made ({filteredPurchases.length})</h3>
      {filteredPurchases.length === 0 ? <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No purchases recorded{startDate && ' for this period'}.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredPurchases.map((p) => (
            <li key={p.id} style={{ padding: '12px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', borderLeft: '4px solid #e67e22' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '15px', color: '#2c3e50' }}>{p.produce_type} • {p.mould}</strong>
                  <div style={{ fontSize: '13px', color: '#7f8c8d', marginTop: '3px' }}>
                    {p.weight_kg}kg @ ₦{parseFloat(p.price_per_kg).toLocaleString()}/kg
                  </div>
                  <div style={{ fontSize: '12px', color: '#95a5a6', marginTop: '3px' }}>
                    {p.branches?.name} • {p.date}
                  </div>
                </div>
                <div style={{ textAlign: 'right', minWidth: '80px' }}>
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#e67e22' }}>₦{parseFloat(p.gross_total).toLocaleString()}</div>
                  {p.advance_applied > 0 && (
                    <div style={{ fontSize: '11px', color: '#e74c3c' }}>-₦{parseFloat(p.advance_applied).toLocaleString()}</div>
                  )}
                  <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#27ae60', marginTop: '2px' }}>₦{parseFloat(p.net_payable).toLocaleString()}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
