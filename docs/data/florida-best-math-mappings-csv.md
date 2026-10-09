# Florida B.E.S.T. Math Standard Mappings CSV

## File location

`data/raw/Florida B.E.S.T. Math Standard Mappings.csv`

## Columns

| Column | Description |
|--------|-------------|
| **Set ID** | Dataset identifier (e.g. `FL.BEST.Math`). |
| **Standard ID** | Florida B.E.S.T. Mathematics benchmark code (e.g. `MA.2.NSO.1.1`, `MA.912.C.1.4`). |
| **Standard Description** | Full benchmark text. May be quoted in CSV when it contains commas. |
| **Content Kind** | Type of linked content: `Exercise` (interactive practice), `Video`, or `Article`. |
| **Content Title** | Display title for the linked resource. |
| **Content URL** | HTTPS URL on `khanacademy.org`. |

## What this file is (and is not)

- **It is** a **standard-to-resource alignment table** published for Florida B.E.S.T. Math: each row maps one benchmark to one Khan Academy item (exercise, video, or article).
- **It is not** a dump of official **FAST** or **CPALMS** assessment items. It does not contain item stems, multiple-choice options, correct keys, or psychometric metadata for statewide tests.
- **Official standards and assessment framing** still come from CPALMS / FDOE (e.g. [CPALMS Standards API](https://www.cpalms.org/standards/standards_api.aspx), [CPALMS Downloads](http://cpalms.org/downloads), [FDOE FAST](https://www.fldoe.org/accountability/assessments/k-12-student-assessment/best/)).

## What you can build from it

1. **Practice link bank** — Per standard, list Khan `Exercise` URLs as supplementary practice (closest analog to “questions” in this file; actual question UI lives on Khan Academy).
2. **Supplementary media** — `Video` / `Article` rows for remediation or lesson planning.
3. **Coverage / QA** — Count exercises per standard; flag bad rows (e.g. `internal-courses` test URLs).

## Tooling in this repo

- **`npm run extract:khan-mappings`** — Runs `scripts/parse-best-math-mappings.ts`, writes `data/processed/best-khan-mappings.json` (Exercise-only per standard, deduped URLs, filtered junk URLs).
- **`npm run seed:practice-links`** — Upserts rows into Supabase `standard_practice_links` from that JSON (requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`).

### Supabase schema

Apply the migration in the Supabase SQL editor (or via Supabase CLI), then run the seed:

1. Run the SQL in [`supabase/migrations/20260427120000_standard_practice_links.sql`](../../supabase/migrations/20260427120000_standard_practice_links.sql) once on your project.
2. Run `npm run extract:khan-mappings` if `data/processed/best-khan-mappings.json` is missing or stale.
3. Run `npm run seed:practice-links` with service role credentials in `.env`.

The table uses `unique (standard_id, content_url)` so re-seeding updates `standard_description`, `content_title`, and `source_generated_at` for existing links.

## Licensing and product note

Khan Academy content is subject to Khan’s terms of use. This CSV provides **links and titles**, not permission to copy full item text into your app. For an in-app item bank aligned to FAST released items, use a separate official or licensed item source.
