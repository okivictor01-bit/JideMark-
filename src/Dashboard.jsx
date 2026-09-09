export default function Dashboard({ onNavigate, userRole, branchesCount }) {
  
  // Define all possible menu items and who is allowed to see them
  const allMenuItems = [
    { id: 'reports', title: 'Reports & Analytics', icon: '📊', color: '#2c3e50', full: true, allowed: ['super_admin', 'branch_manager'] },
    { id: 'stock', title: 'Produce Stock', icon: '🌾', color: '#16a085', allowed: ['super_admin', 'branch_manager'] },
    { id: 'team', title: 'Team', icon: '', color: '#27ae60', allowed: ['super_admin'] }, // Only Admin sees Team
    { id: 'suppliers', title: 'Suppliers', icon: '🧑‍', color: '#3498db', allowed: ['super_admin', 'branch_manager', 'clerk'] },
    { id: 'advances', title: 'Advances', icon: '💰', color: '#9b59b6', allowed: ['super_admin', 'branch_manager', 'clerk'] },
    { id: 'purchases', title: 'Purchases', icon: '🛒', color: '#e67e22', allowed: ['super_admin', 'branch_manager', 'clerk'] },
    { id: 'sales', title: 'Sales (Export)', icon: '💵', color: '#27ae60', allowed: ['super_admin', 'branch_manager', 'clerk'] },
    { id: 'inventory', title: 'Tools Inventory', icon: '🧰', color: '#16a085', allowed: ['super_admin', 'branch_manager'] },
    { id: 'transfers', title: 'Transfers', icon: '🔄', color: '#8e44ad', allowed: ['super_admin', 'branch_manager'] },
    { id: 'ledger', title: 'Cash Ledger', icon: '📒', color: '#2980b9', allowed: ['super_admin', 'branch_manager'] },
  ];

  // Filter the menu so users only see what they are allowed to see
  const menuItems = allMenuItems.filter(item => item.allowed.includes(userRole));

  // Dynamic Greeting
  let greeting = "User";
  if (userRole === 'super_admin') greeting = "Boss";
  else if (userRole === 'branch_manager') greeting = "Manager";
  else if (userRole === 'clerk') greeting = "Clerk";

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ backgroundColor: '#2c3e50', color: 'white', padding: '20px', borderRadius: '10px', marginBottom: '20px' }}>
        <h1 style={{ margin: '0 0 5px 0', fontSize: '24px' }}>JideMark</h1>
        <p style={{ margin: 0, opacity: 0.8 }}>Welcome back, {greeting}!</p>
        {userRole === 'super_admin' && (
          <div style={{ marginTop: '15px', fontSize: '14px', opacity: '0.9' }}>🏢 Active Branches: <strong>{branchesCount}</strong></div>
        )}
      </div>
      
      <h3 style={{ color: '#7f8c8d', marginBottom: '15px' }}>Main Menu</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
        {menuItems.map((item) => (
          <button key={item.id} onClick={() => onNavigate(item.id)} style={{
            backgroundColor: item.full ? '#34495e' : 'white', color: item.full ? 'white' : '#2c3e50',
            border: 'none', borderRadius: '12px', padding: '20px 10px', display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', boxShadow: item.full ? '0 4px 8px rgba(0,0,0,0.2)' : '0 2px 5px rgba(0,0,0,0.05)', cursor: 'pointer'
          }}>
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>{item.icon}</div>
            <div style={{ fontSize: item.full ? '16px' : '14px', fontWeight: 'bold', textAlign: 'center' }}>{item.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
