import { logout } from "@/app/login/actions";
import { Nav } from "./Nav";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Nav logout={logout} />
      <main className="px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
