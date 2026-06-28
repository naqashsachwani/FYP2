"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle, XCircle, Search, Car, UserCircle, FileText, ExternalLink, ShieldAlert, Ban, Filter, Edit, Image as ImageIcon, Upload, RefreshCcw } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminRiderManagementPage() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  
  const [filter, setFilter] = useState("PENDING_APPROVAL");

  // --- EDIT MODAL STATE ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRider, setEditingRider] = useState(null);
  const [editFormData, setEditFormData] = useState({
    phoneNumber: "", vehicleType: "", vehiclePlate: "", cnicNumber: "", licenseNumber: "", idImageUrl: ""
  });
  const [imageUploading, setImageUploading] = useState(false);

  const fetchRiders = async () => {
    setLoading(true);
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

  const handleRefresh = () => {
    setFilter("PENDING_APPROVAL");
    fetchRiders();
  };

  // --- STATUS CHANGE HANDLER ---
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

  // --- EDIT HANDLERS ---
  const openEditModal = (rider) => {
    setEditingRider(rider);
    setEditFormData({
      phoneNumber: rider.phoneNumber || "",
      vehicleType: rider.vehicleType || "",
      vehiclePlate: rider.vehiclePlate || "",
      cnicNumber: rider.cnicNumber || "",
      licenseNumber: rider.licenseNumber || "",
      idImageUrl: rider.idImageUrl || ""
    });
    setIsEditModalOpen(true);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setImageUploading(true);
    
    try {
      const base64Promises = files.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      });

      const base64Images = await Promise.all(base64Promises);

      setEditFormData(prev => ({ ...prev, idImageUrl: JSON.stringify(base64Images) }));
      toast.success(`${base64Images.length} image(s) processed successfully`);
    } catch (error) {
      toast.error("Failed to process images.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleUpdateRider = async (e) => {
    e.preventDefault();
    setProcessingId(editingRider.id);
    try {
      const res = await fetch("/api/admin/riders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          riderId: editingRider.id,
          ...editFormData
        }),
      });

      if (!res.ok) throw new Error("Failed to update rider details");

      toast.success("Rider details updated successfully!");
      setIsEditModalOpen(false);
      fetchRiders();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRiders = riders.filter(r => filter === "ALL" || r.status === filter);

  const parseImages = (jsonStr) => {
    if (!jsonStr) return [];
    try { 
      const parsed = JSON.parse(jsonStr); 
      return Array.isArray(parsed) ? parsed : [jsonStr]; 
    } catch (e) { 
      return [jsonStr]; 
    }
  };

  if (loading && riders.length === 0) return <div className="min-h-[100dvh] flex items-center justify-center bg-slate-50"><Loader2 className="animate-spin text-blue-600 w-10 h-10" /></div>;

  return (
    <div className="min-h-[100dvh] bg-slate-50 p-4 sm:p-6 md:p-10 relative">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5 sm:pb-0 sm:border-none">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Rider Fleet Management</h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">Review, approve, and manage DreamSaver delivery personnel.</p>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            <div className="relative w-full sm:w-56">
               <select 
                 value={filter} 
                 onChange={(e) => setFilter(e.target.value)} 
                 className="w-full pl-3 sm:pl-4 pr-10 py-2.5 sm:py-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-bold text-slate-700 shadow-sm cursor-pointer transition-shadow"
               >
                 <option value="ALL">All Riders</option>
                 <option value="PENDING_APPROVAL">Pending Approval</option>
                 <option value="APPROVED">Approved</option>
                 <option value="SUSPENDED">Suspended</option>
                 <option value="REJECTED">Rejected</option>
               </select>
               <Filter className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none w-4 h-4 sm:w-4 sm:h-4" />
            </div>
            <button 
              onClick={handleRefresh} 
              disabled={loading}
              className="p-2.5 sm:p-3 bg-white border border-slate-200 rounded-lg sm:rounded-xl hover:bg-slate-50 shadow-sm transition-colors text-slate-600 shrink-0"
              title="Reset filters and refresh"
            >
              <RefreshCcw size={18} className={`sm:w-5 sm:h-5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden flex flex-col">
          {filteredRiders.length === 0 ? (
            <div className="p-12 sm:p-16 text-center text-slate-500 flex flex-col items-center justify-center">
              <ShieldAlert className="text-slate-300 mb-3 sm:mb-4 w-10 h-10 sm:w-12 sm:h-12" />
              <p className="font-bold text-base sm:text-lg text-slate-700">No Riders Found</p>
              <p className="text-xs sm:text-sm mt-1">There are no riders matching the current filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar flex-1">
              <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[9px] sm:text-[10px] font-extrabold tracking-wider">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 sm:py-4">Applicant Info</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4">Vehicle Details</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4">Documents</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4">Status</th>
                    <th className="px-4 sm:px-6 py-3 sm:py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRiders.map((rider) => (
                    <tr key={rider.id} className="hover:bg-slate-50 transition-colors align-top sm:align-middle">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-2.5 sm:gap-3">
                          <img src={rider.user.image || "/default-avatar.png"} alt="Avatar" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-slate-200 shrink-0 object-cover" />
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 text-xs sm:text-sm truncate">{rider.user.name}</p>
                            <p className="text-slate-500 text-[10px] sm:text-xs truncate">{rider.user.email}</p>
                            <p className="text-blue-500 text-[10px] sm:text-xs font-mono font-bold mt-0.5 truncate">📞 {rider.phoneNumber || "N/A"}</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 sm:px-6 py-4">
                        <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 text-slate-700 font-medium text-xs sm:text-sm">
                            <Car className="text-blue-500 w-3.5 h-3.5 sm:w-4 sm:h-4" />{rider.vehicleType || "N/A"}
                        </div>
                        <span className="bg-slate-100 text-slate-600 font-mono text-[10px] sm:text-xs px-2 py-0.5 sm:py-1 rounded border border-slate-200 inline-block">{rider.vehiclePlate || "N/A"}</span>
                      </td>

                      <td className="px-4 sm:px-6 py-4">
                        <div className="space-y-1.5 sm:space-y-1">
                          <p className="text-[10px] sm:text-xs text-slate-600 flex items-center gap-1.5 sm:gap-1"><UserCircle className="text-slate-400 w-3.5 h-3.5 sm:w-3 sm:h-3" /> <span className="font-mono">{rider.cnicNumber || "N/A"}</span></p>
                          <p className="text-[10px] sm:text-xs text-slate-600 flex items-center gap-1.5 sm:gap-1"><FileText className="text-slate-400 w-3.5 h-3.5 sm:w-3 sm:h-3" /> <span className="font-mono">{rider.licenseNumber || "N/A"}</span></p>
                          {rider.idImageUrl && (
                            <div className="flex flex-col gap-1 mt-2">
                              {parseImages(rider.idImageUrl).map((imgUrl, idx) => (
                                <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-blue-600 hover:underline w-fit">
                                  View Document {parseImages(rider.idImageUrl).length > 1 ? idx + 1 : ''} <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-4 sm:px-6 py-4">
                        <span className={`px-2 sm:px-3 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded-full border shadow-sm ${
                          rider.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                          rider.status === 'SUSPENDED' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                          rider.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200' :
                          'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}>
                          {rider.status.replace("_", " ")}
                        </span>
                      </td>

                      <td className="px-4 sm:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
                          
                          {/* EDIT BUTTON */}
                          <button
                            onClick={() => openEditModal(rider)}
                            className="p-1 sm:p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-colors shadow-sm border border-blue-200"
                            title="Edit Rider Details"
                          >
                            <Edit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>

                          {rider.status === 'APPROVED' && (
                             <button
                               onClick={() => handleStatusChange(rider.id, "SUSPENDED")}
                               disabled={processingId === rider.id}
                               className="p-1 sm:p-1.5 bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white border border-orange-200 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                               title="Suspend"
                             >
                               {processingId === rider.id ? <Loader2 className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                             </button>
                          )}

                          {(rider.status === 'SUSPENDED' || rider.status === 'PENDING_APPROVAL') && (
                             <button
                               onClick={() => handleStatusChange(rider.id, "APPROVED")}
                               disabled={processingId === rider.id}
                               className="p-1 sm:p-1.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white border border-green-200 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                               title="Approve"
                             >
                               {processingId === rider.id ? <Loader2 className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <CheckCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                             </button>
                          )}

                          {rider.status !== 'REJECTED' && rider.status !== 'SUSPENDED' && rider.status !== 'APPROVED' && (
                            <button
                              onClick={() => handleStatusChange(rider.id, "REJECTED")}
                              disabled={processingId === rider.id}
                              className="p-1 sm:p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-colors shadow-sm border border-red-200"
                              title="Reject Rider"
                            >
                              {processingId === rider.id ? <Loader2 className="animate-spin w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <XCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
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

      {/* EDIT RIDER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl sm:rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Edit className="text-blue-600" /> Edit Rider Profile
              </h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-red-500 transition-colors">
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1">
              <form id="editRiderForm" onSubmit={handleUpdateRider} className="space-y-4">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Phone Number</label>
                    <input 
                      type="text" 
                      value={editFormData.phoneNumber} 
                      onChange={(e) => setEditFormData({...editFormData, phoneNumber: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Vehicle Type</label>
                    <select 
                      value={editFormData.vehicleType} 
                      onChange={(e) => setEditFormData({...editFormData, vehicleType: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    >
                      <option value="Bike">Bike</option>
                      <option value="Car">Car</option>
                      <option value="Van">Van</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">Vehicle Plate</label>
                    <input 
                      type="text" 
                      value={editFormData.vehiclePlate} 
                      onChange={(e) => setEditFormData({...editFormData, vehiclePlate: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600 uppercase">CNIC Number</label>
                    <input 
                      type="text" 
                      value={editFormData.cnicNumber} 
                      onChange={(e) => setEditFormData({...editFormData, cnicNumber: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-xs font-bold text-slate-600 uppercase">License Number</label>
                    <input 
                      type="text" 
                      value={editFormData.licenseNumber} 
                      onChange={(e) => setEditFormData({...editFormData, licenseNumber: e.target.value})}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2 pt-2 border-t border-slate-100">
                    <label className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1"><ImageIcon size={14} /> Update Document Images</label>
                    
                    <div className="mt-2 flex items-center gap-3">
                      <label className="cursor-pointer bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-medium px-4 py-2.5 rounded-lg text-sm transition-colors flex items-center gap-2">
                         {imageUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                         {imageUploading ? "Processing Images..." : "Upload New Images"}
                         <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={imageUploading} />
                      </label>
                      <span className="text-xs text-slate-500 italic">Select multiple images to replace the current documents.</span>
                    </div>

                    {parseImages(editFormData.idImageUrl).length > 0 && (
                       <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                         <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-2">✓ {parseImages(editFormData.idImageUrl).length} Document(s) Ready</p>
                         <div className="flex flex-wrap gap-2">
                           {parseImages(editFormData.idImageUrl).map((imgUrl, idx) => (
                             <a key={idx} href={imgUrl} target="_blank" rel="noopener noreferrer" className="relative group block w-14 h-14 rounded-md border border-slate-200 overflow-hidden shadow-sm">
                               <img src={imgUrl} alt={`Document ${idx+1}`} className="w-full h-full object-cover" />
                               <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                 <ExternalLink className="text-white w-4 h-4" />
                               </div>
                             </a>
                           ))}
                         </div>
                       </div>
                    )}
                  </div>
                </div>

              </form>
            </div>

            <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => setIsEditModalOpen(false)} 
                className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                form="editRiderForm"
                disabled={processingId === editingRider?.id || imageUploading} 
                className="px-5 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors text-sm disabled:opacity-50 flex items-center gap-2 shadow-md shadow-blue-600/20"
              >
                {processingId === editingRider?.id ? <Loader2 size={16} className="animate-spin" /> : "Save Changes"}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}