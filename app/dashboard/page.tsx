"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, LogOut, MapPin, MapPinPlus } from "lucide-react";
import { Card, Logo } from "@/components/ui";
import { useRequireAuth, useAuth } from "@/lib/auth";
import { getPlaceCount, listRecentPlaces, PlaceSubmission } from "@/lib/places";

export default function DashboardPage() {
  const { user, loading } = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);
  const [recent, setRecent] = useState<PlaceSubmission[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getPlaceCount(), listRecentPlaces(5)])
      .then(([c, r]) => {
        setCount(c);
        setRecent(r);
      })
      .finally(() => setLoadingStats(false));
  }, [user]);

  if (loading || !user) {
    return <div className="flex flex-1 items-center justify-center bg-white" />;
  }

  const firstName = user.full_name.split(" ")[0];

  return (
    <div className="flex min-h-screen flex-col bg-(--background)">
      <header className="flex items-center justify-between bg-gradient-to-r from-brand-700 to-brand-900 px-4 py-4">
        <div className="flex items-center gap-2.5">
          <Logo size={32} />
          <div>
            <div className="font-[family-name:var(--font-heading)] text-[15.5px] font-bold text-white">
              Waypoint
            </div>
            <div className="text-[11.5px] text-white/75">{user.full_name}</div>
          </div>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-[12px] font-semibold text-white"
        >
          <LogOut size={13} /> Log out
        </button>
      </header>

      <main className="flex-1 px-4 py-5 pb-10">
        <h1 className="font-[family-name:var(--font-heading)] text-[19px] font-semibold text-ink">
          Hi, {firstName}
        </h1>
        <p className="mt-0.5 mb-4 text-[12.5px] text-gray">Here&apos;s your registration activity</p>

        <Card className="mb-4 flex items-center gap-3 !rounded-[14px] !p-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-brand-bg text-brand-700">
            <MapPin size={18} />
          </div>
          <div>
            <div className="font-[family-name:var(--font-heading)] text-[17px] font-semibold text-ink">
              {loadingStats ? "…" : count}
            </div>
            <div className="text-[10.5px] text-gray">Places registered</div>
          </div>
        </Card>

        <button
          onClick={() => router.push("/register")}
          className="mb-6 flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-900 p-4 text-left shadow-[0_10px_22px_rgba(18,63,166,0.28)]"
        >
          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-white/18">
            <MapPinPlus size={22} color="#fff" />
          </div>
          <div className="flex-1">
            <div className="font-[family-name:var(--font-heading)] text-[14.5px] font-semibold text-white">
              Register a place
            </div>
            <div className="text-[11.5px] text-white/80">Pin the location you&apos;re standing at</div>
          </div>
          <ChevronRight size={18} color="#fff" />
        </button>

        <div className="mb-2 font-[family-name:var(--font-heading)] text-[13.5px] font-semibold text-ink">
          Recently registered
        </div>
        <div className="flex flex-col gap-2">
          {!loadingStats && recent.length === 0 && (
            <p className="rounded-xl border border-dashed border-gray-light bg-white p-4 text-center text-[12.5px] text-gray">
              Nothing registered yet. Register your first place to get started.
            </p>
          )}
          {recent.map((p) => (
            <Card key={p.id} className="!rounded-[13px] !p-3">
              <div className="text-[13px] font-bold text-ink">{p.name}</div>
              <div className="mt-0.5 text-[11.5px] text-gray">
                {p.area}, {p.sub_region}, {p.region}
              </div>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
