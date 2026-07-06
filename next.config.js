/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  experimental: {
    // The Engine Lab fixtures route reads fixtures/engine/*.json off
    // disk at request time; dynamic reads are invisible to Vercel's
    // file tracer, so include them explicitly or the deployed function
    // 404s on files that exist locally.
    outputFileTracingIncludes: {
      "/api/engine-lab/fixtures": ["./fixtures/engine/*.json"],
    },
  },
};
