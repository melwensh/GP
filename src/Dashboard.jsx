import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// IMPORT ADDED: getActiveDoctorSession to get the current doctor's details
import { getPatients, deletePatient, getActiveDoctorSession } from './dataService';

export default function Dashboard() {
  const [patients, setPatients] = useState([]);
  const [doctorName, setDoctorName] = useState('');
  const navigate = useNavigate();

  useEffect(() => { 
    // 1. Security Check: Ensure a doctor is actually logged in
    const activeDoctor = getActiveDoctorSession();
    if (activeDoctor) {
      // Set the doctor's name for the welcome message
      setDoctorName(activeDoctor.name);
    } else {
      // Redirect to login if no active session is found
      navigate('/');
      return; // Stop execution
    }

    // 2. Fetch ONLY the patients belonging to this specific doctor
    // (This works automatically via our updated dataService.js logic)
    setPatients(getPatients()); 
  }, [navigate]);

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete ${name} and ALL their EEG records?`)) {
      // Delete the patient and their records
      deletePatient(id);
      // Refresh the list to update the UI
      setPatients(getPatients()); 
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div>
          {/* Dynamic Welcome Message */}
          <h1>Welcome, Dr. {doctorName}</h1>
          <p className="subtitle">Select a patient to view their EEG history</p>
        </div>
        <button onClick={() => navigate('/add-patient')} className="primary-btn small-btn">+ Add Patient</button>
      </div>
      
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr><th>ID</th><th>Patient Name</th><th>Age</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {/* Elegant Empty State: Show a message if the doctor has no patients yet */}
            {patients.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                  No patients found. Click "+ Add Patient" to get started.
                </td>
              </tr>
            ) : (
              // Map through the doctor's patients if they exist
              patients.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.id}</strong></td><td>{p.name}</td><td>{p.age}</td>
                  <td>
                    <div className="action-buttons" style={{ gap: '0.5rem' }}>
                      <button onClick={() => navigate(`/patient/${p.id}`)} className="primary-btn small-btn">View History</button>
                      <button onClick={() => handleDelete(p.id, p.name)} className="danger-btn small-btn">Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}