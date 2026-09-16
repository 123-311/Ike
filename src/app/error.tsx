"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-sm mx-auto text-center py-20">
      <h1 className="text-3xl font-extrabold text-danger mb-2">Something went wrong</h1>
      <p className="text-sm text-muted mb-6">
        An unexpected error occurred. Please try again.
        {error.digest && (
          <>
            <br />
            <span className="text-xs">Reference: {error.digest}</span>
          </>
        )}
      </p>
      <button
        onClick={reset}
        className="inline-block rounded-lg bg-primary text-primary-contrast px-5 py-2.5 text-sm font-semibold"
      >
        Try again
      </button>
    </div>
  );
}
