import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'

function App() {
  const [user, setUser] = useState(null)
  const [userRole, setUserRole] = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState('')
  
  // Form states for adding a branch
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
    setDebugInfo(`User ID: ${currentUser.id}`)
    
    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', currentUser.id)
      .single()
    
    if (profileError) {
      setDebugInfo(prev => prev + `\nProfile Error: ${profileError.message}`)
    } else if (profile) {
      setUserRole(profile.role)
      setDebugInfo(prev => prev + `\nRole: ${profile.role}`)
    }
    
    // Fetch branches
    await getBranches()
    setLoading(false)
  }

  async function getBranches() {
    try {
      const { data, error } = await supabase.from('branches').select('*')
      if (error) throw error
      setBranches(data || [])
      setDebugInfo(prev => prev + `\nBranches found: ${data?.length || 0}`)
    } catch (error) {
      console.error('Error:', error.message)
      setDebugInfo(prev => prev + `\nBranch Error: ${error.message}`)
    }
  }

  async function handleAddBranch(e) {
    e.preventDefault()
    const { error } = await supabase
      .from('branches')
      .insert([{ name: newBranchName, location: newBranchLocation, is_active: true }])
    
    if (error) {
      alert('Error adding branch: ' + error.message)
    } else {
      setNewBranchName('')
      setNewBranchLocation('')
      getBranches()
      alert('Branch added successfully!')
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setUserRole(null)
    setBranches([])
    setDebugInfo('')
  }

  if (!user) {
    return <Login onLogin={() => checkUser()} />
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ color: '#2c3e50', margin: 0 }}>JideMark</h1>
        <button 
          onClick={handleLogout}
          style={{ padding: '8px 15px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          Logout
        </button>
      </div>
      
      <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '5px', marginBottom: '15px', fontSize: '12px' }}>
        <p style={{ margin: '5px 0' }}> Email: {user.email}</p>
        <p style={{ margin: '5px 0' }}>🔑 Role: <strong>{userRole || 'Loading...'}</strong></p>
        {debugInfo && <pre style={{ margin: '10px 0', whiteSpace: 'pre-wrap' }}>{debugInfo}</pre>}
      </div>
      
      {/* ONLY SHOW THIS FORM IF THE USER IS A SUPER ADMIN */}
      {userRole === 'super_admin' ? (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeeba' }}>
          <h3 style={{ marginTop: 0, color: '#856404' }}>Add New Branch</h3>
          <form onSubmit={handleAddBranch} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input 
              type="text" 
              placeholder="Branch Name (e.g., Lagos Branch)" 
              value={newBranchName} 
              onChange={(e) => setNewBranchName(e.target.value)} 
              required 
              style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
            />
            <input 
              type="text" 
              placeholder="Location (e.g., Lagos, Nigeria)" 
              value={newBranchLocation} 
              onChange={(e) => setNewBranchLocation(e.target.value)} 
              required 
              style={{ padding: '10px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
            />
            <button 
              type="submit"
              style={{ padding: '10px', fontSize: '16px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
            >
              Add Branch
            </button>
          </form>
        </div>
      ) : (
        <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#d1ecf1', borderRadius: '8px', border: '1px solid #bee5eb' }}>
          <p style={{ margin: 0, color: '#0c5460' }}>ℹ️ You are logged in as <strong>{userRole}</strong>. Only super_admin can add branches.</p>
        </div>
      )}

      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h2 style={{ color: '#34495e', marginTop: 0 }}>All Branches</h2>
        {loading ? (
          <p>Loading...</p>
        ) : branches.length === 0 ? (
          <p>No branches found yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {branches.map((branch) => (
              <li key={branch.id} style={{ 
                padding: '12px', marginBottom: '8px', backgroundColor: 'white', 
                borderRadius: '5px', borderLeft: '4px solid #3498db'
              }}>
                <strong>{branch.name}</strong> - {branch.location}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default App
