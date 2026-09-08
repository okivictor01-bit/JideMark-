import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    getBranches()
  }, [])

  async function getBranches() {
    try {
      setLoading(true)
      setError(null)
      const { data, error } = await supabase.from('branches').select('*')
      if (error) throw error
      setBranches(data || [])
    } catch (err) {
      console.error('Error fetching branches:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ color: '#2c3e50' }}>JideMark Dashboard</h1>
      <p style={{ color: '#27ae60', fontWeight: 'bold' }}>✅ Connected to Supabase successfully!</p>
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h2 style={{ color: '#34495e' }}>Your Branches:</h2>
        {loading ? (
          <p>Loading branches...</p>
        ) : error ? (
          <p style={{ color: '#e74c3c' }}>Error: {error}</p>
        ) : branches.length === 0 ? (
          <p>No branches found yet.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {branches.map((branch) => (
              <li key={branch.id} style={{ 
                padding: '12px', 
                marginBottom: '8px', 
                backgroundColor: 'white', 
                borderRadius: '5px',
                borderLeft: '4px solid #3498db'
              }}>
                <strong>{branch.name}</strong>
                {branch.location && <span style={{ color: '#7f8c8d' }}> - {branch.location}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default App
