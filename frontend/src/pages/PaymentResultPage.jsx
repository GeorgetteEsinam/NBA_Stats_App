import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import "./PaymentResultPage.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api";

function PaymentResultPage() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [status, setStatus] = useState("checking");
  const [message, setMessage] = useState("Checking your payment with ExpressPay...");
  const [checking, setChecking] = useState(false);

  const checkPayment = useCallback(async () => {
    const token = localStorage.getItem("token");

    if (!orderId) {
      setStatus("error");
      setMessage("We couldn't find a payment reference.");
      return;
    }

    if (!token) {
      setStatus("login");
      setMessage(
        "Your payment reference is available, but you need to log in to check its status."
      );
      return;
    }

    setChecking(true);

    try {
      const response = await fetch(
        `${API_BASE}/payments/expresspay/status/${encodeURIComponent(orderId)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to check payment right now.");
      }

      const paymentStatus = String(
        data.payment?.status ?? data.status ?? ""
      ).toLowerCase();

      if (["approved", "success", "successful", "paid"].includes(paymentStatus)) {
        setStatus("success");
        setMessage("Your payment was confirmed. Your League Pass subscription is active.");
      } else if (["pending", "processing"].includes(paymentStatus)) {
        setStatus("pending");
        setMessage(
          "Your payment is still being confirmed. You can check again in a moment."
        );
      } else if (["declined", "failed", "error", "cancelled", "canceled"].includes(paymentStatus)) {
        setStatus("failed");
        setMessage(
          "The payment was not completed successfully. You can return to League Pass and try again if needed."
        );
      } else {
        setStatus("pending");
        setMessage(
          "We received your return from checkout, but the payment status isn't confirmed yet. Please check again."
        );
      }
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Unable to check your payment right now.");
    } finally {
      setChecking(false);
    }
  }, [orderId]);

  useEffect(() => {
    checkPayment();
  }, [checkPayment]);

  const heading = {
    checking: "Checking payment",
    success: "Payment successful!",
    pending: "Payment pending",
    failed: "Payment not completed",
    error: "Couldn't verify payment",
    login: "Log in to check your payment",
  }[status];

  return (
    <main className="payment-result-page">
      <section className="payment-result-card" aria-live="polite">
        <div className={`payment-result-icon ${status}`}>
          {status === "success"
            ? "✓"
            : status === "failed" || status === "error"
              ? "!"
              : status === "checking"
                ? "…"
                : "i"}
        </div>

        <h1>{heading}</h1>
        <p>{message}</p>

        {orderId && (
          <p className="payment-reference">
            Payment reference: <strong>{orderId}</strong>
          </p>
        )}

        {status === "pending" && (
          <button
            type="button"
            className="result-primary-button"
            onClick={checkPayment}
            disabled={checking}
          >
            {checking ? "Checking..." : "Check payment again"}
          </button>
        )}

        {status === "error" && (
          <button
            type="button"
            className="result-primary-button"
            onClick={checkPayment}
            disabled={checking}
          >
            {checking ? "Checking..." : "Try checking again"}
          </button>
        )}

        {status === "login" && (
          <Link className="result-primary-button" to="/login">
            Log in
          </Link>
        )}

        {status === "success" && (
          <Link className="result-primary-button" to="/">
            Return to NBA Stats
          </Link>
        )}

        {(status === "failed" || status === "error" || status === "login") && (
          <Link className="result-secondary-link" to="/league-pass">
            Return to League Pass
          </Link>
        )}

        {status === "pending" && (
          <Link className="result-secondary-link" to="/">
            Return home
          </Link>
        )}
      </section>
    </main>
  );
}

export default PaymentResultPage;
