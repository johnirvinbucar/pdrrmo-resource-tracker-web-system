import React, { useState, useEffect } from 'react';
import './ResourceTracker.css';

const ResourceTracker = () => {
  const [medics, setMedics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showOutOfServiceModal, setShowOutOfServiceModal] = useState(false);
  const [currentMedic, setCurrentMedic] = useState(null);
  const [editingNameId, setEditingNameId] = useState(null); // ID of the medic being edited
  const [editedName, setEditedName] = useState('');         // Temporary edited name

  const [assignForm, setAssignForm] = useState({
    name: '',
    teamLeader: '',
    contactNumber: '',
    members: '',
    assignedArea: ''
  });

  const [cause, setCause] = useState('');

  // Fetch medics from backend
  useEffect(() => {
    fetch("http://localhost:3001/api/resources")
      .then(res => res.json())
      .then(data => setMedics(data))
      .catch(err => console.error("Error fetching resources:", err));
  }, []);

  // Filter medics based on search term
  const filteredMedics = medics.filter(medic =>
    medic.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

const saveMedicName = (medicId) => {
const updatedMedic = {
  ...medics.find(m => m.id === medicId),
  name: editedName
};


  fetch(`http://localhost:3001/api/resources/${medicId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedMedic)
  })
    .then(res => res.json())
    .then(() => {
      setMedics(medics.map(m => (m.id === medicId ? updatedMedic : m)));
      setEditingNameId(null); // exit edit mode
      setEditedName('');
    })
    .catch(err => console.error("Error updating medic name:", err));
};
  

  // Handler functions
const handleAssign = (medic) => {
  setCurrentMedic(medic);
  setAssignForm({
    name: medic.name,
    teamLeader: medic.teamLeader,
    contactNumber: medic.contactNumber,
    members: medic.members,
    assignedArea: medic.assignedArea
  });
  setShowAssignModal(true);
};


  const handleOutOfService = (medic) => {
    setCurrentMedic(medic);
    setCause(medic.cause);
    setShowOutOfServiceModal(true);
  };

const handleAvailable = (id) => {
  const updatedMedic = {
    ...medics.find(m => m.id === id),
    status: "Available",
    teamLeader: "",
    contactNumber: "",
    members: "",
    assignedArea: "",
    cause: ""
  };

  console.log("Setting medic to Available:", updatedMedic);

  fetch(`http://localhost:3001/api/resources/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedMedic)
  })
    .then(res => res.json())
    .then(() => {
      setMedics(medics.map(m => (m.id === id ? updatedMedic : m)));
    })
    .catch(err => console.error("Error updating medic:", err));
};


  const saveAssign = () => {
    const updatedMedic = {
      ...currentMedic,
      status: "Assigned",
      ...assignForm
    };

    fetch(`http://localhost:3001/api/resources/${currentMedic.id}`, { 
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedMedic)
    })
      .then(res => res.json())
      .then(() => {
        setMedics(medics.map(m => (m.id === currentMedic.id ? updatedMedic : m)));
        setShowAssignModal(false);
      })
      .catch(err => console.error("Error updating medic:", err));
  };


