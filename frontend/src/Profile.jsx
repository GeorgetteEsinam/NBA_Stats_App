import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  // ==========================================
  // GET LOGGED-IN USER
  // ==========================================

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    fetch("http://localhost:5000/api/auth/me", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch user");
        }

        return response.json();
      })
      .then((data) => {
        setUser(data.user);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Profile error:", error);

        // If token is invalid/expired
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        navigate("/login");
      });
  }, [navigate]);

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setMenuOpen(false);

    navigate("/login");
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="profile-loading">
        Loading profile...
      </div>
    );
  }

  // ==========================================
  // NO USER
  // ==========================================

  if (!user) {
    return (
      <div className="profile-loading">
        Could not load your profile.
      </div>
    );
  }

  // ==========================================
  // USER DETAILS
  // ==========================================

  const initials = user.name
    ? user.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      })
    : "--";

  return (
    <div className="profile-page">

      {/* ======================================
          NAVBAR
      ====================================== */}

      <nav className="profile-navbar">

        <div className="profile-nav-left">

          <div className="profile-nba-logo">
            NBA
          </div>

          <div className="profile-brand">
            NBA Stats
          </div>

          <div className="profile-nav-links">

            <button onClick={() => navigate("/")}>
              Home
            </button>

            <button onClick={() => navigate("/teams")}>
              Teams
            </button>

            <button onClick={() => navigate("/players")}>
              Players
            </button>

          </div>

        </div>


        <div className="profile-nav-right">

          


          {/* MENU BUTTON */}

          <button
            className="menu-button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>


          <div className="nav-user">
            <strong>{user.name}</strong>

            <small>
              {user.account_type === "pro"
                ? "League Pass"
                : "Free Account"}
            </small>
          </div>

        </div>

      </nav>


      {/* ======================================
          SLIDING MENU
      ====================================== */}

      {menuOpen && (
        <>

          {/* DARK OVERLAY */}

          <div
            className="menu-overlay"
            onClick={() => setMenuOpen(false)}
          ></div>


          {/* RIGHT SIDE MENU */}

          <aside className="side-menu">

            <div className="side-menu-header">

              <span>MENU</span>

              <button
                className="close-menu"
                onClick={() => setMenuOpen(false)}
              >
                ×
              </button>

            </div>


            {/* USER */}

            <div className="side-menu-user">

              <div className="side-menu-avatar">
                {initials}
              </div>

              <div>
                <strong>{user.name}</strong>

                <small>
                  {user.email}
                </small>
              </div>

            </div>


            {/* MENU ITEMS */}

            <div className="side-menu-items">

              {/* PROFILE */}

              <button
                className="side-menu-item active"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/profile");
                }}
              >

                <div className="menu-item-icon">
                  
                </div>

                <div className="menu-item-text">
                  <strong>Profile</strong>
                  <small>Account details</small>
                </div>

                <span className="menu-arrow">
                  ›
                </span>

              </button>


              {/* SUBSCRIPTION */}

              <button
                className="side-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                }}
              >

                <div className="menu-item-icon">
                  
                </div>

                <div className="menu-item-text">
                  <strong>Subscription</strong>
                  <small>League Pass</small>
                </div>

                <span className="subscription-status">
                  {user.account_type === "pro"
                    ? "Active"
                    : "Free"}
                </span>

              </button>


              {/* SAVED PLAYER CARDS */}

              <button
                className="side-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                }}
              >

                <div className="menu-item-icon">
                  
                </div>

                <div className="menu-item-text">
                  <strong>Saved Player Cards</strong>
                  <small>Your saved players</small>
                </div>

                <span className="menu-arrow">
                  ›
                </span>

              </button>

            </div>


            {/* LOGOUT */}

            <div className="side-menu-bottom">

              <button
                className="side-menu-logout"
                onClick={handleLogout}
              >
                ↪
                <span>Log out</span>
              </button>

            </div>

          </aside>

        </>
      )}


      {/* ======================================
          PROFILE CONTENT
      ====================================== */}

      <main className="profile-content">

        <div className="profile-heading">

          <h1>
            Profile
          </h1>

          <p>
            Manage your account and favorites
          </p>

        </div>


        <div className="profile-layout">

          {/* ==================================
              LEFT USER CARD
          ================================== */}

          <section className="user-card">

            <div className="avatar">
              {initials}
            </div>

            <div className="avatar-status">
              ✓
            </div>

            <h2>
              {user.name}
            </h2>

            <p className="user-email">
              {user.email}
            </p>

            <div className="account-status">
              {user.account_type === "pro"
                ? "League Pass · Active"
                : "Free Account"}
            </div>

            <div className="member-since">

              <span>
                Member since
              </span>

              <strong>
                {memberSince}
              </strong>

            </div>

          </section>


          {/* ==================================
              RIGHT SIDE
          ================================== */}

          <section className="profile-right">

            {/* PERSONAL INFORMATION */}

            <div className="profile-panel personal-panel">

              <div className="panel-title-row">

                <h2>
                  Personal information
                </h2>

                <button className="edit-button">
                  Edit
                </button>

              </div>


              <div className="personal-grid">

                <div className="profile-field">

                  <label>
                    Full name
                  </label>

                  <input
                    type="text"
                    value={user.name}
                    readOnly
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Email
                  </label>

                  <input
                    type="email"
                    value={user.email}
                    readOnly
                  />

                </div>


                <div className="profile-field">

                  <label>
                    Phone number
                  </label>

                  <input
                    type="text"
                    placeholder="Not added"
                    readOnly
                  />

                </div>

              </div>


              <button className="save-button">
                Save changes
              </button>

            </div>


            {/* FAVORITE TEAMS */}

            <div className="profile-panel">

              <div className="panel-title-row">

                <h2>
                  Favorite teams
                </h2>

                <button className="add-button">
                  + Add team
                </button>

              </div>


              <div className="favorite-list">

                <div className="favorite-team">

                  <div className="team-circle purple">
                    LAL
                  </div>

                  <div className="favorite-info">

                    <small>
                      Los Angeles
                    </small>

                    <strong>
                      Lakers
                    </strong>

                  </div>

                  <button className="remove-button">
                    ×
                  </button>

                </div>


                <div className="favorite-team">

                  <div className="team-circle yellow">
                    GSW
                  </div>

                  <div className="favorite-info">

                    <small>
                      Golden State
                    </small>

                    <strong>
                      Warriors
                    </strong>

                  </div>

                  <button className="remove-button">
                    ×
                  </button>

                </div>


                <div className="favorite-team">

                  <div className="team-circle green">
                    MIN
                  </div>

                  <div className="favorite-info">

                    <small>
                      Minnesota
                    </small>

                    <strong>
                      Timberwolves
                    </strong>

                  </div>

                  <button className="remove-button">
                    ×
                  </button>

                </div>

              </div>

            </div>


            {/* FAVORITE PLAYERS */}

            <div className="profile-panel">

              <div className="panel-title-row">

                <h2>
                  Favorite players
                </h2>

                <button className="add-button">
                  + Add player
                </button>

              </div>


              <div className="favorite-list">

                <div className="favorite-player">

                  <div className="player-avatar">
                    AE
                  </div>

                  <div className="favorite-info">

                    <small>
                      MIN
                    </small>

                    <strong>
                      Anthony Edwards
                    </strong>

                  </div>

                  <button className="remove-button">
                    ×
                  </button>

                </div>


                <div className="favorite-player">

                  <div className="player-avatar">
                    LJ
                  </div>

                  <div className="favorite-info">

                    <small>
                      LAL
                    </small>

                    <strong>
                      LeBron James
                    </strong>

                  </div>

                  <button className="remove-button">
                    ×
                  </button>

                </div>


                <div className="favorite-player">

                  <div className="player-avatar">
                    SC
                  </div>

                  <div className="favorite-info">

                    <small>
                      GSW
                    </small>

                    <strong>
                      Stephen Curry
                    </strong>

                  </div>

                  <button className="remove-button">
                    ×
                  </button>

                </div>

              </div>

            </div>


            {/* LOGOUT */}

            <button
              className="profile-logout"
              onClick={handleLogout}
            >
              Log out
            </button>

          </section>

        </div>

      </main>

    </div>
  );
}

export default Profile;