import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-sm mx-auto text-center py-20">
      <h1 className="text-3xl font-extrabold text-primary mb-2">404</h1>
      <p className="text-lg font-semibold mb-1">Page not found</p>
      <p className="text-sm text-muted mb-6">
        This deal or page may have expired, been removed, or never existed.
      </p>
      <Link
        href="/"
        className="inline-block rounded-lg bg-primary text-primary-contrast px-5 py-2.5 text-sm font-semibold"
      >
        Back to Mtaani Deals
      </Link>
    </div>
  );
}
