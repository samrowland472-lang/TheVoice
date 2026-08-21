# The Voice

A creative studio in one file: neural text-to-speech, voice recording and
modulation, a drum sequencer and songwriting tools, and a 3D animation
studio with a WebGL renderer, keyframed cameras and lighting, and video
export.

## Deploying

`index.html` is the entire site. There is nothing to build and nothing to
install.

- **GitHub Pages** — put `index.html` in the repository root, then
  Settings → Pages → Source: `main` / root.
- **Netlify** — drag this folder onto <https://app.netlify.com/drop>.
- **Vercel** — import the repository; no build command, no output directory.

## Accounts

The site comes wired to its Supabase project, so sign-up and sign-in work as
soon as it is deployed. To point it at a different project, use "Change
Supabase project" on the sign-in screen — paste any URL from the Supabase
dashboard and it will be normalised for you.

## Optional extras

Neither is needed for the site to work.

- **Payments** — create Stripe payment links and paste them into Settings.
- **The AI scene agent** — the "Describe it" box in Animate works without
  it, using a built-in pattern matcher. For full natural language, deploy
  the edge function in the source repository's `supabase/` folder.
