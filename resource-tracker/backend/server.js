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
  const { name, status, team_leader, contact_number, members, assigned_area, cause } = req.body;
  
  const sql = `
    INSERT INTO resources (name, status, team_leader, contact_number, members, assigned_area, cause)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;
  
  db.run(sql, [name, status, team_leader, contact_number, members, assigned_area, cause], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({
        id: this.lastID,
        name,
        status,
        team_leader,
        contact_number,
        members,
        assigned_area,
        cause
      });
    }
  });
});

// Update a resource
app.put("/api/resources/:id", (req, res) => {
  const { id } = req.params;
  const { name, status, team_leader, contact_number, members, assigned_area, cause } = req.body;

  const sql = `
    UPDATE resources
    SET 
      name = COALESCE(?, name),
      status = COALESCE(?, status),
      team_leader = COALESCE(?, team_leader),
      contact_number = COALESCE(?, contact_number),
      members = COALESCE(?, members),
      assigned_area = COALESCE(?, assigned_area),
      cause = COALESCE(?, cause)
    WHERE id = ?
  `;

  db.run(sql, [name, status, team_leader, contact_number, members, assigned_area, cause, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: "Resource updated", changes: this.changes });
    }
  });
});

// Delete a resource
app.delete("/api/resources/:id", (req, res) => {
  const { id } = req.params;
  
  db.run("DELETE FROM resources WHERE id = ?", id, function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: "Resource deleted", changes: this.changes });
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