import Link from "next/link";

export default function AuthCodeError() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md rounded-2xl border border-red-800 bg-gray-900 p-8 text-center shadow-xl">
        <h1 className="mb-2 text-2xl font-bold text-red-400">
          Authentication Error
        </h1>
        <p className="mb-6 text-gray-400">
          Something went wrong during sign-in. The link may have expired or
          already been used.
        </p>
        <Link
          href="/signin"
          className="inline-block rounded-lg bg-gray-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-600"
        >
          Back to Sign in
        </Link>
      </div>
    </main>
  );
}
