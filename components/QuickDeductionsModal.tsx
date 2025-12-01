import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign } from 'lucide-react';
import { Employee } from '../types';

interface QuickDeductionsModalProps {
  isOpen: boolean;
  employee: Employee | null;
  onClose: () => void;
  onSave: (updatedEmp: Employee) => void;
}

const QuickDeductionsModal: React.FC<QuickDeductionsModalProps> = ({ isOpen, employee, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    advance: 0,
    uniform: 0,
    shoes: 0,
    others: 0
  });

  useEffect(() => {
    if (employee && employee.salaryDetails?.deductionBreakdown) {
      setFormData({
        advance: employee.salaryDetails.deductionBreakdown.advance || 0,
        uniform: employee.salaryDetails.deductionBreakdown.uniform || 0,
        shoes: employee.salaryDetails.deductionBreakdown.shoes || 0,
        others: employee.salaryDetails.deductionBreakdown.others || 0
      });
    } else {
      setFormData({ advance: 0, uniform: 0, shoes: 0, others: 0 });
    }
  }, [employee]);

  if (!isOpen || !employee) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedEmp: Employee = {
      ...employee,
      salaryDetails: {
        ...employee.salaryDetails,
        deductionBreakdown: {
          ...employee.salaryDetails?.deductionBreakdown,
          ...formData
        }
      }
    };
    onSave(updatedEmp);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-primary px-6 py-4 flex justify-between items-center">
          <h3 className="text-white font-bold flex items-center gap-2">
            <DollarSign size={20} /> Deductions: {employee.name}
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Advance</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input 
                  type="number" 
                  value={formData.advance || ''}
                  onChange={e => setFormData({...formData, advance: Number(e.target.value)})}
                  className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Uniform</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input 
                  type="number" 
                  value={formData.uniform || ''}
                  onChange={e => setFormData({...formData, uniform: Number(e.target.value)})}
                  className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Shoes</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input 
                  type="number" 
                  value={formData.shoes || ''}
                  onChange={e => setFormData({...formData, shoes: Number(e.target.value)})}
                  className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Other Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input 
                  type="number" 
                  value={formData.others || ''}
                  onChange={e => setFormData({...formData, others: Number(e.target.value)})}
                  className="w-full pl-7 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
              Cancel
            </button>
            <button type="submit" className="flex-1 px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-700 font-medium flex items-center justify-center gap-2">
              <Save size={18} /> Save Deductions
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickDeductionsModal;
