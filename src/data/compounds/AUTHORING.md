# How to write compound entries

Each file in this folder exports one `Peptide[]` array (type in `src/lib/types.ts`). Entries are read by
ordinary people deciding whether something is safe, so accuracy beats completeness.

## Hard rules
- Every fact must come from the research notes or a source cited there. If the notes don't support it, leave it out.
- Never include community, forum, vendor, or "biohacker" dosing. `studied` holds only FDA-label or published-trial doses,
  and is omitted for compounds with no human trials.
- Plain, neutral language. Short sentences. No hype, no exclamation marks, no em-dashes. Write "may", "in rats", "in one small study" where that is the truth.
- Name the population and size for studies (e.g. "12-week RCT, 54 adults").

## Field guide
| Field | Guidance |
|---|---|
| `id` | Use exactly the id assigned to you (other files link to these ids). |
| `summary` | 1 to 2 sentences, at most 240 characters. What it is and what it's used for. |
| `mechanism` | At most 400 characters, plain language. |
| `claim` / `shows` | What's claimed online (at most 220 chars) vs what the evidence shows (at most 320 chars). |
| `evidence` | 3 to 6 bullets, each at most 220 chars, specific (study, size, result, year). |
| `tier` | 1 FDA-approved for some indication (judge on the approved use); 2 randomized human trials exist but not approved for the popular use; 3 only small, short, or uncontrolled human studies; 4 animal or lab only; 5 never studied (blends). Foreign-only approval does not by itself make Tier 1: judge on evidence quality. |
| `legal` | US status as of Oct 26, 2026: `approved` FDA-approved drug; `compoundable` lawfully compoundable by 503A pharmacies with an Rx now (Category 1, bulks list, USP monograph, or component of an approved drug); `pending` taken off Category 2 in April 2026 and recommended by PCAC in July 2026 or scheduled for the PCAC meeting due by Feb 2027, but not yet lawful to compound; `restricted` currently on 503A Category 2; `investigational` in company-run trials, not approved; `unapproved` none of the above (not approved, not compoundable); `cosmetic` sold legally as a topical cosmetic ingredient; `supplement` sold as a dietary supplement or OTC; `abroad` approved as a medicine outside the US but none of the US buckets fits better. |
| `status` | One line, at most 200 chars, the specific US status (e.g. "PCAC voted 8-6-1 to recommend on Jul 23, 2026; not yet lawful to compound"). Mention foreign approvals here. |
| `wada` | Short, from the notes: "Prohibited at all times (S0)", "Prohibited (S2.2)", "Not prohibited", or "Not named; likely S0" if the notes infer it. Omit if unknown. |
| `halfLife` | With context ("about 7 days (label)", "unknown in humans"). Omit if the notes have nothing. |
| `routes` | How it is given in studies or labels, and how it is sold online if different. |
| `studied` | Label or trial doses only, at most 300 chars. Omit if none. |
| `sideEffects` | 3 to 8 short bullets. |
| `redFlags` | 2 to 6 bullets: symptoms that mean get medical help right away. |
| `avoid` | 2 to 6 bullets: who should avoid it or ask a doctor first. |
| `interactions` | 0 to 4 bullets. |
| `unknowns` | 1 to 4 bullets: what nobody knows yet. |
| `seq` | Only for peptides of 44 residues or fewer when the notes or a reliable source give the sequence. Plain one-letter string for natural L-residues ("GEPPPGKPADDAGLV"); a token array when there are modifications (["Ac","L","K","K","T","E","T","Q"]). Omit if unsure. |
| `seqNote` | Optional, e.g. "15 amino acids". |
| `isPeptide` | `false` only for things that are not peptides (small molecules, coenzymes, amino-acid derivatives). |
| `goals` | 2 to 5 lowercase search words people would type (e.g. "tendon", "fat loss", "sleep"). |
| `defaultRoute` | One of: "Subcutaneous injection", "Intramuscular injection", "Nasal spray", "Oral", "Sublingual", "Topical", "IV (in clinic)", "Other". |
| `defaultUnit` | "mg" or "mcg". |
| `popularity` | Only the numbers you are given. Otherwise omit. |
| `sources` | 3 to 8 `{ t, u }` with real URLs taken from the notes. Prefer FDA, labels, journals, PubMed, ClinicalTrials.gov, WADA, regulators. No vendor sales pages. |
