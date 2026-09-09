import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function SupplierDetail({ supplierId, onBack }) {
  const [supplier, setSupplier] = useState(null)
  const [advances, setAdvances] = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading] = useState(true)

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

  if (loading || !supplier) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading supplier details...</div>
  }

  // Calculate totals
  const totalAdvances = advances.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0)
  const totalApplied = purchases.reduce((sum, p) => sum + parseFloat(p.advance_applied || 0), 0)
  const outstandingBalance = totalAdvances - totalApplied
  const totalPurchasedValue = purchases.reduce((sum, p) => sum + parseFloat(p.gross_total || 0), 0)

  return (
    <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      
      {/* Supplier Header */}
      <div style={{ backgroundColor: '#2c3e50', color: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 5px 0', fontSize: '22px' }}>{supplier.name}</h2>
        {supplier.phone && <p style={{ margin: '5px 0', opacity: 0.9 }}>📱 {supplier.phone}</p>}
        {supplier.location && <p style={{ margin: '5px 0', opacity: 0.9 }}>📍 {supplier.location}</p>}
      </div>

      {/* Financial Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
        <div style={{ padding: '15px', backgroundColor: '#fdedec', borderRadius: '8px', borderLeft: '4px solid #e74c3c' }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Outstanding Advance</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c' }}>₦{outstandingBalance.toLocaleString()}</div>
        </div>
        <div style={{ padding: '15px', backgroundColor: '#e8f6f3', borderRadius: '8px', borderLeft: '4px solid #16a085' }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d' }}>Total Purchases</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#16a085' }}>₦{totalPurchasedValue.toLocaleString()}</div>
        </div>
      </div>

      {/* Advances Section */}
      <h3 style={{ color: '#34495e', borderBottom: '2px solid #9b59b6', paddingBottom: '5px', marginBottom: '15px' }}>💰 Advances Given</h3>
      {advances.length === 0 ? <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No advances recorded.</p> : (
        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '30px' }}>
          {advances.map((adv) => (
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
      <h3 style={{ color: '#34495e', borderBottom: '2px solid #e67e22', paddingBottom: '5px', marginBottom: '15px' }}> Purchases Made</h3>
      {purchases.length === 0 ? <p style={{ color: '#7f8c8d', fontStyle: 'italic' }}>No purchases recorded.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {purchases.map((p) => (
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
