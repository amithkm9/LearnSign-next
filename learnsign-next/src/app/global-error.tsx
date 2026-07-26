"use client";

/**
 * Last-resort boundary: catches failures in the root layout itself, where
 * `error.tsx` can't run. It must render its own <html>/<body>.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          display: "grid",
          placeItems: "center",
          minHeight: "100vh",
          margin: 0,
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "1rem",
        }}
      >
        <div>
          <div style={{ fontSize: "3rem" }}>🙈</div>
          <h1 style={{ fontSize: "1.25rem" }}>Something went wrong</h1>
          <p style={{ color: "#666", fontSize: "0.875rem" }}>
            Please reload the page.
          </p>
          <button
            onClick={reset}
            style={{
              marginTop: "1rem",
              padding: "0.5rem 1.25rem",
              borderRadius: "9999px",
              border: "1px solid #ccc",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest && (
            <p style={{ color: "#999", fontSize: "0.75rem", marginTop: "1.5rem" }}>
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
