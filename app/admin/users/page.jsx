'use client'

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import { Loader2, UserX, Users, ShieldAlert, ShieldCheck } from "lucide-react" 
import { useAuth } from "@clerk/nextjs"
import axios from "axios"

export default function AdminUsers() {
  const { getToken } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = async () => {
    try {
      const token = await getToken()
      const { data } = await axios.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(data.users)
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
  const handleToggleStatus = async (id, name, currentStatus) => {
    const actionText = currentStatus ? "DISABLE" : "ENABLE";
    if (!window.confirm(`Are you sure you want to ${actionText} ${name}'s account?`)) return;

    // Optimistic UI Update for instant feedback
    setUsers(users.map(u => u.id === id ? { ...u, isActive: !currentStatus } : u))

    try {
      const token = await getToken()
      const { data } = await axios.patch('/api/admin/users', 
        { id, currentStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toast.success(data.message)
    } catch (error) {
      // Revert on failure
      setUsers(users.map(u => u.id === id ? { ...u, isActive: currentStatus } : u))
      toast.error(error?.response?.data?.error || "Failed to update status")
    }
  }

  // --- DELETE & BAN USER ---
  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to remove ${name}?\n\nNOTE: If this is their first deletion, they will be allowed to recreate their account ONE time. If they have been deleted before, they will be permanently banned.`)) return

    try {
      const token = await getToken()
      const response = await axios.delete(`/api/admin/users?id=${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      toast.success(response.data.message, { duration: 5000 })
      setUsers(users.filter(u => u.id !== id))
    } catch (error) {
      toast.error(error?.response?.data?.error || "Failed to delete user")
    }
  }

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40} /></div>

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-12 text-gray-700">
      <div className="max-w-6xl mx-auto">
        
        <div className="flex items-center gap-3 mb-8">
            <Users className="text-blue-600 w-8 h-8" />
            <h1 className="text-3xl font-bold text-gray-800">Manage <span className="text-blue-600">Users</span></h1>
        </div>

        <div className="bg-white shadow-md rounded-xl p-6 overflow-x-auto border border-gray-100">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 rounded-t-xl border-b border-slate-100">
              <tr>
                <th className="py-4 px-4 text-left font-bold text-slate-600">User</th>
                <th className="py-4 px-4 text-left font-bold text-slate-600">Email Address</th>
                <th className="py-4 px-4 text-center font-bold text-slate-600">Status</th>
                <th className="py-4 px-4 text-right font-bold text-slate-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className={`border-b border-slate-50 transition group ${!user.isActive ? 'bg-red-50/50 grayscale-[0.3]' : 'hover:bg-slate-50'}`}>
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img 
                        src={user.image || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
                        alt="avatar" 
                        className={`w-10 h-10 rounded-full border border-slate-200 object-cover ${!user.isActive ? 'opacity-50' : ''}`}
                    />
                    <span className="font-semibold text-slate-800">{user.name}</span>
                  </td>
                  <td className="py-3 px-4 text-slate-600">{user.email}</td>
                  
                  {/* STATUS BADGE */}
                  <td className="py-3 px-4 text-center">
                    {user.isActive ? (
                        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold">Active</span>
                    ) : (
                        <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">Disabled</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right space-x-2">
                    {/* TOGGLE STATUS BUTTON */}
                    <button 
                        onClick={() => handleToggleStatus(user.id, user.name, user.isActive)} 
                        className={`p-2 rounded-lg transition-colors ${user.isActive ? 'hover:bg-amber-100 text-slate-400 hover:text-amber-600' : 'hover:bg-emerald-100 text-red-400 hover:text-emerald-600'}`}
                        title={user.isActive ? "Suspend User" : "Enable User"}
                    >
                        {user.isActive ? <ShieldAlert className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                    </button>

                    <button 
                        onClick={() => handleDeleteUser(user.id, user.name)} 
                        className="p-2 hover:bg-red-100 rounded-lg transition-colors text-slate-400 hover:text-red-600" 
                        title="Delete User"
                    >
                        <UserX className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              
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