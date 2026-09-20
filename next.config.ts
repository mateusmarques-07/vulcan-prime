import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // acesso via IP do VPS em modo dev (Mateus conecta por 187.77.55.239, nao localhost)
  allowedDevOrigins: ["187.77.55.239"],
};

export default nextConfig;
