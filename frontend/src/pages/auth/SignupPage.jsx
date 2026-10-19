import { useState } from "react";
import { Link } from "react-router-dom";
import { signupUser } from "../../services/api.js";

function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreed, setAgreed] = useState(false);

 const handleSubmit = async (e) => {
  e.preventDefault();

  try {
    await signupUser({ name, email, password });

    alert("Account created successfully!");
  } catch (error) {
    console.error(error);
    alert(error.message || "Could not connect to the server.");
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

      {/* Sign Up */}
      <main className="auth-content">

        <div className="auth-container">

          <h1>Create an account</h1>

          <p className="auth-subtitle">
            Join NBA Stats and unlock more features
          </p>

          <form onSubmit={handleSubmit} className="auth-form">

            <div className="form-group">
              <label htmlFor="name">Full name</label>

              <input
                id="name"
                type="text"
                placeholder="Enter your full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

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
                placeholder="Create a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <label className="terms-check">
              <input
                type="checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
                required
              />

              <span>
                I agree to the Terms of Service and Privacy Policy
              </span>
            </label>

            <button type="submit" className="auth-button">
              Create account
            </button>

          </form>

          <div className="auth-bottom">
            <span>Already have an account?</span>

            <Link to="/login">
              Log in
            </Link>
          </div>

        </div>

      </main>

    </div>
  );
}

export default Signup;