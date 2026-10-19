
import { NavLink, useNavigate } from "react-router-dom";
import { getStoredUser } from "../services/auth.js";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();
  const user = getStoredUser();

  return (
    <header className="site-navbar">
      <button
        className="site-brand"
        onClick={() => navigate("/")}
        aria-label="Go to home"
      >
        <span className="site-logo">NBA</span>
        <span>NBA Stats</span>
      </button>

      <nav className="site-nav-links">
        <NavLink to="/" end>Home</NavLink>
        <NavLink to="/teams">Teams</NavLink>
        <NavLink to="/players">Players</NavLink>
      </nav>

      <div className="site-nav-actions">
        {user ? (
          <button
            type="button"
            className="site-profile-button"
            onClick={() => navigate("/profile")}
            aria-label="Open profile"
          >
            <span className="site-user-details">
              <strong>{user.name || "My Account"}</strong>
              <small>Profile</small>
            </span>
          </button>
        ) : (
          <div className="site-guest-actions">
            <button
              type="button"
              className="site-login-button"
              onClick={() => navigate("/login")}
            >
              Login
            </button>

            <button
              type="button"
              className="site-signup-button"
              onClick={() => navigate("/signup")}
            >
              Sign Up
            </button>
          </div>
        )}

        <button
          type="button"
          className="site-pass-button"
          onClick={() => navigate("/league-pass")}
        >
          League Pass
        </button>
      </div>
    </header>
  );
}

export default Navbar;
