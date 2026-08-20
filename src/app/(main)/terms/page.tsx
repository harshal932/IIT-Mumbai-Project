import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck, Lock, FileText, HelpCircle, Eye, AlertTriangle } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Header Banner */}
      <div>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">
              Terms of Service & Help Center
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Community guidelines, ground-truth verification standards, and privacy protections for LocalLoop.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Key Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Policy 1: Community Conduct */}
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Community Conduct</CardTitle>
              <p className="text-xs text-gray-400">Ground truth reporting & authenticity</p>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-gray-600 dark:text-gray-300 space-y-2 leading-relaxed">
            <p>
              LocalLoop is built on trust and direct community participation. All problem reports, verifications, and comments must represent genuine local observations.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-gray-500">
              <li>Do not post false, misleading, or commercial promotion content.</li>
              <li>Always provide accurate descriptions and genuine urgency markers.</li>
              <li>Respect fellow residents and municipal workers in all discussions.</li>
            </ul>
          </CardContent>
        </Card>

        {/* Policy 2: Privacy & Geo Fuzzing */}
        <Card className="shadow-2xs">
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-base">Privacy & Location Security</CardTitle>
              <p className="text-xs text-gray-400">Resident safety & fuzzing protection</p>
            </div>
          </CardHeader>
          <CardContent className="text-xs text-gray-600 dark:text-gray-300 space-y-2 leading-relaxed">
            <p>
              To protect community members&apos; privacy, exact home coordinates are automatically fuzzed by up to ~300 meters on public feeds and map displays.
            </p>
            <ul className="list-disc pl-4 space-y-1 text-gray-500">
              <li>Anonymous reporting is fully supported for sensitive issues.</li>
              <li>Exact GPS points are restricted to verified municipal liaisons.</li>
              <li>Personal identifiable data is never sold or shared with third parties.</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Full Terms Section */}
      <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 p-6 sm:p-8 space-y-6 shadow-2xs">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 border-b border-gray-100 dark:border-gray-800 pb-3">
          Detailed Terms & Legal Agreement
        </h2>

        <div className="space-y-4 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          <section className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Eye className="h-4 w-4 text-indigo-500" />
              1. Acceptance of Terms
            </h3>
            <p>
              By accessing or using LocalLoop, you agree to be bound by these Terms of Service and all applicable local municipal regulations. If you do not agree, please refrain from submitting community reports or accessing platform services.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              2. Emergency & Immediate Hazard Notice
            </h3>
            <p className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/40 text-amber-800 dark:text-amber-300">
              <strong>IMPORTANT:</strong> LocalLoop is a community reporting tool and is <em>NOT a replacement for emergency emergency services (911 or local emergency dispatches)</em>. If you encounter an immediate danger to life or active crime, contact emergency authorities directly immediately.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-blue-500" />
              3. Content Verification & Moderation Policy
            </h3>
            <p>
              Submissions flagged for misinformation, harassment, or spam undergo automated rate limiting and human moderator review. Accounts found repeatedly violating community standards may be subject to reputation penalties or account restrictions.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
              4. Service Availability & Modification
            </h3>
            <p>
              LocalLoop provides community platform features on an &quot;as is&quot; and &quot;as available&quot; basis. Features, categories, and verification thresholds may be updated to reflect civic best practices.
            </p>
          </section>
        </div>
      </div>

      {/* Help FAQ Section */}
      <div className="bg-indigo-50/50 dark:bg-indigo-950/20 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 p-6 space-y-4">
        <h3 className="text-sm font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          Need Help or Want to Contact Legal Support?
        </h3>
        <p className="text-xs text-indigo-700 dark:text-indigo-300">
          Have questions about your reports or privacy rights? Reach out to our community support team at{" "}
          <a href="mailto:support@localloop.org" className="underline font-semibold hover:text-indigo-900 dark:hover:text-indigo-100">
            support@localloop.org
          </a>.
        </p>
      </div>
    </div>
  );
}
