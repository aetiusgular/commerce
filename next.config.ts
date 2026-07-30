export default {
  experimental: {
    ppr: true,
    inlineCss: true,
    useCache: true,
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.shopify.com",
        pathname: "/s/files/**",
      },
    ],
  },
  // Permanent (308) redirects from the legacy Shopify URL structure to the
  // current routes. Rescues index equity from old pages and kills stale-price
  // ghosts that Google is still holding.
  async redirects() {
    return [
      // Canonical host: 308-redirect every www.agmnt.space request to the
      // apex agmnt.space so Google stops splitting signals between two hosts.
      // Runs at the app/CDN level, so it works even though both domains are
      // attached to the Vercel project.
      {
        source: "/:path*",
        has: [{ type: "host", value: "www.agmnt.space" }],
        destination: "https://agmnt.space/:path*",
        permanent: true,
      },
      {
        source: "/products/:handle",
        destination: "/product/:handle",
        permanent: true,
      },
      {
        source: "/collections",
        destination: "/shop",
        permanent: true,
      },
      {
        source: "/collections/:handle",
        destination: "/shop/:handle",
        permanent: true,
      },
      {
        source: "/pages/:handle",
        destination: "/:handle",
        permanent: true,
      },
    ];
  },
};
