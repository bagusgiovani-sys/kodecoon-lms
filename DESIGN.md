# KodeHub design direction

Approved by the user on 2026-10-15.

## Visual language

Use a futuristic, calm classroom interface: deep navy background (#080e20),
layered navy cards (#101b34), electric blue accents (#79adff), and readable
secondary text (#a2b2cf). Colors belong in shared tokens in app/globals.css.
Use subtle borders, small highlights, and restrained glow. Keep decoration
outside dense reading areas. Preserve visible focus and reduced-motion support.

## Student cards

Show identity, age/guardian, all enrolled classes, credits remaining, and module
progress in distinct sections. Low credit status must have a text label, not
color alone. Give the learning-record action a clear accessible name. Reuse
StudentCard for the demo student directory and parent hub. Student records use
an identity card plus independent metrics and content cards.

## Responsive behavior

- Student directory: one column below 640px, two from 640px, three from 1280px.
- Check 360px and 390px phones, 768px and 1024px tablets, and 1440px desktops.
- Let content wrap; use min-width: 0 on cards. Navigation/tab strips may scroll
  horizontally within their own container; the document must not overflow.
- Primary buttons and form inputs have at least 44px height. Phone inputs use
  16px text to avoid focus zoom. Dialogs fit the viewport and scroll internally.
- Hover decoration is optional; every action must remain usable with touch.

## Delivery

Document major changes and evidence in build-progress.md, then commit and push.
The shared theme applies to both app implementations. The modular StudentCard
is currently on the browser-local demo; live student-directory parity remains
separate work. Do not describe browser-local records as production storage.
