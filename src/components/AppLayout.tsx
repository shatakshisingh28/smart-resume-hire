import { ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import {
  LayoutDashboard, Upload, Search, LogOut, Sun, Moon, Brain, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/upload", icon: Upload, label: "Upload & Analyze" },
  { to: "/results", icon: FileText, label: "Results" },
  { to: "/search", icon: Search, label: "Semantic Search" },
  { to: "/chat", icon: Brain, label: "AI Chat" },
];

export default function AppLayout({ children }: { children: ReactNode }) {
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border bg-card p-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Brain className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">ResumeAI</span>
        </div>

        <nav className="flex-1 space-y-1">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === to
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="space-y-2 pt-4 border-t border-border">
          <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-full justify-start gap-3 text-muted-foreground">
            {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            {theme === "light" ? "Dark Mode" : "Light Mode"}
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="flex-1 flex flex-col">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">ResumeAI</span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border flex justify-around py-2 z-50">
          {navItems.slice(0, 4).map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-1 px-3 py-1 text-xs ${
                location.pathname === to ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 p-4 md:p-8 pb-20 md:pb-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
