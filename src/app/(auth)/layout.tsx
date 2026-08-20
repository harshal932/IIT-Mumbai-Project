import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-gray-50 dark:bg-gray-950">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 mb-2"
        >
          <span>LocalLoop</span>
        </Link>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Community Problem-Solving Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-gray-900 py-8 px-4 shadow-xl border border-gray-100 dark:border-gray-800 sm:rounded-2xl sm:px-10">
          {children}
        </div>
      </div>
    </div>
  );
}
