import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Auth.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    const response = await fetch("http://localhost:5000/api/auth/Login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      alert(data.message);
      return;
    }
     // Save the JWT token
    localStorage.setItem("token", data.token);

    // Save the logged-in user's information
    localStorage.setItem("user", JSON.stringify(data.user));

    console.log("Logged in user:", data.user);

    alert("Login successful!");


localStorage.setItem("user", JSON.stringify(data.user));

navigate("/");

    console.log("Logged in user:", data.user);

  } catch (error) {
    console.error(error);
    alert("Could not connect to the server.");
  }
};

return (
    <div className="auth-page">

      {/* Header */}
      <header className="auth-header">
        <div className="auth-logo">
             NBA
     </div>

        <div className="auth-brand">
          NBA Stats
        </div>
      </header>

      {/* Login form */}
      <main className="auth-content">

        <div className="auth-container">

          <h1>Welcome back</h1>

          <p className="auth-subtitle">
            Log in to your NBA Stats account
          </p>

          <form onSubmit={handleSubmit} className="auth-form">

            <div className="form-group">
              <label htmlFor="email">Email</label>

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="auth-options">

              <label className="remember-me">
                <input type="checkbox" />
                <span>Remember me</span>
              </label>

              <a href="#" className="forgot-password">
                Forgot password?
              </a>

            </div>

            <button type="submit" className="auth-button">
              Log in
            </button>

          </form>

          <div className="auth-bottom">
            <span>Don't have an account?</span>
            <Link to="/signup">Sign up</Link>

            
             
           
          </div>

        </div>

      </main>

    </div>
  );
}

export default Login;