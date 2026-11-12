import { useEffect, useState } from "react";
import { api } from "../utils/api";
import { setSEO } from "../utils/useSEO";
import AboutUsSection from "../components/AboutUsSection";

export default function AboutPage() {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    api.get("/api/settings").then(setSettings).catch(() => {});
  }, []);

  useEffect(() => {
    setSEO({
      title: "About Us | Stickover",
      description: "Learn about Stickover — custom phone cases and stickers, designed and printed for durability and shipped pan-India.",
      url: "/about-us",
    });
  }, []);

  return (
    <div className="max-w-[1600px] mx-auto px-6 sm:px-10 lg:px-20 py-12 sm:py-16">
      <AboutUsSection settings={settings} />
    </div>
  );
}
