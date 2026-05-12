"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Section = {
  href: string;
  label: string;
};

type SectionNavProps = {
  sections: Section[];
};

function getCurrentHash() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.location.hash;
}

export function SectionNav({ sections }: SectionNavProps) {
  const [currentHash, setCurrentHash] = useState("");

  useEffect(() => {
    function syncHash() {
      setCurrentHash(getCurrentHash());
    }

    syncHash();
    window.addEventListener("hashchange", syncHash);

    return () => {
      window.removeEventListener("hashchange", syncHash);
    };
  }, []);

  return (
    <nav className="navStack">
      {sections.map((section) => {
        const sectionHash = new URL(section.href, "http://localhost").hash;
        const isDashboardRoot = sectionHash === "";
        const isActive = isDashboardRoot ? currentHash === "" : currentHash === sectionHash;

        return (
          <Link
            key={section.href}
            href={section.href}
            className={`navItem${isActive ? " navItemActive" : ""}`}
          >
            {section.label}
          </Link>
        );
      })}
    </nav>
  );
}
