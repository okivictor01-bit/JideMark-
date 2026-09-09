import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Suppliers from './Suppliers'
import Advances from './Advances'
import Purchases from './Purchases'
import ToolInventory from './ToolInventory'
import ToolTransfers from './ToolTransfers'

function App() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [newBranchName, setNewBranchName] = useState('')
  const [newBranchLocation, setNewBranchLocation] = useState('')

  useEffect(() => {
    checkUser()
  }, [])

  async function checkUser() {
    const { data: { session } } = await supabase.auth.getSession()
    const currentUser = session?.user
    
    if (!currentUser) {
      setLoading(false)
      return
    }
    
    setUser(currentUser)
    
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()
    
    if (profile) setUserRole(profile.role)
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
    const { error } = await supabase
      .from('branches')
      .insert([{ name: newBranchName, location: newBranchLocation, is_active: true }])
    
    if (!error) {
      setNewBranchName('')
      setNewBranchLocation('')
      getBranches()
      alert('Branch added successfully!')
    } else {
      alert('Error: ' + error.message)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    setBranches([])
  }

  if (!user) {
    return <Login onLogin={() => checkUser()} />
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      
      {/* --- HEADER --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>JideMark</h1>
        <button onClick={handleLogout} style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      
      <p style={{ color: '#27ae60', marginBottom: '20px' }}>
        ✅ Logged in as <strong>{user.email}</strong> ({userRole})
      </p>
      
      {/* --- ADD BRANCH FORM (Admin Only) --- */}
      {userRole === 'super_admin' && (
        <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeeba' }}>
          <h3 style={{ marginTop: 0, color: '#856404' }}>Add New Branch</h3>
          <form onSubmit={handleAddBranch} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input type="text" placeholder="Branch Name" value={newBranchName} onChange={(e) => setNewBranchName(e.target.value)} required style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }} />
            <input type="text" placeholder="Location" value={newBranchLocation} onChange={(e) => setNewBranchLocation(e.target.value)} required style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }} />
            <button type="submit" style={{ padding: '10px', fontSize: '16px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Add Branch</button>
          </form>
        </div>
      )}

      {/* --- BRANCHES LIST --- */}
      <div style={{ marginBottom: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h2 style={{ color: '#34495e', marginTop: 0 }}>All Branches ({branches.length})</h2>
        {loading ? <p>Loading...</p> : branches.length === 0 ? <p>No branches found yet.</p> : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {branches.map((branch) => (
              <li key={branch.id} style={{ padding: '12px', marginBottom: '8px', backgroundColor: 'white', borderRadius: '5px', borderLeft: '4px solid #3498db' }}>
                <strong>{branch.name}</strong> - {branch.location}
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* --- SECTIONS --- */}
      <Suppliers userRole={userRole} />
      <Advances userRole={userRole} userBranchId={null} />
      <Purchases userRole={userRole} userBranchId={null} />
      <ToolInventory userRole={userRole} userBranchId={null} />
      <ToolTransfers userRole={userRole} />

    </div>
  )
}

export default App
