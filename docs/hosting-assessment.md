# KodeNexus hosting assessment

Reviewed 2026-10-28. Recommendation, not a deployment or capacity test.

## Recommendation

Use Netlify Free for a synthetic-data demonstration if its current monthly allowance
is sufficient. For academy operations, budget for paid hosting and complete live
authentication, database permissions and private media delivery first. Hosting this
browser-local demo does not make its records shared or its simulated accounts secure.

| Host | Assessment |
| --- | --- |
| Vercel Hobby | Personal, non-commercial only. Kodecoon's operational company app should not use it, even if parents pay nothing to access the app. Choose a commercial plan if using Vercel. |
| Netlify Free | Explicitly permits commercial projects. Current pricing includes 300 monthly credits; Free projects pause when exhausted. Best initial free demo candidate, subject to a Next.js deployment test. |
| Cloudflare Workers | Evaluate for low-cost operation. Free includes 100,000 requests/day but only 10 ms CPU per invocation. Current Next.js guidance recommends vinext; OpenNext is another documented path. Our Next 16 proxy, authentication, server PDFs and dependencies need adapter/runtime validation. Static Pages hosting is not a drop-in solution for this server-rendered app. |
| Render Free | Supports Node web services but sleeps after 15 minutes without traffic; Render says not to use free instances for production. Suitable for testing, poor fit for dependable staff/parent access. |

No host-specific build, adapter migration, load test or deployment was performed.
Drive/video delivery and Supabase costs/limits are separate from frontend hosting.

## Official sources

- https://vercel.com/docs/plans/hobby
- https://www.netlify.com/blog/introducing-netlify-free-plan/
- https://www.netlify.com/pricing/
- https://www.netlify.com/pricing/pro-vs-free/
- https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://render.com/docs/free
