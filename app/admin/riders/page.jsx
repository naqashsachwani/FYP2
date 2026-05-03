"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, Search, Car, UserCircle, FileText, ExternalLink, ShieldAlert, Ban, Filter } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminRiderManagementPage() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  // ✅ NEW: Default to ALL for dropdown, or you can keep it PENDING_APPROVAL
  const [filter, setFilter] = useState("PENDING_APPROVAL");

  const fetchRiders = async () => {
    try {
      const res = await fetch("/api/admin/riders");
      if (!res.ok) throw new Error("Failed to fetch riders");
      const data = await res.json();
      setRiders(data);
    } catch (error) {
      toast.error("Error loading riders.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRiders(); }, []);

  const handleStatusChange = async (riderId, newStatus) => {
    if (!confirm(`Are you sure you want to ${newStatus.replace('_', ' ')} this rider?`)) return;
    
    setProcessingId(riderId);
    try {
      const res = await fetch("/api/admin/riders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ riderId, status: newStatus }),
      });

      if (!res.ok) throw new Error("Update failed");

      toast.success(`Rider status updated to ${newStatus.replace('_', ' ')}.`);
      fetchRiders(); 
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRiders = riders.filter(r => filter === "ALL" || r.status === filter);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Rider Fleet Management</h1>
            <p className="text-slate-500 mt-1">Review, approve, and manage DreamSaver delivery personnel.</p>
          </div>
          
          {/* ✅ REPLACED BUTTONS WITH DROPDOWN FILTER */}
          <div className="relative w-full sm:w-56">
             <select 
                value={filter} 
                onChange={(e) => setFilter(e.target.value)} 
                className="w-full pl-4 pr-10 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-bold text-slate-700 shadow-sm cursor-pointer"
             >
               <option value="ALL">All Riders</option>
               <option value="PENDING_APPROVAL">Pending Approval</option>
               <option value="APPROVED">Approved</option>
               <option value="SUSPENDED">Suspended</option>
               <option value="REJECTED">Rejected</option>
             </select>
             <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
          {filteredRiders.length === 0 ? (
            <div className="p-16 text-center text-slate-500 flex flex-col items-center">
              <ShieldAlert size={48} className="text-slate-300 mb-4" />
              <p className="font-bold text-lg text-slate-700">No Riders Found</p>
              <p className="text-sm">There are no riders matching the current filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Applicant Info</th>
                    <th className="px-6 py-4">Vehicle Details</th>
                    <th className="px-6 py-4">Documents</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRiders.map((rider) => (
                    <tr key={rider.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={rider.user.image} alt="Avatar" className="w-10 h-10 rounded-full border border-slate-200" />
                          <div>
                            <p className="font-bold text-slate-900">{rider.user.name}</p>
                            <p className="text-slate-500 text-xs">{rider.user.email}</p>
                            <p className="text-blue-500 text-xs font-mono font-bold mt-0.5">📞 {rider.phoneNumber || "N/A"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 mb-1 text-slate-700 font-medium"><Car size={14} className="text-blue-500" />{rider.vehicleType}</div>
                        <span className="bg-slate-100 text-slate-600 font-mono text-xs px-2 py-1 rounded border border-slate-200">{rider.vehiclePlate}</span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <p className="text-xs text-slate-600 flex items-center gap-1"><UserCircle size={12} className="text-slate-400" /> <span className="font-mono">{rider.cnicNumber}</span></p>
                          <p className="text-xs text-slate-600 flex items-center gap-1"><FileText size={12} className="text-slate-400" /> <span className="font-mono">{rider.licenseNumber}</span></p>
                          {rider.idImageUrl && (
                            <div className="flex flex-col gap-1 mt-2">
                              {(() => {
                                let images = [];
                                try { images = JSON.parse(rider.idImageUrl); if (!Array.isArray(images)) images = [rider.idImageUrl]; } catch (e) { images = [rider.idImageUrl]; }
                                return images.map((imgUrl, idx) => (
                                  <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:underline">
                                    View Document {images.length > 1 ? idx + 1 : ''} <ExternalLink size={10} />
                                  </a>
                                ));
                              })()}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-full border ${
                          rider.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                          rider.status === 'SUSPENDED' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          rider.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {rider.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          
                          {rider.status === 'APPROVED' && (
                             <button
                               onClick={() => handleStatusChange(rider.id, "SUSPENDED")}
                               disabled={processingId === rider.id}
                               className="px-3 py-1.5 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white border border-orange-200 rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                             >
                               <Ban size={14} /> Disable
                             </button>
                          )}

                          {(rider.status === 'SUSPENDED' || rider.status === 'PENDING_APPROVAL') && (
                             <button
                               onClick={() => handleStatusChange(rider.id, "APPROVED")}
                               disabled={processingId === rider.id}
                               className="px-3 py-1.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-200 rounded-lg font-bold text-xs transition-colors flex items-center gap-1"
                             >
                               <CheckCircle size={14} /> Enable
                             </button>
                          )}

                          {rider.status !== 'REJECTED' && rider.status !== 'SUSPENDED' && rider.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleStatusChange(rider.id, "REJECTED")}
                              disabled={processingId === rider.id}
                              className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors disabled:opacity-50"
                              title="Reject Rider"
                            >
                              {processingId === rider.id ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}