const saveOutOfService = () => {
  const updatedMedic = {
    ...currentMedic,
    status: "Out of Service",
    cause
  };

  fetch(`http://localhost:3001/api/resources/${currentMedic.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedMedic)
  })
    .then(res => res.json())
    .then(() => {
      setMedics(medics.map(m => (m.id === currentMedic.id ? updatedMedic : m)));
      setShowOutOfServiceModal(false);
    })
    .catch(err => console.error("Error updating medic:", err));
};


  // const resetAll = () => {
  //   setMedics(medics.map(medic => ({
  //     ...medic,
  //     status: 'Available',
  //     teamLeader: '',
  //     contactNumber: '',
  //     members: '',
  //     assignedArea: '',
  //     cause: ''
  //   })));
  // };

  // Render a column with medics of a specific status
  const renderColumn = (status) => {
    const statusMedics = filteredMedics.filter(medic => medic.status === status);
    const statusColors = {
      'Available': '#10b981',
      'Assigned': '#3b82f6',
      'Out of Service': '#ef4444'
    };
    
    return (
      <div className="column">
        <div className="column-header" style={{borderBottom: `3px solid ${statusColors[status]}`}}>
          <h2>{status}</h2>
          <span className="count-badge">{statusMedics.length}</span>
        </div>
        <div className="cards-container">
          {statusMedics.map(medic => (
            <div key={medic.id} className="card">
                <div className="card-header">
                  {editingNameId === medic.id ? (
                    <>
                      <input
                        type="text"
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                      />
                      <button onClick={() => saveMedicName(medic.id)}>Save</button>
                      <button onClick={() => setEditingNameId(null)}>Cancel</button>
                    </>
                  ) : (
                    <>
                      <h3>{medic.name}</h3>
                      <button onClick={() => {
                        setEditingNameId(medic.id);
                        setEditedName(medic.name);
                      }}>Edit</button>
                    </>
                  )}
                  <span className={`status-indicator ${medic.status.replace(/\s+/g, '-').toLowerCase()}`}></span>
                </div>

              
              {medic.status === 'Assigned' && (
                <div className="card-details">
                  <p><strong>Team Leader:</strong> {medic.teamLeader}</p>
                  <p><strong>Contact:</strong> {medic.contactNumber}</p>
                  <p><strong>Members:</strong> {medic.members}</p>
                  <p><strong>Area:</strong> {medic.assignedArea}</p>
                </div>
              )}
              
              {medic.status === 'Out of Service' && (
                <div className="card-details">
                  <p><strong>Reason:</strong> {medic.cause}</p>
                </div>
              )}
              
              <div className="card-actions">
                {medic.status === 'Available' && (
                  <>
                    <button className="btn-assign" onClick={() => handleAssign(medic)}>Assign</button>
                    <button className="btn-out-of-service" onClick={() => handleOutOfService(medic)}>Out of Service</button>
                  </>
                )}
                {medic.status === 'Assigned' && (
                  <>
                    <button className="btn-reassign" onClick={() => handleAssign(medic)}>Reassign</button>
                    <button className="btn-out-of-service" onClick={() => handleOutOfService(medic)}>Out of Service</button>
                    <button className="btn-available" onClick={() => handleAvailable(medic.id)}>Available</button>
                  </>
                )}
                {medic.status === 'Out of Service' && (
                  <>
                    <button className="btn-assign" onClick={() => handleAssign(medic)}>Assign</button>
                    <button className="btn-available" onClick={() => handleAvailable(medic.id)}>Available</button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="resource-tracker">
      <div className="header">
        <h1>Resource Tracker System</h1>
        <div className="controls">
          <div className="search-container">
            <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              placeholder="Search medics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {/* <button className="btn-reset" onClick={resetAll}>
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/>
            </svg>
            Reset All
          </button> */}
        </div>
      </div>

      <div className="columns-container">
        {renderColumn('Available')}
        {renderColumn('Assigned')}
        {renderColumn('Out of Service')}
      </div>

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Assign {currentMedic?.name}</h2>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
             <div className="form-group">
              <label>Medic Name</label>
              <input
                type="text"
                value={assignForm.name}
                onChange={(e) => setAssignForm({...assignForm, name: e.target.value})}
              />
            </div>
              <div className="form-group">
                <label>Team Leader</label>
                <input
                  type="text"
                  value={assignForm.teamLeader}
                  onChange={(e) => setAssignForm({...assignForm, teamLeader: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Contact Number</label>
                <input
                  type="text"
                  value={assignForm.contactNumber}
                  onChange={(e) => setAssignForm({...assignForm, contactNumber: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Members</label>
                <input
                  type="text"
                  value={assignForm.members}
                  onChange={(e) => setAssignForm({...assignForm, members: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Assigned Area</label>
                <input
                  type="text"
                  value={assignForm.assignedArea}
                  onChange={(e) => setAssignForm({...assignForm, assignedArea: e.target.value})}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAssignModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveAssign}>Save Assignment</button>
            </div>
          </div>
        </div>
      )}

      {/* Out of Service Modal */}
      {showOutOfServiceModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Set Out of Service for {currentMedic?.name}</h2>
              <button className="modal-close" onClick={() => setShowOutOfServiceModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Reason:</label>
                <textarea
                  value={cause}
                  onChange={(e) => setCause(e.target.value)}
                  rows={4}
                  placeholder="Enter the reason for out of service status"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowOutOfServiceModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={saveOutOfService}>Save Status</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceTracker;