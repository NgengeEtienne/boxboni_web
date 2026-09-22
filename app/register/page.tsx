"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { ArrowRight, CheckCircle2, ChevronLeft, MapPin, X } from "lucide-react";
import { Button, SelectField, TextField } from "@/components/ui";
import { useRequireAuth } from "@/lib/auth";
import { listDivisions, listRegions, listSubdivisions } from "@/lib/cameroon";
import { ApiError } from "@/lib/api";
import { createPlaceSubmission } from "@/lib/places";

const LocationMap = dynamic(() => import("@/components/LocationMap"), { ssr: false });

type Step = 1 | 2 | 3;
type GeoState = "idle" | "locating" | "ready" | "denied" | "error";

// The lat/lng columns are DecimalField(max_digits=9, decimal_places=6) --
// browser geolocation/Leaflet return far more precision than that (15+
// significant digits), which the API rejects with a 400. 6 decimal places
// is already ~11cm precision, far finer than GPS accuracy anyway.
function round6(n: number) {
  return Math.round(n * 1e6) / 1e6;
}

export default function RegisterPage() {
  const { user, loading } = useRequireAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [region, setRegion] = useState("");
  const [subRegion, setSubRegion] = useState("");
  const [area, setArea] = useState("");

  const [geoState, setGeoState] = useState<GeoState>("idle");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const regions = useMemo(() => listRegions(), []);
  const divisions = useMemo(() => (region ? listDivisions(region) : []), [region]);
  const subdivisions = useMemo(
    () => (region && subRegion ? listSubdivisions(region, subRegion) : []),
    [region, subRegion]
  );

  function locate() {
    setGeoState("locating");
    if (!navigator.geolocation) {
      setGeoState("error");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: round6(pos.coords.latitude), lng: round6(pos.coords.longitude) });
        setGeoState("ready");
      },
      (err) => {
        setGeoState(err.code === err.PERMISSION_DENIED ? "denied" : "error");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  useEffect(() => {
    // Kick off geolocation once, when the user reaches the map step.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (step === 2 && geoState === "idle") locate();
  }, [step, geoState]);

  function goBack() {
    if (step === 1) router.replace("/dashboard");
    else setStep((s) => (s - 1) as Step);
  }

  async function handleSave() {
    if (!coords) return;
    setSaving(true);
    setSaveError(null);
    try {
      await createPlaceSubmission({
        name,
        region,
        sub_region: subRegion,
        area,
        lat: coords.lat,
        lng: coords.lng,
      });
      setStep(3);
    } catch (err) {
      setSaveError(err instanceof ApiError ? err.message : "Could not save this place. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  if (loading || !user) {
    return <div className="flex flex-1 items-center justify-center bg-white" />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <div className="flex items-center justify-between border-b border-gray-light px-4 py-4">
        <button onClick={goBack} className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-brand-bg text-brand-700">
          <ChevronLeft size={20} />
        </button>
        <div className="font-[family-name:var(--font-heading)] text-[14.5px] font-semibold text-ink">
          {step === 1 && "Place details"}
          {step === 2 && "Confirm location"}
          {step === 3 && "Registered"}
        </div>
        {step < 3 ? (
          <button onClick={() => router.replace("/dashboard")} className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-brand-bg text-brand-700">
            <X size={20} />
          </button>
        ) : (
          <div className="w-[34px]" />
        )}
      </div>

      {step < 3 && (
        <div className="flex gap-1.5 px-4 pt-3.5">
          {[1, 2].map((n) => (
            <div key={n} className={`h-1 flex-1 rounded ${step >= n ? "bg-brand-700" : "bg-gray-light"}`} />
          ))}
        </div>
      )}

      <div className="flex flex-1 flex-col px-4 py-5">
        {step === 1 && (
          <>
            <p className="mb-3.5 text-[13px] text-gray">Where are you, and what is this place called?</p>

            <SelectField
              label="Region"
              placeholder="Select region"
              options={regions}
              value={region}
              onChange={(e) => {
                setRegion(e.target.value);
                setSubRegion("");
                setArea("");
              }}
            />
            <SelectField
              label="Division"
              placeholder={region ? "Select division" : "Select a region first"}
              options={divisions}
              value={subRegion}
              disabled={!region}
              onChange={(e) => {
                setSubRegion(e.target.value);
                setArea("");
              }}
            />
            <SelectField
              label="Subdivision"
              placeholder={subRegion ? "Select subdivision" : "Select a division first"}
              options={subdivisions}
              value={area}
              disabled={!subRegion}
              onChange={(e) => setArea(e.target.value)}
            />
            <TextField
              icon={MapPin}
              placeholder="Name of this place"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />

            <Button
              icon={ArrowRight}
              className="mt-2"
              disabled={!name || !region || !subRegion || !area}
              onClick={() => setStep(2)}
            >
              Continue
            </Button>
          </>
        )}

        {step === 2 && (
          <div className="flex flex-1 flex-col">
            {geoState === "locating" && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-brand-bg border-t-brand-700" />
                <p className="text-[13px] text-gray">Finding your location…</p>
              </div>
            )}

            {(geoState === "denied" || geoState === "error") && (
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
                <p className="text-[13px] text-gray">
                  {geoState === "denied"
                    ? "Location access was denied. Enable location for this site in your browser settings, then try again."
                    : "Could not get your location. Please try again."}
                </p>
                <Button variant="outline" onClick={locate} className="w-auto px-5">
                  Try again
                </Button>
              </div>
            )}

            {geoState === "ready" && coords && (
              <>
                <p className="mb-3 text-[13px] text-gray">
                  Drag the pin if it isn&apos;t exactly where you&apos;re standing.
                </p>
                <div className="mb-4 h-72 w-full overflow-hidden rounded-2xl border border-gray-light">
                  <LocationMap
                    lat={coords.lat}
                    lng={coords.lng}
                    onChange={(lat, lng) => setCoords({ lat: round6(lat), lng: round6(lng) })}
                  />
                </div>
                {saveError && <p className="mb-3 text-[12.5px] text-red-600">{saveError}</p>}
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Confirm and save"}
                </Button>
              </>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-green">
              <CheckCircle2 size={30} color="#fff" />
            </div>
            <h3 className="font-[family-name:var(--font-heading)] text-[16px] font-semibold text-ink">
              Place registered
            </h3>
            <p className="mt-1 mb-6 text-[12.5px] text-gray">{name} has been saved.</p>
            <Button onClick={() => router.replace("/dashboard")} className="w-auto px-8">
              Done
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
