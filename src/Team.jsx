import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Team({ userRole }) {
  const [teamMembers, setTeamMembers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newMember, setNewMember] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'branch_manager',
    branch_id: ''
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])
    
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*, auth_users!inner(email)')
      .order('full_name')
    
    setTeamMembers(profilesData || [])
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
        setEditingId(null)
      } else {
        alert('Error updating: ' + error.message)
      }
    } else {
      // Create new user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: newMember.email,
        password: newMember.password
      })
      
      if (authError) {
        alert('Error creating user: ' + authError.message)
        return
      }
      
      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: newMember.role,
          branch_id: newMember.branch_id || null,
          full_name: newMember.full_name
        })
        .eq('id', authData.user.id)
      
      if (!profileError) {
        alert('Team member added successfully! They can now login.')
        setNewMember({ email: '', password: '', full_name: '', role: 'branch_manager', branch_id: '' })
        setShowForm(false)
        loadData()
      } else {
        alert('Error saving profile: ' + profileError.message)
      }
    }
  }

  function handleEdit(member) {
    setEditingId(member.id)
    setNewMember({
      email: member.auth_users?.email || '',
      password: '',
      full_name: member.full_name || '',
      role: member.role || 'branch_manager',
      branch_id: member.branch_id || ''
    })
    setShowForm(true)
  }

  async function handleDelete(memberId) {
    if (!confirm('Are you sure you want to delete this team member? This cannot be undone.')) return
    
    const { error } = await supabase
      .from('profiles')
      .delete()
      .eq('id', memberId)
    
    if (!error) {
      alert('Team member deleted successfully!')
      loadData()
    } else {
      alert('Error deleting: ' + error.message)
    }
  }

  function getRoleColor(role) {
    switch(role) {
      case 'super_admin': return '#e74c3c'
      case 'branch_manager': return '#f39c12'
      case 'clerk': return '#3498db'
      default: return '#7f8c8d'
    }
  }

  function getBranchName(branchId) {
    if (!branchId) return 'All Branches'
    const branch = branches.find(b => b.id === branchId)
    return branch ? branch.name : 'Unknown'
  }

  return (
    <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Team Management</h2>
        {userRole === 'super_admin' && (
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setNewMember({ email: '', password: '', full_name: '', role: 'branch_manager', branch_id: '' }) }} style={{ padding: '8px 15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {showForm ? 'Cancel' : '+ Add Team Member'}
          </button>
        )}
      </div>

      {showForm && userRole === 'super_admin' && (
        <form onSubmit={handleAddMember} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '5px' }}>
          <h3 style={{ marginTop: 0, color: '#27ae60' }}>{editingId ? 'Edit Team Member' : 'Add New Team Member'}</h3>
          
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name *</label>
          <input type="text" placeholder="e.g., John Doe" value={newMember.full_name} onChange={(e) => setNewMember({...newMember, full_name: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email Address *</label>
          <input type="email" placeholder="e.g., john@jidemark.com" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} required disabled={!!editingId} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box', backgroundColor: editingId ? '#ecf0f1' : 'white' }} />

          {!editingId && (
            <>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password *</label>
              <input type="password" placeholder="Minimum 6 characters" value={newMember.password} onChange={(e) => setNewMember({...newMember, password: e.target.value})} required minLength="6" style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
            </>
          )}

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Role *</label>
          <select value={newMember.role} onChange={(e) => setNewMember({...newMember, role: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="branch_manager">Branch Manager</option>
            <option value="clerk">Clerk</option>
            <option value="super_admin">Super Admin (Owner)</option>
          </select>

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Assigned Branch</label>
          <select value={newMember.branch_id} onChange={(e) => setNewMember({...newMember, branch_id: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="">All Branches (Owner only)</option>
            {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
          </select>

          <button type="submit" style={{ padding: '12px 20px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', width: '100%' }}>
            {editingId ? 'Update Member' : 'Create Account'}
          </button>
        </form>
      )}

      {loading ? <p>Loading team members...</p> : teamMembers.length === 0 ? <p>No team members yet.</p> : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {teamMembers.map((member) => (
            <li key={member.id} style={{ padding: '15px', marginBottom: '10px', backgroundColor: 'white', borderRadius: '5px', borderLeft: `4px solid ${getRoleColor(member.role)}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                    <strong style={{ fontSize: '16px' }}>{member.full_name || 'Unnamed User'}</strong>
                    <span style={{ 
                      padding: '3px 8px', 
                      backgroundColor: getRoleColor(member.role), 
                      color: 'white', 
                      borderRadius: '3px', 
                      fontSize: '12px',
                      textTransform: 'capitalize'
                    }}>
                      {member.role?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#7f8c8d', marginBottom: '3px' }}>
                    📧 {member.auth_users?.email}
                  </div>
                  <div style={{ fontSize: '13px', color: '#7f8c8d' }}>
                    🏢 {getBranchName(member.branch_id)}
                  </div>
                </div>
                {userRole === 'super_admin' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => handleEdit(member)} style={{ padding: '6px 12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>
                      ✏️ Edit
                    </button>
                    <button onClick={() => handleDelete(member.id)} style={{ padding: '6px 12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', fontSize: '12px' }}>
                      🗑️ Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Help Text */}
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#eaf2f8', borderRadius: '5px', fontSize: '14px' }}>
        <strong>ℹ️ Role Permissions:</strong>
        <ul style={{ margin: '10px 0 0 0', paddingLeft: '20px' }}>
          <li><strong style={{ color: '#e74c3c' }}>Super Admin</strong> - Full access to everything</li>
          <li><strong style={{ color: '#f39c12' }}>Branch Manager</strong> - Can manage their assigned branch only</li>
          <li><strong style={{ color: '#3498db' }}>Clerk</strong> - Can record purchases and sales for their branch</li>
        </ul>
      </div>
    </div>
  )
}
