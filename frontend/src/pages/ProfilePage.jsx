
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSession } from "../services/auth.js";
import {
  getCurrentUser,
  getTeams,
  getPlayers,
  getFavoriteTeams,
  getFavoritePlayers,
  addFavoriteTeam,
  addFavoritePlayer,
  removeFavoriteTeam,
  removeFavoritePlayer,
  cancelSubscription,
} from "../services/api.js";
import "./ProfilePage.css";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [favoriteTeams, setFavoriteTeams] = useState([]);
  const [favoritePlayers, setFavoritePlayers] = useState([]);

  const [modalType, setModalType] = useState(null);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Subscription state
  const [cancelling, setCancelling] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState("");
  const [subscriptionError, setSubscriptionError] = useState("");

  // Load the logged-in user
  useEffect(() => {
    let cancelled = false;

    async function loadProfile() {
      const token = localStorage.getItem("token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const data = await getCurrentUser(token);

        if (!cancelled) {
          setUser(data.user);
          setLoading(false);
        }
      } catch (err) {
        console.error("Profile error:", err);

        if (!cancelled) {
          clearSession();
          navigate("/login");
        }
      }
    }

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // Load teams, players and saved favourites
  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    async function loadFavoritesData() {
      setFavoritesLoading(true);
      setError("");

      const token = localStorage.getItem("token");

      try {
        const results = await Promise.all([
          getTeams(),
          getPlayers(),
          getFavoriteTeams(token),
          getFavoritePlayers(token),
        ]);

        if (!cancelled) {
          setTeams(results[0]);
          setPlayers(results[1]);
          setFavoriteTeams(results[2]);
          setFavoritePlayers(results[3]);
        }
      } catch (err) {
        console.error("Favorites loading error:", err);

        if (!cancelled) {
          setError(
            "Could not load your favourites. Please refresh the page and try again."
          );
        }
      } finally {
        if (!cancelled) {
          setFavoritesLoading(false);
        }
      }
    }

    loadFavoritesData();

    return () => {
      cancelled = true;
    };
  }, [user]);

  // Cancel the Pro subscription
  const handleCancelSubscription = async () => {
    const token = localStorage.getItem("token");

    if (!token || cancelling) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel your Pro subscription? " +
        "Your existing paid access will remain until its expiry date. " +
        "This records your cancellation request; it does not automatically " +
        "stop recurring ExpressPay charges."
    );

    if (!confirmed) return;

    setCancelling(true);
    setSubscriptionMessage("");
    setSubscriptionError("");

    try {
      const result = await cancelSubscription(token);
      const updatedProfile = await getCurrentUser(token);

      setUser(updatedProfile.user);

      setSubscriptionMessage(
        result.message ||
          "Your cancellation request has been recorded."
      );
    } catch (err) {
      console.error("Subscription cancellation error:", err);

      setSubscriptionError(
        err.message ||
          "Could not record your cancellation. Please try again."
      );
    } finally {
      setCancelling(false);
    }
  };

  // Logout
  const handleLogout = () => {
    clearSession();
    setMenuOpen(false);
    navigate("/login");
  };

  // Open the selector
  const openSelector = (type) => {
    setModalType(type);
    setSearch("");
    setError("");
    setNotice("");
  };

  const closeSelector = () => {
    if (saving) return;

    setModalType(null);
    setSearch("");
  };

  // Add a favourite
  const handleAddFavorite = async (item) => {
    const token = localStorage.getItem("token");

    if (!token || saving) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      if (modalType === "team") {
        await addFavoriteTeam(item.id, token);

        setFavoriteTeams((previous) => {
          if (previous.some((team) => team.id === item.id)) {
            return previous;
          }

          return [...previous, item];
        });

        setNotice(`${item.name} added to your favorite teams.`);
      } else {
        await addFavoritePlayer(item.id, token);

        setFavoritePlayers((previous) => {
          if (previous.some((player) => player.id === item.id)) {
            return previous;
          }

          return [...previous, item];
        });

        setNotice(
          `${item.first_name} ${item.last_name} added to your favorite players.`
        );
      }

      setModalType(null);
      setSearch("");
    } catch (err) {
      console.error("Add favorite error:", err);
      setError(err.message || "Could not save this favourite.");
    } finally {
      setSaving(false);
    }
  };

  // Remove a favourite
  const handleRemoveFavorite = async (type, item) => {
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    setError("");
    setNotice("");

    try {
      if (type === "team") {
        await removeFavoriteTeam(item.id, token);

        setFavoriteTeams((previous) =>
          previous.filter((team) => team.id !== item.id)
        );

        setNotice(`${item.name} removed from your favorite teams.`);
      } else {
        await removeFavoritePlayer(item.id, token);

        setFavoritePlayers((previous) =>
          previous.filter((player) => player.id !== item.id)
        );

        setNotice(
          `${item.first_name} ${item.last_name} removed from your favorite players.`
        );
      }
    } catch (err) {
      console.error("Remove favorite error:", err);
      setError(err.message || "Could not remove this favourite.");
    }
  };

  if (loading) {
    return (
      <div className="profile-loading">
        Loading profile...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-loading">
        Could not load your profile.
      </div>
    );
  }

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

  // Subscription information
  const hasActivePro =
    user.account_type === "pro" &&
    user.pro_expires_at &&
    new Date(user.pro_expires_at) > new Date();

  const hasCancelledPro = Boolean(user.pro_cancelled_at);

  const proExpiryDate = user.pro_expires_at
    ? new Date(user.pro_expires_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  const isTeamModal = modalType === "team";

  const options = (isTeamModal ? teams : players).filter((item) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    if (isTeamModal) {
      return [
        item.name,
        item.nickname,
        item.city,
        item.code,
      ].some((value) =>
        String(value || "").toLowerCase().includes(query)
      );
    }

    const fullName =
      `${item.first_name || ""} ${item.last_name || ""}`;

    return (
      fullName.toLowerCase().includes(query) ||
      String(item.team || "").toLowerCase().includes(query)
    );
  });

  const selectedIds = new Set(
    isTeamModal
      ? favoriteTeams.map((team) => team.id)
      : favoritePlayers.map((player) => player.id)
  );

  return (
    <div className="profile-page">
      {/* SLIDING MENU */}
      {menuOpen && (
        <>
          <div
            className="menu-overlay"
            onClick={() => setMenuOpen(false)}
          />

          <aside className="side-menu">
            <div className="side-menu-header">
              <span>MENU</span>

              <button
                className="close-menu"
                onClick={() => setMenuOpen(false)}
                aria-label="Close menu"
              >
                ×
              </button>
            </div>

            <div className="side-menu-user">
              <div className="side-menu-avatar">
                {initials}
              </div>

              <div>
                <strong>{user.name}</strong>
                <small>{user.email}</small>
              </div>
            </div>

            <div className="side-menu-items">
              <button
                className="side-menu-item active"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/profile");
                }}
              >
                <div className="menu-item-icon">♙</div>

                <div className="menu-item-text">
                  <strong>Profile</strong>
                  <small>Account details</small>
                </div>

                <span className="menu-arrow">›</span>
              </button>

              <button
                className="side-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  navigate("/league-pass");
                }}
              >
                <div className="menu-item-icon">★</div>

                <div className="menu-item-text">
                  <strong>Subscription</strong>
                  <small>League Pass</small>
                </div>

                <span className="subscription-status">
                  {user.account_type === "pro" ? "Active" : "Free"}
                </span>
              </button>

              <button
                className="side-menu-item"
                onClick={() => {
                  setMenuOpen(false);
                  setNotice(
                    "Saved Player Cards is not connected yet."
                  );
                }}
              >
                <div className="menu-item-icon">▣</div>

                <div className="menu-item-text">
                  <strong>Saved Player Cards</strong>
                  <small>Your saved players</small>
                </div>

                <span className="menu-arrow">›</span>
              </button>
            </div>

            <div className="side-menu-bottom">
              <button
                className="side-menu-logout"
                onClick={handleLogout}
              >
                ↪ <span>Log out</span>
              </button>
            </div>
          </aside>
        </>
      )}

      {/* PROFILE CONTENT */}
      <main className="profile-content">
        <div className="profile-heading">
          <h1>Profile</h1>
          <p>Manage your account and favorites</p>
        </div>

        <div className="profile-layout">
          {/* USER CARD */}
          <section className="user-card">
            <div className="avatar">{initials}</div>
            <div className="avatar-status">✓</div>

            <h2>{user.name}</h2>
            <p className="user-email">{user.email}</p>

            <div className="account-status">
              {hasActivePro
                ? hasCancelledPro
                  ? "League Pass · Cancelling"
                  : "League Pass · Active"
                : "Free Account"}
            </div>

            <div className="member-since">
              <span>Member since</span>
              <strong>{memberSince}</strong>
            </div>
          </section>

          {/* RIGHT SIDE */}
          <section className="profile-right">
            {/* SUBSCRIPTION MANAGEMENT */}
            <div className="profile-panel subscription-panel">
              <div className="panel-title-row">
                <h2>League Pass subscription</h2>

                <span
                  className={`subscription-badge ${
                    hasActivePro ? "pro" : "free"
                  }`}
                >
                  {hasActivePro ? "Pro" : "Free"}
                </span>
              </div>

              {hasActivePro ? (
                <>
                  <p className="subscription-description">
                    {hasCancelledPro
                      ? "Your cancellation request has been recorded. Your Pro access remains available until the date below."
                      : "You currently have access to NBA Stats Pro features."}
                  </p>

                  <div className="subscription-expiry">
                    <span>Pro access valid until</span>
                    <strong>
                      {proExpiryDate || "Date unavailable"}
                    </strong>
                  </div>

                  {hasCancelledPro ? (
                    <p className="subscription-cancelled">
                      Cancellation recorded. Your paid access has
                      not been removed.
                    </p>
                  ) : (
                    <button
                      type="button"
                      className="cancel-subscription-button"
                      onClick={handleCancelSubscription}
                      disabled={cancelling}
                    >
                      {cancelling
                        ? "Processing..."
                        : "Cancel Subscription"}
                    </button>
                  )}
                </>
              ) : (
                <>
                  <p className="subscription-description">
                    {user.account_type === "pro"
                      ? "Your Pro access has expired."
                      : "You're currently using the free account."}
                  </p>

                  <button
                    type="button"
                    className="manage-subscription-button"
                    onClick={() => navigate("/league-pass")}
                  >
                    View Pro Plans
                  </button>
                </>
              )}

              {subscriptionMessage && (
                <p
                  className="favorites-message success"
                  role="status"
                >
                  {subscriptionMessage}
                </p>
              )}

              {subscriptionError && (
                <p
                  className="favorites-message error"
                  role="alert"
                >
                  {subscriptionError}
                </p>
              )}
            </div>

            {/* PERSONAL INFORMATION */}
            <div className="profile-panel personal-panel">
              <div className="panel-title-row">
                <h2>Personal information</h2>
                <span className="profile-readonly-label">
                  Account details
                </span>
              </div>

              <div className="personal-grid">
                <div className="profile-field">
                  <label>Full name</label>
                  <input
                    type="text"
                    value={user.name || ""}
                    readOnly
                  />
                </div>

                <div className="profile-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={user.email || ""}
                    readOnly
                  />
                </div>

                <div className="profile-field">
                  <label>Phone number</label>
                  <input
                    type="text"
                    placeholder="Not added"
                    readOnly
                  />
                </div>
              </div>
            </div>

            {/* FAVORITE TEAMS */}
            <div className="profile-panel">
              <div className="panel-title-row">
                <h2>Favorite teams</h2>

                <button
                  className="add-button"
                  onClick={() => openSelector("team")}
                >
                  + Add team
                </button>
              </div>

              {favoritesLoading ? (
                <p className="favorites-empty">
                  Loading favorite teams...
                </p>
              ) : favoriteTeams.length === 0 ? (
                <p className="favorites-empty">
                  You haven't added any favorite teams yet.
                </p>
              ) : (
                <div className="favorite-list">
                  {favoriteTeams.map((team) => (
                    <div className="favorite-team" key={team.id}>
                      {team.logo ? (
                        <img
                          className="favorite-team-logo"
                          src={team.logo}
                          alt=""
                        />
                      ) : (
                        <div className="team-circle">
                          {team.code || team.name?.slice(0, 3)}
                        </div>
                      )}

                      <div className="favorite-info">
                        <small>
                          {team.city || "NBA"} {team.code || ""}
                        </small>
                        <strong>{team.name}</strong>
                      </div>

                      <button
                        className="remove-button"
                        onClick={() =>
                          handleRemoveFavorite("team", team)
                        }
                        aria-label={`Remove ${team.name}`}
                        title="Remove favorite team"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* FAVORITE PLAYERS */}
            <div className="profile-panel">
              <div className="panel-title-row">
                <h2>Favorite players</h2>

                <button
                  className="add-button"
                  onClick={() => openSelector("player")}
                >
                  + Add player
                </button>
              </div>

              {favoritesLoading ? (
                <p className="favorites-empty">
                  Loading favorite players...
                </p>
              ) : favoritePlayers.length === 0 ? (
                <p className="favorites-empty">
                  You haven't added any favorite players yet.
                </p>
              ) : (
                <div className="favorite-list">
                  {favoritePlayers.map((player) => (
                    <div
                      className="favorite-player"
                      key={player.id}
                    >
                      {player.photo ? (
                        <img
                          className="player-avatar favorite-player-photo"
                          src={player.photo}
                          alt=""
                        />
                      ) : (
                        <div className="player-avatar">
                          {player.first_name?.[0]}
                          {player.last_name?.[0]}
                        </div>
                      )}

                      <div className="favorite-info">
                        <small>
                          {player.team || "NBA Player"}
                          {player.position
                            ? ` · ${player.position}`
                            : ""}
                        </small>

                        <strong>
                          {player.first_name} {player.last_name}
                        </strong>
                      </div>

                      <button
                        className="remove-button"
                        onClick={() =>
                          handleRemoveFavorite("player", player)
                        }
                        aria-label={`Remove ${player.first_name} ${player.last_name}`}
                        title="Remove favorite player"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {error && (
              <p className="favorites-message error" role="alert">
                {error}
              </p>
            )}

            {notice && (
              <p
                className="favorites-message success"
                role="status"
              >
                {notice}
              </p>
            )}

            <button
              className="profile-logout"
              onClick={handleLogout}
            >
              Log out
            </button>
          </section>
        </div>
      </main>

      {/* TEAM / PLAYER SELECTOR */}
      {modalType && (
        <div
          className="favorite-modal-overlay"
          onClick={closeSelector}
        >
          <section
            className="favorite-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="favorite-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="favorite-modal-header">
              <div>
                <h2 id="favorite-modal-title">
                  Add favorite {isTeamModal ? "team" : "player"}
                </h2>

                <p>
                  Choose from the teams and players in your database.
                </p>
              </div>

              <button
                className="close-menu"
                onClick={closeSelector}
                disabled={saving}
                aria-label="Close selector"
              >
                ×
              </button>
            </div>

            <input
              className="favorite-search"
              type="search"
              placeholder={
                isTeamModal
                  ? "Search teams by name or city..."
                  : "Search players by name or team..."
              }
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              autoFocus
            />

            <div className="favorite-options">
              {options.map((item) => {
                const label = isTeamModal
                  ? item.name
                  : `${item.first_name} ${item.last_name}`;

                const subtitle = isTeamModal
                  ? [item.city, item.nickname, item.code]
                      .filter(Boolean)
                      .join(" · ")
                  : [item.team, item.position]
                      .filter(Boolean)
                      .join(" · ");

                const alreadyAdded = selectedIds.has(item.id);

                return (
                  <div
                    className="favorite-option"
                    key={item.id}
                  >
                    <div className="favorite-option-info">
                      <strong>{label}</strong>
                      <small>{subtitle || "NBA"}</small>
                    </div>

                    <button
                      className={
                        alreadyAdded
                          ? "favorite-select-button added"
                          : "favorite-select-button"
                      }
                      disabled={alreadyAdded || saving}
                      onClick={() => handleAddFavorite(item)}
                    >
                      {alreadyAdded
                        ? "Added"
                        : saving
                          ? "Saving..."
                          : "Add"}
                    </button>
                  </div>
                );
              })}

              {options.length === 0 && (
                <p className="favorites-empty">
                  No {isTeamModal ? "teams" : "players"} match your
                  search.
                </p>
              )}
            </div>

            <div className="favorite-modal-footer">
              <span>
                {options.length} {isTeamModal ? "teams" : "players"}{" "}
                found
              </span>

              <button
                className="favorite-cancel-button"
                onClick={closeSelector}
                disabled={saving}
              >
                Close
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default Profile;
