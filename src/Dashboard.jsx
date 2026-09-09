export default function Dashboard({ onNavigate, userRole, branchesCount }) {
  const menuItems = [
    { id: 'reports', title: 'Reports & Analytics', icon: '📊', color: '#2c3e50', full: true },
    { id: 'suppliers', title: 'Suppliers', icon: '👥', color: '#3498db' },
    { id: 'advances', title: 'Advances', icon: '💰', color: '#9b59b6' },
    { id: 'purchases', title: 'Purchases', icon: '', color: '#e67e22' },
    { id: 'inventory', title: 'Inventory', icon: '', color: '#16a085' },
    { id: 'transfers', title: 'Transfers', icon: '🔄', color: '#8e44ad' },
    { id: 'ledger', title: 'Cash Ledger', icon: '', color: '#2980b9' },
  ];

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#2c3e50', color: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>JideMark</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>Welcome back, {userRole === 'super_admin' ? 'Boss' : 'Manager'}!</p>
        <div style={{ marginTop: '15px', fontSize: '14px', opacity: 0.9 }}>
           Active Branches: <strong>{branchesCount}</strong>
        </div>
      </div>

      <h3 style={{ color: '#7f8c8d', marginBottom: '15px' }}>Main Menu</h3>
      
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            style={{
              backgroundColor: item.full ? '#34495e' : 'white',
              color: item.full ? 'white' : '#2c3e50',
              border: 'none',
              borderRadius: '12px',
              padding: item.full ? '20px 10px' : '20px 10px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: item.full ? '0 4px 8px rgba(0,0,0,0.2)' : '0 2px 5px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'transform 0.1s'
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>{item.icon}</div>
            <div style={{ fontSize: item.full ? '16px' : '14px', fontWeight: 'bold', textAlign: 'center' }}>{item.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
