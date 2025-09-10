import React, { useState, useEffect } from 'react';
import './ResourceTracker.css';

const ResourceTracker = () => {
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [medics, setMedics] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showOutOfServiceModal, setShowOutOfServiceModal] = useState(false);
  const [showAddMedicModal, setShowAddMedicModal] = useState(false);
  const [currentMedic, setCurrentMedic] = useState(null);
  const [expandedCards, setExpandedCards] = useState({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newMedicKind, setNewMedicKind] = useState("");
  const [newMedicTeamLeader, setNewMedicTeamLeader] = useState("");
  const [newMedicContact, setNewMedicContact] = useState("");
  const [newMedicMembers, setNewMedicMembers] = useState("");
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
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
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
      ...medic,
      status: "Available",
      assigned_area: "",
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

  const handleAddMedic = async () => {
    if (!newMedicName || !newMedicKind) {
      alert("Please fill in at least Name and Kind");
      return;
    }

    const newMedic = {
      name: newMedicName,
      kind: newMedicKind,
      team_leader: newMedicTeamLeader,
      contact_number: newMedicContact,
      members: newMedicMembers,
      status: "Available"
    };

    try {
      const response = await fetch("http://localhost:3001/api/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newMedic)
      });

      if (response.ok) {
        const savedMedic = await response.json();
        setMedics([...medics, savedMedic]);

        // Reset fields
        setNewMedicName("");
        setNewMedicKind("");
        setNewMedicTeamLeader("");
        setNewMedicContact("");
        setNewMedicMembers("");
        setShowAddMedicModal(false);
      } else {
        alert("Failed to add medic");
      }
    } catch (error) {
      console.error("Error adding medic:", error);
    }
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
      assigned_area: assignForm.assigned_area
    };

    fetch(`http://localhost:3001/api/resources/${currentMedic.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedMedic),
    })
      .then((res) => res.json())
      .then((data) => {
        setMedics(
          medics.map((m) => (m.id === currentMedic.id ? updatedMedic : m))
        );
        setShowAssignModal(false);
      })
      .catch((err) => console.error("Error updating medic:", err));
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
      'Available': '#28a745',
      'Assigned': '#17a2b8',
      'Out of Service': '#dc3545'
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
              + Create
            </button>
          )}
        </div>
        <div className="cards-container">
          {statusMedics.map(medic => (
            <div key={medic.id} className="card">
              <div className="card-header">
                <h3>
                  {medic.name}
                  {medic.assigned_area ? ` - ${medic.assigned_area}` : ''}
                </h3>
                <div className="card-header-actions">
                  <button
                    className="expand-btn"
                    onClick={() =>
                      setExpandedCards(prev => ({ ...prev, [medic.id]: !prev[medic.id] }))
                    }
                  >
                    {expandedCards[medic.id] ? '▼' : '▶'}
                  </button>
                  <button 
                    className="btn-delete"
                    onClick={() => handleDeleteMedic(medic.id)}
                  >
                    ×
                  </button>
                </div>
              </div>

              {expandedCards[medic.id] && (
                <>
                  <div className="card-details">
                    <p><strong>Kind:</strong> {medic.kind}</p>
                    <p><strong>Team Leader:</strong> {medic.team_leader}</p>
                    <p><strong>Contact:</strong> {medic.contact_number}</p>
                    <p><strong>Members:</strong> {medic.members}</p>
                    <p><strong>Area:</strong> {medic.assigned_area}</p>
                    {medic.status === "Out of Service" && (
                      <p><strong>Reason:</strong> {medic.cause}</p>
                    )}
                  </div>

                  <div className="card-actions">
                    {medic.status === "Available" && (
                      <>
                        <button className="btn-assign" onClick={() => handleAssign(medic)}>Assign</button>
                        <button className="btn-out-of-service" onClick={() => handleOutOfService(medic)}>Out of Service</button>
                      </>
                    )}

                    {medic.status === "Assigned" && (
                      <>
                        <button className="btn-reassign" onClick={() => handleAssign(medic)}>Reassign</button>
                        <button className="btn-out-of-service" onClick={() => handleOutOfService(medic)}>Out of Service</button>
                        <button className="btn-available" onClick={() => handleAvailable(medic)}>Available</button>
                      </>
                    )}

                    {medic.status === "Out of Service" && (
                      <>
                        <button className="btn-assign" onClick={() => handleAssign(medic)}>Assign</button>
                        <button className="btn-available" onClick={() => handleAvailable(medic)}>Available</button>
                      </>
                    )}
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
        <div className="header-top">
          <img src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBmaWxsPSIjZmZmIj48cGF0aCBkPSJNMjU2IDhDMTE5IDggOCAxMTkgOCAyNTZzMTExIDI0OCAyNDggMjQ4IDI0OC0xMTEgMjQ4LTI0OFMzOTMgOCAyNTYgOHptMCA0NDhjLTExMC41IDAtMjAwLTg5LjUtMjAwLTIwMFMxNDUuNSA1NiAyNTYgNTZzMjAwIDg5LjUgMjAwIDIwMC04OS41IDIwMC0yMDAgMjAwem0xMDgtMTYwSDE0OGMtNi42IDAtMTItNS40LTEyLTEydjU2YzAgNi42IDUuNCAxMiAxMiAxMmg0NGMyMjMuNyAwIDE2MC0yOS42IDE2MCAxNnY0OGMwIDYuNiA1LjQgMTIgMTIgMTJoNTZjNi42IDAgMTItNS40IDEyLTEydi00OGMwLTQyLjctNTQuOS-642N64yNjRIMTQ4Yy02LjYgMC0xMi01LjQtMTItMTJ2LTU2YzAtNi42IDUuNC0xMiAxMi0xMmg0NGM0NC4yIDAgNTYuOC0xNy45IDU3LjQtNDguNi4xLTUuMiA0LjQtOS40IDkuNi05LjRoNjRjNS4xIDAgOS40IDQuMiA5LjYgOS40LjYgMzAuNyAxMy4yIDQ4LjYgNTcuNCA0OC42aDQ0YzYuNiAwIDEyIDUuNCAxMiAxMnY1NmMwIDYuNi01LjQgMTItMTIgMTJ6Ii8+PC9zdmc+" alt="Logo" className="logo" />
          <div className="header-title">
            <h1>OPDRRMO-Bohol</h1>
            <p>Resource Tracker System</p>
          </div>
        </div>
        <div className="controls">
          <div className="search-container">
            <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18">
              <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="date-time">
            {currentTime.toLocaleDateString()} {currentTime.toLocaleTimeString()}
          </div>
          <button
            className="log-button"
            onClick={async () => {
              setShowLogsModal(true);
              setLoadingLogs(true);
              try {
                const res = await fetch("http://localhost:3001/api/logs");
                const data = await res.json();
                setLogs(data);
              } catch (err) {
                console.error("Error fetching logs:", err);
              } finally {
                setLoadingLogs(false);
              }
            }}
          >
            View Logs
          </button>
        </div>
      </div>

      <div className="columns-container">
        {renderColumn('Available')}
        {renderColumn('Assigned')}
        {renderColumn('Out of Service')}
      </div>

      {showLogsModal && (
        <div className="modal-overlay">
          <div className="modal logs-modal">
            <div className="modal-header">
              <h2>Resource Change Logs</h2>
              <button className="modal-close" onClick={() => setShowLogsModal(false)}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              {loadingLogs ? (
                <p>Loading...</p>
              ) : (
                <div className="logs-table-wrapper">
                  <table className="logs-table">
                    <thead>
                      <tr>
                        <th>Status / Action</th>
                        <th>Resource Name</th>
                        <th>Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log.id}>
                          <td>
                            <span className={`status-badge ${log.action.replace(/\s+/g, '-').toLowerCase()}`}>
                              {log.action}
                            </span>
                          </td>
                          <td>{log.medic_name}</td>
                          <td>{new Date(log.timestamp).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showAddMedicModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Add New Resource</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddMedicModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Name:</label>
                <input
                  type="text"
                  value={newMedicName}
                  onChange={(e) => setNewMedicName(e.target.value)}
                  placeholder="Enter resource name"
                />
              </div>
              <div className="form-group">
                <label>Kind:</label>
                <input
                  type="text"
                  value={newMedicKind}
                  onChange={(e) => setNewMedicKind(e.target.value)}
                  placeholder="Medic, Vehicle, Equipment..."
                />
              </div>
              <div className="form-group">
                <label>Team Leader:</label>
                <input
                  type="text"
                  value={newMedicTeamLeader}
                  onChange={(e) => setNewMedicTeamLeader(e.target.value)}
                  placeholder="Enter team leader name"
                />
              </div>
              <div className="form-group">
                <label>Contact Number:</label>
                <input
                  type="text"
                  value={newMedicContact}
                  onChange={(e) => setNewMedicContact(e.target.value)}
                  placeholder="Enter contact number"
                />
              </div>
              <div className="form-group">
                <label>Members:</label>
                <textarea
                  value={newMedicMembers}
                  onChange={(e) => setNewMedicMembers(e.target.value)}
                  placeholder="List of members"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowAddMedicModal(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={handleAddMedic}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {showAssignModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>Assign Area - {currentMedic?.name}</h2>
              <button
                className="modal-close"
                onClick={() => setShowAssignModal(false)}
              >
                &times;
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Assigned Area</label>
                <input
                  type="text"
                  value={assignForm.assigned_area}
                  onChange={(e) =>
                    setAssignForm({ ...assignForm, assigned_area: e.target.value })
                  }
                  placeholder="Enter assigned area"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setShowAssignModal(false)}
              >
                Cancel
              </button>
              <button className="btn-primary" onClick={saveAssign}>
                Save Assignment
              </button>
            </div>
          </div>
        </div>
      )}

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