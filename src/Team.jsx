import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

export default function Team({ userRole }) {
  const [teamMembers, setTeamMembers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newMember, setNewMember] = useState({
    email: '', password: '', full_name: '', role: 'clerk', branch_id: ''
  })

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: branchesData } = await supabase.from('branches').select('*')
    setBranches(branchesData || [])
    
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    setTeamMembers(profilesData || [])
    setLoading(false)
  }

  async function handleAddMember(e) {
    e.preventDefault()
    
    if (editingId) {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role: newMember.role,
          branch_id: newMember.role === 'super_admin' ? null : (newMember.branch_id || null),
          full_name: newMember.full_name
        })
        .eq('id', editingId)
      
      if (!error) {
        alert('Updated successfully!')
        setEditingId(null)
        setShowForm(false)
        await loadData()
      } else {
        alert('Error: ' + error.message)
      }
    } else {
      try {
        // Create user
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
        
        if (authError) throw authError
        
        // Wait for trigger to create profile
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // Update branch if provided
        if (newMember.branch_id && newMember.role !== 'super_admin') {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ branch_id: newMember.branch_id })
            .eq('id', authData.user.id)
          
          if (updateError) console.error('Branch update error:', updateError)
        }
        
        alert('Member added successfully!')
        setNewMember({ email: '', password: '', full_name: '', role: 'clerk', branch_id: '' })
        setShowForm(false)
        await loadData()
        
      } catch (error) {
        alert('Error: ' + error.message)
      }
    }
  }

  async function handleRemove(id) {
    if (!confirm('Remove this member?')) return
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (!error) {
      await loadData()
    } else {
      alert('Error: ' + error.message)
    }
  }

  function handleEdit(member) {
    setEditingId(member.id)
    setNewMember({
      email: member.email || '',
      password: '',
      full_name: member.full_name || '',
      role: member.role || 'clerk',
      branch_id: member.branch_id || ''
    })
    setShowForm(true)
  }

  function getBranchName(branchId, role) {
    if (role === 'super_admin') return 'All Branches (Owner)'
    if (!branchId) return 'No branch assigned - Click Edit to assign'
    const branch = branches.find(b => b.id === branchId)
    return branch ? branch.name : 'Unknown Branch'
  }

  return (
    <div style={{ padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#34495e', margin: 0 }}>Team Management</h2>
        {userRole === 'super_admin' && (
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setNewMember({ email: '', password: '', full_name: '', role: 'clerk', branch_id: '' }) }} style={{ padding: '8px 15px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>
            {showForm ? 'Cancel' : '+ Add Member'}
          </button>
        )}
      </div>

      {showForm && userRole === 'super_admin' && (
        <form onSubmit={handleAddMember} style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
          <h3 style={{ marginTop: 0 }}>{editingId ? 'Edit Member' : 'Add New Member'}</h3>
          
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Full Name *</label>
          <input type="text" value={newMember.full_name} onChange={(e) => setNewMember({...newMember, full_name: e.target.value})} required style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Email *</label>
          <input type="email" value={newMember.email} onChange={(e) => setNewMember({...newMember, email: e.target.value})} required disabled={!!editingId} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />

          {!editingId && (
            <>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Password (min 6 chars) *</label>
              <input type="password" value={newMember.password} onChange={(e) => setNewMember({...newMember, password: e.target.value})} required minLength="6" style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }} />
            </>
          )}

          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Role *</label>
          <select value={newMember.role} onChange={(e) => setNewMember({...newMember, role: e.target.value})} style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}>
            <option value="clerk">Clerk</option>
            <option value="branch_manager">Branch Manager</option>
            <option value="super_admin">Super Admin (Owner)</option>
          </select>

          {newMember.role !== 'super_admin' && (
            <>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Branch *</label>
              <select 
                value={newMember.branch_id} 
                onChange={(e) => setNewMember({...newMember, branch_id: e.target.value})} 
                required
                style={{ width: '100%', padding: '10px', marginBottom: '15px', border: '1px solid #ccc', borderRadius: '5px', boxSizing: 'border-box' }}
              >
                <option value="">Select Branch</option>
                {branches.map(b => (<option key={b.id} value={b.id}>{b.name}</option>))}
              </select>
            </>
          )}

          <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#27ae60', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
            {editingId ? 'Save Changes' : 'Create Account'}
          </button>
        </form>
      )}

      {loading ? <p>Loading...</p> : (
        <div>
          <h3>Team Members ({teamMembers.length})</h3>
          {teamMembers.length === 0 ? <p>No members yet</p> : (
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {teamMembers.map((member) => (
                <li key={member.id} style={{ padding: '15px', marginBottom: '10px', backgroundColor: 'white', borderRadius: '8px', border: '1px solid #ddd' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong>{member.full_name || member.email || 'Unnamed'}</strong>
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '5px' }}>
                         {member.email}<br/>
                        🏢 {getBranchName(member.branch_id, member.role)}
                      </div>
                      <span style={{ 
                        display: 'inline-block',
                        padding: '3px 8px', 
                        backgroundColor: member.role === 'super_admin' ? '#e74c3c' : member.role === 'branch_manager' ? '#f39c12' : '#3498db', 
                        color: 'white', 
                        borderRadius: '3px', 
                        fontSize: '11px',
                        marginTop: '5px',
                        textTransform: 'uppercase'
                      }}>
                        {member.role?.replace('_', ' ')}
                      </span>
                    </div>
                    {userRole === 'super_admin' && member.role !== 'super_admin' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button onClick={() => handleEdit(member)} style={{ padding: '6px 12px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>✏️ Edit</button>
                        <button onClick={() => handleRemove(member.id)} style={{ padding: '6px 12px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer' }}>🗑️ Remove</button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
