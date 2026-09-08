import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (isSignup) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } }
      })
      if (error) setMessage('Error: ' + error.message)
      else setMessage('Check your email to confirm your account!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setMessage('Error: ' + error.message)
      else onLogin()
    }
    setLoading(false)
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', color: '#2c3e50' }}>JideMark</h1>
      <h2 style={{ textAlign: 'center', color: '#7f8c8d' }}>{isSignup ? 'Create Account' : 'Sign In'}</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        {isSignup && (
          <input 
            type="text" 
            placeholder="Full Name" 
            value={fullName} 
            onChange={(e) => setFullName(e.target.value)} 
            required 
            style={{ padding: '12px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
          />
        )}
        <input 
          type="email" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
          required 
          style={{ padding: '12px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
        />
        <input 
          type="password" 
          placeholder="Password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
          required 
          style={{ padding: '12px', fontSize: '16px', border: '1px solid #ccc', borderRadius: '5px' }}
        />
        
        <button 
          type="submit" 
          disabled={loading}
          style={{ padding: '12px', fontSize: '16px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          {loading ? 'Processing...' : (isSignup ? 'Sign Up' : 'Login')}
        </button>
      </form>

      {message && <p style={{ textAlign: 'center', marginTop: '15px', color: '#e74c3c' }}>{message}</p>}

      <p style={{ textAlign: 'center', marginTop: '20px' }}>
        {isSignup ? 'Already have an account? ' : 'Need an account? '}
        <span 
          onClick={() => setIsSignup(!isSignup)} 
          style={{ color: '#3498db', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {isSignup ? 'Login' : 'Sign Up'}
        </span>
      </p>
    </div>
  )
}
