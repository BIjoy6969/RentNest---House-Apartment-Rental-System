import { useEffect, useState } from "react";
import { getApplications, updateApplication } from "../services/applicationService";

export default function ViewApplications() {
  const user = JSON.parse(localStorage.getItem("rn_user") || "null");
  const [apps, setApps] = useState([]);

  const load = async () => {
    try {
      const data = await getApplications(user._id); // landlordId
      setApps(data);
    } catch {
      // ignore
    }
  };

  useEffect(() => { load(); }, []);

  const decide = async (id, status) => {
    await updateApplication(id, status);
    load();
  };

  return (
    <div className="container">
      <h2>Tenant Applications</h2>
      {apps.length === 0 ? <p>No applications yet.</p> : (
        <table className="table">
          <thead>
            <tr>
              <th>Property</th>
              <th>Tenant</th>
              <th>Phone</th>
              <th>Income</th>
              <th>Message</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {apps.map(a => (
              <tr key={a._id}>
                <td>{a.property?.title}</td>
                <td>{a.fullName} ({a.email})</td>
                <td>{a.phone}</td>
                <td>{a.monthlyIncome}</td>
                <td>{a.message}</td>
                <td>{a.status}</td>
                <td>
                  <button onClick={() => decide(a._id, "approved")}>Approve</button>
                  <button onClick={() => decide(a._id, "rejected")} style={{ marginLeft: 6 }}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
