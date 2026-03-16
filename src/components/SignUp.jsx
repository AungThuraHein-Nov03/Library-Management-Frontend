import { useRef, useState } from "react";
import { useUser } from "../contexts/UserProvider";
import { Link, Navigate } from "react-router-dom";

export default function SignUp() {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const { user } = useUser();

  const usernameRef = useRef();
  const emailRef = useRef();
  const passwordRef = useRef();
  const confirmPasswordRef = useRef();
  const firstnameRef = useRef();
  const lastnameRef = useRef();

  const API_URL = import.meta.env.VITE_API_URL;

  async function handleSignUp(e) {
    e.preventDefault();
    setError("");

    const password = passwordRef.current.value;
    const confirmPassword = confirmPasswordRef.current.value;

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: usernameRef.current.value,
          email: emailRef.current.value,
          password: password,
          firstname: firstnameRef.current.value,
          lastname: lastnameRef.current.value,
        }),
      });

      if (response.ok) {
        setSuccess(true);
      } else {
        const data = await response.json();
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Unable to connect to the server");
    } finally {
      setSubmitting(false);
    }
  }

  if (user.isLoggedIn) {
    return <Navigate to="/books" replace />;
  }

  if (success) {
    return (
      <div className="card" style={{ textAlign: "center" }}>
        <h2 style={{ marginBottom: "1rem" }}>Account Created</h2>
        <p style={{ color: "#059669", marginBottom: "1.5rem" }}>
          Your account has been created successfully.
        </p>
        <Link to="/login">
          <button className="w-full">Go to Login</button>
        </Link>
      </div>
    );
  }

  return (
    <div className="card">
      <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Create Account</h2>
      <form onSubmit={handleSignUp}>
        <div className="flex gap-4 mb-4">
          <div className="w-full">
            <label htmlFor="firstname">First Name</label>
            <input type="text" id="firstname" ref={firstnameRef} placeholder="First name" required />
          </div>
          <div className="w-full">
            <label htmlFor="lastname">Last Name</label>
            <input type="text" id="lastname" ref={lastnameRef} placeholder="Last name" required />
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input type="text" id="username" ref={usernameRef} placeholder="Choose a username" required />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" id="email" ref={emailRef} placeholder="Enter your email" required />
        </div>
        <div className="flex gap-4 mb-4">
          <div className="w-full">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" ref={passwordRef} placeholder="Password" required />
          </div>
          <div className="w-full">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" ref={confirmPasswordRef} placeholder="Confirm password" required />
          </div>
        </div>
        <button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating Account..." : "Sign Up"}
        </button>
      </form>
      {error && (
        <div style={{ color: "#ef4444", marginTop: "1rem", textAlign: "center", fontWeight: "500" }}>
          {error}
        </div>
      )}
      <p style={{ textAlign: "center", marginTop: "1.5rem", color: "#64748b" }}>
        Already have an account? <Link to="/login" style={{ color: "#3b82f6" }}>Sign In</Link>
      </p>
    </div>
  );
}
