"use client";
import React, { useEffect, useState } from "react";

interface Log {
  id: number;
  action: string;
  medic_name: string;
  timestamp: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState([] as Log[]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:3001/api/logs") // Make sure server is running
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching logs:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <p>Loading logs...</p>;

  return (
    <div className="logs-page">
      <h2>Resource Change Logs</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Action</th>
            <th>Medic Name</th>
            <th>Timestamp</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>{log.action}</td>
              <td>{log.medic_name}</td>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
