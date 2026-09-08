import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'

function App() {
  const [user, setUser] = useState(null)
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) getBranches()
      else setLoading(false)
    })

    // Listen for login/logout changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) getBranches()
      else setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function getBranches() {
    try {
      const { data, error } = await supabase.from('branches').select('*')
      if (error) throw error
      setBranches(data || [])
    } catch (error) {
      console.error('Error:', error.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    setUser(null)
    setBranches([])
  }

  // If no user, show Login screen
  if (!user) {
    return <Login onLogin={() => setUser(supabase.auth.getUser())} />
  }

  // If user is logged in, show Dashboard
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
      
      <p style={{ color: '#27ae60', fontWeight: 'bold' }}>✅ Logged in as {user.email}</p>
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h2 style={{ color: '#34495e' }}>Your Branches:</h2>
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
