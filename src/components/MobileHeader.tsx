"use client";

import { Menu } from "lucide-react";
import { useSession } from "next-auth/react";

interface Props {
  onMenuOpen: () => void;
}

export function MobileHeader({ onMenuOpen }: Props) {
  const { data: session } = useSession();
  const name = session?.user?.name ?? "U";
  const role = (session?.user as any)?.role ?? "";

  return (
    <header className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-gray-900 text-white flex items-center px-4 gap-3 shadow-lg">
      <button
        onClick={onMenuOpen}
        className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      <span className="flex-1 font-bold text-lg">VaxTrace</span>

      <div className="flex items-center gap-2">
        <span className="text-xs bg-blue-600 px-2 py-0.5 rounded-full font-medium">{role}</span>
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-sm font-bold">
          {name[0]?.toUpperCase() ?? "U"}
        </div>
      </div>
    </header>
  );
}
