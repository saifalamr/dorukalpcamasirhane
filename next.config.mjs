/** @type {import('next').NextConfig} */
const nextConfig = {
  // exceljs uses dynamic requires (stream internals etc.) that break when the
  // bundler inlines it — keep it as a runtime Node require on the server.
  serverExternalPackages: ["exceljs"],
};

export default nextConfig;
