"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

type Section = {
  href: string;
  label: string;
  icon: string;
  group: "Principal" | "Extras";
};

type SectionNavProps = {
  sections: readonly Section[];
};

export function SectionNav({ sections }: SectionNavProps) {
  const pathname = usePathname();
  const groupedSections = useMemo(
    () => [
      { label: "Principal", items: sections.filter((section) => section.group === "Principal") },
      { label: "Extras", items: sections.filter((section) => section.group === "Extras") }
    ],
    [sections]
  );

  return (
    <nav className="navStack" aria-label="Pantallas del dashboard">
      {groupedSections.map((group) => (
        <div className="navGroup" key={group.label}>
          <span className="navSectionLabel">{group.label}</span>
          {group.items.map((section) => {
            const isActive = pathname === section.href;

            return (
              <Link
                key={section.href}
                href={section.href}
                className={`navBtn${isActive ? " active" : ""}`}
                prefetch={false}
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
