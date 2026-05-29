// --- DOCTOR AUTH & PROFILE ---
export const registerDoctor = (name, email, password, phone, hospital) => {
  const doctors = JSON.parse(localStorage.getItem('eeg_doctors')) || [];
  
  if (doctors.some(doc => doc.email === email)) {
    return { success: false, message: "This email is already registered." };
  }
  
  doctors.push({ name, email, password, phone, hospital }); 
  localStorage.setItem('eeg_doctors', JSON.stringify(doctors));
  return { success: true };
};

export const loginDoctor = (email, password) => {
  const doctors = JSON.parse(localStorage.getItem('eeg_doctors')) || [];
  const doctor = doctors.find(doc => doc.email === email && doc.password === password);
  
  if (doctor) {
    localStorage.setItem('active_doctor', JSON.stringify({ name: doctor.name, email: doctor.email }));
    return { success: true, doctor };
  }
  
  return { success: false, message: "Invalid email or password." };
};

export const logoutDoctor = () => localStorage.removeItem('active_doctor');

export const getActiveDoctorSession = () => JSON.parse(localStorage.getItem('active_doctor'));

export const getDoctorProfile = (email) => {
  const doctors = JSON.parse(localStorage.getItem('eeg_doctors')) || [];
  return doctors.find(doc => doc.email === email);
};

export const updateDoctorProfile = (originalEmail, updatedData) => {
  let doctors = JSON.parse(localStorage.getItem('eeg_doctors')) || [];
  const index = doctors.findIndex(doc => doc.email === originalEmail);
  
  if (index !== -1) {
    if (originalEmail !== updatedData.email && doctors.some(d => d.email === updatedData.email)) {
      return { success: false, message: "Email in use." };
    }
    doctors[index] = { ...doctors[index], ...updatedData };
    localStorage.setItem('eeg_doctors', JSON.stringify(doctors));
    localStorage.setItem('active_doctor', JSON.stringify({ name: updatedData.name, email: updatedData.email }));
    return { success: true };
  }
  return { success: false, message: "Account not found." };
};

// --- HELPER FUNCTIONS (Internal use only) ---
// Gets absolutely all patients from the storage
const getAllPatientsRaw = () => JSON.parse(localStorage.getItem('eeg_patients')) || [];
// Gets absolutely all records from the storage
const getAllRecordsRaw = () => JSON.parse(localStorage.getItem('eeg_records')) || [];


// --- PATIENT MANAGEMENT ---

// Returns only the patients linked to the currently active doctor
export const getPatients = () => {
  const allPatients = getAllPatientsRaw();
  const activeDoctor = getActiveDoctorSession();
  
  if (!activeDoctor) return [];
  
  // Filter patients so the doctor only sees their own
  return allPatients.filter(p => p.doctorEmail === activeDoctor.email);
};

export const getPatientById = (id) => getPatients().find(p => p.id === id);

// Tags the new patient with the active doctor's email and calculates a scoped ID
export const addPatient = (patient) => {
  const allPatients = getAllPatientsRaw();
  const activeDoctor = getActiveDoctorSession();
  
  if (activeDoctor) {
    patient.doctorEmail = activeDoctor.email; // Link patient to this doctor
  }

  // Calculate Auto-Increment ID based ONLY on this doctor's patients
  const doctorPatients = activeDoctor 
    ? allPatients.filter(p => p.doctorEmail === activeDoctor.email)
    : allPatients;

  let nextIdNumber = 1;
  if (doctorPatients.length > 0) {
    const maxId = Math.max(...doctorPatients.map(p => {
      // Extract the number from the ID
      const num = parseInt(String(p.id).replace(/[^0-9]/g, ''), 10);
      return isNaN(num) ? 0 : num;
    }));
    nextIdNumber = maxId + 1;
  }
  
  // Assign the scoped ID to the patient (if not already set manually)
  if (!patient.id) {
    patient.id = nextIdNumber.toString(); 
  }
  
  allPatients.push(patient);
  localStorage.setItem('eeg_patients', JSON.stringify(allPatients));
};

// Deletes safely from the raw list so other doctors' data isn't lost
export const deletePatient = (id) => {
  const allPatients = getAllPatientsRaw();
  localStorage.setItem('eeg_patients', JSON.stringify(allPatients.filter(p => p.id !== id)));
  
  const allRecords = getAllRecordsRaw();
  localStorage.setItem('eeg_records', JSON.stringify(allRecords.filter(r => r.patientId !== id)));
};


// --- RECORD MANAGEMENT ---

// Returns only records for patients that belong to the active doctor
export const getRecords = () => {
  const allRecords = getAllRecordsRaw();
  const activeDoctor = getActiveDoctorSession();
  
  if (!activeDoctor) return [];
  
  return allRecords.filter(r => r.doctorEmail === activeDoctor.email);
};

export const getRecordsByPatient = (patientId) => getRecords().filter(r => r.patientId === patientId);

export const getRecordById = (id) => getRecords().find(r => r.id === id);

// Calculates REC- ID based ONLY on this doctor's records
export const addRecord = (record) => {
  const allRecords = getAllRecordsRaw();
  const activeDoctor = getActiveDoctorSession();
  
  // Link this record to the current doctor
  if (activeDoctor) {
    record.doctorEmail = activeDoctor.email;
  }
  
  // Get ONLY the records for the current logged-in doctor
  const doctorRecords = activeDoctor 
    ? allRecords.filter(r => r.doctorEmail === activeDoctor.email)
    : allRecords;
    
  // Calculate the next ID based ONLY on this doctor's records
  let nextIdNumber = 1; 
  
  if (doctorRecords.length > 0) {
    const maxId = Math.max(...doctorRecords.map(r => {
      const num = parseInt(String(r.id).replace('REC-', ''), 10);
      return isNaN(num) ? 0 : num;
    }));
    
    nextIdNumber = maxId + 1; 
  }

  // Save to the main array with the scoped ID
  allRecords.push({ ...record, id: 'REC-' + nextIdNumber });
  localStorage.setItem('eeg_records', JSON.stringify(allRecords));
};

// Deletes safely from the raw list
export const deleteRecord = (id) => {
  const allRecords = getAllRecordsRaw();
  localStorage.setItem('eeg_records', JSON.stringify(allRecords.filter(r => r.id !== id)));
};