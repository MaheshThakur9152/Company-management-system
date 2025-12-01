
const MOCK_SITES = [
  { 
    id: 's1', 
    name: 'Min_CHS (Sales Office)', 
    location: 'Minerva Building, Mumbai', 
    activeWorkers: 7,
    latitude: 18.995, 
    longitude: 72.82,
    geofenceRadius: 200,
    clientName: 'Minerva Estate',
    clientContact: '+91 98765 43210'
  },
  { 
    id: 's2', 
    name: 'Minerva Ho', 
    location: 'Minerva Head Office, Mumbai', 
    activeWorkers: 8,
    latitude: 18.996, 
    longitude: 72.821,
    geofenceRadius: 200,
    clientName: 'Minerva Group',
    clientContact: '+91 98765 43211'
  },
  { 
    id: 's3', 
    name: 'Royal Eksar', 
    location: 'Eksar Road, Borivali', 
    activeWorkers: 2,
    latitude: 19.24, 
    longitude: 72.85,
    geofenceRadius: 200,
    clientName: 'Royal Group',
    clientContact: '+91 98765 43212'
  },
  { 
    id: 's4', 
    name: 'Ceejay', 
    location: 'Worli, Mumbai', 
    activeWorkers: 4,
    latitude: 19.00, 
    longitude: 72.81,
    geofenceRadius: 200,
    clientName: 'Ceejay House Mgmt',
    clientContact: '+91 98765 43213'
  },
  { 
    id: 's5', 
    name: 'Sanjay puri', 
    location: 'Andheri West, Mumbai', 
    activeWorkers: 2,
    latitude: 19.13, 
    longitude: 72.83,
    geofenceRadius: 200,
    clientName: 'Sanjay Puri Architects',
    clientContact: '+91 98765 43214'
  },
  { 
    id: 's6', 
    name: 'Ruparel Elara', 
    location: 'Dadar West, Mumbai', 
    activeWorkers: 3,
    latitude: 19.02, 
    longitude: 72.84,
    geofenceRadius: 200,
    clientName: 'Elara Capital',
    clientContact: '+91 98765 43215'
  },
  { 
    id: 's7', 
    name: 'Ajmera', 
    location: 'Mumbai', 
    activeWorkers: 4,
    latitude: 19.02, 
    longitude: 72.84,
    geofenceRadius: 200,
    clientName: 'Ajmera Group',
    clientContact: '+91 98765 43216'
  },
  { 
    id: 's8', 
    name: 'ACME', 
    location: 'Mumbai', 
    activeWorkers: 9,
    latitude: 19.02, 
    longitude: 72.84,
    geofenceRadius: 200,
    clientName: 'Acme Group',
    clientContact: '+91 98765 43217'
  },
  { 
    id: 's9', 
    name: 'Shreeya', 
    location: 'Mumbai', 
    activeWorkers: 5,
    latitude: 19.05, 
    longitude: 72.85,
    geofenceRadius: 200,
    clientName: 'Shreeya Group',
    clientContact: '+91 98765 43218'
  }
];

