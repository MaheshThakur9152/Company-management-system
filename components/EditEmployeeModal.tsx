
import React, { useState, useEffect } from 'react';
import { X, Save, User, MapPin, Briefcase, Calendar, Upload } from 'lucide-react';
import { Employee, Site } from '../types';
import { getSites } from '../services/mockData';

interface EditEmployeeModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSave: (employee: Employee) => void;
  defaultSiteId?: string;
}

const EditEmployeeModal: React.FC<EditEmployeeModalProps> = ({ isOpen, employee, onClose, onSave, defaultSiteId }) => {
  const [sites, setSites] = useState<Site[]>([]);
  
  const [formData, setFormData] = useState<Partial<Employee>>({
    role: 'Janitor',
    weeklyOff: 'Sunday',
    status: 'Active',
    photoUrl: ''
  });

  useEffect(() => {
    const loadData = async () => {
        // Fetch dynamic sites
        const loadedSites = await getSites();
        setSites(loadedSites);

        if (employee) {
            setFormData(employee);
        } else {
            // Reset for new employee
            setFormData({
                id: Date.now().toString(),
                role: 'Janitor',
                siteId: defaultSiteId && defaultSiteId !== 'all' ? defaultSiteId : (loadedSites.length > 0 ? loadedSites[0].id : ''),
                weeklyOff: 'Sunday',
                status: 'Active',
                // Default placeholder for new staff
                photoUrl: 'https://ui-avatars.com/api/?name=New+Staff&background=random',
                name: '',
                biometricCode: '',
                joiningDate: new Date().toISOString().split('T')[0],
                bankDetails: {
                    accountNumber: '',
                    ifscCode: '',
                    bankName: '',
                    branchName: ''
                }
            });
        }
    };
    loadData();
  }, [employee, isOpen]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB Limit check
        alert("File size is too large. Please select an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, photoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  if (!isOpen) return null;

  const handleChange = (field: keyof Employee, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (!formData.name || !formData.biometricCode) {
        alert("Name and Biometric Code are required.");
        return;
    }
    if (!formData.siteId) {
        alert("Please assign a site.");
        return;
    }
    onSave(formData as Employee);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-primary px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <User size={20} /> {employee ? 'Edit Staff' : 'Add New Staff'}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          
          {/* Photo & Basic Info */}
          <div className="flex gap-4 items-start">
             <div className="relative group w-20 h-20 flex-shrink-0">
                <div className="w-full h-full rounded-full overflow-hidden bg-gray-100 border-2 border-primary/20 shadow-inner relative">
                    <img src={formData.photoUrl} alt="Preview" className="w-full h-full object-cover" />
                    
                    {/* Overlay for Upload */}
                    <label className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10">
                        <Upload size={20} className="text-white mb-1" />
                        <span className="text-[10px] text-white font-bold uppercase tracking-wider">Upload</span>
                        <input 
                            type="file" 
                            accept="image/png, image/jpeg, image/jpg" 
                            className="hidden" 
                            onChange={handlePhotoUpload}
                        />
                    </label>
                </div>
             </div>

             <div className="flex-1 space-y-3">
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Full Name *</label>
                    <input 
                        value={formData.name || ''}
                        onChange={(e) => handleChange('name', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none font-medium"
                        placeholder="e.g. Rahul Sharma"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Biometric Code *</label>
                    <input 
                        value={formData.biometricCode || ''}
                        onChange={(e) => handleChange('biometricCode', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none font-mono"
                        placeholder="e.g. 3765"
                    />
                 </div>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Briefcase size={12} /> Role
                </label>
                <select 
                    value={formData.role}
                    onChange={(e) => handleChange('role', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-primary"
                >
                    <option value="Janitor">Janitor</option>
                    <option value="Key Supervisor">Key Supervisor</option>
                    <option value="Security">Security</option>
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <MapPin size={12} /> Assigned Site
                </label>
                <select 
                    value={formData.siteId}
                    onChange={(e) => handleChange('siteId', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-primary"
                >
                    {sites.map(site => (
                        <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                </select>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Weekly Off</label>
                <select 
                    value={formData.weeklyOff}
                    onChange={(e) => handleChange('weeklyOff', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white outline-none focus:ring-2 focus:ring-primary"
                >
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                        <option key={day} value={day}>{day}</option>
                    ))}
                </select>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                    <Calendar size={12} /> Joining Date
                </label>
                <input 
                    type="date"
                    value={formData.joiningDate}
                    onChange={(e) => handleChange('joiningDate', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                />
             </div>
          </div>

          {/* --- NEW FIELDS: Aadhar, PAN, Bank --- */}
          <div className="space-y-3 pt-2 border-t border-gray-100">
             <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Identity & Banking</h3>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Aadhar Number</label>
                    <input 
                        value={formData.aadharNumber || ''}
                        onChange={(e) => handleChange('aadharNumber', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
                        placeholder="XXXX XXXX XXXX"
                        maxLength={12}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">PAN Number</label>
                    <input 
                        value={formData.panNumber || ''}
                        onChange={(e) => handleChange('panNumber', e.target.value.toUpperCase())}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none font-mono text-sm uppercase"
                        placeholder="ABCDE1234F"
                        maxLength={10}
                    />
                </div>
             </div>

             <div className="bg-blue-50/50 p-3 rounded-lg border border-blue-100 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Bank Name</label>
                        <input 
                            value={formData.bankDetails?.bankName || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                bankDetails: { ...prev.bankDetails!, bankName: e.target.value }
                            }))}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                            placeholder="e.g. HDFC Bank"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Branch Name</label>
                        <input 
                            value={formData.bankDetails?.branchName || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                bankDetails: { ...prev.bankDetails!, branchName: e.target.value }
                            }))}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none"
                            placeholder="e.g. Andheri West"
                        />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Account Number</label>
                        <input 
                            value={formData.bankDetails?.accountNumber || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                bankDetails: { ...prev.bankDetails!, accountNumber: e.target.value }
                            }))}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none font-mono"
                            placeholder="0000000000"
                        />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">IFSC Code</label>
                        <input 
                            value={formData.bankDetails?.ifscCode || ''}
                            onChange={(e) => setFormData(prev => ({
                                ...prev,
                                bankDetails: { ...prev.bankDetails!, ifscCode: e.target.value.toUpperCase() }
                            }))}
                            className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-1 focus:ring-primary outline-none font-mono uppercase"
                            placeholder="HDFC0001234"
                        />
                    </div>
                </div>
             </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Status</label>
            <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer group">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.status === 'Active' ? 'border-primary' : 'border-gray-300'}`}>
                        {formData.status === 'Active' && <div className="w-2 h-2 rounded-full bg-primary" />}
                    </div>
                    <input 
                        type="radio" 
                        checked={formData.status === 'Active'} 
                        onChange={() => handleChange('status', 'Active')}
                        className="hidden"
                    />
                    <span className={`text-sm font-medium ${formData.status === 'Active' ? 'text-primary' : 'text-gray-600'}`}>Active</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                     <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${formData.status === 'Inactive' ? 'border-gray-500' : 'border-gray-300'}`}>
                        {formData.status === 'Inactive' && <div className="w-2 h-2 rounded-full bg-gray-500" />}
                    </div>
                    <input 
                        type="radio" 
                        checked={formData.status === 'Inactive'} 
                        onChange={() => handleChange('status', 'Inactive')}
                        className="hidden"
                    />
                    <span className={`text-sm font-medium ${formData.status === 'Inactive' ? 'text-gray-800' : 'text-gray-600'}`}>Inactive</span>
                </label>
            </div>
            
            {formData.status === 'Inactive' && (
                <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center gap-1">
                        <Calendar size={12} /> Leaving Date
                    </label>
                    <input 
                        type="date"
                        value={formData.leavingDate || new Date().toISOString().split('T')[0]}
                        onChange={(e) => handleChange('leavingDate', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            )}
          </div>

        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-teal-600 flex items-center gap-2 shadow-sm active:scale-95 transition-all"
          >
            <Save size={18} /> {employee ? 'Update Staff' : 'Add Staff'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditEmployeeModal;
