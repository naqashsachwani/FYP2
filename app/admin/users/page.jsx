'use client'

import { useEffect, useState } from "react" 
import toast from "react-hot-toast" 
import { Loader2, UserX, Users, ShieldAlert, ShieldCheck } from "lucide-react" 
import { useAuth } from "@clerk/nextjs" 
import axios from "axios" 

export default function AdminUsers() {
  const { getToken, userId } = useAuth()
  
  // --- State Management ---
  const [users, setUsers] = useState([]) 
  const [loading, setLoading] = useState(true)

  // function to retrieve all users from the admin API
  const fetchUsers = async () => {
    try {
      const token = await getToken() 
      const { data } = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` } 
      })
      setUsers(data.users) // Populate the state with the fetched users
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // --- TOGGLE ENABLE/DISABLE ---
  // Reverses a user's active status 
  const handleToggleStatus = async (id, name, currentStatus) => {
    // Determine the confirmation text based on what the *new* state will be
    const actionText = currentStatus ? "DISABLE" : "ENABLE";
    
    if (!window.confirm(`Are you sure you want to ${actionText} ${name}'s account?`)) return;
    setUsers(users.map(u => u.id === id ? { ...u, isActive: !currentStatus } : u))

    try {
      const token = await getToken()
      // Send a PATCH request to update the user's status in the database
      const { data } = await axios.patch('/api/admin/users', 
        { id, currentStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(data.message)
    } catch (error) {
      // Rollback: If the API call fails, revert the user's status in the local state back to its original value
      setUsers(users.map(u => u.id === id ? { ...u, isActive: currentStatus } : u))
      toast.error(error?.response?.data?.error || "Failed to update status")
    }
  }

  // --- DELETE & BAN USER ---
  // Permanently removes a user from the platform
  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?\n\nNOTE: If this is their first deletion, they will be allowed to recreate their account ONE time. If they have been deleted before, they will be permanently banned.`)) return

    try {
      const token = await getToken()
      // Send a DELETE request with the user's ID as a query parameter
      const response = await axios.delete(`/api/admin/users?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      // Show success message that persists slightly longer (5 seconds)
      toast.success(response.data.message, { duration: 5000 })
      
      // Update UI: Filter out the deleted user from the state array so they disappear from the table
      setUsers(users.filter(u => u.id !== id))
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to delete user")
    }
  }

  // Shows a centered spinner while the initial fetchUsers request is running
  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 text-gray-700">
      <div className="max-w-6xl mx-auto">
        
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
            <Users className="text-blue-600 w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-800">Manage <span className="text-blue-600">Users</span></h1>
        </div>

        {/* Users Table Container */}
        <div className="bg-white shadow-md rounded-xl p-6 overflow-x-auto border border-gray-100">
          <table className="min-w-full text-sm">
            
            {/* Table Headers */}
            <thead className="bg-slate-50 rounded-t-xl border-b border-slate-100">
              <tr>
                <th className="py-4 px-4 text-left font-bold text-slate-600">User</th>
                <th className="py-4 px-4 text-left font-bold text-slate-600">Email Address</th>
                <th className="py-4 px-4 text-center font-bold text-slate-600">Status</th>
                <th className="py-4 px-4 text-right font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            
            {/* Table Body */}
            <tbody>
              {/* Map over the users array to create a table row for each user */}
              {users.map((user) => {
                const isSelf = user.id === userId; 

                return (
                  <tr key={user.id} className={`border-b border-slate-50 transition group ${!user.isActive ? 'bg-red-50/50 grayscale-[0.3]' : 'hover:bg-slate-50'}`}>
                    
                    {/* Column 1: Avatar and Name */}
                    <td className="py-3 px-4 flex items-center gap-3">
                      <img 
                          // Try to load the user's actual image. If missing, fall back to an external service that generates an avatar based on their initials.
                          src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                          alt="avatar" 
                          className={`w-10 h-10 rounded-full border border-slate-200 object-cover ${!user.isActive ? 'opacity-50' : ''}`}
                      />
                      <span className="font-semibold text-slate-800">
                        {user.name}
                        {isSelf && <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">YOU</span>}
                      </span>
                    </td>
                    
                    <td className="py-3 px-4 text-slate-600">{user.email}</td>
                    
                    {/* Column 3: STATUS BADGE */}
                    <td className="py-3 px-4 text-center">
                      {/* Conditionally render a Green "Active" badge or a Red "Disabled" badge */}
                      {user.isActive ? (
                          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">Active</span>
                      ) : (
                          <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Disabled</span>
                      )}
                    </td>

                    {/* Column 4: Actions (Buttons) */}
                    <td className="py-3 px-4 text-right space-x-2">
                      
                      {/* TOGGLE STATUS BUTTON */}
                      <button 
                          onClick={() => handleToggleStatus(user.id, user.name, user.isActive)} 
                          disabled={isSelf} // Prevent admin from disabling themselves
                          // Dynamic button styling: Handle self, active, and inactive states.
                          className={`p-2 rounded-lg transition-colors ${
                            isSelf 
                              ? 'opacity-30 cursor-not-allowed text-slate-400' 
                              : user.isActive 
                                ? 'hover:bg-amber-100 text-slate-400 hover:text-amber-600' 
                                : 'hover:bg-emerald-100 text-red-400 hover:text-emerald-600'
                          }`}
                          title={isSelf ? "You cannot suspend your own account" : (user.isActive ? "Suspend User" : "Enable User")}
                      >
                          {user.isActive ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                      </button>

                      {/* DELETE BUTTON */}
                      <button 
                          onClick={() => handleDeleteUser(user.id, user.name)} 
                          disabled={isSelf} // Prevent admin from deleting themselves
                          className={`p-2 rounded-lg transition-colors text-slate-400 ${
                            isSelf 
                              ? 'opacity-30 cursor-not-allowed' 
                              : 'hover:bg-red-100 hover:text-red-600'
                          }`} 
                          title={isSelf ? "You cannot delete your own account" : "Delete User"}
                      >
                          <UserX className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
              
              {/* Empty State Fallback */}
              {/* If the database returns an empty array, span across all 4 columns and display this message */}
              {users.length === 0 && (
                <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400">No users found in the database.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}