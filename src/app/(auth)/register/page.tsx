"use client";

import { useState, useEffect, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { CheckCircle2, AlertCircle, LogIn } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const initialEmail = searchParams.get("email") || "";

  const [name, setName] = useState("");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    checked: boolean;
    isRegistered: boolean;
    name?: string;
  }>({ checked: false, isRegistered: false });

  // Crosscheck email availability in database
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

    if (emailStatus.checked && emailStatus.isRegistered) {
      toast.error("Already Registered", "An account with this email already exists. Please sign in instead.");
      router.push(`/login?email=${encodeURIComponent(email)}`);
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Password mismatch", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, confirmPassword }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Registration failed");
      }

      toast.success("Account created!", "Signing you in...");

      // Auto sign-in
      const signInRes = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        password,
        redirect: false,
      });

      if (signInRes?.error) {
        router.push("/login");
      } else {
        router.push("/feed");
        router.refresh();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Registration failed";
      toast.error("Registration Error", msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 text-center">
          Join LocalLoop Community
        </h2>
        <p className="text-xs text-gray-500 text-center mt-1">
          Create an account to report issues, verify problems, and offer help
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Full Name / Display Name"
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={2}
        />

        <div className="space-y-1.5">
          <Input
            type="email"
            label="Email Address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          {checkingEmail && (
            <p className="text-[11px] text-gray-400 animate-pulse flex items-center gap-1.5 pl-1">
              Checking database for email availability...
            </p>
          )}

          {!checkingEmail && emailStatus.checked && !emailStatus.isRegistered && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium pl-1">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              <span>Email available for new account registration</span>
            </div>
          )}

          {!checkingEmail && emailStatus.checked && emailStatus.isRegistered && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300 space-y-2 text-xs">
              <div className="flex items-start gap-2 font-semibold">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>Account already registered ({emailStatus.name})</span>
              </div>
              <p className="text-[11px] text-blue-700 dark:text-blue-300">
                You already have an active account for <strong>{email}</strong>.
              </p>
              <Link
                href={`/login?email=${encodeURIComponent(email)}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-900 dark:text-blue-100 hover:underline pt-0.5"
              >
                <LogIn className="h-3.5 w-3.5" />
                Sign In to Existing Account
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
          minLength={6}
        />

        <Input
          type="password"
          label="Confirm Password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
        />

        <Button
          type="submit"
          loading={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold"
          disabled={emailStatus.checked && emailStatus.isRegistered}
        >
          Create New Account
        </Button>
      </form>

      <div className="text-center border-t border-gray-100 dark:border-gray-800 pt-4">
        <p className="text-xs text-gray-500">
          Already registered?{" "}
          <Link
            href={email ? `/login?email=${encodeURIComponent(email)}` : "/login"}
            className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-xs text-gray-400">Loading registration form...</div>}>
      <RegisterForm />
    </Suspense>
  );
}
