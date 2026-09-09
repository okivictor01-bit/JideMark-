import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Reports({ userRole }) {
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSpent: 0,
    totalWeight: 0,
    outstandingAdvances: 0,
    totalInventoryValue: 0,
    totalBranches: 0,
    totalSuppliers: 0,
    cocoaPurchases: 0,
    palmKernelPurchases: 0,
    // New sales stats
    totalSales: 0,
    totalRevenue: 0,
    totalSoldWeight: 0,
    cocoaSales: 0,
    palmKernelSales: 0,
    profit: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadReports()
  }, [])

  async function loadReports() {
    setLoading(true)

    // 1. Total Purchases & Weight
    const { data: purchases } = await supabase.from('purchases').select('*')
    const totalPurchases = purchases?.length || 0
    const totalSpent = purchases?.reduce((sum, p) => sum + parseFloat(p.net_payable || 0), 0) || 0
    const totalWeight = purchases?.reduce((sum, p) => sum + parseFloat(p.weight_kg || 0), 0) || 0
    const cocoaPurchases = purchases?.filter(p => p.produce_type === 'Cocoa').length || 0
    const palmKernelPurchases = purchases?.filter(p => p.produce_type === 'Palm kernel').length || 0

    // 2. Outstanding Advances
    const { data: advances } = await supabase
      .from('advances')
      .select('amount')
      .eq('approval_status', 'approved')
    
    const totalAdvances = advances?.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0) || 0
    
    const { data: appliedAdvances } = await supabase
      .from('purchases')
      .select('advance_applied')
    
    const totalApplied = appliedAdvances?.reduce((sum, p) => sum + parseFloat(p.advance_applied || 0), 0) || 0
    const outstandingAdvances = totalAdvances - totalApplied

    // 3. Inventory Value
    const { data: inventory } = await supabase.from('tools_inventory').select('*')
    const totalInventoryValue = inventory?.reduce((sum, item) => {
      return sum + (item.current_quantity * (item.unit_cost || 0))
    }, 0) || 0

    // 4. Total Branches
    const { data: branches } = await supabase.from('branches').select('*')
    const totalBranches = branches?.length || 0

    // 5. Total Suppliers
    const { data: suppliers } = await supabase.from('suppliers').select('*')
    const totalSuppliers = suppliers?.length || 0

    // 6. Sales Data (NEW)
    const { data: sales } = await supabase.from('sales').select('*')
    const totalSales = sales?.length || 0
    const totalRevenue = sales?.reduce((sum, s) => sum + parseFloat(s.total_amount || 0), 0) || 0
    const totalSoldWeight = sales?.reduce((sum, s) => sum + parseFloat(s.weight_kg || 0), 0) || 0
    const cocoaSales = sales?.filter(s => s.produce_type === 'Cocoa').length || 0
    const palmKernelSales = sales?.filter(s => s.produce_type === 'Palm kernel').length || 0

    // 7. Profit Calculation
    const profit = totalRevenue - totalSpent

    setStats({
      totalPurchases,
      totalSpent,
      totalWeight,
      outstandingAdvances,
      totalInventoryValue,
      totalBranches,
      totalSuppliers,
      cocoaPurchases,
      palmKernelPurchases,
      totalSales,
      totalRevenue,
      totalSoldWeight,
      cocoaSales,
      palmKernelSales,
      profit
    })

    setLoading(false)
  }

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading reports...</div>
  }

  return (
    <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <h2 style={{ color: '#34495e', marginTop: 0, marginBottom: '20px' }}>📊 Business Reports</h2>

      {/* Key Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '25px' }}>
        <div style={{ padding: '15px', backgroundColor: '#e8f6f3', borderRadius: '8px', borderLeft: '4px solid #16a085' }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '5px' }}>Total Purchases</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a085' }}>{stats.totalPurchases}</div>
        </div>
        <div style={{ padding: '15px', backgroundColor: '#fef9e7', borderRadius: '8px', borderLeft: '4px solid #f39c12' }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '5px' }}>Total Spent</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#f39c12' }}>{(stats.totalSpent / 1000000).toFixed(2)}M</div>
        </div>
        <div style={{ padding: '15px', backgroundColor: '#eaf2f8', borderRadius: '8px', borderLeft: '4px solid #3498db' }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '5px' }}>Total Weight Bought</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>{(stats.totalWeight / 1000).toFixed(1)}T</div>
        </div>
        <div style={{ padding: '15px', backgroundColor: '#fdedec', borderRadius: '8px', borderLeft: '4px solid #e74c3c' }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '5px' }}>Outstanding Advances</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#e74c3c' }}>₦{(stats.outstandingAdvances / 1000).toFixed(0)}K</div>
        </div>
      </div>

      {/* Sales Metrics (NEW) */}
      <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>💰 Sales Performance</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '25px' }}>
        <div style={{ padding: '15px', backgroundColor: '#d5f5e3', borderRadius: '8px', borderLeft: '4px solid #27ae60' }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '5px' }}>Total Sales</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#27ae60' }}>{stats.totalSales}</div>
        </div>
        <div style={{ padding: '15px', backgroundColor: '#d5f5e3', borderRadius: '8px', borderLeft: '4px solid #27ae60' }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '5px' }}>Total Revenue</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#27ae60' }}>{(stats.totalRevenue / 1000000).toFixed(2)}M</div>
        </div>
        <div style={{ padding: '15px', backgroundColor: '#eaf2f8', borderRadius: '8px', borderLeft: '4px solid #3498db' }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '5px' }}>Total Weight Sold</div>
          <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#3498db' }}>{(stats.totalSoldWeight / 1000).toFixed(1)}T</div>
        </div>
        <div style={{ padding: '15px', backgroundColor: stats.profit >= 0 ? '#d5f5e3' : '#fdedec', borderRadius: '8px', borderLeft: `4px solid ${stats.profit >= 0 ? '#27ae60' : '#e74c3c'}` }}>
          <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '5px' }}>Profit/Loss</div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: stats.profit >= 0 ? '#27ae60' : '#e74c3c' }}>
            {stats.profit >= 0 ? '+' : ''}₦{(stats.profit / 1000).toFixed(0)}K
          </div>
        </div>
      </div>

      {/* Detailed Stats */}
      <h3 style={{ color: '#2c3e50', marginBottom: '15px' }}>📈 Detailed Statistics</h3>
      
      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#34495e' }}>Purchases Breakdown</h4>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span> Cocoa</span>
            <strong>{stats.cocoaPurchases} purchases</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>🌴 Palm Kernel</span>
            <strong>{stats.palmKernelPurchases} purchases</strong>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#34495e' }}>Sales Breakdown</h4>
        <div style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <span>🍫 Cocoa</span>
            <strong>{stats.cocoaSales} sales</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span> Palm Kernel</span>
            <strong>{stats.palmKernelSales} sales</strong>
          </div>
        </div>
      </div>

      <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '15px', marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 15px 0', color: '#34495e' }}>Business Overview</h4>
        <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ecf0f1' }}>
          <span>🏢 Active Branches</span>
          <strong>{stats.totalBranches}</strong>
        </div>
        <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ecf0f1' }}>
          <span>👥 Registered Suppliers</span>
          <strong>{stats.totalSuppliers}</strong>
        </div>
        <div style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #ecf0f1' }}>
          <span>📦 Tools Inventory Value</span>
          <strong>₦{stats.totalInventoryValue.toLocaleString()}</strong>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0' }}>
          <span>💵 Avg. per Purchase</span>
          <strong>₦{stats.totalPurchases > 0 ? Math.round(stats.totalSpent / stats.totalPurchases).toLocaleString() : 0}</strong>
        </div>
      </div>

      {/* Quick Summary */}
      <div style={{ backgroundColor: '#2c3e50', color: 'white', borderRadius: '8px', padding: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0' }}>📝 Quick Summary</h4>
        <p style={{ margin: '0', fontSize: '14px', lineHeight: '1.6' }}>
          JideMark has made <strong>{stats.totalPurchases} purchases</strong> totaling <strong>₦{stats.totalSpent.toLocaleString()}</strong> 
          across {stats.totalBranches} branches. Sold <strong>{stats.totalSales} times</strong> generating <strong>₦{stats.totalRevenue.toLocaleString()}</strong> in revenue.
          Current profit: <strong style={{ color: stats.profit >= 0 ? '#2ecc71' : '#e74c3c' }}>₦{stats.profit.toLocaleString()}</strong>.
          Holding <strong>₦{stats.totalInventoryValue.toLocaleString()}</strong> in tools inventory with <strong>₦{stats.outstandingAdvances.toLocaleString()}</strong> in outstanding advances.
        </p>
      </div>

      <button 
        onClick={loadReports}
        style={{ 
          width: '100%', 
          marginTop: '20px', 
          padding: '12px', 
          backgroundColor: '#3498db', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px', 
          cursor: 'pointer',
          fontSize: '16px',
          fontWeight: 'bold'
        }}
      >
        🔄 Refresh Data
      </button>
    </div>
  )
}
