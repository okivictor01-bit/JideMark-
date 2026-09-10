import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Dashboard from './Dashboard'
import Suppliers from './Suppliers'
import SupplierDetail from './SupplierDetail'
import Advances from './Advances'
import Purchases from './Purchases'
import Sales from './Sales'
import ToolInventory from './ToolInventory'
import ToolTransfers from './ToolTransfers'
import CashLedger from './CashLedger'
import Reports from './Reports'
import ProduceStock from './ProduceStock'
import ProduceTransfers from './ProduceTransfers' // NEW
import Team from './Team'

function App() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState('dashboard')
  const [selectedSupplierId, setSelectedSupplierId] = useState(null)
  const [newBranchName, setNewBranchName] = useState('')
  const [newBranchLocation, setNewBranchLocation] = useState('')

  useEffect(() => { checkUser() }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    const currentUser = session?.user
    if (!currentUser) { setLoading(false); return }
    setUser(currentUser)
    const { data: profile } = await supabase.from('profiles').select('role, branch_id').eq('id', currentUser.id).single()
    if (profile) {
      setUserRole(profile.role)
      // We can pass branch_id to components if needed, but for now we rely on the component fetching it or userBranchId prop
    }
    await getBranches()
    setLoading(false)
  }

  async function getBranches() {
    const { data, error } = await supabase.from('branches').select('*')
    if (!error) setBranches(data || [])
    setLoading(false)
  }

  async function handleAddBranch(e) {
    e.preventDefault()
    const { error } = await supabase.from('branches').insert([{ name: newBranchName, location: newBranchLocation, is_active: true }])
    if (!error) { setNewBranchName(''); setNewBranchLocation(''); getBranches(); alert('Branch added successfully!') }
    else { alert('Error: ' + error.message) }
  }

  async function handleLogout() { await supabase.auth.signOut(); setUser(null); setUserRole(null); setBranches([]); setCurrentView('dashboard') }
  function handleViewSupplier(id) { setSelectedSupplierId(id); setCurrentView('supplier-detail') }

  function PageWrapper({ children }) {
    return (
      <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={() => setCurrentView('dashboard')} style={{ padding: '8px 15px', backgroundColor: '#ecf0f1', color: '#2c3e50', border: 'none', borderRadius: '5px', cursor: 'pointer', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 'bold' }}>
          ⬅️ Back to Dashboard
        </button>
        {children}
      </div>
    )
  }

  if (!user) return <Login onLogin={() => checkUser()} />

  if (currentView === 'dashboard') {
    return (
      <div>
        {userRole === 'super_admin' && (
          <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h1 style={{ color: '#2c3e50', margin: 0 }}>JideMark</h1>
              <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Logout</button>
            </div>
            <p style={{ color: '#27ae60', marginBottom: '20px' }}>✅ Logged in as <strong>{user.email}</strong> ({userRole})</p>
            <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeeba' }}>
              <h3 style={{ marginTop: 0, color: '#856404' }}>Add New Branch</h3>
              <form onSubmit={handleAddBranch} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <input type="text" placeholder="Branch Name" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} required style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }} />
                <input type="text" placeholder="Location" value={newBranchLocation} onChange={(e) => setNewBranchLocation(e.target.value)} required style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }} />
                <button type="submit" style={{ padding: '10px', fontSize: '16px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Add Branch</button>
              </form>
            </div>
          </div>
        )}
        <Dashboard onNavigate={setCurrentView} userRole={userRole} branchesCount={branches.length} />
      </div>
    )
  }

  return (
    <PageWrapper>
      {currentView === 'reports' && <Reports userRole={userRole} />}
      {currentView === 'stock' && <ProduceStock userRole={userRole} userBranchId={null} />}
      {currentView === 'produce-transfer' && <ProduceTransfers userRole={userRole} />} {/* NEW ROUTE */}
      {currentView === 'team' && <Team userRole={userRole} />}
      {currentView === 'suppliers' && <Suppliers userRole={userRole} onViewSupplier={handleViewSupplier} />}
      {currentView === 'supplier-detail' && <SupplierDetail supplierId={selectedSupplierId} onBack={() => setCurrentView('suppliers')} />}
      {currentView === 'advances' && <Advances userRole={userRole} userBranchId={null} />}
      {currentView === 'purchases' && <Purchases userRole={userRole} userBranchId={null} />}
      {currentView === 'sales' && <Sales userRole={userRole} userBranchId={null} />}
      {currentView === 'inventory' && <ToolInventory userRole={userRole} userBranchId={null} />}
      {currentView === 'transfers' && <ToolTransfers userRole={userRole} />}
      {currentView === 'ledger' && <CashLedger userRole={userRole} />}
    </PageWrapper>
  )
}

export default App
