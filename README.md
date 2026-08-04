# Traffic Wedge

Everything for the Bengaluru/Hyderabad traffic app, in one repo.
Stack: Cloudflare (D1 + Workers + Pages) + GitHub (source + CI/CD).
No WordPress, no other services.

## Structure

```
api/            Cloudflare Worker - the backend (D1-backed advisory API)
admin-form/     Static HTML form for posting advisories (deploys to Pages)
mobile-app/     Expo/React Native app (source lives here; app stores
                are the only piece that can't live on Cloudflare)
.github/workflows/deploy.yml   Auto-deploys api/ and admin-form/ on push
```

## One-time setup (do this once, then forget about manual deploys)

1. Create a GitHub repo and push this folder to it:
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-new-github-repo-url>
   git push -u origin main

2. Get a Cloudflare API token (Cloudflare dashboard -> My Profile ->
   API Tokens -> Create Token -> use the "Edit Cloudflare Workers"
   template, or a custom token with Workers + Pages + D1 edit
   permissions).

3. Add it as a GitHub secret: in your repo, go to
   Settings -> Secrets and variables -> Actions -> New repository
   secret. Name it CLOUDFLARE_API_TOKEN, paste the token value.

4. Set your admin token as a Worker secret (one-time, from your
   machine, since this is a runtime secret, not a deploy-time one):
   cd api && wrangler secret put ADMIN_TOKEN

That's it. From now on:
   git add . && git commit -m "..." && git push
...auto-deploys the API and the admin form. No manual wrangler deploy
needed for those two pieces going forward.

## What's NOT auto-deployed (and why)

mobile-app/ is not in the GitHub Action. Mobile app store releases
(App Store / Play Store) require manual review submission - there's
no "just push to deploy" for those the way there is for a Worker. The
Expo web build *could* be added to the Action later (deploy to Pages
too) if you want a browser-testable version to update automatically -
ask if you want that wired up.

## Day-to-day workflow once this is set up

- Change API logic -> edit api/src/index.js -> push -> live in ~30s
- Post a new advisory -> open the admin-form Pages URL -> fill it in
  (no push needed, this just calls the already-deployed API)
- Change the app -> edit mobile-app/ -> test locally with
  `npx expo start` or `npm run web` -> push when ready
