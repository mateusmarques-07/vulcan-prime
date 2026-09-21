import { logout } from "@/app/login/actions";
import { getPapelUsuario } from "@/lib/auth";
import { Nav } from "./Nav";
import { LoadingBar } from "./LoadingBar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const papel = await getPapelUsuario();

  return (
    <div className="min-h-screen">
      <LoadingBar />
      <Nav logout={logout} isGarcom={papel === "garcom"} />
      <main className="px-4 py-6 sm:px-8">{children}</main>
    </div>
  );
}
