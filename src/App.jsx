import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function App() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getBranches()
  }, [])

  async function getBranches() {
    try {
      setLoading(true)
      // This fetches data from the 'branches' table we created in Supabase
      const { data, error } = await supabase.from('branches').select('*')
      if (error) throw error
      setBranches(data || [])
    } catch (error) {
      alert('Error: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>JideMark Dashboard</h1>
      <p>Connected to Supabase successfully!</p>
      
      <h2>Your Branches:</h2>
      {loading ? (
        <p>Loading branches...</p>
      ) : branches.length === 0 ? (
        <p>No branches found yet. (Go to Supabase Table Editor to add one!)</p>
      ) : (
        <ul>
          {branches.map((branch) => (
            <li key={branch.id}>{branch.name} - {branch.location}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default App
