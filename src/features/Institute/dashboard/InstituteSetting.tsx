// src/features/Institute/dashboard/InstituteSetting.tsx
// Institute Settings — wired to the real institute profile
// (GET/PATCH /api/institute-admin/institute). The old page showed a hardcoded
// "Ace English Academy"; the fake email/phone/domain/notification-preference
// fields had no backend and were dropped rather than left lying.
import { useCallback, useEffect, useState } from "react";
import { Building2, MapPin, Image as ImageIcon, Save, ShieldCheck } from "lucide-react";
import { InstituteAdminLayout } from "../components/InstituteAdminLayout";
import { SectionCard, StatusBadge, ErrorBanner } from "../components/shared/primitives";
import {
  fetchInstituteProfile, updateInstituteProfile, InstituteProfile,
} from "../services/instituteAdminService";
import { useToast } from "@/shared/hooks/use-toast";

export default function InstituteSettings() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<InstituteProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchInstituteProfile();
      setProfile(res.data);
      setName(res.data.name ?? "");
      setAddress(res.data.address ?? "");
      setLogoUrl(res.data.logoUrl ?? "");
    } catch (err: any) {
      setError(err?.message ?? "Failed to load institute profile.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dirty = profile !== null && (
    name !== (profile.name ?? "") ||
    address !== (profile.address ?? "") ||
    logoUrl !== (profile.logoUrl ?? "")
  );

  const save = async () => {
    if (!dirty || !name.trim()) return;
    setSaving(true);
    try {
      const res = await updateInstituteProfile({ name: name.trim(), address, logoUrl });
      setProfile(prev => prev ? { ...prev, ...res.data } : prev);
      toast({ title: "Settings saved", description: "Your institute profile has been updated." });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err?.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 bg-white dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/[0.06] rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal-500/20 focus:border-brand-teal-500 transition-all text-sm font-medium text-slate-700 dark:text-slate-200 placeholder:text-slate-400";

  return (
    <InstituteAdminLayout activeTab="settings">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Institute Settings</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Your institute's identity across the platform and invite emails.</p>
      </div>

      {error && <ErrorBanner message={error} onRetry={load} />}

      {loading ? (
        <div className="space-y-4 animate-pulse">
          <div className="h-64 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
          <div className="h-40 bg-slate-100 dark:bg-white/[0.04] rounded-2xl" />
        </div>
      ) : profile && (
        <div className="max-w-2xl space-y-6">
          <SectionCard
            title="Institute Profile"
            icon={Building2}
            actions={
              <StatusBadge tone={profile.isActive ? "success" : "danger"}>
                {profile.isActive ? "Active" : "Inactive"}
              </StatusBadge>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  Institute name
                </label>
                <input value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Your institute's name" />
                {!name.trim() && <p className="text-xs text-rose-500 mt-1 font-medium">Name is required.</p>}
                <p className="text-xs text-slate-400 mt-1.5">Shown on student/tutor dashboards and in every invite email.</p>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</span>
                </label>
                <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={inputClass} placeholder="Street, city, state" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                  <span className="inline-flex items-center gap-1"><ImageIcon className="h-3 w-3" /> Logo URL</span>
                </label>
                <div className="flex items-center gap-3">
                  <input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className={inputClass} placeholder="https://…/logo.png" />
                  {logoUrl && (
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="h-11 w-11 rounded-xl object-cover border border-slate-200 dark:border-white/[0.08] shrink-0"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                    />
                  )}
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  onClick={save}
                  disabled={!dirty || saving || !name.trim()}
                  className="inline-flex items-center gap-2 bg-brand-teal-600 hover:bg-brand-teal-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm"
                >
                  <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save changes"}
                </button>
                {dirty && !saving && <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Unsaved changes</p>}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Account" icon={ShieldCheck}>
            <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1.5">
              <p>
                Institute created on{" "}
                <strong className="text-slate-700 dark:text-slate-300 font-semibold">
                  {new Date(profile.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </strong>.
              </p>
              <p>Institute activation is managed by the platform — contact TestCrack support to change it.</p>
            </div>
          </SectionCard>
        </div>
      )}
    </InstituteAdminLayout>
  );
}
