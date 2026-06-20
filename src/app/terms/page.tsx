"use client";

import { Loader2 } from "lucide-react";
import { LandingShell, useSiteSettings } from "@/components/LandingShell";

export default function TermsPage() {
  const { settings, loading } = useSiteSettings();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
      </div>
    );
  }

  return (
    <LandingShell settings={settings}>
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-8">Terms of Service</h1>
        <div className="space-y-6 text-slate-600 font-medium leading-relaxed">
          <p>Last updated: June 2026</p>
          <p>
            By using {settings.cafeName}&apos;s website and ordering platform, you agree to these terms of service.
          </p>
          <h2 className="text-xl font-black text-slate-900">Ordering</h2>
          <p>
            Orders placed through our platform are subject to availability. Prices and menu items may change
            without notice. Table orders are paid at the counter unless otherwise stated.
          </p>
          <h2 className="text-xl font-black text-slate-900">Cancellations</h2>
          <p>
            Once an order has been accepted by our kitchen, cancellations may not be possible.
            Contact our staff for assistance.
          </p>
          <h2 className="text-xl font-black text-slate-900">Liability</h2>
          <p>
            We strive to provide accurate information but are not liable for delays caused by factors
            outside our control.
          </p>
          <h2 className="text-xl font-black text-slate-900">Contact</h2>
          <p>
            Questions about these terms? Reach us at {settings.email || settings.phone}.
          </p>
        </div>
      </div>
    </LandingShell>
  );
}
