  import React, { useState, useEffect } from 'react';
  import './ResourceTracker.css';

  const ResourceTracker = () => {
    const [medics, setMedics] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showOutOfServiceModal, setShowOutOfServiceModal] = useState(false);
    const [showAddMedicModal, setShowAddMedicModal] = useState(false);
    const [currentMedic, setCurrentMedic] = useState(null);
    const [expandedCards, setExpandedCards] = useState({});
    const [assignForm, setAssignForm] = useState({
      name: '',
      team_leader: '',
      contact_number: '',
      members: '',
      assigned_area: ''
    });
    const [newMedicName, setNewMedicName] = useState('');
    const [cause, setCause] = useState('');

    // Fetch medics from backend
    useEffect(() => {
      fetchMedics();
    }, []);

    const fetchMedics = () => {
      fetch("http://localhost:3001/api/resources")
        .then(res => res.json())
        .then(data => setMedics(data))
        .catch(err => console.error("Error fetching resources:", err));
    };

    // Filter medics based on search term
    const filteredMedics = medics.filter(medic =>
      medic.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAssign = (medic) => {
      setCurrentMedic(medic);
      setAssignForm({
        name: medic.name || '',
        team_leader: medic.team_leader || '',
        contact_number: medic.contact_number || '',
        members: medic.members || '',
        assigned_area: medic.assigned_area || ''
      });
      setShowAssignModal(true);
    };

    const handleOutOfService = (medic) => {
      setCurrentMedic(medic);
      setCause(medic.cause || '');
      setShowOutOfServiceModal(true);
    };

    const handleAvailable = (medic) => {
      const updatedMedic = {
        ...medic, // Keep all existing properties
        status: "Available",
        team_leader: "",
        contact_number: "",
        members: "",
        assigned_area: "", // Only clear the assigned area
        cause: ""
      };

      fetch(`http://localhost:3001/api/resources/${medic.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedMedic)
      })
        .then(res => res.json())
        .then(() => {
          setMedics(medics.map(m => (m.id === medic.id ? updatedMedic : m)));
        })
        .catch(err => console.error("Error updating medic:", err));
    };

    const handleAddMedic = () => {
      const newMedic = {
        name: newMedicName,
        status: "Available",
        team_leader: "",
        contact_number: "",
        members: "",
        assigned_area: "",
        cause: ""
      };

      fetch("http://localhost:3001/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMedic)
      })
        .then(res => res.json())
        .then(() => {
          setNewMedicName('');
          setShowAddMedicModal(false);
          fetchMedics(); // Refresh the list
        })
        .catch(err => console.error("Error adding medic:", err));
    };

    const handleDeleteMedic = (id) => {
      if (window.confirm("Are you sure you want to delete this medic?")) {
        fetch(`http://localhost:3001/api/resources/${id}`, {
          method: "DELETE"
        })
          .then(res => res.json())
          .then(() => {
            setMedics(medics.filter(m => m.id !== id));
          })
          .catch(err => console.error("Error deleting medic:", err));
      }
    };

    const saveAssign = () => {
      const updatedMedic = {
        ...currentMedic,
        status: "Assigned",
        name: assignForm.name,
        team_leader: assignForm.team_leader,
        contact_number: assignForm.contact_number,
        members: assignForm.members,
        assigned_area: assignForm.assigned_area
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
          <div className="column-header" style={{ borderBottom: `3px solid ${statusColors[status]}` }}>
            <h2>{status}</h2>
            <span className="count-badge">{statusMedics.length}</span>
            {status === 'Available' && (
              <button 
                className="btn-add-medic"
                onClick={() => setShowAddMedicModal(true)}
              >
                + Add Medic
              </button>
            )}
          </div>
          <div className="cards-container">
            {statusMedics.map(medic => (
              <div key={medic.id} className="card">
                {/* Card Header */}
                <div className="card-header">
                  <h3>
                    {medic.name}
                    {medic.assigned_area ? ` - ${medic.assigned_area}` : ''}
                  </h3>
                  <div className="card-header-actions">
                    {status === 'Assigned' && (
                      <button
                        className="expand-btn"
                        onClick={() =>
                          setExpandedCards(prev => ({ ...prev, [medic.id]: !prev[medic.id] }))
                        }
                      >
                        {expandedCards[medic.id] ? '▼' : '▶'}
                      </button>
                    )}
                    <button 
                      className="btn-delete"
                      onClick={() => handleDeleteMedic(medic.id)}
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Expanded details and actions */}
                {status === 'Assigned' && expandedCards[medic.id] && (
                  <>
                    <div className="card-details">
                      <p><strong>Team Leader:</strong> {medic.team_leader}</p>
                      <p><strong>Contact:</strong> {medic.contact_number}</p>
                      <p><strong>Members:</strong> {medic.members}</p>
                      <p><strong>Area:</strong> {medic.assigned_area}</p>
                    </div>
                    <div className="card-actions">
                      <button className="btn-reassign" onClick={() => handleAssign(medic)}>Reassign</button>
                      <button className="btn-out-of-service" onClick={() => handleOutOfService(medic)}>Out of Service</button>
                      <button className="btn-available" onClick={() => handleAvailable(medic)}>Available</button>
                    </div>
                  </>
                )}
                
                {/* Actions for Available status */}
                {status === 'Available' && (
                  <div className="card-actions">
                    <button className="btn-assign" onClick={() => handleAssign(medic)}>Assign</button>
                    <button className="btn-out-of-service" onClick={() => handleOutOfService(medic)}>Out of Service</button>
                  </div>
                )}
                
                {/* Details and actions for Out of Service */}
                {status === 'Out of Service' && (
                  <>
                    <div className="card-details">
                      <p><strong>Reason:</strong> {medic.cause}</p>
                    </div>
                    <div className="card-actions">
                      <button className="btn-assign" onClick={() => handleAssign(medic)}>Assign</button>
                      <button className="btn-available" onClick={() => handleAvailable(medic)}>Available</button>
                    </div>
                  </>
                )}
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
          </div>
        </div>

        <div className="columns-container">
          {renderColumn('Available')}
          {renderColumn('Assigned')}
          {renderColumn('Out of Service')}
        </div>

        {/* Add Medic Modal */}
        {showAddMedicModal && (
          <div className="modal-overlay">
            <div className="modal">
              <div className="modal-header">
                <h2>Add New Medic</h2>
                <button className="modal-close" onClick={() => setShowAddMedicModal(false)}>
                  &times;
                </button>
              </div>
              <div className="modal-body">
                <div className="form-group">
                  <label>Medic Name</label>
                  <input
                    type="text"
                    value={newMedicName}
                    onChange={(e) => setNewMedicName(e.target.value)}
                    placeholder="Enter medic name"
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setShowAddMedicModal(false)}>Cancel</button>
                <button className="btn-primary" onClick={handleAddMedic}>Add Medic</button>
              </div>
            </div>
          </div>
        )}

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
                    value={assignForm.team_leader}
                    onChange={(e) => setAssignForm({...assignForm, team_leader: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input
                    type="text"
                    value={assignForm.contact_number}
                    onChange={(e) => setAssignForm({...assignForm, contact_number: e.target.value})}
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
                    value={assignForm.assigned_area}
                    onChange={(e) => setAssignForm({...assignForm, assigned_area: e.target.value})}
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