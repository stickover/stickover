import { useEffect, useState } from "react";
import { api } from "../utils/api";
import { setSEO } from "../utils/useSEO";

export default function ContactPage() {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    api.get("/api/settings").then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    setSEO({
      title: "Contact Us | Stickover",
      description: "Get in touch with Stickover support for order, shipping, or custom design questions.",
      url: "/contact",
    });
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-20 py-12 sm:py-16">
      <section id="contact" className="scroll-mt-20">
        <div className="text-center mb-12">
          <h1 className="text-2xl md:text-3xl tracking-tight font-black text-zinc-900 uppercase">
            {settings?.contactTitle || "Get In Touch With Support"}
          </h1>
          <p className="text-sm text-zinc-450 mt-2 max-w-md mx-auto">
            {settings?.contactSubtitle || "Have questions about your order, shipping, or a custom design? We're here to help."}
          </p>
        </div>
        <div className="max-w-xl mx-auto divide-y divide-zinc-200 border-y border-zinc-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-6 py-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Email Address</h3>
            <a href={`mailto:${settings?.contactEmail || "stickover.in@gmail.com"}`} className="text-sm font-black text-zinc-900 hover:underline sm:text-right">
              {settings?.contactEmail || "stickover.in@gmail.com"}
            </a>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-6 py-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Call / Message</h3>
            <div className="sm:text-right">
              <p className="text-sm font-black text-zinc-900">{settings?.contactPhone || "+91 98405 22325"}</p>
              <p className="text-[11px] text-zinc-400 font-medium mt-0.5">{settings?.contactHours || "Available 10 AM – 5 PM"}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-6 py-6">
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Location</h3>
            <p className="text-sm font-black text-zinc-900 sm:text-right">{settings?.contactAddress || "Avinashi, Tiruppur"}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
