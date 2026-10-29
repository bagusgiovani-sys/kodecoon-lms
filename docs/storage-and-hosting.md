# Lesson storage and hosting — 29 October 2026 review

## Files

PDF worksheets and presentations belong in the lesson library. Keep the original
PPT/PPTX for staff download and a PDF preview for dependable in-app reading. PDF
previews lose slide animations. The logical ERD now links `lesson_materials` to
original/preview `media_files`, with version and audience. This is a data contract,
not a completed lesson upload/viewer implementation.

Keep academy-controlled Drive as the agreed storage direction for now. SQL stores
provider, file ID/key, name, MIME type and size, not file bytes. Parent access requires
a verified guardian-child link, relevant learner entitlement and explicit publication.
Lesson resources default to staff-only until released. Never expose a broad Drive
listing, service credentials or a public child-media folder.

Embedding does not override Google file permissions. Test private playback/download
without the teacher's Google session. Blob downloads and Workspace exports use
different API flows: [Drive permissions](https://developers.google.com/workspace/drive/api/guides/ref-roles)
and [downloads/exports](https://developers.google.com/workspace/drive/api/guides/manage-downloads).

The production session-documentation flow already has a Google Drive Picker for
video selection/upload, stores the Drive file ID/link in `session_videos`, and shows
the Drive preview. The Picker is currently limited to videos. It does not upload
lesson PDFs or PowerPoints, and the course lesson editor currently holds text-only
materials. Extend the Picker to documents and add lesson-material metadata, staff
attachment UI, and a permission-checked embedded viewer before treating lesson files
as implemented.

The mock student-profile demo behaves differently: its local video Upload control
saves to browser IndexedDB; a Drive link can be pasted to embed a preview. It does
not upload that local file to Drive or Supabase. Separately, the production student-
media endpoint uses private Supabase Storage for its supported media flow. Keep these
three paths explicit so a demo upload is not mistaken for academy storage.

Google Drive can preview PDFs and PowerPoint files in-browser, so yes: use the same
Drive file-ID and embedded-preview approach for lesson PDFs and PPT/PPTX rather than
uploading their bytes through KodeNexus. For dependable reading, attach the original
PowerPoint plus an optional PDF export; PDF preview may omit slide animations, and
Google notes that Office preview can differ from the original. Test the exact parent
viewer flow with a private Drive file and a parent account that is not signed into
the staff Google account. Private parent playback remains unverified.

If Drive's private viewer proves unsuitable, use private Supabase Storage or R2 for
delivery. R2 works independently of the web host. Signed URLs are bearer links until
expiry: issue after entitlement checks, and keep private content out of public caches.
Drive may remain an archive, but avoid unnecessary duplicate file copies.

## Hosting recommendation: Netlify Free

Use [Netlify Free](https://www.netlify.com/pricing/) for a no-cost pilot. Netlify's
current Free plan permits commercial projects, costs USD 0, includes 300 usage
credits each month, and has a hard limit: when credits run out, sites pause until
the next cycle. That prevents an unexpected bill, but can interrupt the app during
a traffic or build spike. Track usage and keep a backup deployment path ready.
The plan comparison says private organization repositories and shared environment
variables are paid-plan features, so verify that the KodeNexus GitHub repository can
connect under the intended account before relying on deploy previews or collaboration.

Netlify's [Next.js adapter documentation](https://docs.netlify.com/build/frameworks/framework-setup-guides/nextjs/overview/)
says its OpenNext adapter supports current stable Next.js releases, SSR, route/API
handlers, Middleware, Pages Router, rewrites and App Router. That matches this repo's
mixed App/Pages setup much better than a static-only host. Still deploy a preview and
check login cookies, proxy rewrites, API routes, PDF generation and file downloads
before a family pilot; no Netlify deployment was tested here.

Cloudflare is another free-tier candidate, but its [Workers free limits](https://developers.cloudflare.com/workers/platform/limits/)
include 100,000 requests per day and only 10 ms CPU per invocation. Cloudflare's
[current Next.js guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/)
recommends vinext, marked beta, and links alternative deployment paths. I would run
a separate compatibility trial for this Next.js app and verify proxy rewrites, auth,
Supabase and PDF generation before choosing it. Static Cloudflare Pages alone cannot
run these server APIs. If that trial is strong, Cloudflare may be the lower-cost long
term option; don't migrate the production app just to avoid a paid Vercel tier.

[Cloudflare R2 Standard](https://developers.cloudflare.com/r2/pricing/) is optional
file storage, independent of hosting. Its free allowance includes 10 GB-month storage,
operation limits and free Internet egress; excess storage/operations are billed. It
does not automatically transcode video. For now, Drive remains the agreed file source.

No hosting migration, subscription or deployment was performed. Address the concrete
security findings in `security/2026-10-29-build-hooks.md` before live deployment.
