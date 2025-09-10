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

// Update a resource status
app.put("/api/resources/:id", (req, res) => {
  const { id } = req.params;
  const { status, teamLeader, contactNumber, members, assignedArea, cause } = req.body;

  const sql = `
    UPDATE resources 
    SET status = ?, team_leader = ?, contact_number = ?, members = ?, assigned_area = ?, cause = ?
    WHERE id = ?
  `;

  db.run(sql, [status, teamLeader, contactNumber, members, assignedArea, cause, id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else {
      res.json({ message: "Resource updated", changes: this.changes });
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
