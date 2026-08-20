"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2, AlertTriangle, UserPlus, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Email verification state
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    checked: boolean;
    isRegistered: boolean;
    name?: string;
    message?: string;
  }>({ checked: false, isRegistered: false });

  // Real-time email lookup database crosscheck
  useEffect(() => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !trimmed.includes("@") || !trimmed.includes(".")) {
      setEmailStatus({ checked: false, isRegistered: false });
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const res = await fetch(`/api/users/check-email?email=${encodeURIComponent(trimmed)}`);
        const json = await res.json().catch(() => ({}));
        if (res.ok && json.isRegistered) {
          setEmailStatus({
            checked: true,
            isRegistered: true,
            name: json.user?.name,
          });
        } else {
          setEmailStatus({
            checked: true,
            isRegistered: false,
            message: json.message || "This email is not registered in the platform.",
          });
        }
      } catch {
        setEmailStatus({ checked: false, isRegistered: false });
      } finally {
        setCheckingEmail(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedEmail = email.trim().toLowerCase();

    // If email was checked and is NOT registered, prompt registration
    if (emailStatus.checked && !emailStatus.isRegistered) {
      toast.error("Account Not Found", "Please create a new account before signing in.");
      router.push(`/register?email=${encodeURIComponent(trimmedEmail)}`);
      return;
    }

    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: trimmedEmail,
        password,
        redirect: false,
      });

      if (res?.error) {
        toast.error("Sign In Failed", "Invalid password or credentials.");
      } else {
        toast.success("Welcome back!", emailStatus.name ? `Signed in as ${emailStatus.name}` : undefined);
        router.push("/feed");
        router.refresh();
      }
    } catch {
      toast.error("Error", "An unexpected error occurred during sign in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
          Sign in to LocalLoop
        </h2>
        <p className="text-xs text-gray-500 text-center mt-1">
          Access your local community feed and problem reports
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Input
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {/* Email DB Crosscheck Status Badges */}
          {checkingEmail && (
            <p className="text-[11px] text-gray-400 animate-pulse flex items-center gap-1.5 pl-1">
              Checking database for registered email...
            </p>
          )}

          {!checkingEmail && emailStatus.checked && emailStatus.isRegistered && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium pl-1">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Registered account found ({emailStatus.name})</span>
            </div>
          )}

          {!checkingEmail && emailStatus.checked && !emailStatus.isRegistered && (
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 space-y-2 text-xs">
              <div className="flex items-start gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span>Account not registered in database</span>
              </div>
              <p className="text-[11px] text-amber-700 dark:text-amber-300">
                No account exists for <strong>{email}</strong>. You need to create a new account to sign in.
              </p>
              <Link
                href={`/register?email=${encodeURIComponent(email)}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-100 hover:underline pt-0.5"
              >
                <UserPlus className="h-3.5 w-3.5" />
                Create New Account Now
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <Button
          type="submit"
          loading={loading}
          className={`w-full font-semibold ${
            emailStatus.checked && !emailStatus.isRegistered
              ? "bg-amber-600 hover:bg-amber-700 text-white"
              : "bg-indigo-600 hover:bg-indigo-700 text-white"
          }`}
        >
          {emailStatus.checked && !emailStatus.isRegistered
            ? "Create Account to Sign In"
            : "Sign In"}
        </Button>
      </form>

      <div className="text-center border-t border-gray-100 dark:border-gray-800 pt-4">
        <p className="text-xs text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href={email ? `/register?email=${encodeURIComponent(email)}` : "/register"}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
