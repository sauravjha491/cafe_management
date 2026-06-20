"use client";

import { Loader2 } from "lucide-react";
import { LandingShell, useSiteSettings } from "@/components/LandingShell";

export default function PrivacyPage() {
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
      <div className="max-w-3xl mx-auto px-6 py-16 prose prose-slate">
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-8">Privacy Policy</h1>
        <div className="space-y-6 text-slate-600 font-medium leading-relaxed">
          <p>Last updated: June 2026</p>
          <p>
            {settings.cafeName} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy. This policy explains how we collect,
            use, and protect your information when you use our website and ordering services.
          </p>
          <h2 className="text-xl font-black text-slate-900">Information We Collect</h2>
          <p>
            When you place an order, we may collect your name, phone number, table number, delivery address,
            and order details. Payment information is processed securely and is not stored on our servers.
          </p>
          <h2 className="text-xl font-black text-slate-900">How We Use Your Information</h2>
          <p>
            We use your information to process orders, provide live order tracking, improve our service,
            and communicate with you about your order status.
          </p>
          <h2 className="text-xl font-black text-slate-900">Contact</h2>
          <p>
            For privacy-related questions, contact us at {settings.email || settings.phone}.
          </p>
        </div>
      </div>
    </LandingShell>
  );
}
