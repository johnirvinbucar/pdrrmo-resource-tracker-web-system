// server.js
const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const cors = require("cors");

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to SQLite
const dbPath = path.resolve(__dirname, "../../database/resource_tracker.db");
console.log("Looking for database at:", dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database at", dbPath);

    // CREATE resource_logs table
    db.run(`
      CREATE TABLE IF NOT EXISTS resource_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        resource_id INTEGER,
        action TEXT,
        note TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (resource_id) REFERENCES resources(id)
      )
    `, (err) => {
      if (err) {
        console.error("Error creating resource_logs table:", err.message);
      } else {
        console.log("Resource logs table ready ✅");
      }
    });

    // Keep the existing logs table for backward compatibility
    db.run(`
      CREATE TABLE IF NOT EXISTS logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        action TEXT,
        medic_name TEXT,
        timestamp TEXT,
        kind TEXT
      )
    `, (err) => {
      if (err) {
        console.error("Error creating logs table:", err.message);
      } else {
        console.log("Legacy logs table ready ✅");
      }
    });
  }
});

// Get all resources
app.get("/api/resources", (req, res) => {
  db.all("SELECT * FROM resources", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Create a new resource
app.post("/api/resources", (req, res) => {
  const { name, status, team_leader, contact_number, members, assigned_area, cause, kind } = req.body;
  
  const sql = `
    INSERT INTO resources (name, status, team_leader, contact_number, members, assigned_area, cause, kind)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [name, status, team_leader, contact_number, members, assigned_area, cause, kind], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      const resourceId = this.lastID;
      
      // Add to legacy logs
      addLog("Added", name, kind);
      
      // Add to resource_logs
      const logSql = `INSERT INTO resource_logs (resource_id, action, note) VALUES (?, ?, ?)`;
      db.run(logSql, [resourceId, "Created in staging area", ""], (err) => {
        if (err) console.error("Error creating resource log:", err.message);
      });
      
      res.json({
        id: resourceId,
        name,
        status,
        team_leader,
        contact_number,
        members,
        assigned_area,
        cause,
        kind
      });
    }
  });
});

// Update a resource
app.put("/api/resources/:id", (req, res) => {
  const { id } = req.params;
  const { name, status, team_leader, contact_number, members, assigned_area, cause, kind } = req.body;

  // First get the current resource to compare status changes
  db.get("SELECT * FROM resources WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    if (!row) {
      return res.status(404).json({ error: "Resource not found" });
    }
    
    const currentStatus = row.status;
    const currentArea = row.assigned_area;
    const currentCause = row.cause;
    
    const sql = `
      UPDATE resources
      SET 
        name = COALESCE(?, name),
        status = COALESCE(?, status),
        team_leader = COALESCE(?, team_leader),
        contact_number = COALESCE(?, contact_number),
        members = COALESCE(?, members),
        assigned_area = COALESCE(?, assigned_area),
        cause = COALESCE(?, cause),
        kind = COALESCE(?, kind)
      WHERE id = ?
    `;

    db.run(sql, [name, status, team_leader, contact_number, members, assigned_area, cause, kind, id], function (err) {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        // Add to legacy logs
        addLog(status, name, kind);
        
        // Add to resource_logs based on status changes
        if (status && status !== currentStatus) {
          let action = "";
          let note = "";
          
          switch (status) {
            case "Assigned":
              action = `Assigned to ${assigned_area}`;
              note = req.body.note || "";
              break;
            case "Out of Service":
              action = "Set out of service";
              note = cause || "";
              break;
            case "Available":
              action = "Returned to staging area";
              note = req.body.note || "";
              break;
          }
          
          if (action) {
            const logSql = `INSERT INTO resource_logs (resource_id, action, note) VALUES (?, ?, ?)`;
            db.run(logSql, [id, action, note], (err) => {
              if (err) console.error("Error creating resource log:", err.message);
            });
          }
        }
        
        res.json({ message: "Resource updated", changes: this.changes });
      }
    });
  });
});

// Delete a resource
app.delete("/api/resources/:id", (req, res) => {
  const { id } = req.params;
  
  db.run("DELETE FROM resources WHERE id = ?", id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      addLog("Deleted", `Medic ID ${id}`, null);
      res.json({ message: "Resource deleted", changes: this.changes });
    }
  });
});

// Get logs for a specific resource
app.get("/api/resources/:id/logs", (req, res) => {
  const { id } = req.params;
  
  db.all("SELECT * FROM resource_logs WHERE resource_id = ? ORDER BY timestamp ASC", [id], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Create a log for a specific resource
app.post("/api/resources/:id/logs", (req, res) => {
  const { id } = req.params;
  const { action, note } = req.body;
  
  const sql = `INSERT INTO resource_logs (resource_id, action, note) VALUES (?, ?, ?)`;
  
  db.run(sql, [id, action, note], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.status(201).json({ id: this.lastID });
    }
  });
});

// Get all legacy logs
app.get("/api/logs", (req, res) => {
  db.all("SELECT * FROM logs ORDER BY id DESC", [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json(rows);
    }
  });
});

// Example route
app.get("/", (req, res) => {
  res.send("Backend server is running ✅");
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Helper to insert a log entry (legacy)
function addLog(action, medic_name, kind) {
  const timestamp = new Date().toISOString();
  const sql = `INSERT INTO logs (action, medic_name, timestamp, kind) VALUES (?, ?, ?, ?)`;
  db.run(sql, [action, medic_name, timestamp, kind], (err) => {
    if (err) {
      console.error("Error inserting log:", err.message);
    } else {
      console.log(`Legacy log added: [${action}] ${medic_name} (${kind}) at ${timestamp}`);
    }
  });
}