import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./Menu.css";

function Menu({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, [isOpen]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    onClose();
    navigate("/login");
  };

  const goTo = (path) => {
    onClose();
    navigate(path);
  };

  if (!isOpen) {
    return null;
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((word) => word[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <>
      {/* Dark overlay */}
      <div
        className="menu-overlay"
        onClick={onClose}
      ></div>

      {/* Sliding menu */}
      <aside className="side-menu">

        {/* MENU HEADER */}
        <div className="menu-header">

          <span>MENU</span>

          <button
            className="menu-close"
            onClick={onClose}
          >
            ×
          </button>

        </div>


        {/* USER */}
        <div className="menu-user">

          <div className="menu-avatar">
            {initials}
          </div>

          <div className="menu-user-info">

            <strong>
              {user?.name || "Guest"}
            </strong>

            <small>
              {user?.email || "Not logged in"}
            </small>

          </div>

        </div>


        {/* MENU ITEMS */}
        <div className="menu-items">

          {/* PROFILE */}
          <button
            className={`menu-item ${
              location.pathname === "/profile"
                ? "menu-item-active"
                : ""
            }`}
            onClick={() => goTo("/profile")}
          >

            <div className="menu-item-icon">
              ♙
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
            className="menu-item"
            onClick={() => goTo("/pro")}
          >

            <div className="menu-item-icon">
              ◆
            </div>

            <div className="menu-item-text">
              <strong>Subscription</strong>
              <small>League Pass</small>
            </div>

            {user?.account_type === "pro" && (
              <span className="menu-active">
                Active
              </span>
            )}

          </button>


          {/* SAVED PLAYER CARDS */}
          <button
            className="menu-item"
            onClick={() => goTo("/saved-cards")}
          >

            <div className="menu-item-icon">
              ♧
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
        <div className="menu-bottom">

          <button
            className="menu-logout"
            onClick={handleLogout}
          >
            <span>↪</span>
            Log out
          </button>

        </div>

      </aside>
    </>
  );
}

export default Menu;