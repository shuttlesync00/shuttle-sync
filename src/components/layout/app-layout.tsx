"use client";

import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { TopHeader } from "@/components/layout/top-header";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMatchScorePage = pathname.startsWith("/matches/");

  useEffect(() => {
    if (isMatchScorePage) return undefined;

    let startX = 0;
    let startY = 0;
    let tracking = false;

    function isExcludedTarget(target: EventTarget | null) {
      return target instanceof Element && Boolean(target.closest("button, a, input, textarea, select, [role=dialog], [data-no-swipe]"));
    }

    function handlePointerDown(event: PointerEvent) {
      if (event.pointerType !== "touch" || isExcludedTarget(event.target)) return;
      const edgeStart = event.clientX <= 24;
      if (!sidebarOpen && !edgeStart) return;
      startX = event.clientX;
      startY = event.clientY;
      tracking = true;
    }

    function handlePointerUp(event: PointerEvent) {
      if (!tracking) return;
      tracking = false;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      if (Math.abs(deltaX) < 72 || Math.abs(deltaX) <= Math.abs(deltaY)) return;
      if (!sidebarOpen && deltaX > 0) setSidebarOpen(true);
      if (sidebarOpen && deltaX < 0) setSidebarOpen(false);
    }

    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    window.addEventListener("pointerup", handlePointerUp, { passive: true });
    window.addEventListener("pointercancel", handlePointerUp, { passive: true });
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [isMatchScorePage, sidebarOpen]);

  const titleMap: Record<string, string> = {
    "/dashboard": "Home",
    "/start-match": "Start Match",
    "/matches": "Matches",
    "/tournaments": "Tournaments",
    "/tournaments/new": "New Tournament",
    "/points-table": "Points Tables",
    "/players": "Players",
    "/players/new": "New Player",
    "/profile": "Profile",
    "/profile/stats": "Profile Stats",
    "/teams": "Teams",
    "/teams/new": "New Team",
    "/friendly-matches": "Friendly Matches",
    "/live-scoring": "Live Scoring",
  };

  const routeLabels: Record<string, string> = {
    dashboard: "Home",
    "start-match": "Start Match",
    matches: "Matches",
    tournaments: "Tournaments",
    new: "New",
    "points-table": "Points Table",
    players: "Players",
    profile: "Profile",
    stats: "Stats",
    teams: "Teams",
    setup: "Setup",
    standings: "Standings",
    fixtures: "Fixtures",
    results: "Results",
    statistics: "Statistics",
    "friendly-matches": "Friendly Matches",
    "live-scoring": "Live Scoring",
  };

  const currentTitle = titleMap[pathname] ?? "Home";

  const breadcrumbs = pathname
    .split("/")
    .filter(Boolean)
    .reduce<Array<{ label: string; href: string }>>((items, segment, index, array) => {
      const basePath = `/${array.slice(0, index + 1).join("/")}`;
      const href = index === 0 ? `/${segment}` : `/${array.slice(0, index + 1).join("/")}`;

      if (segment === "dashboard") {
        items.push({ label: "Home", href: "/dashboard" });
        return items;
      }

      const label = routeLabels[segment] ?? segment.replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
      if (label === "Home" && items.some((item) => item.label === "Home")) return items;

      items.push({ label, href });
      return items;
    }, [{ label: "Home", href: "/dashboard" }])
    .filter((item, index, all) => !(index === 0 && all.length > 1 && item.href === "/dashboard" && pathname !== "/dashboard"))
    .map((item, index, all) => ({
      ...item,
      href: index === all.length - 1 ? "#" : item.href,
    }));

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#f8fafc_0%,#f3f4f6_100%)] text-zinc-900">
      <div className="flex min-h-screen">
        <Sidebar currentPath={pathname} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((collapsed) => !collapsed)} onNavigate={() => setSidebarOpen(false)} />

        <div className="flex min-h-screen flex-1 flex-col">
          <TopHeader title={currentTitle} breadcrumbs={breadcrumbs} onMenuClick={() => setSidebarOpen((open) => !open)} />
          <main className="flex-1 px-4 py-4 pb-24 sm:px-6 lg:px-8 lg:pb-8">
            {children}
          </main>
        </div>
      </div>

      {sidebarOpen ? (
        <div className="fixed inset-0 z-50 bg-zinc-950/40 lg:hidden" onClick={() => setSidebarOpen(false)}>
          <div className="h-full w-[85%] max-w-[280px] bg-white p-4 shadow-xl" onClick={(event) => event.stopPropagation()}>
            <Sidebar mobile currentPath={pathname} onNavigate={() => setSidebarOpen(false)} />
          </div>
        </div>
      ) : null}

      {!isMatchScorePage ? <MobileNavigation currentPath={pathname} onMoreClick={() => setSidebarOpen(true)} /> : null}
    </div>
  );
}
