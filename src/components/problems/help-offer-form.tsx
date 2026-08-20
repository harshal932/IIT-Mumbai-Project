"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { HandHeart, CheckCircle2, Check, AlertCircle } from "lucide-react";
import type { HelpType } from "@/lib/types";

const HELP_TYPE_OPTIONS: { id: HelpType; label: string; description: string }[] = [
  { id: "information", label: "Information / Advice", description: "Share local knowledge, contact details, or legal/technical guidance" },
  { id: "volunteer", label: "Volunteer Hands-On", description: "Offer physical assistance, cleanup, repair, or presence" },
  { id: "resources", label: "Equipment / Supplies", description: "Lend tools, donate materials, or share supplies" },
  { id: "professional", label: "Professional Skill", description: "Pro bono legal, medical, engineering, or tradeperson skill" },
  { id: "authority_contact", label: "Authority Liaison", description: "Connect with city officials, departments, or leaders" },
  { id: "organization_support", label: "Org Support", description: "Connect with relevant NGO or community group resources" },
];

interface HelpOfferFormProps {
  problemId: string;
  hasOfferedHelp?: boolean;
  onOfferSubmitted?: () => void;
}

export function HelpOfferForm({
  problemId,
  hasOfferedHelp = false,
  onOfferSubmitted,
}: HelpOfferFormProps) {
  const [open, setOpen] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<HelpType[]>(["information"]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [offered, setOffered] = useState(hasOfferedHelp);
  const toast = useToast();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(`localloop_help_offered_${problemId}`);
      if (saved === "true") {
        setOffered(true);
      }
    }
  }, [problemId]);

  const toggleType = (type: HelpType) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        const next = prev.filter((t) => t !== type);
        return next.length === 0 ? ["information"] : next;
      }
      return [...prev, type];
    });
  };

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    if (selectedTypes.length === 0) {
      setSelectedTypes(["information"]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const typesToSubmit = selectedTypes.length > 0 ? selectedTypes : ["information"];
    const finalMessage = message.trim();

    if (finalMessage.length < 10) {
      toast.error("Please write a description", "Enter at least 10 characters describing how you can assist.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/problems/${problemId}/help-offers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          helpTypes: typesToSubmit,
          message: finalMessage,
          isPrivate: true,
        }),
        signal: AbortSignal.timeout(12000),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to send help offer");
      }

      if (typeof window !== "undefined") {
        localStorage.setItem(`localloop_help_offered_${problemId}`, "true");
      }

      toast.success("Help offer submitted!", "The problem reporter has been notified.");
      setOffered(true);
      setOpen(false);
      setMessage("");
      onOfferSubmitted?.();
    } catch (err: unknown) {
      const msg =
        err instanceof DOMException && err.name === "TimeoutError"
          ? "The request timed out. Please try again."
          : err instanceof Error
            ? err.message
            : "Failed to send help offer";
      toast.error("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (offered) {
    return (
      <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs font-semibold shadow-2xs">
        <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span>You have offered support for this problem. Thank you for assisting your community!</span>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold py-3 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2"
      >
        <HandHeart className="h-4 w-4" />
        Offer Support / Assistance
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Offer Help on this Problem"
        description="Select how you can assist. Your message will be sent privately to the post reporter."
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-200 mb-2">
              Select Assistance Types
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {HELP_TYPE_OPTIONS.map((opt) => {
                const selected = selectedTypes.includes(opt.id);
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => toggleType(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between relative ${
                      selected
                        ? "border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-200 ring-2 ring-emerald-400/50"
                        : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/60 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-xs font-bold">{opt.label}</span>
                      {selected && <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-tight">
                      {opt.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Textarea
            label="Describe your help offer"
            placeholder="Introduce yourself and explain what specific assistance, tools, or contacts you can provide (min 10 characters)..."
            value={message}
            onChange={handleMessageChange}
            maxLength={1000}
            showCount
            rows={4}
            required
          />

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            <span className="text-[11px] text-gray-400">
              {message.trim().length < 10 ? "Write at least 10 characters" : "Ready to submit"}
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                loading={submitting}
                disabled={message.trim().length < 10}
              >
                Submit Help Offer
              </Button>
            </div>
          </div>
        </form>
      </Dialog>
    </>
  );
}
