# Instagram Video Automation & Persona Invariants

## 1. Account Persona Mapping (Strict Invariants)
- **`@adhlil.co` (ID: 1)**:
  - **Niche**: Nasehat Islami, Muhasabah Diri, Adab & Akhlak, Rezeki Halal, Ikhlas, Sunnah Productivity.
  - **Tone**: Hangat, teduh, reflektif, menyentuh hati, mengajak kebaikan.
  - **Forbidden**: Do NOT post tech tools, coding tips, or SaaS promos to this account.
- **`@sharesa.space` (ID: 3)**:
  - **Niche**: 4 Web Products (HandleMyFile, SolveMyMedia, Tranvas, Caridisini) + Jasa Pembuatan Website Modern (Next.js, high-speed, SEO).
  - **Tone**: Profesional, inovatif, solutif, digital architecture.
- **`@tranvasapp` (ID: 2)**:
  - **Niche**: The Visual Workspace, All-in-One Life OS, Habit Compounding, Focus Timer, Chaos to Structure.
  - **Tone**: Mindful productivity, contrarian system thinking.

## 2. Video Format Standard (Ban Old Rigid Box Templates)
- Do NOT use the legacy Remotion 60% card / 40% bottom subtitle template (`AdhlilStoryReel.jsx` / `DynamicMindsetVideo.jsx`).
- Standardize all automated Reels on the **High-Retention Video Pipeline**:
  - Fullscreen cinematic 9:16 vertical B-roll footage (Pexels / contextual real video).
  - Kinetic active-word pop-in captions (1.25x scaling, bold impact, glowing yellow/green keyword emphasis).
  - Procedural sound design: subtle `whoosh` on scene cuts, soft `pop` on keyword appearance, low `hit` on hook title.
  - Dynamic retention emojis.

## 3. Platform Scope Isolation
- When modifying Instagram workflows or crons, focus solely on `instagram` and `facebook` (cross-post). Never alter Threads, Bluesky, Mastodon, Tumblr, or DEV.TO pipelines unless explicitly requested.

## 4. Temporary Format Constraint: 100% Full Video (Reels) ONLY
- **Carousels are temporarily PAUSED** for Instagram.
- All automated and manual Instagram posts are locked to `isCarouselDay = false`, enforcing 100% High-Retention Video Reels generation across all 3 accounts (`@adhlil.co`, `@sharesa.space`, `@tranvasapp`).
