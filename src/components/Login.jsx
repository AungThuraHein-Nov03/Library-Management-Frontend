//You can modify this component.

import { useRef, useState } from "react";
import { useUser } from "../contexts/UserProvider";
import { Navigate, Link } from "react-router-dom";

export default function Login() {

  const [controlState, setControlState] = useState({
    isLoggingIn: false,
    isLoginError: false,
    isLoginOk: false
  });

  const emailRef = useRef();
  const passRef = useRef();
  const {user, login} = useUser();

  async function onLogin () {

    setControlState((prev)=>{
      return {
        ...prev,
        isLoggingIn: true
      }
    });

    const email = emailRef.current.value;
    const pass = passRef.current.value;

    const result = await login(email, pass);

    setControlState((prev) => {
      return {
        isLoggingIn: false,
        isLoginError: !result,
        isLoginOk: result
      }
    });
  }

  if (!user.isLoggedIn)
    return (
      <div className="card">
        <h2 style={{ textAlign: "center", marginBottom: "1.5rem" }}>Sign In</h2>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input type="email" name="email" id="email" ref={emailRef} placeholder="Enter your email" />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input type="password" name="password" id="password" ref={passRef} placeholder="Enter your password" />
        </div>
        <button className="w-full mt-4" onClick={onLogin} disabled={controlState.isLoggingIn}>
          {controlState.isLoggingIn ? "Logging in..." : "Login"}
        </button>
        {controlState.isLoginError && <div style={{ color: "#ef4444", marginTop: "1rem", textAlign: "center", fontWeight: "500" }}>Invalid email or password</div>}
        {user.isLoggedIn && <div style={{ color: "#10b981", marginTop: "1rem", textAlign: "center", fontWeight: "500" }}>Login Success</div>}
        <p style={{ textAlign: "center", marginTop: "1.5rem", color: "#64748b" }}>
          Don't have an account? <Link to="/signup" style={{ color: "#3b82f6" }}>Sign Up</Link>
        </p>
      </div>
    );
  else
    return (
      <Navigate to="/profile" replace />
    );
}