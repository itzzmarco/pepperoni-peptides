import type { Peptide } from '../../lib/types';

// Repair and immune peptides. US status as of Oct 26, 2026.
// Sources: research notes "repair_immune_peptides.md" and "regulation_and_safety.md".

const WADA_LIST = {
  t: 'WADA 2026 Prohibited List (copy hosted by SEGAS)',
  u: 'https://www.segas.gr/wp-content/uploads/2025/11/2026list_en_final_clean_september_2025.pdf',
};
const FDA_BULKS_RISK_PAGE = {
  t: 'FDA: Bulk drug substances that may present significant safety risks (Category 2 page)',
  u: 'https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks',
};
const HOLLAND_KNIGHT = {
  t: 'Holland & Knight: Peptides at a Crossroads (Oct 16, 2026)',
  u: 'https://www.hklaw.com/en/insights/publications/2026/10/peptides-at-a-crossroads-what-wellness-providers-need-to-know',
};
const FDA_BPC157_BRIEFING = {
  t: 'FDA PCAC briefing document: BPC-157 (July 2026)',
  u: 'https://www.fda.gov/media/193343/download',
};
const FDA_TB500_BRIEFING = {
  t: 'FDA PCAC briefing document: TB-500 (July 2026)',
  u: 'https://www.fda.gov/media/193349/download',
};
const HSS_REVIEW = {
  t: 'Vasireddi et al., BPC-157 systematic review, HSS Journal 2025',
  u: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC12313605/',
};
const MCGUIRE_REVIEW = {
  t: 'McGuire et al., thymosin beta-4 and TB-500 scoping review, 2026 (preprint)',
  u: 'https://www.preprints.org/manuscript/202605.1124/v1',
};
const AJMC_VOTES = {
  t: 'AJMC: FDA panel backs 6 peptides for compounding (Jul 2026)',
  u: 'https://www.ajmc.com/view/fda-panel-backs-6-peptides-for-compounding',
};

const ALLERGY_FLAG =
  'Trouble breathing, wheezing, hives, or swelling of the face, eyes or tongue after a dose (call 911)';
const FEVER_FLAG = 'Fever, chills or dizziness within hours of an injection';
const SITE_FLAG = 'Redness or swelling at an injection site that spreads, shows red streaks, or comes with fever';

