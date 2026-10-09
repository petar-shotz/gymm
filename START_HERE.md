# EMBER Fitness App — Source Export

Complete source from published revision 66fbdc59dbbb850e67fb487fbb5e490cb75cb5a8.

Includes the weekly calendar, nutrition and hydration tracking, training logs,
18 exercises with 36 demonstration photos, vitamin reference tracking,
analog/digital stopwatch, and save-response recovery improvements.

## Development

Requires Node.js 22.13 or newer and pnpm.

    pnpm install
    pnpm dev

The app is a React/Vinext application, not a standalone HTML file.
See the included project README.md for Cloudflare D1 development setup,
local migrations and starter configuration. Database migrations are included
in drizzle/. Build with pnpm build.

## Backend and sign-in

The hosted app uses Cloudflare D1 (binding DB) and authenticated identity
headers supplied by ChatGPT Sites. The ZIP includes the server code and schema,
but not the hosted database, saved personal logs, credentials, or dependencies.
Running this on another hosting provider requires configuring a database and
trusted server-side authentication; do not trust identity headers supplied
directly by a public browser. The existing .openai/hosting.json identifies
the original Site. Do not reuse that project ID to create an unrelated Site.

Exercise media attribution and license are included in public/exercises/.
