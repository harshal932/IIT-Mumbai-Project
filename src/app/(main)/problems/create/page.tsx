import { ProblemForm } from "@/components/problems/problem-form";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function CreateProblemPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/problems/create");
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 py-2">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Report a Local Problem
        </h1>
        <p className="text-xs text-gray-500 mt-1">
          Provide ground details, location, and the type of community support needed.
        </p>
      </div>

      <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <ProblemForm />
      </div>
    </div>
  );
}
