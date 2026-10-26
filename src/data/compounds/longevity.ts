import type { Peptide } from '../../lib/types';

// Longevity and mitochondria compounds. US status as of Oct 26, 2026.
// Built only from research notes: longevity_peptides.md and regulation_and_safety.md.

export const LONGEVITY: Peptide[] = [
  {
    id: 'glutathione',
    name: 'Glutathione',
    aka: ['GSH', 'Reduced L-glutathione', 'Tathion (Japan)'],
    family: 'longevity',
    tier: 2,
    legal: 'compoundable',
    status:
      'In 503A Category 1 (under evaluation) since at least Sept 2023, so a pharmacy may compound it with a prescription. Not FDA-approved. Approved as an oral drug in Japan (Tathion) for narrow uses.',
    summary:
      'An antioxidant tripeptide the body makes itself. It is taken by mouth, as a nasal spray, or as an IV drip, and is most often promoted online for skin lightening.',
    mechanism:
      'Glutathione is the body\'s own antioxidant. In rats, oral glutathione is mostly broken down after it is absorbed: only about 14% of what appeared in urine was unchanged. Even so, one human trial found high oral doses raised levels in blood cells. Given IV, it is cleared from plasma in about 10 minutes.',
    claim:
      'A "master antioxidant" that lightens skin, often sold as an IV drip at wellness clinics.',
    shows:
      'Oral glutathione raised body stores in one 6-month RCT. Skin effects were small, limited to some body sites, inconsistent and probably not lasting. IV use has no positive controlled evidence, and contaminated or supplement-grade IV products caused endotoxin outbreaks. A nasal spray did not beat placebo in Parkinson\'s.',
    evidence: [
      '6-month RCT, 54 adults (Richie 2015): 1,000 mg/day by mouth raised glutathione about 30 to 35% in red blood cells, plasma and lymphocytes. Levels returned to baseline 1 month after stopping.',
      '4-week RCT, 60 medical students (2012): 500 mg/day by mouth lowered skin melanin, but beat placebo at only 2 of 6 body sites.',
      '12-week RCT, 83 women analyzed (Indonesia, 2021, industry-funded): a capsule with 500 mg glutathione plus other ingredients showed no significant skin differences versus placebo.',
      'IV RCT, 32 people (Pakistan, 2016): 6 of 16 improved on IV glutathione vs 3 of 16 on placebo, not a significant difference. Only 1 of 16 kept the effect at 6 months. The trial had design flaws.',
      'Nasal spray Phase IIb RCT, 45 people with Parkinson\'s (2017): 300 or 600 mg/day for 12 weeks was no better than placebo.',
      'Fatty liver (NAFLD) pilot, 29 adults finished (2017): ALT fell about 16% on 300 mg/day for 4 months, but there was no control group and only about half responded.',
    ],
    halfLife: 'About 10 minutes in plasma after an IV dose (one cited study)',
    routes:
      'By mouth in most trials (tablets and powder are approved in Japan). Nasal spray in a Parkinson\'s trial. IV drips and injections from compounding pharmacies and wellness clinics.',
    studied:
      'Oral trials: 250 or 1,000 mg/day for 6 months (Richie 2015); 500 mg/day for 4 weeks (skin trial). Nasal spray: 300 or 600 mg/day in 3 doses for 12 weeks (no better than placebo). Japan oral label: 50 to 100 mg, 1 to 3 times a day. No IV trial dose is listed here.',
    sideEffects: [
      'By mouth: rash (rare, under 0.1% on Japan\'s label)',
      'By mouth: nausea, vomiting, stomach pain or loss of appetite (rare, under 0.1% on Japan\'s label)',
      'Mild side effects in one 12-week oral trial: 9% on glutathione vs 8% on placebo',
      'Nasal spray: sinus irritation and headache',
      'Nasal spray: puffiness under the eyes (reported in one trial)',
    ],
    redFlags: [
      'Trouble breathing, fainting, or signs of shock during or after IV glutathione: get emergency care. This is CDC\'s advice after the 2026 outbreak.',
      'Fever, chills, body aches, headache, nausea, vomiting, dizziness, a fast heartbeat, low blood pressure or an injection-site reaction during or after an IV dose or injection: contact a clinician right away. These can be signs of an endotoxin reaction.',
      'FDA notice (Aug 27, 2026): at least 30 patients had fever, chills, pain, dizziness, signs of shock or sepsis-like symptoms after IV glutathione, alone or mixed with other ingredients. Some were hospitalized. FDA said these are consistent with excess endotoxin.',
      'FDA traced several cases to Medisca lot #229536, labeled dietary supplement grade, which FDA says is not an appropriate ingredient for injectable drugs.',
      'CDC (Sept 2026): more than 25 people became sick in at least 4 states after IV glutathione. At least 3 were hospitalized, and 1 needed intensive care for shock and abnormal blood clotting.',
    ],
    avoid: [
      'Anyone offered IV glutathione: FDA advises asking the compounder where its glutathione came from. Supplement-grade ingredient is not appropriate for injections.',
      'Anyone offered an IV dose of a product made for injection under the skin: in 2026, 2 people went to the emergency room after this.',
      'People with heart problems, before using the nasal spray: one trial participant developed heart muscle disease (cardiomyopathy) with a fast heartbeat, which resolved after stopping (cause unclear).',
      'Drug-tested athletes: the IV route itself may be restricted under WADA infusion rules. Check with USADA first.',
    ],
    unknowns: [
      'Whether any form gives lasting skin lightening. Effects in trials were small and faded after stopping.',
      'Whether IV glutathione does anything useful, since it leaves the blood within minutes.',
      'Long-term safety of oral or IV use.',
      'Whether the 2026 supply problem is over. Recalls continued into October 2026, and FDA said it would post updates.',
    ],
    popularity: 2236,
    goals: ['skin lightening', 'antioxidant', 'skin', 'liver'],
    defaultRoute: 'IV (in clinic)',
    defaultUnit: 'mg',
    sources: [
      { t: 'FDA: FDA reminds compounders not to use dietary supplement grade glutathione for injectables (Aug 27, 2026)', u: 'https://www.fda.gov/drugs/human-drug-compounding/fda-reminds-compounders-not-use-dietary-supplement-grade-glutathione-injectables' },
      { t: 'CDC: Current situation (IV glutathione illnesses, Sept 2026)', u: 'https://www.cdc.gov/healthcare-associated-infections/current-situation/index.html' },
      { t: 'FDA: Bulk drug substances nominated for use in compounding under Section 503A (updated May 14, 2026)', u: 'https://www.fda.gov/media/94155/download' },
      { t: 'FDA 503A categories update, September 2023 (A4PC copy)', u: 'https://join.a4pc.org/hubfs/PDFs/503A-Categories-Update-for-September-2023-FINAL.docx.pdf' },
      { t: 'Richie et al. 2015, Eur J Nutr: randomized trial of oral glutathione', u: 'https://pure.psu.edu/en/publications/randomized-controlled-trial-of-oral-glutathione-supplementation-o/' },
      { t: 'Sitohang and Ninditya 2020, Dermatol Res Pract: systemic glutathione as a skin whitener', u: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7196133' },
      { t: 'Mischley et al. 2017, J Parkinsons Dis: Phase IIb intranasal glutathione RCT', u: 'https://journals.sagepub.com/doi/10.3233/JPD-161040' },
      { t: 'PMDA (Japan): Tathion label', u: 'https://www.pmda.go.jp/PmdaSearch/iyakuDetail/450064_3922001B2041_3_07' },
    ],
  },
  {
    id: 'ss-31',
    name: 'SS-31 (elamipretide)',
    aka: ['Elamipretide', 'Forzinity'],
    family: 'longevity',
    tier: 1,
    legal: 'approved',
    status:
      'FDA accelerated approval Sept 19, 2025 (Forzinity), only to improve muscle strength in Barth syndrome in patients 30 kg or more. Other uses are off-label and unstudied.',
    summary:
      'A mitochondria-targeting peptide approved by FDA in 2025 as Forzinity, only for muscle strength in Barth syndrome, a rare genetic disease. It is sold online for energy and anti-aging, uses that have not been studied.',
    mechanism:
      'Elamipretide binds cardiolipin in the inner membrane of mitochondria, the parts of cells that make energy. The label says this improves the shape and function of mitochondria. It is broken down into inactive pieces and leaves the body in urine.',
    claim:
      'A mitochondrial peptide that boosts energy and endurance and slows aging in healthy people.',
    shows:
      'Its only approval is for Barth syndrome. It rests on strength gains in an uncontrolled open-label phase, after the randomized phase of a 12-person trial missed its walking and fatigue goals. The approval depends on a confirmatory trial. No human evidence was found for energy or anti-aging use.',
    evidence: [
      'Randomized placebo crossover trial, 12 males aged 12 to 35 with Barth syndrome: no better than placebo on 6-minute walk distance or fatigue scores.',
      'Open-label extension, no control group: knee strength rose about 34 N by week 12 and 63 N by week 168 (8 patients left), from a baseline of 124 N. FDA based the approval on this.',
      'FDA refused to file the application in 2021 and rejected it in May 2025 before granting accelerated approval on Sept 19, 2025.',
      'Confirmatory 72-week randomized, placebo-controlled trial (4TAZPower, ages 5 and up) dosed its first patient on July 8, 2026.',
      'No human studies of SS-31 for energy, endurance or aging in healthy people were found.',
    ],
    halfLife:
      'Not confirmed in the label sections reviewed. Levels peak 0.5 to 1 hour after injection, and nearly all of a dose is in the urine within 48 hours (label).',
    routes:
      'Injection under the skin of the belly or outer thigh (label). Not approved for IV use. Grey-market "SS-31" vials sold online are not Forzinity and lack its quality controls.',
    studied:
      'Label (Barth syndrome, 30 kg or more): 40 mg under the skin once daily. Adults with eGFR under 30 who are not on dialysis: 20 mg once daily. A missed dose is skipped, not doubled. Not approved for IV use.',
    sideEffects: [
      'Injection-site reactions in 100% of treated trial patients (67% on placebo)',
      'Redness (100%), pain (75%), hardening (67%) and itching (67%) at the injection site',
      'Bruising or hives at the site (25% each)',
      'Higher eosinophil (white blood cell) counts that returned to normal without symptoms',
      'Allergic reactions, sometimes serious, from minutes to months after starting',
    ],
    redFlags: [
      'Trouble breathing, coughing, swelling, or hives beyond the injection site: get emergency care. Serious allergic reactions needing emergency treatment have occurred.',
      'A new rash, bumps, or itchy or inflamed skin: contact your prescriber promptly. After a serious allergic reaction, the label says to stop and not restart.',
    ],
    avoid: [
      'Anyone who has had a serious allergic reaction to elamipretide or any ingredient in it (label contraindication)',
      'Newborns: the vials contain benzyl alcohol, which carries a risk of fatal "gasping syndrome" in neonates. It is not approved for them.',
      'Pregnancy: no human data (no harm to the fetus in rat and rabbit studies)',
      'Kidney disease: blood levels rise with kidney impairment. The label lowers the dose for severe impairment, and data for dialysis are lacking.',
      'Adults 65 or older and children under 30 kg: not studied',
      'Healthy people seeking energy or anti-aging effects: not studied',
    ],
    interactions: [
      'Blocks the MATE1 drug transporter in lab tests. It did not block or boost CYP drug-processing enzymes.',
      'IV elamipretide did not meaningfully change aspirin, clopidogrel or heparin levels or their anti-clotting effects.',
    ],
    unknowns: [
      'Whether the strength benefit holds up in a controlled trial. The confirmatory study began in July 2026.',
      'Any effect in healthy people, for energy, endurance or aging.',
      'Long-term safety beyond a 12-person trial.',
      'Its status under WADA rules has not been confirmed. Athletes should check with USADA or Global DRO.',
    ],
    popularity: 525,
    goals: ['mitochondria', 'energy', 'endurance', 'anti-aging', 'barth syndrome'],
    defaultRoute: 'Subcutaneous injection',
    defaultUnit: 'mg',
    sources: [
      { t: 'FDA Drug Trials Snapshots: Forzinity', u: 'https://fda.gov/drugs/drug-trials-snapshots/drug-trials-snapshots-forzinity' },
      { t: 'Forzinity prescribing information (Drugs.com)', u: 'https://www.drugs.com/pro/forzinity.html' },
      { t: 'Forzinity pharmacology monograph (RxReasoner)', u: 'https://www.rxreasoner.com/monographs/forzinity/pharmacology' },
      { t: 'Pharmaceutical Technology: Forzinity approved as first Barth syndrome therapy (Sept 22, 2025)', u: 'https://www.pharmaceutical-technology.com/newsletters/stealth-bios-forzinity-finally-approved-as-first-barth-syndrome-therapy' },
      { t: 'BioSpace: first patient dosed in Phase 4 confirmatory study (July 8, 2026)', u: 'https://www.biospace.com/press-releases/mighty-therapeutics-announces-first-patient-dosed-in-phase-4-confirmatory-study-of-elamipretide-in-barth-syndrome' },
    ],
  },
  {
    id: 'mots-c',
    name: 'MOTS-c',
    family: 'longevity',
    tier: 4,
    legal: 'pending',
    status:
      'Off Category 2 on Apr 15, 2026. PCAC voted 7-5-2 to recommend it (obesity, osteoporosis) on Jul 23, 2026, against FDA staff advice. Not yet lawful to compound.',
    wada: 'Prohibited at all times (S4.4)',
    seq: 'MRWQEMGYIFYPRKLR',
    seqNote: '16 amino acids',
    summary:
      'A mitochondria-derived peptide promoted online for fat loss and endurance. It has been studied only in animals and the lab. FDA found no human studies of it.',
    mechanism:
      'MOTS-c is a 16-amino-acid peptide that comes from mitochondria. In rodents its effects on metabolism appear to work partly through an enzyme called AMPK, but its exact target is unknown. In lab tests it broke down quickly in human blood.',
    claim:
      'An "exercise mimetic" that burns fat, boosts metabolism and increases endurance.',
    shows:
      'Only rodent and lab studies. Rodents showed better glucose control and less weight gain on high-fat diets, but FDA notes these lacked dose-response data. There are no human studies, no human or animal PK data, and no toxicology studies.',
    evidence: [
      'FDA\'s July 2026 review found no published human studies of MOTS-c for any route or use, and no adverse-event reports in FAERS through March 2025.',
      'Rodent studies, mostly with injections into the belly cavity, reported better glucose and fat metabolism and less weight gain on high-fat diets. FDA says clinical relevance is unknown.',
      'In lab tests, MOTS-c broke down quickly in human whole blood. FDA says it is not known whether injected doses can reach active levels.',
      'A different, modified molecule (CB4211) was tested for 4 weeks in 20 obese adults with fatty liver. Liver enzymes fell versus placebo, but liver fat did not. This does not apply to MOTS-c.',
      'No toxicology studies exist: no acute, repeat-dose, genetic, reproductive or cancer studies (FDA).',
    ],
    halfLife: 'Unknown in humans and animals. It broke down quickly in human blood in lab tests (FDA).',
    routes:
      'No human route has been studied. Rodent studies mostly used injections into the belly cavity. Sold online as injectable vials.',
    sideEffects: [
      'No human side-effect data exist for MOTS-c itself',
      'Immune reactions are a concern, especially with injection under the skin, because of clumping and impurities (FDA)',
      'Injection-site reactions were the most common effect with CB4211, a related but different molecule',
      'Vials may carry impurities or endotoxin. The nominator\'s certificate of analysis lacked impurity, microbial and endotoxin results (FDA).',
    ],
    redFlags: [
      'Trouble breathing, swelling of the face or throat, or hives all over after a dose: call 911.',
      'Fever, chills or shaking within hours of an injection: possible endotoxin reaction. Get care right away.',
      'Spreading redness, warmth, red streaks or pus at the injection site: possible infection. Contact a clinician right away.',
    ],
    avoid: [
      'Drug-tested athletes: prohibited at all times by WADA (S4.4)',
      'Pregnancy or trying to conceive: no reproductive safety studies exist (FDA)',
      'Anyone considering online vials: FDA judged MOTS-c not well-characterized, and different salts and forms are sold under the same name.',
    ],
    unknowns: [
      'Whether it does anything in people, at any dose.',
      'Whether injected doses last long enough in the blood to act.',
      'Short- and long-term safety, including immune reactions and cancer risk, which have not been tested.',
    ],
    goals: ['fat loss', 'metabolism', 'endurance', 'mitochondria'],
    defaultRoute: 'Subcutaneous injection',
    defaultUnit: 'mg',
    sources: [
      { t: 'FDA PCAC briefing document: MOTS-c (July 2026)', u: 'https://www.fda.gov/media/193347/download' },
      { t: 'FDA: July 23-24, 2026 Pharmacy Compounding Advisory Committee meeting', u: 'https://www.fda.gov/advisory-committees/advisory-committee-calendar/july-23-24-2026-meeting-pharmacy-compounding-advisory-committee-07232026' },
      { t: 'McDermott: PCAC backs majority of peptides in two-day public meeting', u: 'https://www.mcdermottlaw.com/insights/bulk-list-bound-pcac-backs-majority-of-peptides-in-two-day-public-meeting/' },
      { t: 'FDA Law Blog: FDA\'s peptide rally (Apr 21, 2026)', u: 'https://www.thefdalawblog.com/2026/04/fdas-peptide-rally-what-compounders-and-industry-need-to-know-post-1-of-2/' },
      { t: 'WADA 2026 Prohibited List', u: 'https://www.segas.gr/wp-content/uploads/2025/11/2026list_en_final_clean_september_2025.pdf' },
      { t: 'CohBar: Phase 1a/1b results for CB4211, a MOTS-c analog (Aug 10, 2021)', u: 'https://www.biospace.com/cohbar-announces-positive-topline-results-from-the-phase-1a-1b-study-of-cb4211-under-development-for-nash-and-obesity' },
    ],
  },
  {
    id: 'epitalon',
    name: 'Epitalon',
    aka: ['Epithalon', 'AEDG'],
    family: 'longevity',
    tier: 3,
    legal: 'pending',
    status:
      'Off Category 2 on Apr 15, 2026. PCAC voted 7-4-1 to recommend it (insomnia) on Jul 24, 2026, against FDA staff advice. Not yet lawful to compound. Not approved anywhere.',
    wada: 'Not named; likely S0',
    seq: 'AEDG',
    seqNote: '4 amino acids (Ala-Glu-Asp-Gly)',
    summary:
      'A synthetic 4-amino-acid peptide from Russia, promoted online for longevity and longer telomeres. Human data are thin and mostly Russian, and much of the older work used epithalamin, a different calf pineal extract.',
    mechanism:
      'Lab studies reported that epitalon activated telomerase and lengthened telomeres in human fetal lung cells grown in a dish. In one small human study it raised a breakdown product of melatonin. Neither effect has been shown to slow aging or extend life in people.',
    claim:
      'A "longevity" peptide that lengthens telomeres, improves sleep and extends lifespan.',
    shows:
      'Telomere effects come only from cell and animal studies. FDA found no human data on telomeres or lifespan and no insomnia trials. One small study raised a melatonin marker. FDA flagged a theoretical cancer risk from long-term telomerase activation.',
    evidence: [
      'Randomized, placebo-controlled study, 75 women aged 40 to 50 working night shifts (Ivko 2021): a 0.5 mg/day spray under the tongue for 20 days raised a melatonin marker 1.7-fold. Sleep was not measured.',
      'FDA\'s July 2026 review found no insomnia trials, no studies of injection under the skin, and no human evidence for telomere lengthening or longer life.',
      'Telomerase activation and telomere lengthening were reported only in human fetal lung cells in the lab (2003, 2005).',
      'Effects on lifespan come only from mouse studies. FDA judged the mouse cancer studies inadequate (intermittent dosing, up to about 22 weeks).',
    ],
    halfLife: 'Unknown in humans (no human PK data, per FDA)',
    routes:
      'Spray under the tongue in one small trial; one Russian study injected it near the eye. It was nominated for compounding as an injection under the skin, a route FDA found no studies of.',
    studied:
      '0.5 mg/day as a spray under the tongue for 20 days (Ivko 2021, women working night shifts). FDA identified no published trial of injection under the skin.',
    sideEffects: [
      'No reliable human side-effect data. One small Russian report in older people described no side effects.',
      'Immune reactions are a concern with injection under the skin (FDA)',
      'The certificate of analysis reviewed by FDA lacked microbial and endotoxin tests',
      'No FDA adverse-event reports through Dec 8, 2025, though FDA notes reporting is incomplete',
    ],
    redFlags: [
      'Trouble breathing, swelling of the face or throat, or hives all over after a dose: call 911.',
      'Fever, chills or shaking within hours of an injection: possible endotoxin reaction. Get care right away.',
      'Spreading redness, warmth, red streaks or pus at the injection site: possible infection. Contact a clinician right away.',
    ],
    avoid: [
      'Current or past cancer: FDA warned that long-term telomerase activation could, in theory, lead to cancer.',
      'Pregnancy or trying to conceive: no reproductive toxicology studies exist (FDA)',
      'Drug-tested athletes: not named by WADA, but likely banned under S0. Check with USADA first.',
    ],
    unknowns: [
      'Whether it lengthens telomeres or extends life in people.',
      'Whether it helps sleep. No insomnia trials exist.',
      'Long-term safety, including cancer risk.',
      'Whether it can be made reliably as an injection. FDA said it may not be possible to make the free base as a 3 mg/mL injection in water.',
    ],
    goals: ['longevity', 'telomeres', 'sleep', 'anti-aging'],
    defaultRoute: 'Subcutaneous injection',
    defaultUnit: 'mg',
    sources: [
      { t: 'FDA PCAC briefing document: Epitalon (July 2026)', u: 'https://www.fda.gov/media/193345/download' },
      { t: 'FDA: July 23-24, 2026 Pharmacy Compounding Advisory Committee meeting', u: 'https://www.fda.gov/advisory-committees/advisory-committee-calendar/july-23-24-2026-meeting-pharmacy-compounding-advisory-committee-07232026' },
      { t: 'McDermott: PCAC backs majority of peptides in two-day public meeting', u: 'https://www.mcdermottlaw.com/insights/bulk-list-bound-pcac-backs-majority-of-peptides-in-two-day-public-meeting/' },
      { t: 'FDA 503A categories update, September 2023 (A4PC copy)', u: 'https://join.a4pc.org/hubfs/PDFs/503A-Categories-Update-for-September-2023-FINAL.docx.pdf' },
    ],
  },
  {
    id: 'foxo4-dri',
    name: 'FOXO4-DRI',
    family: 'longevity',
    tier: 4,
    legal: 'unapproved',
    status:
      'Not approved anywhere. Not on FDA\'s 503A lists and not reviewed by PCAC. Sold online as a "research chemical," which is an unapproved drug when sold for human use.',
    wada: 'Not named; likely S0',
    summary:
      'An experimental peptide designed to make senescent (aged) cells die. It has been tested only in mice and cells, never in people, and is sold online as a research chemical.',
    mechanism:
      'FOXO4-DRI is built from mirror-image (D) amino acids in reverse order so it resists breakdown by enzymes. It is designed to block FOXO4 from binding p53, a protein involved in cell death, so that senescent cells self-destruct. Its effects on healthy cells in people are unknown.',
    claim: 'A senolytic that clears old cells and reverses aging.',
    shows:
      'One 2017 mouse study reported that it cleared senescent cells and restored fitness, fur density and kidney function in aged mice. It has never been tested in a human, and there are no human dosing or safety data.',
    evidence: [
      'Baar et al. 2017 (Cell), mice: it selectively killed senescent cells and restored fitness, fur density and kidney function in fast-aging and naturally aged mice.',
      'The same work reported less chemotherapy toxicity in a separate mouse model.',
      'No registered human trials on ClinicalTrials.gov as of May 2026 (secondary source).',
      'No human pharmacokinetic data exist, so there is no basis for any human dose.',
    ],
    halfLife: 'Unknown (no human data)',
    routes: 'Never given to people in a study. Sold online as a "research chemical."',
    sideEffects: [
      'No human side-effect data exist',
      'In theory, forcing cell death through p53 could harm healthy cells, stem cells or tissue repair',
      'Possible immune reactions to the peptide',
      'Grey-market product may be contaminated, mislabeled, or made with the wrong mirror-image form',
      'Leftover TFA salt and 2 to 5% impurities have been raised as concerns with custom-made batches',
    ],
    redFlags: [
      'Trouble breathing, swelling of the face or throat, or hives all over after a dose: call 911.',
      'Fever, chills or shaking within hours of an injection: possible endotoxin reaction. Get care right away.',
      'Spreading redness, warmth, red streaks or pus at an injection site: possible infection. Contact a clinician right away.',
    ],
    avoid: [
      'Active or suspected cancer (advice from a secondary review)',
      'Drug-tested athletes: not named by WADA, but likely banned under S0. Check with USADA first.',
      'Anyone thinking of self-experimenting: it has never been tested in a human, and product quality is unverified.',
    ],
    unknowns: [
      'Whether it is safe or does anything in people.',
      'What forcing cell death does to healthy tissue, stem cells and healing.',
      'A safe or effective human dose, if one exists.',
    ],
    goals: ['senolytic', 'anti-aging', 'longevity', 'senescent cells'],
    defaultRoute: 'Other',
    defaultUnit: 'mg',
    sources: [
      { t: 'Baar et al. 2017, Cell: targeted apoptosis of senescent cells in mice', u: 'https://doi.org/10.1016/j.cell.2017.02.031' },
      { t: 'Outliyr: FOXO4-DRI evidence report (secondary summary)', u: 'https://outliyr.com/reports/fox04-dri' },
      { t: 'FDA: Bulk drug substances nominated for use in compounding under Section 503A (updated May 14, 2026)', u: 'https://www.fda.gov/media/94155/download' },
      { t: 'FDA: July 23-24, 2026 Pharmacy Compounding Advisory Committee meeting', u: 'https://www.fda.gov/advisory-committees/advisory-committee-calendar/july-23-24-2026-meeting-pharmacy-compounding-advisory-committee-07232026' },
      { t: 'Fight Aging blog: on self-experiments with FOXO4-DRI (Mar 2018)', u: 'https://www.fightaging.org/archives/2018/03/how-to-plan-and-carry-out-a-simple-self-experiment-a-single-person-trial-of-senolytic-peptide-foxo4-dri/?nc' },
    ],
  },
  {
    id: 'nad',
    name: 'NAD+ (IV and injections)',
    aka: ['Nicotinamide adenine dinucleotide', 'NAD'],
    family: 'longevity',
    tier: 3,
    legal: 'compoundable',
    isPeptide: false,
    status:
      'NAD has been in 503A Category 1 (under evaluation) since at least Sept 2023, so a pharmacy may compound it with a prescription. A salt form (NAD disodium salt trihydrate) is Category 3.',
    summary:
      'NAD+ is a coenzyme cells use in their metabolism. Clinics sell it as IV drips for energy and anti-aging, but human data are limited to two tiny studies of blood levels and tolerability. Neither measured any health benefit.',
    mechanism:
      'NAD+ is a coenzyme in cellular redox metabolism. When infused, enzymes in the body break it down into products such as nicotinamide, ADPR, methylnicotinamide and NMN. In one study, blood levels did not rise for the first 2 hours of a slow drip.',
    claim:
      'IV drips that boost energy, sharpen thinking, slow aging and "recharge" cells.',
    shows:
      'About 25 people took part in two small studies tied to companies that sell infusions. Neither measured energy, thinking or aging. At clinic speeds, every NAD+ recipient in one study had stomach symptoms, a faster heart rate and chest pressure.',
    evidence: [
      'Grant 2019, 11 healthy men (8 NAD+, 3 saline): 750 mg over 6 hours. Blood NAD+ did not change for 2 hours, then rose about 398% by 6 hours. No side effects at this slow rate. Partly industry-funded.',
      'Reyna 2026, retrospective, 14 people, no placebo (6 NAD+, 8 NR): four 500 mg IV infusions. All NAD+ recipients had moderate to severe stomach symptoms, faster heart rate and chest pressure, which resolved afterward.',
      'In the same study, liver, kidney, thyroid and inflammation tests and blood pressure did not change significantly. It was funded by a wellness company.',
      'No randomized trial shows IV NAD+ improves energy, thinking, aging or any health outcome.',
      'Context, oral nicotinamide riboside (NR): 6-week crossover RCT, 24 adults aged 55 to 79 finished. 1,000 mg/day raised NAD+ in blood cells about 60%. Blood pressure changes were not significant.',
    ],
    halfLife: 'No published half-life found. In one slow-drip study, blood levels did not rise for the first 2 hours.',
    routes:
      'Studied only as slow IV infusions (about 1.5 to 6 hours each). No human studies of NAD+ injected under the skin or into muscle were found.',
    studied:
      'Tolerability studies only, not proven doses: 750 mg IV over 6 hours (Grant 2019, 8 men) and four 500 mg IV infusions of about 97 minutes each (Reyna 2026, 6 people).',
    sideEffects: [
      'Moderate to severe stomach symptoms during faster infusions',
      'Faster heart rate during infusion',
      'Chest pressure during infusion',
      'In one small study, symptoms resolved after the infusion ended',
      'No side effects in one study at a slow rate (750 mg over 6 hours)',
    ],
    redFlags: [
      'Chest pressure or a racing heartbeat that does not go away when the drip is slowed or stopped: get emergency care.',
      'Trouble breathing, swelling of the face or throat, or hives during or after an infusion: call 911.',
      'Fever, chills, shaking, dizziness or low blood pressure during or after a drip: possible endotoxin reaction. Get care right away.',
    ],
    avoid: [
      'Anyone with a heart condition: ask a doctor first, since chest pressure and a faster heart rate were common during infusions.',
      'Anyone offered a compounded drip: ask where the ingredient came from. Compounded IV products can carry the kind of endotoxin risk FDA found with glutathione in 2026.',
      'Drug-tested athletes: the IV route itself may be restricted under WADA infusion rules. Check with USADA first.',
    ],
    unknowns: [
      'Whether IV NAD+ improves energy, thinking or aging. No controlled trial has measured this.',
      'Its half-life and how much reaches cells.',
      'Long-term safety of repeated drips.',
      'Whether NAD+ shots under the skin or into muscle are safe or do anything.',
    ],
    goals: ['energy', 'anti-aging', 'longevity', 'iv drip'],
    defaultRoute: 'IV (in clinic)',
    defaultUnit: 'mg',
    sources: [
      { t: 'Grant et al. 2019, Front Aging Neurosci: IV NAD+ infusion in healthy men', u: 'https://www.frontiersin.org/journals/aging-neuroscience/articles/10.3389/fnagi.2019.00257/full' },
      { t: 'Reyna et al. 2026, Front Aging: IV NAD+ and NR tolerability pilot', u: 'https://www.frontiersin.org/articles/10.3389/fragi.2026.1652582/full' },
      { t: 'Martens et al. 2018, Nat Commun: nicotinamide riboside in older adults', u: 'https://www.nature.com/articles/s41467-018-03421-7' },
      { t: 'FDA: Bulk drug substances nominated for use in compounding under Section 503A (updated May 14, 2026)', u: 'https://www.fda.gov/media/94155/download' },
      { t: 'FDA 503A categories update, September 2023 (A4PC copy)', u: 'https://join.a4pc.org/hubfs/PDFs/503A-Categories-Update-for-September-2023-FINAL.docx.pdf' },
      { t: 'FDA: FDA reminds compounders not to use dietary supplement grade glutathione for injectables (Aug 27, 2026)', u: 'https://www.fda.gov/drugs/human-drug-compounding/fda-reminds-compounders-not-use-dietary-supplement-grade-glutathione-injectables' },
    ],
  },
];
