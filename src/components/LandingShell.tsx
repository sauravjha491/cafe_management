"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Coffee, MapPin, Phone, MessageCircle,
  Globe, Share2, Instagram, Facebook, Twitter
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SiteSettings {
  cafeName: string;
  address: string;
  phone: string;
  email: string;
  heroTagline: string;
  aboutText: string;
  footerText: string;
  workingHoursWeekdays: string;
  workingHoursWeekend: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  websiteUrl: string;
}

export const defaultSiteSettings: SiteSettings = {
  cafeName: "CafePro",
  address: "123 Gourmet Street, Foodie City",
  phone: "+1 (555) 000-0000",
  email: "hello@cafepro.com",
  heroTagline: "New Generation of Dining",
  aboutText: "We are passionate about great coffee, fresh food, and a seamless dining experience powered by technology.",
  footerText: "Redefining the café experience with technology that puts the customer first.",
  workingHoursWeekdays: "08:00 - 22:00",
  workingHoursWeekend: "09:00 - 23:00",
  facebookUrl: "",
  instagramUrl: "",
  twitterUrl: "",
  websiteUrl: "",
};

export function useSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(defaultSiteSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setSettings({
            cafeName: data.cafeName || defaultSiteSettings.cafeName,
            address: data.address || defaultSiteSettings.address,
            phone: data.phone || defaultSiteSettings.phone,
            email: data.email || defaultSiteSettings.email,
            heroTagline: data.heroTagline || defaultSiteSettings.heroTagline,
            aboutText: data.aboutText || defaultSiteSettings.aboutText,
            footerText: data.footerText || defaultSiteSettings.footerText,
            workingHoursWeekdays: data.workingHoursWeekdays || defaultSiteSettings.workingHoursWeekdays,
            workingHoursWeekend: data.workingHoursWeekend || defaultSiteSettings.workingHoursWeekend,
            facebookUrl: data.facebookUrl || "",
            instagramUrl: data.instagramUrl || "",
            twitterUrl: data.twitterUrl || "",
            websiteUrl: data.websiteUrl || "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { settings, loading };
}

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/about", label: "About" },
  { href: "/order?table=0", label: "Menu" },
  { href: "/track", label: "Track Order" },
  { href: "/contact", label: "Contact" },
];

export function LandingNav({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname();
  const cafeFirst = settings.cafeName.split(" ")[0];
  const cafeRest = settings.cafeName.split(" ").slice(1).join(" ") || "PRO";

  return (
    <nav className="max-w-7xl mx-auto w-full px-6 py-8 flex items-center justify-between relative z-10">
      <Link href="/" className="flex items-center gap-3">
        <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-red-200">
          <Coffee className="w-7 h-7" />
        </div>
        <span className="text-2xl font-black text-slate-900 tracking-tighter uppercase">
          {cafeFirst}<span className="text-red-600">{cafeRest}</span>
        </span>
      </Link>

      <div className="hidden md:flex items-center gap-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "hover:text-red-600 transition-colors",
              pathname === link.href && "text-red-600"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function SocialLink({ href, icon: Icon, label }: { href?: string; icon: typeof Globe; label: string }) {
  if (!href) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center hover:bg-red-600 transition-colors group"
    >
      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform" />
    </a>
  );
}

export function LandingFooter({ settings }: { settings: SiteSettings }) {
  return (
    <footer id="footer" className="bg-[#0f172a] text-slate-300 pt-24 pb-12 overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/5 rounded-full blur-[100px] -mr-48 -mt-48" />

      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-24 relative z-10">
        <div className="space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-red-500/20">C</div>
            <span className="text-2xl font-black text-white tracking-tighter uppercase">{settings.cafeName}</span>
          </div>
          <p className="text-slate-400 font-medium leading-relaxed">{settings.footerText}</p>
          <div className="flex gap-4">
            <SocialLink href={settings.websiteUrl} icon={Globe} label="Website" />
            <SocialLink href={settings.facebookUrl} icon={Facebook} label="Facebook" />
            <SocialLink href={settings.instagramUrl} icon={Instagram} label="Instagram" />
            <SocialLink href={settings.twitterUrl} icon={Twitter} label="Twitter" />
            {!settings.websiteUrl && !settings.facebookUrl && !settings.instagramUrl && !settings.twitterUrl && (
              <span className="text-slate-500 text-xs font-bold">Social links managed in admin settings</span>
            )}
          </div>
        </div>

        <div className="space-y-8">
          <h4 className="text-white font-black uppercase tracking-widest text-sm">Quick Links</h4>
          <ul className="space-y-4 font-bold text-slate-400">
            <li><Link href="/order?table=0" className="hover:text-white transition-colors">Our Menu</Link></li>
            <li><Link href="/track" className="hover:text-white transition-colors">Track Order</Link></li>
            <li><Link href="/delivery" className="hover:text-white transition-colors">Delivery</Link></li>
            <li><Link href="/about" className="hover:text-white transition-colors">About Us</Link></li>
          </ul>
        </div>

        <div className="space-y-8">
          <h4 className="text-white font-black uppercase tracking-widest text-sm">Working Hours</h4>
          <ul className="space-y-4 font-bold text-slate-400">
            <li className="flex justify-between">
              <span>Mon - Fri</span>
              <span className="text-white">{settings.workingHoursWeekdays}</span>
            </li>
            <li className="flex justify-between">
              <span>Sat - Sun</span>
              <span className="text-white">{settings.workingHoursWeekend}</span>
            </li>
          </ul>
        </div>

        <div className="space-y-8">
          <h4 className="text-white font-black uppercase tracking-widest text-sm">Find Us</h4>
          <div className="space-y-6 font-bold text-slate-400">
            <div className="flex gap-4">
              <MapPin className="w-5 h-5 text-red-500 shrink-0" />
              <span>{settings.address}</span>
            </div>
            <div className="flex gap-4">
              <Phone className="w-5 h-5 text-red-500 shrink-0" />
              <a href={`tel:${settings.phone}`} className="hover:text-white transition-colors">{settings.phone}</a>
            </div>
            {settings.email && (
              <div className="flex gap-4">
                <MessageCircle className="w-5 h-5 text-red-500 shrink-0" />
                <a href={`mailto:${settings.email}`} className="hover:text-white transition-colors">{settings.email}</a>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-12 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">
        <p>© 2026 {settings.cafeName} • All Rights Reserved</p>
        <div className="flex gap-8">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
        </div>
      </div>
    </footer>
  );
}

export function LandingShell({
  children,
  settings,
}: {
  children: React.ReactNode;
  settings: SiteSettings;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-red-100 selection:text-red-600">
      <LandingNav settings={settings} />
      <main className="flex-1">{children}</main>
      <LandingFooter settings={settings} />
    </div>
  );
}
