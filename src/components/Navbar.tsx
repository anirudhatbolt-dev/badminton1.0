import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const NAV_LINKS = [
  { label: "Home", to: "/" as const },
  { label: "Players", to: "/players" as const },
  { label: "Teams", to: "/teams" as const },
  { label: "Matches", to: "/matches" as const },
  { label: "Stats", to: "/stats" as const },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out");
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="text-xl font-extrabold tracking-tight">
          Gigaminton
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              activeProps={{ className: "text-sm font-medium text-foreground" }}
              activeOptions={{ exact: true }}
            >
              {l.label}
            </Link>
          ))}

          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-3 ml-2">
                  <span className="text-xs text-muted-foreground truncate max-w-[160px]">
                    {user.email}
                  </span>
                  <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-1.5">
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </Button>
                </div>
              ) : (
                <Link to="/login">
                  <Button size="sm" className="ml-2">Login</Button>
                </Link>
              )}
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 -mr-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden fixed inset-0 top-14 z-[100] bg-background">
          <div className="flex flex-col gap-2 p-6">
            {NAV_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="text-lg font-medium py-2 text-muted-foreground hover:text-foreground"
                activeProps={{ className: "text-lg font-medium py-2 text-foreground" }}
                activeOptions={{ exact: true }}
                onClick={() => setOpen(false)}
              >
                {l.label}
              </Link>
            ))}

            {!loading && (
              <div className="pt-4 border-t mt-2">
                {user ? (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <Button variant="outline" size="sm" onClick={() => { handleSignOut(); setOpen(false); }} className="gap-1.5">
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </Button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setOpen(false)}>
                    <Button size="sm">Login</Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
