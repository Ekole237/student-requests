"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  const buildHref = (idx: number) => "/" + segments.slice(0, idx + 1).join("/");

  return (
    <div className="px-4 md:px-6 py-2 text-sm text-gray-600 border-b">
      <Link href="/">Accueil</Link>

      {segments.map((segment, idx) => {
        const label = segment
          .replace(/-/g, " ")
          .replace(/\b\w/g, l => l.toUpperCase());

        const isLast = idx === segments.length - 1;

        return (
          <span key={idx}>
            {" / "}
            {isLast ? <span>{label}</span> : <Link href={buildHref(idx)}>{label}</Link>}
          </span>
        );
      })}
    </div>
  );
}
