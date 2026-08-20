"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { Alert } from "@/components/ui/alert";
import { MapPin, CheckSquare, Upload, X, Loader2 } from "lucide-react";
import { reverseGeocode } from "@/lib/services/geocoding";
import type { ProblemUrgency, ProblemType, HelpType } from "@/lib/types";

const CATEGORIES = [
  { id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1201", name: "Potholes & Roads" },
  { id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1202", name: "Street Lighting & Electricity" },
  { id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1203", name: "Water, Plumbing & Drainage" },
  { id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1204", name: "Sanitation & Waste Management" },
  { id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1205", name: "Public Safety & Hazards" },
  { id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1206", name: "Parks & Environment" },
  { id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1207", name: "Accessibility & Sidewalks" },
  { id: "e1a90c01-7d12-4d22-8d76-1b5e0c5d1208", name: "Community / General Help" },
];

const HELP_TYPES: { id: HelpType; label: string }[] = [
  { id: "information", label: "Information & Advice" },
  { id: "volunteer", label: "Volunteer Assistance" },
  { id: "resources", label: "Tools / Supplies / Equipment" },
  { id: "professional", label: "Professional / Technical Help" },
  { id: "authority_contact", label: "Contacting City Authorities" },
  { id: "organization_support", label: "NGO / Community Group Action" },
];

export function ProblemForm() {
  const router = useRouter();
  const toast = useToast();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState(CATEGORIES[0].id);
  const [urgency, setUrgency] = useState<ProblemUrgency>("medium");
  const [problemType, setProblemType] = useState<ProblemType>("public");
  const [selectedHelpTypes, setSelectedHelpTypes] = useState<HelpType[]>(["information"]);
  const [locationArea, setLocationArea] = useState("");
  const [lat, setLat] = useState<number>(40.7128);
  const [lng, setLng] = useState<number>(-74.006);
  const [affectedCount, setAffectedCount] = useState(1);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);

  const toggleHelpType = (ht: HelpType) => {
    setSelectedHelpTypes((prev) =>
      prev.includes(ht) ? prev.filter((t) => t !== ht) : [...prev, ht]
    );
  };

  const handleLocateMe = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const latitude = pos.coords.latitude;
        const longitude = pos.coords.longitude;
        setLat(latitude);
        setLng(longitude);

        try {
          const address = await reverseGeocode(latitude, longitude);
          setLocationArea(address);
          toast.success("Location acquired!", address);
        } catch {
          setLocationArea(`Near ${latitude.toFixed(3)}, ${longitude.toFixed(3)}`);
        } finally {
          setLocating(false);
        }
      },
      () => {
        toast.error("Could not access GPS location. Default set to NYC.");
        setLocating(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!consentGiven) {
      toast.error("Consent required", "You must accept the terms before submitting.");
      return;
    }

    if (selectedHelpTypes.length === 0) {
      toast.error("Select Help Type", "Select at least one type of help needed.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/problems", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          categoryId,
          urgency,
          problemType,
          helpTypes: selectedHelpTypes,
          latitude: lat,
          longitude: lng,
          locationArea: locationArea.trim() || `Near ${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E`,
          affectedCount: Number(affectedCount),
          isAnonymous,
          visibility: "public",
          consentGiven: true,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create problem report.");
      }

      toast.success("Problem reported!", "Your issue has been posted to the local feed.");
      router.push(`/problems/${json.data.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Submission failed";
      toast.error("Error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <Alert variant="info">
        <strong>Privacy Notice:</strong> Exact locations are never shown publicly. LocalLoop
        fuzzes marker locations slightly to protect your exact home or workplace privacy.
      </Alert>

      {/* Title */}
      <Input
        label="Problem Title"
        placeholder="Brief summary of the issue (e.g. Broken streetlight on 5th Ave)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        minLength={10}
        maxLength={200}
      />

      {/* Category & Urgency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          required
        >
          {CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>

        <Select
          label="Urgency Level"
          value={urgency}
          onChange={(e) => setUrgency(e.target.value as ProblemUrgency)}
          required
        >
          <option value="low">Low — Routine / minor</option>
          <option value="medium">Medium — Moderate disruption</option>
          <option value="high">High — Significant risk or inconvenience</option>
          <option value="critical">Critical — Immediate safety hazard</option>
        </Select>
      </div>

      {/* Description */}
      <Textarea
        label="Detailed Description"
        placeholder="Describe what happened, where it is, how long it has been present, and what ground impact it creates..."
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
        minLength={20}
        maxLength={5000}
        rows={5}
        showCount
      />

      {/* Help Types needed */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
          What kind of support is needed?
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {HELP_TYPES.map((ht) => {
            const selected = selectedHelpTypes.includes(ht.id);
            return (
              <button
                key={ht.id}
                type="button"
                onClick={() => toggleHelpType(ht.id)}
                className={`p-2.5 rounded-lg border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                  selected
                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-900 dark:text-indigo-200"
                    : "border-gray-200 dark:border-gray-700 text-gray-600"
                }`}
              >
                <span>{ht.label}</span>
                {selected && <CheckSquare className="h-4 w-4 text-indigo-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Location Area & Coordinates */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">
            Location Description / Neighborhood
          </label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLocateMe}
            loading={locating}
            className="text-xs text-indigo-600"
          >
            <MapPin className="h-3.5 w-3.5 mr-1" />
            Use My Current GPS
          </Button>
        </div>
        <Input
          placeholder="e.g. Near West 14th St & 6th Ave, Manhattan"
          value={locationArea}
          onChange={(e) => setLocationArea(e.target.value)}
          required
        />
      </div>

      {/* Number affected & Anonymous flag */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          type="number"
          label="Estimated People Affected"
          value={affectedCount}
          onChange={(e) => setAffectedCount(Math.max(1, Number(e.target.value)))}
          min={1}
        />

        <div className="flex items-center gap-3 pt-6">
          <input
            type="checkbox"
            id="isAnonymous"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
          />
          <label htmlFor="isAnonymous" className="text-sm font-medium text-gray-700 dark:text-gray-200">
            Post Anonymously
          </label>
        </div>
      </div>

      {/* Consent Checkbox */}
      <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50 space-y-2">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consentGiven"
            checked={consentGiven}
            onChange={(e) => setConsentGiven(e.target.checked)}
            className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 mt-1"
            required
          />
          <label htmlFor="consentGiven" className="text-xs text-gray-600 dark:text-gray-300">
            I confirm that this report is truthful to the best of my knowledge and complies with
            LocalLoop community guidelines. I understand ground information will be visible to nearby residents.
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <Button
        type="submit"
        size="lg"
        loading={submitting}
        disabled={!consentGiven || !title.trim() || !description.trim()}
        className="w-full"
      >
        Submit Problem Report
      </Button>
    </form>
  );
}
