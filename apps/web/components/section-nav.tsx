"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Section = {
  href: string;
  label: string;
  icon: string;
  group: "Principal" | "Extras";
};

type SectionNavProps = {
  sections: readonly Section[];
};

function getCurrentHash() {
  if (typeof window === "undefined") {
    return "#dashboard";
  }

  return window.location.hash || "#dashboard";
}

export function SectionNav({ sections }: SectionNavProps) {
  const [currentHash, setCurrentHash] = useState("#dashboard");
  const groupedSections = useMemo(
    () => [
      { label: "Principal", items: sections.filter((section) => section.group === "Principal") },
      { label: "Extras", items: sections.filter((section) => section.group === "Extras") }
    ],
    [sections]
  );

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
    <nav className="navStack" aria-label="Secciones del dashboard">
      {groupedSections.map((group) => (
        <div className="navGroup" key={group.label}>
          <span className="navSectionLabel">{group.label}</span>
          {group.items.map((section) => {
            const sectionHash = new URL(section.href, "http://localhost").hash || "#dashboard";
            const isActive = currentHash === sectionHash;

            return (
              <Link
                key={section.href}
                href={section.href}
                className={`navBtn${isActive ? " active" : ""}`}
              >
                <span className="navIcon" aria-hidden="true">
                  {section.icon}
                </span>
                {section.label}
                <span className="navDot" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