export const REPAIR_IMMUNE: Peptide[] = [
  {
    id: 'bpc-157',
    name: 'BPC-157',
    aka: ['Body Protection Compound-157', 'PL 14736', 'PL10', 'Bepecin', 'pentadecapeptide BPC 157'],
    family: 'repair',
    tier: 3,
    legal: 'pending',
    status:
      'Off FDA Category 2 since Apr 2026. PCAC voted 8-6-1 on Jul 23, 2026 to recommend it, against FDA staff advice. Not yet lawful to compound. No approval found in any country.',
    wada: 'Prohibited at all times (S0)',
    seq: 'GEPPPGKPADDAGLV',
    seqNote: '15 amino acids',
    summary:
      'A lab-made 15-amino-acid peptide based on a fragment of a protein in human stomach juice. Sold online for tendon, joint and gut healing. It is not an approved drug, and human data are very limited.',
    mechanism:
      'How it works is not known. FDA says its mechanisms remain poorly understood. Animal and lab studies suggest it may promote new blood vessel growth, including raising VEGF, a blood vessel growth signal. This is a proposed reason for wound healing in animals. It has not been shown in people.',
    claim: 'Called "the Wolverine peptide" online and said to heal tendons, ligaments, muscles and the gut.',
    shows:
      'No human trial has tested it for tendon, ligament or muscle injury. FDA found 5 small human studies (about 108 people). The only randomized one, a 53-person colitis enema study published as an abstract, did not clearly beat placebo. No human study has formally assessed its safety.',
    evidence: [
      '2025 systematic review (HSS Journal): of 36 included studies, 35 were in animals or the lab. The 1 human study was a review of 12 knee pain patients; 7 of 12 reported relief lasting over 6 months.',
      'Ulcerative colitis RCT (53 adults, 2 weeks, meeting abstract only): disease score fell 3.2 points with BPC-157 vs 1.6 with placebo, but the difference could have been chance. FDA called the data inadequate.',
      'Bladder pain pilot (12 women, one dose into the bladder, no control group, 2024): 10 of 12 reported full symptom relief. Follow-up length was not reported.',
      'IV report (2 healthy adults, 1 to 20 mg): no side effects reported. A 2003 Phase I study in healthy men was reported as safe, but its details are scarce.',
      'Over 80% of BPC-157 papers are linked to one research group (Sikiric). Independent labs have added only a few lab or short rodent studies.',
      'A registered Phase 1 trial in Mexico (NCT02637284) has had unknown status since 2016 and no posted results. One review describes it as cancelled.',
    ],
    halfLife: 'Under 30 minutes in rats and dogs; unknown in humans',
    routes:
      'Human studies gave it by enema, into the knee joint, into the bladder, or into a vein. Most people inject it under the skin, a route never tested in humans. Capsules, nasal sprays and creams were proposed for compounding but not studied.',
    studied:
      'No trial has tested injection under the skin. Ulcerative colitis RCT abstract (53 adults): 80 mg enema or placebo for 2 weeks. Healthy-volunteer study (24 adults): enema up to 2 mg/kg once daily for 8 days.',
    sideEffects: [
      'Injection-site redness and swelling (one FDA report, lasting 9 days)',
      'Shortness of breath after injection under the skin (one FDA report, led to an ER visit)',
      'Darkening of skin and gums with a BPC-157/TB-500 blend (one report; it came back on reuse)',
      'Possible immune reaction to the peptide (FDA concern; never studied)',
      'Liver-related lab changes and clotting changes in rat and dog studies',
      'No human study has formally tracked side effects',
    ],
    redFlags: [
      ALLERGY_FLAG,
      'Injection-site redness or swelling that spreads, shows red streaks, or lasts for days',
      FEVER_FLAG,
      'New darkening of the skin or gums (stop and see a doctor)',
    ],
    avoid: [
      'Pregnant or breastfeeding people: no reproductive safety data exist',
      'People with cancer or a past cancer: blood vessel growth is a possible, unproven tumor risk, and no cancer-safety studies exist',
      'People with liver disease or a bleeding or clotting problem should ask a doctor first: animal studies showed liver and clotting changes',
      'Drug-tested athletes and US service members: banned by WADA and on the DoD prohibited ingredients list',
    ],
    interactions: [
      'No drug interaction studies exist',
      'Several FDA reports involved other peptides or multi-ingredient products, so effects could not be pinned on BPC-157',
    ],
    unknowns: [
      'Whether it helps any tendon, ligament or muscle injury in people',
      'Its safety when injected under the skin, the way most people use it',
      'Whether long-term use changes cancer risk',
      'Whether an HHS interim access policy, under White House review since Oct 14, 2026 and not in effect, will cover it',
    ],
    popularity: 899,
    goals: ['tendon', 'injury recovery', 'gut', 'joint pain'],
    defaultRoute: 'Subcutaneous injection',
    defaultUnit: 'mcg',
    sources: [
      FDA_BPC157_BRIEFING,
      HSS_REVIEW,
      {
        t: 'Józwiak et al., reply on BPC-157 evidence, Pharmaceuticals 2025',
        u: 'https://www.mdpi.com/1424-8247/18/10/1451/html',
      },
      {
        t: 'RAPS: FDA advisory committee backs two controversial peptides (Jul 23, 2026)',
        u: 'https://www.raps.org/resource/fda-advisory-committee-backs-two-controversial-peptides.html',
      },
      HOLLAND_KNIGHT,
      WADA_LIST,
      {
        t: 'DoD OPSS: BPC-157 prohibited peptide and unapproved drug',
        u: 'https://www.opss.org/article/bpc-157-prohibited-peptide-and-unapproved-drug-found-health-and-wellness-products',
      },
    ],
  },
  {
    id: 'tb-500',
    name: 'TB-500',
    aka: ['TB500', 'Thymosin beta-4 fragment 17-23'],
    family: 'repair',
    tier: 4,
    legal: 'pending',
    status:
      'Off FDA Category 2 since Apr 2026. PCAC voted 8-6-1 on Jul 23, 2026 to recommend it, against FDA staff advice. Not yet lawful to compound.',
    wada: 'Prohibited at all times (S2.3)',
    seq: ['Ac', 'L', 'K', 'K', 'T', 'E', 'T', 'Q'],
    seqNote: '7 amino acids, N-acetylated; residues 17 to 23 of thymosin beta-4',
    summary:
      'A lab-made 7-amino-acid fragment (Ac-LKKTETQ) of thymosin beta-4. It is not the same as full thymosin beta-4, and it has never been studied in people. Sold online for injury healing.',
    mechanism:
      'TB-500 copies residues 17 to 23 of thymosin beta-4, with an acetyl group added. FDA says the two are not the same substance. In a 2024 lab study, TB-500 itself did not help wound healing, but one of its breakdown products (Ac-LKKTE) did. Whether any effect in the body depends on that breakdown is unknown.',
    claim: 'Sold as a healing peptide for tendons, muscles and wounds, often backed by research on full thymosin beta-4.',
    shows:
      'No human study of TB-500 exists. A 2026 review of 80 studies found direct TB-500 evidence in only 1, a lab study where TB-500 itself was inactive. Trials of full thymosin beta-4 eye drops do not apply to this fragment.',
    evidence: [
      "FDA's July 2026 review found no human studies of TB-500 and no data on how it behaves in the body. FDA said evidence of effectiveness is lacking.",
      '2026 scoping review (80 studies, searched to March 2026): mostly animal and lab work on full thymosin beta-4. Direct TB-500 evidence came from 1 study.',
      '2024 lab study (Rahaman): TB-500 itself did not speed wound closure in cell tests; its breakdown product Ac-LKKTE did. No cell toxicity was seen.',
      'An often-cited 2003 mouse wound study used the non-acetylated fragment. FDA says those results cannot be assumed to apply to TB-500.',
      'Full thymosin beta-4 (RGN-259 eye drops) has randomized trials in dry eye and a nerve-related cornea disease. It is a different molecule and is not approved.',
    ],
    halfLife: 'Unknown; no human data and no published half-life',
    routes:
      'Never tested in people by any route. Proposed for compounding as an injection under the skin or into muscle.',
    sideEffects: [
      'No human side-effect data exist; FDA found no adverse event reports for TB-500 alone',
      'Possible immune reaction to the injected peptide (FDA concern, which clumping may raise)',
      'Darkening of skin and gums reported once with a BPC-157/TB-500 blend',
      'FDA found no animal toxicity studies, so organ risks are unknown',
    ],
    redFlags: [ALLERGY_FLAG, FEVER_FLAG, SITE_FLAG],
    avoid: [
      'Drug-tested athletes: banned at all times by WADA',
      'Pregnant or breastfeeding people: no reproductive studies exist',
      'People with cancer or a past cancer: no cancer-safety studies exist',
    ],
    interactions: ['No interaction studies exist'],
    unknowns: [
      'Whether it does anything in people',
      'Its half-life, safe dose range and long-term safety',
      'Whether any effect comes from its breakdown products rather than TB-500 itself',
      'Whether an HHS interim access policy, under White House review since Oct 14, 2026 and not in effect, will cover it',
    ],
    goals: ['tendon', 'injury recovery', 'wound healing', 'muscle'],
    defaultRoute: 'Subcutaneous injection',
    defaultUnit: 'mg',
    sources: [
      FDA_TB500_BRIEFING,
      MCGUIRE_REVIEW,
      {
        t: 'Rahaman et al., TB-500 and its metabolites, J Chromatogr B 2024',
        u: 'https://pure.kfupm.edu.sa/en/publications/simultaneous-quantification-of-tb-500-and-its-metabolites-in-in-v/',
      },
      FDA_BULKS_RISK_PAGE,
      AJMC_VOTES,
      HOLLAND_KNIGHT,
      WADA_LIST,
    ],
  },
  {
    id: 'wolverine-stack',
    name: 'Wolverine Stack (BPC-157 + TB-500)',
    aka: ['BPC-157/TB-500 blend'],
    family: 'repair',
    tier: 5,
    legal: 'pending',
    status:
      'Neither part is lawful to compound yet. Both left Category 2 in Apr 2026 and got 8-6-1 PCAC votes to recommend in Jul 2026. The blend itself has never been reviewed.',
    wada: 'Prohibited at all times (S0 and S2.3)',
    summary:
      'A blend of BPC-157 and TB-500, injected separately or premixed in one vial, sold online for injury recovery. The combination has never been studied in any way.',
    mechanism:
      'No study has looked at how the two act together. BPC-157 may promote blood vessel growth in animals. TB-500 is a thymosin beta-4 fragment that was inactive itself in a lab wound test. Neither has been shown to work in people.',
    claim: 'Said to combine two healing peptides for faster recovery from tendon, ligament and muscle injuries.',
    shows:
      'No trial, case series, drug-level or toxicity study of the combination exists. Neither part has been tested for injuries in people. The only data are a few FDA adverse event reports from blended products.',
    evidence: [
      "FDA's 2026 reviews of BPC-157 and TB-500, a 2025 systematic review, and a 2026 scoping review found no study of the two used together.",
      'FDA report: skin and gum darkening after a BPC-157/TB-500 blend came back when the person used it again. FDA could not tell which peptide caused it.',
      'FDA found 2 more complaint reports for blended TB-500 and BPC-157, but they included no safety assessment.',
      'FDA found both peptides poorly characterized, with missing data on impurities, clumping (aggregation) and endotoxin. Clumping is the main immune-reaction concern.',
    ],
    halfLife: 'Unknown; never measured for the combination',
    routes: 'Sold as two separate injections or as one premixed vial. No route has been studied for the blend.',
    sideEffects: [
      'Darkening of skin and gums (one FDA report; it came back on reuse)',
      'Possible immune reaction to the peptides (FDA concern; clumping may raise the risk)',
      'Reported with BPC-157 alone: injection-site redness and swelling, and shortness of breath',
    ],
    redFlags: [
      ALLERGY_FLAG,
      'Injection-site redness or swelling that spreads, shows red streaks, or lasts for days',
      FEVER_FLAG,
      'New darkening of the skin or gums (stop and see a doctor)',
    ],
    avoid: [
      'Drug-tested athletes: both parts are banned at all times',
      'Pregnant or breastfeeding people: no reproductive data for either part',
      'People with cancer or a past cancer: no cancer-safety studies exist for either part',
    ],
    interactions: ['No interaction studies exist for the blend or either part'],
    unknowns: [
      'Whether combining the two changes their effects or safety',
      'Whether premixed vials contain what the label says',
      'Whether the blend does anything in people',
    ],
    goals: ['tendon', 'injury recovery', 'healing'],
    defaultRoute: 'Subcutaneous injection',
    defaultUnit: 'mg',
    sources: [FDA_BPC157_BRIEFING, FDA_TB500_BRIEFING, HSS_REVIEW, MCGUIRE_REVIEW, HOLLAND_KNIGHT, WADA_LIST],
  },
  {
    id: 'ara-290',
    name: 'ARA-290 (cibinetide)',
    aka: ['cibinetide', 'ARA 290'],
    family: 'repair',
    tier: 2,
    legal: 'unapproved',
    status:
      'Not approved in the US or anywhere else. Not on the 503A bulks list, FDA\'s safety-risk list, or any PCAC agenda, so it has no specific ruling and is not cleared to compound.',
    wada: 'Not named; likely S2.1.5',
    seqNote: '11 amino acids',
    summary:
      'A lab-made 11-amino-acid peptide modeled on part of erythropoietin (EPO). It was designed to protect tissue without raising red blood cells. Studied for small-fiber nerve damage and nerve pain. Not approved anywhere.',
    mechanism:
      'It acts on the "innate repair receptor", a pairing of the EPO receptor with the beta common receptor (CD131). It was designed to protect tissue without stimulating red blood cell production, which is what EPO itself does.',
    claim: 'Marketed online as a general nerve-repair and anti-inflammatory peptide.',
    shows:
      'Two small 28-day randomized trials in nerve damage (type 2 diabetes, 48 people; sarcoidosis, 64 people) showed gains on eye scans of nerve fibers and on some pain scores. Pain results were modest or not significant. No longer trials and no approval.',
    evidence: [
      'Type 2 diabetes RCT (48 adults, 28 days, 2014): a pain score (PainDetect) improved vs placebo, and HbA1c fell slightly (-0.16% vs -0.01% at day 28). Two other pain scales showed no difference.',
      'Same trial: corneal nerve fiber density did not change overall. It rose only in a subgroup of 18 people with the lowest starting values.',
      'Sarcoidosis RCT (64 adults, 28 days, 2017): 4 mg daily increased corneal nerve fiber area vs placebo. The 1 mg and 8 mg doses did not reach significance.',
      'Sarcoidosis trial: pain improved in all groups, including placebo. The 4 mg benefit in moderate-to-severe pain was not statistically significant.',
      'Several authors of the 2014 trial were officers of the developer, Araim Pharmaceuticals, and held stock or options.',
    ],
    halfLife: 'About 20 minutes after injection under the skin (healthy volunteers)',
    routes: 'Daily injection under the skin in both trials.',
    studied:
      'Type 2 diabetes RCT (48 adults): 4 mg under the skin once daily for 28 days. Sarcoidosis RCT (64 adults): 1, 4 or 8 mg under the skin daily for 28 days; only 4 mg met the main goal.',
    sideEffects: [
      'Overall side effects were similar to placebo in the diabetes trial',
      'No meaningful changes in blood counts or blood chemistry',
      '4 serious adverse events in the treated group of the diabetes trial; 2 were judged possibly related',
      'Worsening kidney function in one patient taking furosemide, judged possibly related; the drug was stopped',
      'One fatal heart attack in the treated group, judged unrelated by the safety committee',
    ],
    redFlags: [
      'Passing much less urine, or new swelling, especially if you take a diuretic such as furosemide',
      ALLERGY_FLAG,
      SITE_FLAG,
    ],
    avoid: [
      'People taking loop diuretics such as furosemide, or with kidney problems, should ask a doctor first',
      'Anyone planning use beyond 28 days: no longer-term safety data exist',
      'Drug-tested athletes: it may fall under a banned class (innate repair receptor agonists); ask USADA',
    ],
    interactions: ['Furosemide (a loop diuretic): one possibly related case of worsening kidney function'],
    unknowns: [
      'Safety and effects beyond 28 days',
      'Whether gains on nerve-fiber scans lead to lasting pain relief',
      'Its current development status; no Phase 3 trial was found',
    ],
    goals: ['nerve pain', 'neuropathy', 'nerve repair'],
    defaultRoute: 'Subcutaneous injection',
    defaultUnit: 'mg',
    sources: [
      {
        t: 'Brines et al., ARA 290 in type 2 diabetes, Molecular Medicine 2014',
        u: 'https://link.springer.com/article/10.2119/molmed.2014.00215',
      },
      {
        t: 'Culver et al., cibinetide in sarcoidosis, IOVS 2017',
        u: 'https://research.manchester.ac.uk/en/publications/cibinetide-improves-corneal-nerve-fiber-abundance-in-patients-wit/',
      },
      FDA_BULKS_RISK_PAGE,
      {
        t: 'FDA PCAC July 23-24, 2026 meeting questions',
        u: 'https://www.fda.gov/media/193711/download',
      },
      HOLLAND_KNIGHT,
      WADA_LIST,
    ],
  },
  {
    id: 'kpv',
    name: 'KPV',
    aka: ['Lys-Pro-Val', 'alpha-MSH 11-13'],
    family: 'immune',
    tier: 4,
    legal: 'pending',
    status:
      'Off FDA Category 2 since Apr 2026. PCAC voted 8-6-1 on Jul 23, 2026 to recommend it, against FDA staff advice. Not yet lawful to compound. No USP monograph.',
    wada: 'Not named; likely S0',
    seq: 'KPV',
    seqNote: '3 amino acids (positions 11 to 13 of alpha-MSH)',
    summary:
      'A 3-amino-acid peptide (lysine, proline, valine) taken from the end of the hormone alpha-MSH. Promoted for gut and skin inflammation. It has never been studied in people.',
    mechanism:
      'Lab studies suggest it may lower inflammatory signals (such as NF-kB, TNF-alpha and IL-6) and be taken up by gut cells through the PepT1 transporter. FDA says its molecular targets remain unknown. In tests on human skin samples, it did not pass through skin well.',
    claim: 'Promoted for gut inflammation, eczema, psoriasis and healing.',
    shows:
      'No human studies of any kind. Evidence comes from rodent colitis and wound models and cell work. FDA found no human data and no safety studies. It also found KPV does not pass well through human skin, the route it was proposed for.',
    evidence: [
      "FDA's July 2026 review found no human studies, including no data on how it behaves in the body. FDA said evidence of effectiveness is lacking.",
      'Animal evidence comes from mouse and rat colitis and wound-healing models, plus lab cell studies.',
      'In tests on human cadaver skin, KPV did not pass through well. It got through better only with electric current (iontophoresis) or microneedles.',
      'FDA found no toxicity, genetic damage, reproductive or cancer studies, and said its risks in people are unknown.',
    ],
    halfLife: 'Unknown; no studies in people or animals',
    routes:
      'Proposed for compounding as a 0.1% cream or gel for the skin. Injectable forms are also sold. No route has been tested in people.',
    sideEffects: [
      'No side-effect reports exist, but FDA found no documented human use, so this does not mean it is safe',
      'Possible immune reaction (FDA could not rule it out)',
      'Injectable forms add risks of infection, injection-site reactions and dosing errors',
      'Unregulated products may have the wrong strength, contamination or mislabeling',
    ],
    redFlags: [ALLERGY_FLAG, FEVER_FLAG, SITE_FLAG],
    avoid: [
      'Pregnant or breastfeeding people',
      'People with immune, gut, kidney or liver conditions should ask a doctor first',
      'People with a history of cancer',
      'People taking drugs that suppress the immune system',
      'Drug-tested athletes: likely banned under S0',
    ],
    interactions: ['No interaction studies exist'],
    unknowns: [
      'Whether it does anything in people',
      'Its safety in people by any route',
      'Whether it reaches the gut or skin in useful amounts',
      'Whether an HHS interim access policy, under White House review since Oct 14, 2026 and not in effect, will cover it',
    ],
    goals: ['gut', 'inflammation', 'eczema', 'skin'],
    defaultRoute: 'Topical',
    defaultUnit: 'mg',
    sources: [
      {
        t: 'FDA PCAC briefing document: KPV (July 2026)',
        u: 'https://www.fda.gov/media/193346/download',
      },
      {
        t: 'BSCG: KPV peptide benefits, safety and legal status (Jul 2026)',
        u: 'https://www.bscg.org/blogs/single/kpv-peptide-benefits-safety-legal-status-and-research',
      },
      FDA_BULKS_RISK_PAGE,
      {
        t: 'RAPS: FDA advisory committee backs two controversial peptides (Jul 23, 2026)',
        u: 'https://www.raps.org/resource/fda-advisory-committee-backs-two-controversial-peptides.html',
      },
      AJMC_VOTES,
      HOLLAND_KNIGHT,
      WADA_LIST,
    ],
  },
  {
    id: 'thymosin-alpha-1',
    name: 'Thymosin Alpha-1',
    aka: ['thymalfasin', 'Zadaxin', 'Tα1'],
    family: 'immune',
    tier: 2,
    legal: 'abroad',
    status:
      'Not FDA-approved or lawful to compound. Left Category 2 in Sept 2024; PCAC voted against listing it in Dec 2024. Approved abroad as Zadaxin for chronic hepatitis B and C.',
    wada: 'Not named; check with USADA',
    seq: [
      'Ac', 'S', 'D', 'A', 'A', 'V', 'D', 'T', 'S', 'S', 'E', 'I', 'T', 'T', 'K',
      'D', 'L', 'K', 'E', 'K', 'K', 'E', 'V', 'V', 'E', 'E', 'A', 'E', 'N',
    ],
    seqNote: '28 amino acids, N-acetylated',
    summary:
      'A 28-amino-acid thymus peptide sold outside the US as Zadaxin (thymalfasin) for chronic hepatitis B and C. Not FDA-approved. Popular online for immune support and Long COVID.',
    mechanism:
      'A thymic peptide described as an immune modulator, possibly acting through Toll-like receptor signaling. Its ex-US label says it appears to work by enhancing the immune system.',
    claim: 'Promoted online as an "immune reset" for Long COVID, EBV reactivation and ME/CFS.',
    shows:
      'Approved abroad for viral hepatitis, not for general immune support. Its largest trial (1,106 adults with sepsis) found no survival benefit, and an exploratory subgroup under age 60 did worse. No trial in Long COVID was identified.',
    evidence: [
      'TESTS Phase 3 RCT (1,106 adults with sepsis, 22 centers in China, BMJ 2025): 28-day death rate 23.4% vs 24.1% on placebo. No meaningful difference.',
      'TESTS subgroups (exploratory): people under 60 did worse (HR 1.67). People 60 and older showed no significant benefit (HR 0.81).',
      'TESTS safety: any side effect 66.4% vs 67.6%, and serious events 26.8% vs 29.3%, similar to placebo.',
      'Ex-US label: over 2,000 people treated with no clinically significant drug-related reactions. Most effects were mild injection-site discomfort.',
    ],
    halfLife: 'About 2 hours (ex-US label)',
    routes: 'Injection under the skin. The label says it should not be given into a vein.',
    studied:
      'Ex-US label, chronic hepatitis B: 1.6 mg under the skin twice weekly for 6 to 12 months. TESTS sepsis RCT (1,106 adults): 1.6 mg under the skin every 12 hours for 7 days.',
    sideEffects: [
      'Injection-site discomfort (most common)',
      'Rare redness, rash, joint pain with hand swelling, or short-lived muscle wasting',
      'In hepatitis B, a temporary rise in the liver enzyme ALT can occur',
      'In the sepsis trial, side effects matched placebo',
    ],
    redFlags: [
      'Signs of liver failure during hepatitis B treatment (the label says therapy continues only if these do not appear)',
      ALLERGY_FLAG,
      SITE_FLAG,
    ],
    avoid: [
      'People allergic to thymosin alpha-1 or any ingredient',
      'Organ transplant recipients or anyone on immune-suppressing treatment, unless a doctor judges the benefit clearly outweighs the risk',
      'Pregnant people: use only if benefits clearly outweigh risks (animal studies showed no harm)',
      'Breastfeeding people: unknown whether it passes into milk',
      'Children under 18: safety and effectiveness not established',
    ],
    interactions: [
      'Interactions have not been fully evaluated (label)',
      'Use caution with other immune-modulating drugs',
      'Do not mix with other drugs in the same preparation',
    ],
    unknowns: [
      'Whether it helps Long COVID, ME/CFS or other post-viral illness',
      'Whether claimed boosts to vaccine responses hold up; those trials could not be verified',
      'How many countries approve it, and for which uses today',
    ],
    goals: ['immune', 'long covid', 'hepatitis'],
    defaultRoute: 'Subcutaneous injection',
    defaultUnit: 'mg',
    sources: [
      {
        t: 'Wu et al., TESTS trial of thymosin alpha 1 in sepsis, BMJ 2025 (full-text copy)',
        u: 'https://www.binasss.sa.cr/ene25/11.pdf',
      },
      {
        t: 'RxList: Zadaxin (thymalfasin) label information',
        u: 'https://rxlist.com/zadaxin-drug.htm',
      },
      FDA_BULKS_RISK_PAGE,
      {
        t: 'FDA PCAC final summary minutes, Dec 4, 2024',
        u: 'https://fda.gov/media/185642/download',
      },
      {
        t: 'Reed Smith: FDA peptide Category 2 changes and PCAC (Oct 2024)',
        u: 'https://www.reedsmith.com/de/perspectives/2024/10/fda-certain-peptide-bulk-drug-substances-category-2-503a-bulks-pcac',
      },
      WADA_LIST,
    ],
  },
  {
    id: 'thymalin',
    name: 'Thymalin',
    family: 'immune',
    tier: 3,
    legal: 'unapproved',
    status:
      'Not FDA-approved. Not on any FDA compounding list or PCAC agenda, so not cleared to compound. Russian researchers call it an approved medicine; no regulator record was found.',
    wada: 'Not named; likely S0',
    summary:
      'A thymus-derived polypeptide preparation promoted as an immune booster. Its human research is small and uncontrolled, and comes mostly from a small, overlapping group of Russian authors.',
    mechanism:
      'Described by its researchers as an immunomodulator. In small reports it was linked to higher T-cell and B-cell counts in blood tests. No detailed mechanism studies were found.',
    claim: 'Presented as a thymus-restoring immune peptide, with claims that it cut COVID-19 deaths in hospital.',
    shows:
      'Human reports are 2 case reports, a 38 vs 50 non-randomized comparison and an 87-patient retrospective review. They measured blood immune markers, not survival. The death-rate figures quoted online could not be found in any checked source.',
    evidence: [
      'Retrospective study (87 severe COVID-19 patients, 2023): adding thymalin was linked to blood immune markers returning toward normal. Not randomized; no death rates reported.',
      'Non-randomized study (38 on thymalin vs 50 on standard care, older COVID-19 patients, 2021): IL-6 fell and lymphocyte counts rose to normal by day 200. No death rates reported.',
      'Case reports (2 older adults with severe COVID-19 pneumonia, 2020): lymphocyte counts about doubled and both went home. The authors noted possible bias.',
      'Mouse study: thymalin protected 45% to 60% of mice infected with a mouse coronavirus.',
      'The same few authors appear across these papers, a single-group pattern that limits confidence.',
    ],
    halfLife: 'Unknown; no data found',
    routes: 'Injection into muscle in the published reports.',
    sideEffects: [
      'None reported in the published studies, none of which was a safety study',
      'No safety, toxicity or drug-level studies were found',
      'Long-term effects are unknown',
    ],
    redFlags: [ALLERGY_FLAG, FEVER_FLAG, SITE_FLAG],
    avoid: [
      'Organ transplant recipients or anyone on immune-suppressing treatment (caution by analogy to thymosin alpha-1)',
      'Pregnant or breastfeeding people: no safety data found',
      'Drug-tested athletes: likely banned under S0',
    ],
    interactions: ['No interaction data found'],
    unknowns: [
      'Whether it improves survival or recovery in any illness',
      'Its safety, dose-response and half-life',
      'Its registration status and approved uses in Russia',
    ],
    goals: ['immune', 'thymus', 'covid'],
    defaultRoute: 'Intramuscular injection',
    defaultUnit: 'mg',
    sources: [
      {
        t: 'Kuznik et al., thymalin in severe COVID-19, Russian Journal of Immunology 2023',
        u: 'https://journals.rcsi.science/1028-7221/article/view/120220',
      },
      {
        t: 'Khavinson et al., thymalin in older COVID-19 patients, Vrach 2021',
        u: 'https://journals.eco-vector.com/0236-3054/article/view/114441',
      },
      {
        t: 'Shapovalov et al., thymalin case reports, AJBSR 2020',
        u: 'https://khavinson.info/assets/files/skan/2020-shapovalov.pdf',
      },
      {
        t: 'Kozlovsky, thymalin in mouse coronavirus infection, 2022',
        u: 'https://doaj.org/article/ddb682174e624b70b2a8774de79e8aea',
      },
      FDA_BULKS_RISK_PAGE,
      HOLLAND_KNIGHT,
    ],
  },
  {
    id: 'vip',
    name: 'VIP (aviptadil)',
    aka: ['aviptadil', 'vasoactive intestinal peptide', 'Zyesami', 'Invicorp (with phentolamine)', 'Oxyptadil'],
    family: 'immune',
    tier: 2,
    legal: 'abroad',
    status:
      'Not FDA-approved; FDA twice declined COVID-19 emergency use. Not on FDA compounding lists. UK-approved only as Invicorp, with phentolamine, for erectile dysfunction.',
    wada: 'Not named; check with USADA',
    summary:
      'Aviptadil is a lab-made copy of vasoactive intestinal peptide (VIP), which the body makes. Approved in the UK only with phentolamine as a penile injection for erectile dysfunction. Promoted as a nasal spray for mold illness.',
    mechanism:
      'A synthetic version of vasoactive intestinal peptide, a natural signaling peptide. It is cleared from blood within minutes and leaves the body through the kidneys, mostly within 24 hours.',
    claim: 'Marketed as a nasal spray fix for mold illness (CIRS) and Long COVID.',
    shows:
      'The mold-illness use rests on one 20-person open-label study run by the clinic that defined the condition. In a large randomized COVID-19 trial, IV aviptadil was stopped for futility. FDA has not approved it for any use.',
    evidence: [
      'TESICO RCT (471 hospitalized adults with COVID-19 respiratory failure, 28 US sites): no improvement at day 90 (OR 1.11); 90-day deaths 38% vs 36%. Stopped for futility in May 2022.',
      'TESICO safety: a combined measure of serious harms was 63% vs 56% on placebo, not statistically significant.',
      'Mold illness (CIRS) study (20 adults, open-label, 18 months or more, 2013): symptoms and lab markers improved vs historical controls. No placebo group; run by the clinic that defined CIRS.',
      'Invicorp (aviptadil 25 mcg + phentolamine 2 mg) has had a UK license for erectile dysfunction since April 2015.',
      'FDA declined emergency use of Zyesami (aviptadil) for critical COVID-19 in Nov 2021 and again later, citing insufficient data.',
    ],
    halfLife: 'About 1 to 2 minutes in blood',
    routes:
      'Approved product: injection into the penis, with phentolamine. Trials used IV infusion and, in one small study, a nasal spray. Popular online as a nasal spray.',
    studied:
      'Invicorp (UK label): 25 mcg aviptadil + 2 mg phentolamine injected into the penis, no more than once daily or 3 times a week. TESICO RCT (471 adults): 12-hour IV infusion daily for 3 days (600, 1200, then 1800 pmol/kg).',
    sideEffects: [
      'Flushing',
      'Low blood pressure',
      'Fast heartbeat or irregular extra beats (bigeminy)',
      'Diarrhea',
      'With the penile injection: bruising at the site; rarely priapism or penile scarring (fibrosis)',
    ],
    redFlags: [
      'An erection that lasts too long or is painful after a penile injection (priapism is an emergency)',
      'Dizziness or fainting, which can mean low blood pressure',
      'A racing or irregular heartbeat',
    ],
    avoid: [
      'People with low blood pressure or heart rhythm problems should ask a doctor first',
      'Pregnant people: they were excluded from the COVID-19 trials, so it is unstudied in pregnancy',
      'Anyone starting the penile injection: the UK label says first injections must be given by trained medical staff',
    ],
    interactions: ['No known significant interactions are listed, but safety data are limited'],
    unknowns: [
      'Whether nasal VIP helps mold illness or Long COVID in a controlled trial',
      'Long-term safety of nasal use',
    ],
    goals: ['mold', 'cirs', 'long covid', 'erectile dysfunction'],
    defaultRoute: 'Nasal spray',
    defaultUnit: 'mcg',
    sources: [
      {
        t: 'TESICO trial of aviptadil in COVID-19 respiratory failure, Lancet Respir Med 2023 (record)',
        u: 'https://discovery-pp.ucl.ac.uk/id/eprint/10173550',
      },
      {
        t: 'Shoemaker et al., intranasal VIP in CIRS, Health 2013',
        u: 'https://www.scirp.org/html/6-8202013_28586.htm',
      },
      {
        t: 'AWTTC appraisal: aviptadil/phentolamine (Invicorp), 2017',
        u: 'https://awttc.nhs.wales/files/appraisals-asar-far/appraisal-report-aviptadil-phentolamine-invicorp-3435/',
      },
      {
        t: 'Drugs.com: aviptadil monograph',
        u: 'https://drugs.com/ppa/aviptadil.html',
      },
      {
        t: "FDAnews: FDA declines NRx's EUA for Zyesami a second time",
        u: 'https://fdanews.com/articles/208541-fda-declines-nrxs-eua-for-zyesami-a-second-time',
      },
      FDA_BULKS_RISK_PAGE,
      WADA_LIST,
    ],
  },
  {
    id: 'll-37',
    name: 'LL-37',
    aka: ['cathelicidin', 'ropocamptide'],
    family: 'immune',
    tier: 2,
    legal: 'pending',
    status:
      'Off FDA Category 2 since Apr 2026. Slated for the PCAC meeting due by end of Feb 2027; no date set. Not lawful to compound now. No approved product.',
    wada: 'Not named; likely S0',
    summary:
      'An antimicrobial peptide the body makes naturally (a cathelicidin). Trending after a 2026 sleep apnea study of natural blood levels. The only drug trial found tested it on leg ulcers.',
    mechanism:
      'Part of the body\'s own defense against microbes. FDA notes animal or lab findings that it may harm male reproduction and may promote tumors in some tissues.',
    claim: 'Low LL-37 is framed online as a deficiency to fix, for immune support and better sleep.',
    shows:
      'The 2026 study only measured the body\'s own LL-37 in 78 men and found a link with sleep apnea, not a benefit from taking it. The one randomized trial of LL-37 (topical, for leg ulcers) missed its overall comparison.',
    evidence: [
      'HEAL Phase IIb RCT (144 patients with venous leg ulcers, 13 weeks, topical): no significant difference across all wound sizes. Results were reported only by the company, in 2020.',
      'HEAL subgroup with large wounds (10 cm² or more): more complete healing with the lower dose (28.1% vs 8.1% on placebo).',
      '2026 PLOS ONE study (78 men in Japan): blood LL-37 was lower in men with moderate-to-severe sleep apnea (47.1 vs 75.3 ng/L). Observational, so it cannot show cause.',
      'Same study: after about 3 months of CPAP, LL-37 did not rise significantly (20 men, p=0.052). The paper also has errors in its counts and units.',
      'No published human study of injected or nasal LL-37 was found.',
    ],
    halfLife: 'Unknown; no data for LL-37 given as a drug',
    routes: 'Applied to the skin (leg ulcers) in the only trial found. Injected or nasal use has no published human study.',
    studied:
      'HEAL Phase IIb RCT (144 patients with venous leg ulcers): 0.5 mg/mL or 1.6 mg/mL applied to the ulcer twice weekly with dressing changes for 13 weeks.',
    sideEffects: [
      'No serious side effects judged drug-related in the leg-ulcer trial',
      'Possible immune reaction and impurity concerns (FDA)',
      'Possible harm to male reproduction, seen in animal or lab studies (FDA)',
      'Possible tumor-promoting effects in some tissues, seen in animal or lab studies (FDA)',
    ],
    redFlags: [ALLERGY_FLAG, FEVER_FLAG, SITE_FLAG],
    avoid: [
      'Men planning to father a child should ask a doctor first: animal or lab findings suggest harm to male reproduction',
      'People with cancer or a past cancer: it may promote tumors in some tissues (animal or lab findings)',
      'Drug-tested athletes: likely banned under S0',
    ],
    interactions: ['No interaction data found'],
    unknowns: [
      'Whether taking LL-37 does anything for immunity or sleep',
      'Its safety when injected or sprayed in the nose',
      'Whether low blood LL-37 contributes to sleep apnea or simply goes along with it',
      'What the PCAC will recommend at its meeting due by Feb 2027',
    ],
    goals: ['immune', 'infection', 'sleep apnea', 'wound healing'],
    defaultRoute: 'Topical',
    defaultUnit: 'mg',
    sources: [
      {
        t: 'Promore Pharma: Phase IIb results of ropocamptide in venous leg ulcers (Nov 2020, company release)',
        u: 'https://storage.mfn.se/ce27b894-962d-4628-bada-a8baa109c0fb/promore-pharma-announces-positive-results-from-phase-iib-study-of-ropocamptide-in-the-treatment-of-venous-leg-ulcers.pdf',
      },
      {
        t: 'Yamaguchi et al., plasma LL-37 and sleep apnea, PLOS ONE 2026',
        u: 'https://journals.plos.org/plosone/article?id=10.1371%2Fjournal.pone.0355855',
      },
      FDA_BULKS_RISK_PAGE,
      {
        t: 'SSRP Institute: FDA announces change in status of 12 peptides (Apr 15, 2026)',
        u: 'https://ssrpinstitute.org/news/fda-announces-change-in-status-of-12-peptides/',
      },
      {
        t: 'FDA Pharmacy Compounding Advisory Committee meetings page',
        u: 'https://www.fda.gov/advisory-committees/pharmacy-compounding-advisory-committee/meeting-pharmacy-compounding-advisory-committee',
      },
      HOLLAND_KNIGHT,
      WADA_LIST,
    ],
  },
];
