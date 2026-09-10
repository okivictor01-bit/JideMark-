import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Team({ userRole }) {
  const [teamMembers, setTeamMembers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [creating, setCreating] = useState(false)
  const [newMember, setNewMember] = useState({
    email: '', password: '', full_name: '', role: 'branch_manager', branch_id: ''
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])
    
    const { data: profilesData, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, branch_id, created_at')
      .order('created_at', { ascending: false })
    
    if (error) console.error('Error loading team:', error)
    else setTeamMembers(profilesData || [])
    
    setLoading(false)
  }

  async function handleAddMember(e) {
    e.preventDefault()
    
    if (editingId) {
      // Update existing member
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newMember.role, 
          branch_id: newMember.branch_id || null, 
          full_name: newMember.full_name 
        })
        .eq('id', editingId)
      
      if (!error) {
        alert('Team member updated successfully!')
        setEditingId(null); setShowForm(false); await loadData()
      } else { alert('Error updating: ' + error.message) }
    } else {
      setCreating(true)
      
      try {
        // Check if email already exists
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const emailExists = existingUsers.users.some(u => u.email === newMember.email)
        
        if (emailExists) {
          alert('A user with this email already exists!')
          setCreating(false)
          return
        }
        
        // Create new user with metadata
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: newMember.email,
          password: newMember.password,
          options: {
            data: {
              role: newMember.role,
              full_name: newMember.full_name
            }
          }
        })
        
        if (authError) { 
          alert('Error creating user: ' + authError.message)
          setCreating(false)
          return 
        }
        
        // Wait for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        // Update branch_id and other fields if provided
        if (authData.user) {
          const updateData = {}
          if (newMember.branch_id) updateData.branch_id = newMember.branch_id
          if (newMember.role) updateData.role = newMember.role
          if (newMember.full_name) updateData.full_name = newMember.full_name
          
          if (Object.keys(updateData).length > 0) {
            const { error: updateError } = await supabase
              .from('profiles')
              .update(updateData)
              .eq('id', authData.user.id)
            
            if (updateError) {
              console.error('Error updating profile:', updateError)
            }
          }
        }
        
        alert('Team member added successfully! They can now login.')
        setNewMember({ email: '', password: '', full_name: '', role: 'branch_manager', branch_id: '' })
        setShowForm(false)
        await loadData()
        
      } catch (error) {
        console.error('Unexpected error:', error)
        alert('An unexpected error occurred: ' + error.message)
      } finally {
        setCreating(false)
      }
    }
  }

  async function handleRemoveMember(member) {
    if (!window.confirm(`Are you sure you want to remove ${member.full_name || member.email}?`)) return

    const { error } = await supabase.from('profiles').delete().eq('id', member.id)
    
    if (!error) {
      alert('Member removed successfully!')
      await loadData()
    } else { alert('Error removing member: ' + error.message) }
  }

  function handleEdit(member) {
    setEditingId(member.id)
    setNewMember({
      email: member.email || '', password: '', full_name: member.full_name || '',
      role: member.role || 'branch_manager', branch_id: member.branch_id || ''
    })
    setShowForm(true)
  }

  function getRoleColor(role) {
    if (role === 'super_admin') return '#e74c3c'
    if (role === 'branch_manager') return '#f39c12'
    if (role === 'clerk') return '#3498db'
    return '#7f8c8d'
  }

  function getBranchName(branchId, role) {
    // Super admins have access to all branches
    if (role === 'super_admin') return 'All Branches (Owner)'
    
    // If no branch_id, show that
    if (!branchId) return 'No branch assigned'
    
    // Find and return branch name
    const branch = branches.find(b => b.id === branchId)
    return branch ? branch.name : 'Unknown Branch'
  }

  return (
    <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Team Management</h2>
        {userRole === 'super_admin' && (
          <button 
            onClick={() => { setShowForm(!showForm); setEditingId(null); setNewMember({ email: '', password: '', full_name: '', role: 'branch_manager', branch_id: '' }) }} 
            style={{ 
              padding: '8px 15px', 
              backgroundColor: creating ? '#95a5a6' : '#27ae60', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: creating ? 'not-allowed' : 'pointer', 
              fontWeight: 'bold' 
            }}
            disabled={creating}
          >
            {creating ? 'Creating...' : '+ Add Member'}
          </button>
        )}
      </div>

      {showForm && userRole === 'super_admin' && (
        <form onSubmit={handleAddMember} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0, color: '#2c3e50' }}>{editingId ? 'Edit Member' : 'Add New Team Member'}</h3>
          
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Full Name *</label>
          <input type="text" placeholder="e.g., John Doe" value={newMember.full_name} onChange={(e) => setNewMember({...newMember, full_name: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Email Address *</label>
          <input type="email" placeholder="e.g., john@jidemark.com" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} required disabled={!!editingId} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box', backgroundColor: editingId ? '#ecf0f1' : 'white' }} />

          {!editingId && (
            <>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Temporary Password *</label>
              <input type="password" placeholder="Minimum 6 characters" value={newMember.password} onChange={(e) => setNewMember({...newMember, password: e.target.value})} required minLength="6" style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
            </>
          )}

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Role *</label>
          <select value={newMember.role} onChange={(e) => setNewMember({...newMember, role: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="branch_manager">Branch Manager</option>
            <option value="clerk">Clerk</option>
            <option value="super_admin">Super Admin (Owner)</option>
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' }}>Assigned Branch {newMember.role !== 'super_admin' && '*'}</label>
          <select 
            value={newMember.branch_id} 
            onChange={(e) => setNewMember({...newMember, branch_id: e.target.value})} 
            required={newMember.role !== 'super_admin'}
            style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}
          >
            <option value="">Select Branch</option>
            {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>

          <button 
            type="submit" 
            disabled={creating}
            style={{ 
              width: '100%', 
              padding: '12px', 
              backgroundColor: creating ? '#95a5a6' : '#27ae60', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: creating ? 'not-allowed' : 'pointer', 
              fontSize: '16px', 
              fontWeight: 'bold' 
            }}
          >
            {creating ? 'Creating Account...' : (editingId ? 'Save Changes' : 'Create Account')}
          </button>
        </form>
      )}

      {loading ? <p style={{textAlign: 'center', padding: '20px'}}>Loading team members...</p> : teamMembers.length === 0 ? <p style={{textAlign: 'center', padding: '20px', color: '#7f8c8d'}}>No team members added yet.</p> : (
        <div>
          <h3 style={{ color: '#34495e', marginBottom: '15px' }}>Current Team Members ({teamMembers.length})</h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {teamMembers.map((member) => (
              <li key={member.id} style={{ padding: '15px', marginBottom: '10px', backgroundColor: 'white', borderRadius: '8px', borderLeft: `5px solid ${getRoleColor(member.role)}`, boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <strong style={{ fontSize: '16px', color: '#2c3e50' }}>{member.full_name || member.email || 'Unnamed User'}</strong>
                      <span style={{ padding: '4px 8px', backgroundColor: getRoleColor(member.role), color: 'white', borderRadius: '12px', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                        {member.role?.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#7f8c8d', marginBottom: '4px' }}>📧 {member.email || 'No email'}</div>
                    <div style={{ fontSize: '14px', color: '#7f8c8d' }}> {getBranchName(member.branch_id, member.role)}</div>
                  </div>
                  
                  {userRole === 'super_admin' && member.role !== 'super_admin' && (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                      <button onClick={() => handleEdit(member)} style={{ padding: '8px 12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>✏️ Edit</button>
                      <button onClick={() => handleRemoveMember(member)} style={{ padding: '8px 12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '13px', fontWeight: 'bold' }}>🗑️ Remove</button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
