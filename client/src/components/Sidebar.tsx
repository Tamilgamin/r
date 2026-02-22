import { Link, useLocation } from "wouter";
import { Activity, Settings2, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

export function Sidebar() {
  const [location] = useLocation();

  const navItems = [
    { name: "Monitor", path: "/", icon: Activity },
    { name: "Settings", path: "/settings", icon: Settings2 },
  ];

  return (
    <div className="w-20 md:w-64 h-full bg-card/50 backdrop-blur-3xl border-r border-white/5 flex flex-col items-center md:items-start py-8 transition-all duration-300">
      <div className="flex items-center gap-3 px-0 md:px-8 mb-12">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-700 flex items-center justify-center shadow-lg shadow-primary/20">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <h1 className="hidden md:block text-xl font-display font-medium tracking-wide text-white">
          Incubator
        </h1>
      </div>

      <nav className="flex-1 w-full px-4 space-y-2">
        {navItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.path} href={item.path} className="block relative group">
              <div
                className={`flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                <span className="hidden md:block font-medium">{item.name}</span>
                
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 border border-primary/20 rounded-2xl pointer-events-none"
                    initial={false}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
