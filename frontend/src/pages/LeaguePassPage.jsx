
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./LeaguePassPage.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

function LeaguePassPage() {
  const [billing, setBilling] = useState("monthly");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const isYearly = billing === "yearly";
  const price = isYearly ? 1100 : 110;

  
async function handleSubscribe() {
  setError("");

  const token = localStorage.getItem("token");

  if (!token) {
    setError("Please log in before subscribing to League Pass.");
    return;
  }

  setLoading(true);

  try {
    const response = await fetch(
      `${API_BASE}/payments/expresspay/create`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          billingPeriod: billing,
        }),
      }
    );

    const data = await response.json();

    console.log("Payment response:", {
      ok: response.ok,
      status: response.status,
      orderId: data.orderId,
      checkoutUrl: data.checkoutUrl,
      hasCheckoutToken: Boolean(data.checkoutToken),
      message: data.message,
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        setError("Your session has expired. Please log in again.");
        return;
      }

      if (response.status === 409) {
        setError(
          "You already have active Pro access. Check your profile for your subscription status."
        );
        return;
      }

      throw new Error(
        data.message || "Unable to start checkout. Please try again."
      );
    }

    if (!data.checkoutUrl || !data.checkoutToken) {
      throw new Error("The checkout details were incomplete.");
    }

    const checkoutUrl = new URL(data.checkoutUrl);

    console.log(
      "Checkout URL received:",
      checkoutUrl.origin + checkoutUrl.pathname
    );
    console.log(
      "Has token:",
      checkoutUrl.searchParams.has("token")
    );

    if (
      ![
        "https://sandbox.expresspaygh.com",
        "https://expresspaygh.com",
      ].includes(checkoutUrl.origin) ||
      checkoutUrl.pathname !== "/api/checkout.php" ||
      !checkoutUrl.searchParams.has("token")
    ) {
      throw new Error(
        "The checkout address is not recognised. Please check the backend checkout URL."
      );
    }

    window.location.assign(checkoutUrl.toString());
  } catch (err) {
    setError(
      err.message || "Something went wrong. Please try again."
    );
  } finally {
    setLoading(false);
  }
}


  return (
    <main className="league-pass-page">
      <section className="pass-hero">
        <p className="pass-eyebrow">NBA STATS PREMIUM</p>
        <h1>Unlock League Pass</h1>
        <p className="pass-intro">
          Get more info from every player, team and game.
          Explore the stats.
        </p>

        <div className="billing-switch" aria-label="Billing period">
          <button
            type="button"
            className={billing === "monthly" ? "selected" : ""}
            aria-pressed={billing === "monthly"}
            onClick={() => {
              setBilling("monthly");
              setError("");
            }}
          >
            Monthly
          </button>

          <button
            type="button"
            className={billing === "yearly" ? "selected" : ""}
            aria-pressed={billing === "yearly"}
            onClick={() => {
              setBilling("yearly");
              setError("");
            }}
          >
            Yearly
          </button>
        </div>
      </section>

      <section className="pass-plans">
        <article className="pass-plan">
          <p className="plan-label">START HERE</p>
          <h2>Free</h2>

          <p className="plan-description">
            The essentials for every basketball fan.
          </p>

          <div className="plan-price">
            GH₵0 <span>/ forever</span>
          </div>

          <button
            type="button"
            className="plan-button secondary"
            onClick={() => navigate("/players")}
          >
            Explore NBA Stats
          </button>

          <ul>
            <li>✓ Browse NBA players</li>
            <li>✓ Explore all teams</li>
            <li>✓ View player profiles</li>
            <li>✓ Basic player information</li>
          </ul>
        </article>

        <article className="pass-plan featured-plan">
          <span className="plan-badge">PREMIUM</span>
          <p className="plan-label">FOR THE BIGGEST FANS</p>
          <h2>League Pass</h2>

          <div className="plan-price">
            GH₵{price.toLocaleString("en-GH")}
            <span>
              {isYearly ? " / year" : " / month"}
            </span>
          </div>

          <p className="plan-note">
            {isYearly
              ? "Billed GH₵1,100 yearly"
              : "Billed monthly"}
          </p>

          <button
            type="button"
            className="plan-button primary"
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? "Connecting to ExpressPay..." : "Subscribe Now"}
          </button>

          {error && (
            <div className="payment-error" role="alert">
              <p>{error}</p>

              {error.includes("log in") && (
                <button
                  type="button"
                  className="plan-button secondary"
                  onClick={() => navigate("/login")}
                >
                  Log In
                </button>
              )}

              {error.includes("session has expired") && (
                <button
                  type="button"
                  className="plan-button secondary"
                  onClick={() => navigate("/login")}
                >
                  Log In Again
                </button>
              )}
            </div>
          )}

          <ul>
            <li>✓ Everything in Free</li>
            <li>✓ Save favourite players</li>
            <li>✓ Save favourite teams</li>
            <li>✓ Access recent game schedules</li>
          </ul>
        </article>
      </section>

      <section className="pass-benefits">
        <div>
          <span className="benefit-icon">★</span>
          <h3>Your favourite players</h3>
          <p>Keep the players you follow close at hand.</p>
        </div>

        <div>
          <span className="benefit-icon">▦</span>
          <h3>More game insights</h3>
          <p>
            Explore recent performances and player statistics.
          </p>
        </div>
      </section>
    </main>
  );
}

export default LeaguePassPage;
