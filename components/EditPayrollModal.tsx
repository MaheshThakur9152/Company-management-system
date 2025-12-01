import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign } from 'lucide-react';
import { Employee } from '../types';

interface EditPayrollModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSave: (updatedEmployee: Employee) => void;
}

const EditPayrollModal: React.FC<EditPayrollModalProps> = ({ isOpen, employee, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    baseSalary: 0,
    isDailyRated: false,
    dailyRateOverride: 0,
    advance: 0,
    uniform: 0,
    shoes: 0,
    idCard: 0,
    cbre: 0,
    others: 0
  });

  useEffect(() => {
    if (employee) {
      const details = employee.salaryDetails || {};
      const ded = details.deductionBreakdown || {};
      
      setFormData({
        baseSalary: details.baseSalary || 0,
        isDailyRated: details.isDailyRated || false,
        dailyRateOverride: details.dailyRateOverride || 0,
        advance: ded.advance || 0,
        uniform: ded.uniform || 0,
        shoes: ded.shoes || 0,
        idCard: ded.idCard || 0,
        cbre: ded.cbre || 0,
        others: ded.others || 0
      });
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedEmployee: Employee = {
      ...employee,
      salaryDetails: {
        ...employee.salaryDetails,
        baseSalary: formData.baseSalary,
        isDailyRated: formData.isDailyRated,
        dailyRateOverride: formData.dailyRateOverride,
        deductionBreakdown: {
          advance: formData.advance,
          uniform: formData.uniform,
          shoes: formData.shoes,
          idCard: formData.idCard,
          cbre: formData.cbre,
          others: formData.others
        }
      }
    };
    
    onSave(updatedEmployee);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-200">
        <div className="bg-primary px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold text-lg">Edit Payroll: {employee.name}</h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* Salary Base */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
            <h4 className="font-bold text-gray-700 text-sm uppercase flex items-center gap-2">
              <DollarSign size={14} /> Base Salary
            </h4>
            
            <div className="flex items-center gap-2 mb-2">
              <input 
                type="checkbox" 
                id="isDaily"
                checked={formData.isDailyRated}
                onChange={e => setFormData({...formData, isDailyRated: e.target.checked})}
                className="rounded text-primary focus:ring-primary"
              />
              <label htmlFor="isDaily" className="text-sm text-gray-600">Is Daily Rated?</label>
            </div>

            {formData.isDailyRated ? (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Daily Rate Override</label>
                <input 
                  type="number" 
                  value={formData.dailyRateOverride}
                  onChange={e => setFormData({...formData, dailyRateOverride: Number(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Monthly Base Salary</label>
                <input 
                  type="number" 
                  value={formData.baseSalary}
                  onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                />
                <p className="text-[10px] text-gray-400 mt-1">Daily Rate = Base / 31</p>
              </div>
            )}
          </div>

          {/* Deductions */}
          <div className="bg-red-50 p-4 rounded-lg border border-red-100 space-y-3">
            <h4 className="font-bold text-red-700 text-sm uppercase">Deductions</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Advance</label>
                <input 
                  type="number" 
                  value={formData.advance}
                  onChange={e => setFormData({...formData, advance: Number(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Uniform</label>
                <input 
                  type="number" 
                  value={formData.uniform}
                  onChange={e => setFormData({...formData, uniform: Number(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Shoes</label>
                <input 
                  type="number" 
                  value={formData.shoes}
                  onChange={e => setFormData({...formData, shoes: Number(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">ID Card</label>
                <input 
                  type="number" 
                  value={formData.idCard}
                  onChange={e => setFormData({...formData, idCard: Number(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">CBRE Dedu</label>
                <input 
                  type="number" 
                  value={formData.cbre}
                  onChange={e => setFormData({...formData, cbre: Number(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Others</label>
                <input 
                  type="number" 
                  value={formData.others}
                  onChange={e => setFormData({...formData, others: Number(e.target.value)})}
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button 
              type="submit"
              className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-teal-600 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-teal-500/30"
            >
              <Save size={18} /> Save Changes
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default EditPayrollModal;
