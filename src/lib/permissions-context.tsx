"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useSession } from "next-auth/react";

// Hardcoded safe defaults if the API fails
const FALLBACK_PERMISSIONS: Record<string, Record<string, string[]>> = {
  SALES: {
    sales: ["view", "create"],
    customers: ["view"],
    dashboard: ["view"],
    inventory: ["view"],
    products: ["view"],
    fefo: ["view"],
  },
};

interface PermissionsContextValue {
  can: (resource: string, action: string) => boolean;
  userRole: string;
  userOutletId: string | null;
}

const PermissionsContext = createContext<PermissionsContextValue>({
  can: () => false,
  userRole: "",
  userOutletId: null,
});

export function PermissionsProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role ?? "";
  const outletId = (session?.user as any)?.outletId ?? null;

  const [permissions, setPermissions] = useState<Record<string, Record<string, string[]>>>({});

  useEffect(() => {
    if (!role) return;
    fetch("/api/permissions/user")
      .then((r) => r.json())
      .then((d) => {
        if (d.permissions) setPermissions({ [role]: d.permissions });
      })
      .catch(() => {
        setPermissions(FALLBACK_PERMISSIONS);
      });
  }, [role]);

  function can(resource: string, action: string): boolean {
    if (role === "ADMIN") return true;
    const rolePerms = permissions[role] ?? FALLBACK_PERMISSIONS[role] ?? {};
    return (rolePerms[resource] ?? []).includes(action);
  }

  return (
    <PermissionsContext.Provider value={{ can, userRole: role, userOutletId: outletId }}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  return useContext(PermissionsContext);
}