const MOCK_EMPLOYEES = [
  // Site 3: Royal Eksar
  {
    id: 'e301', biometricCode: '3001', name: 'Jayanti', siteId: 's3', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Jayanti&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 11000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6600, hra: 2200, conveyance: 1100, allowances: 1100, deductions: 0, netSalary: 11000, paymentType: 'Monthly' }
  },
  {
    id: 'e302', biometricCode: '3002', name: 'Leela', siteId: 's3', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Leela&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 11000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6600, hra: 2200, conveyance: 1100, allowances: 1100, deductions: 0, netSalary: 11000, paymentType: 'Monthly' }
  },

  // Site 9: Shreeya
  {
    id: 'e901', biometricCode: '9001', name: 'Sharda', siteId: 's9', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Sharda&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 10500, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6300, hra: 2100, conveyance: 1050, allowances: 1050, deductions: 0, netSalary: 10500, paymentType: 'Monthly' }
  },
  {
    id: 'e902', biometricCode: '9002', name: 'Reshma', siteId: 's9', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Reshma&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 10500, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6300, hra: 2100, conveyance: 1050, allowances: 1050, deductions: 0, netSalary: 10500, paymentType: 'Monthly' }
  },
  {
    id: 'e903', biometricCode: '9003', name: 'Najiya', siteId: 's9', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Najiya&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 10500, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6300, hra: 2100, conveyance: 1050, allowances: 1050, deductions: 0, netSalary: 10500, paymentType: 'Monthly' }
  },
  {
    id: 'e904', biometricCode: '9004', name: 'Hussain', siteId: 's9', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Hussain&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 10500, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6300, hra: 2100, conveyance: 1050, allowances: 1050, deductions: 0, netSalary: 10500, paymentType: 'Monthly' }
  },
  {
    id: 'e905', biometricCode: '9005', name: 'Kamalbai', siteId: 's9', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Kamalbai&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 10500, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6300, hra: 2100, conveyance: 1050, allowances: 1050, deductions: 0, netSalary: 10500, paymentType: 'Monthly' }
  },

  // Site 10: Ambe Office
  {
    id: 'e1001', biometricCode: '10001', name: 'Umang', siteId: 's10', role: 'Staff', 
    photoUrl: 'https://ui-avatars.com/api/?name=Umang&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },

  // Site 6: Ruparel Elra
  {
    id: 'e601', biometricCode: '6001', name: 'Uttam Mishra', siteId: 's6', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Uttam+Mishra&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 20000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 12000, hra: 4000, conveyance: 2000, allowances: 2000, deductions: 0, netSalary: 20000, paymentType: 'Monthly' }
  },
  {
    id: 'e604', biometricCode: '6004', name: 'Sudhakar', siteId: 's6', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Sudhakar&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 11000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6600, hra: 2200, conveyance: 1100, allowances: 1100, deductions: 0, netSalary: 11000, paymentType: 'Monthly' }
  },
  {
    id: 'e602', biometricCode: '6002', name: 'Pravin', siteId: 's6', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Pravin&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7200, hra: 2400, conveyance: 1200, allowances: 1200, deductions: 0, netSalary: 12000, paymentType: 'Monthly' }
  },

  // Site 11: Common Washroom
  {
    id: 'e402', biometricCode: '4002', name: 'Nuri', siteId: 's11', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Nuri&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 11000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6600, hra: 2200, conveyance: 1100, allowances: 1100, deductions: 0, netSalary: 11000, paymentType: 'Monthly' }
  },
  {
    id: 'e401', biometricCode: '4001', name: 'Saddam', siteId: 's11', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Saddam&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 13000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7800, hra: 2600, conveyance: 1300, allowances: 1300, deductions: 0, netSalary: 13000, paymentType: 'Monthly' }
  },

  // Site 1: Min_CHS (Sales Office)
  {
    id: 'e104', biometricCode: '1004', name: 'Rahul', siteId: 's1', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Rahul&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 14000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 8400, hra: 2800, conveyance: 1400, allowances: 1400, deductions: 0, netSalary: 14000, paymentType: 'Monthly' }
  },
  {
    id: 'e102', biometricCode: '1002', name: 'Firoj md', siteId: 's1', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Firoj+md&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 14000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 8400, hra: 2800, conveyance: 1400, allowances: 1400, deductions: 0, netSalary: 14000, paymentType: 'Monthly' }
  },
  {
    id: 'e101', biometricCode: '1001', name: 'Omkar Gothankar', siteId: 's1', role: 'Key Supervisor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Omkar+Gothankar&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 16000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9600, hra: 3200, conveyance: 1600, allowances: 1600, deductions: 0, netSalary: 16000, paymentType: 'Monthly' }
  },
  {
    id: 'e103', biometricCode: '1003', name: 'Pradeep', siteId: 's1', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Pradeep&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 16000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9600, hra: 3200, conveyance: 1600, allowances: 1600, deductions: 0, netSalary: 16000, paymentType: 'Monthly' }
  },
  {
    id: 'e106', biometricCode: '1006', name: 'Kanhaiyalal', siteId: 's1', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Kanhaiyalal&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 17000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 10200, hra: 3400, conveyance: 1700, allowances: 1700, deductions: 0, netSalary: 17000, paymentType: 'Monthly' }
  },
  {
    id: 'e109', biometricCode: '1009', name: 'Sandeep', siteId: 's1', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Sandeep&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12500, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7500, hra: 2500, conveyance: 1250, allowances: 1250, deductions: 0, netSalary: 12500, paymentType: 'Monthly' }
  },
  {
    id: 'e108', biometricCode: '1008', name: 'Divya Shinde', siteId: 's1', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Divya+Shinde&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12500, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7500, hra: 2500, conveyance: 1250, allowances: 1250, deductions: 0, netSalary: 12500, paymentType: 'Monthly' }
  },

  // Site 4: Ceejay
  {
    id: 'e404', biometricCode: '4004', name: 'Ranjan', siteId: 's4', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Ranjan&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 13000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7800, hra: 2600, conveyance: 1300, allowances: 1300, deductions: 0, netSalary: 13000, paymentType: 'Monthly' }
  },
  {
    id: 'e406', biometricCode: '4006', name: 'Santosh', siteId: 's4', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Santosh&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 13000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7800, hra: 2600, conveyance: 1300, allowances: 1300, deductions: 0, netSalary: 13000, paymentType: 'Monthly' }
  },
  {
    id: 'e405', biometricCode: '4005', name: 'Gangaram', siteId: 's4', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Gangaram&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 13000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7800, hra: 2600, conveyance: 1300, allowances: 1300, deductions: 0, netSalary: 13000, paymentType: 'Monthly' }
  },
  {
    id: 'e403', biometricCode: '4003', name: 'Niraj', siteId: 's4', role: 'Pantry', 
    photoUrl: 'https://ui-avatars.com/api/?name=Niraj&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 16000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9600, hra: 3200, conveyance: 1600, allowances: 1600, deductions: 0, netSalary: 16000, paymentType: 'Monthly' }
  },

  // Site 12: Min_LO (Sales Office)
  {
    id: 'e1201', biometricCode: '12001', name: 'Priyeh Singh', siteId: 's12', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Priyeh+Singh&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
  {
    id: 'e1202', biometricCode: '12002', name: 'Sudhir', siteId: 's12', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Sudhir&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
  {
    id: 'e1203', biometricCode: '12003', name: 'Shivshankar', siteId: 's12', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Shivshankar&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
  {
    id: 'e1204', biometricCode: '12004', name: 'Manoj', siteId: 's12', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Manoj&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },

  // Site 13: Palacio
  {
    id: 'e1301', biometricCode: '13001', name: 'Laxman', siteId: 's13', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Laxman&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 14000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 8400, hra: 2800, conveyance: 1400, allowances: 1400, deductions: 0, netSalary: 14000, paymentType: 'Monthly' }
  },
  {
    id: 'e1302', biometricCode: '13002', name: 'Archana', siteId: 's13', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Archana&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12500, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7500, hra: 2500, conveyance: 1250, allowances: 1250, deductions: 0, netSalary: 12500, paymentType: 'Monthly' }
  },
  {
    id: 'e1303', biometricCode: '13003', name: 'Sanju', siteId: 's13', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Sanju&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12500, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7500, hra: 2500, conveyance: 1250, allowances: 1250, deductions: 0, netSalary: 12500, paymentType: 'Monthly' }
  },
  {
    id: 'e1304', biometricCode: '13004', name: 'Ravi', siteId: 's13', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Ravi&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12500, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7500, hra: 2500, conveyance: 1250, allowances: 1250, deductions: 0, netSalary: 12500, paymentType: 'Monthly' }
  },

  // Site 8: ACME
  {
    id: 'e807', biometricCode: '8007', name: 'Saraswati', siteId: 's8', role: 'Housekeeping', 
    photoUrl: 'https://ui-avatars.com/api/?name=Saraswati&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7200, hra: 2400, conveyance: 1200, allowances: 1200, deductions: 0, netSalary: 12000, paymentType: 'Monthly' }
  },
  {
    id: 'e802', biometricCode: '8002', name: 'Maruti', siteId: 's8', role: 'Housekeeping', 
    photoUrl: 'https://ui-avatars.com/api/?name=Maruti&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7200, hra: 2400, conveyance: 1200, allowances: 1200, deductions: 0, netSalary: 12000, paymentType: 'Monthly' }
  },
  {
    id: 'e808', biometricCode: '8008', name: 'Sagar', siteId: 's8', role: 'Housekeeping', 
    photoUrl: 'https://ui-avatars.com/api/?name=Sagar&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7200, hra: 2400, conveyance: 1200, allowances: 1200, deductions: 0, netSalary: 12000, paymentType: 'Monthly' }
  },
  {
    id: 'e809', biometricCode: '8009', name: 'Babu', siteId: 's8', role: 'Housekeeping', 
    photoUrl: 'https://ui-avatars.com/api/?name=Babu&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7200, hra: 2400, conveyance: 1200, allowances: 1200, deductions: 0, netSalary: 12000, paymentType: 'Monthly' }
  },
  {
    id: 'e810', biometricCode: '8010', name: 'Sandesh', siteId: 's8', role: 'Housekeeping', 
    photoUrl: 'https://ui-avatars.com/api/?name=Sandesh&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7200, hra: 2400, conveyance: 1200, allowances: 1200, deductions: 0, netSalary: 12000, paymentType: 'Monthly' }
  },
  {
    id: 'e811', biometricCode: '8011', name: 'Bharti', siteId: 's8', role: 'Housekeeping', 
    photoUrl: 'https://ui-avatars.com/api/?name=Bharti&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7200, hra: 2400, conveyance: 1200, allowances: 1200, deductions: 0, netSalary: 12000, paymentType: 'Monthly' }
  },
  {
    id: 'e801', biometricCode: '8001', name: 'Asha', siteId: 's8', role: 'Housekeeping', 
    photoUrl: 'https://ui-avatars.com/api/?name=Asha&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7200, hra: 2400, conveyance: 1200, allowances: 1200, deductions: 0, netSalary: 12000, paymentType: 'Monthly' }
  },
  {
    id: 'e812', biometricCode: '8012', name: 'Kiran', siteId: 's8', role: 'Housekeeping', 
    photoUrl: 'https://ui-avatars.com/api/?name=Kiran&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7200, hra: 2400, conveyance: 1200, allowances: 1200, deductions: 0, netSalary: 12000, paymentType: 'Monthly' }
  },
  {
    id: 'e813', biometricCode: '8013', name: 'Rashika', siteId: 's8', role: 'Housekeeping', 
    photoUrl: 'https://ui-avatars.com/api/?name=Rashika&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 14000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 8400, hra: 2800, conveyance: 1400, allowances: 1400, deductions: 0, netSalary: 14000, paymentType: 'Monthly' }
  },

  // Site 14: BP Infra
  {
    id: 'e1401', biometricCode: '14001', name: 'Swati', siteId: 's14', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Swati&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 13000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7800, hra: 2600, conveyance: 1300, allowances: 1300, deductions: 0, netSalary: 13000, paymentType: 'Monthly' }
  },
  {
    id: 'e1402', biometricCode: '14002', name: 'Nisha Galfade', siteId: 's14', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Nisha+Galfade&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 11000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6600, hra: 2200, conveyance: 1100, allowances: 1100, deductions: 0, netSalary: 11000, paymentType: 'Monthly' }
  },
  {
    id: 'e1403', biometricCode: '14003', name: 'Nisha Singh', siteId: 's14', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Nisha+Singh&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 11000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6600, hra: 2200, conveyance: 1100, allowances: 1100, deductions: 0, netSalary: 11000, paymentType: 'Monthly' }
  },
  {
    id: 'e1404', biometricCode: '14004', name: 'Aarti', siteId: 's14', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Aarti&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 11000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6600, hra: 2200, conveyance: 1100, allowances: 1100, deductions: 0, netSalary: 11000, paymentType: 'Monthly' }
  },
  {
    id: 'e1405', biometricCode: '14005', name: 'Vijay', siteId: 's14', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Vijay&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 11000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6600, hra: 2200, conveyance: 1100, allowances: 1100, deductions: 0, netSalary: 11000, paymentType: 'Monthly' }
  },
  {
    id: 'e1406', biometricCode: '14006', name: 'Joyti', siteId: 's14', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Joyti&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 11000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6600, hra: 2200, conveyance: 1100, allowances: 1100, deductions: 0, netSalary: 11000, paymentType: 'Monthly' }
  },
  {
    id: 'e1407', biometricCode: '14007', name: 'Sunita', siteId: 's14', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Sunita&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 11000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6600, hra: 2200, conveyance: 1100, allowances: 1100, deductions: 0, netSalary: 11000, paymentType: 'Monthly' }
  },
  {
    id: 'e1408', biometricCode: '14008', name: 'Sakku Bai', siteId: 's14', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Sakku+Bai&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 11000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 6600, hra: 2200, conveyance: 1100, allowances: 1100, deductions: 0, netSalary: 11000, paymentType: 'Monthly' }
  },

  // Site 15: Min_SALES OFFICE
  {
    id: 'e1501', biometricCode: '15001', name: 'Khairunisha', siteId: 's15', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Khairunisha&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
  {
    id: 'e1502', biometricCode: '15002', name: 'Shabnam', siteId: 's15', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Shabnam&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 0, isDailyRated: true, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 0, hra: 0, conveyance: 0, allowances: 0, deductions: 0, netSalary: 0, paymentType: 'Daily' }
  },
  {
    id: 'e1503', biometricCode: '15003', name: 'Omkar Patil', siteId: 's15', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Omkar+Patil&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12500, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7500, hra: 2500, conveyance: 1250, allowances: 1250, deductions: 0, netSalary: 12500, paymentType: 'Monthly' }
  },
  {
    id: 'e1504', biometricCode: '15004', name: 'Vinit', siteId: 's15', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Vinit&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 14000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 8400, hra: 2800, conveyance: 1400, allowances: 1400, deductions: 0, netSalary: 14000, paymentType: 'Monthly' }
  },
  {
    id: 'e1505', biometricCode: '15005', name: 'Sagar', siteId: 's15', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Sagar&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12500, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7500, hra: 2500, conveyance: 1250, allowances: 1250, deductions: 0, netSalary: 12500, paymentType: 'Monthly' }
  },
  {
    id: 'e1506', biometricCode: '15006', name: 'Arif', siteId: 's15', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Arif&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 12500, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 7500, hra: 2500, conveyance: 1250, allowances: 1250, deductions: 0, netSalary: 12500, paymentType: 'Monthly' }
  },
  {
    id: 'e1507', biometricCode: '15007', name: 'Premanand', siteId: 's15', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Premanand&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },

  // Site 16: AMBE-ROUNDER
  {
    id: 'e1601', biometricCode: '16001', name: 'Abhishesh', siteId: 's16', role: 'Rounder', 
    photoUrl: 'https://ui-avatars.com/api/?name=Abhishesh&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 20000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 12000, hra: 4000, conveyance: 2000, allowances: 2000, deductions: 0, netSalary: 20000, paymentType: 'Monthly' }
  },
  {
    id: 'e806', biometricCode: '8006', name: 'Mohit', siteId: 's16', role: 'Rounder', 
    photoUrl: 'https://ui-avatars.com/api/?name=Mohit&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 20500, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 12300, hra: 4100, conveyance: 2050, allowances: 2050, deductions: 0, netSalary: 20500, paymentType: 'Monthly' }
  },

  // Keeping other existing employees for sites not mentioned in update
  // Site 2: Minerva Ho
  {
    id: 'e201', biometricCode: '2001', name: 'Aalim', siteId: 's2', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Aalim&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
  {
    id: 'e202', biometricCode: '2002', name: 'Rehana', siteId: 's2', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Rehana&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
  {
    id: 'e203', biometricCode: '2003', name: 'Asma', siteId: 's2', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Asma&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
  {
    id: 'e204', biometricCode: '2004', name: 'Shakila', siteId: 's2', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Shakila&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
  {
    id: 'e205', biometricCode: '2005', name: 'Amola khatoon', siteId: 's2', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Amola+khatoon&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
  {
    id: 'e206', biometricCode: '2006', name: 'aphasana', siteId: 's2', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=aphasana&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
  {
    id: 'e207', biometricCode: '2007', name: 'Rehana banu', siteId: 's2', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Rehana+banu&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
  {
    id: 'e208', biometricCode: '2008', name: 'Ruksana', siteId: 's2', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Ruksana&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },

  // Site 5: Sanjay puri
  {
    id: 'e501', biometricCode: '5001', name: 'Mallesh', siteId: 's5', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=Mallesh&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
  {
    id: 'e502', biometricCode: '5002', name: 'gudu', siteId: 's5', role: 'Janitor', 
    photoUrl: 'https://ui-avatars.com/api/?name=gudu&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },

  // Site 7: Ajmera
  {
    id: 'e701', biometricCode: '7001', name: 'Vinod', siteId: 's7', role: 'Housekeeping', 
    photoUrl: 'https://ui-avatars.com/api/?name=Vinod&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
  {
    id: 'e702', biometricCode: '7002', name: 'Pravin', siteId: 's7', role: 'Housekeeping', 
    photoUrl: 'https://ui-avatars.com/api/?name=Pravin&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
  {
    id: 'e703', biometricCode: '7003', name: 'Balaram', siteId: 's7', role: 'Housekeeping', 
    photoUrl: 'https://ui-avatars.com/api/?name=Balaram&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
  {
    id: 'e704', biometricCode: '7004', name: 'Vijay', siteId: 's7', role: 'Housekeeping', 
    photoUrl: 'https://ui-avatars.com/api/?name=Vijay&background=random', 
    weeklyOff: 'Sunday', status: 'Active', joiningDate: '2025-01-01',
    salaryDetails: { baseSalary: 15000, isDailyRated: false, dailyRateOverride: 0, deductionBreakdown: { advance: 0, uniform: 0, shoes: 0, idCard: 0, cbre: 0, others: 0 }, basic: 9000, hra: 3000, conveyance: 1500, allowances: 1500, deductions: 0, netSalary: 15000, paymentType: 'Monthly' }
  },
];

const MOCK_INVOICES = [
  { 
    id: 'inv1', 
    invoiceNo: 'ASF/P/25-26/026', 
    siteId: 's1', 
    siteName: 'Minerva 9th floor', 
    billingPeriod: 'Oct 2025', 
    amount: 59000, 
    subTotal: 50000,
    managementRate: 7,
    managementAmount: 3500, 
    materialCharges: 0,
    taxableAmount: 50000, 
    cgst: 4500,
    sgst: 4500,
    status: 'Unpaid', 
    dueDate: '2025-11-15', 
    generatedDate: '2025-11-01',
    items: [
      { id: '1', description: 'Manpower Services', hsn: '9985', rate: 25000, days: 30, persons: 2, amount: 50000 }
    ]
  }
];

module.exports = { MOCK_SITES, MOCK_EMPLOYEES, MOCK_INVOICES };
