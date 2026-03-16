import { useState, useEffect } from "react";
import { useUser } from "../contexts/UserProvider";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user, logout } = useUser();
  const API_URL = import.meta.env.VITE_API_URL;
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`${API_URL}/api/user/profile`, {
          credentials: "include",
        });
        if (res.ok) {
          setProfile(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [API_URL]);

  if (loading) return <div>Loading profile...</div>;

  return (
    <div className="card">
      <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>My Profile</h2>
      {profile ? (
        <table>
          <tbody>
            <tr>
              <th>Username</th>
              <td>{profile.username}</td>
            </tr>
            <tr>
              <th>Email</th>
              <td>{profile.email}</td>
            </tr>
            <tr>
              <th>Name</th>
              <td>{profile.firstname || "—"} {profile.lastname || ""}</td>
            </tr>
            <tr>
              <th>Role</th>
              <td><span className={`badge ${profile.role === 'ADMIN' ? 'active' : 'accepted'}`}>{profile.role}</span></td>
            </tr>
          </tbody>
        </table>
      ) : (
        <p>Could not load profile data.</p>
      )}
    </div>
  );
}
