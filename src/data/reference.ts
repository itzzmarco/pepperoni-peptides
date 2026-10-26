import type { FamilyKey, LegalKey, SafetyCard, Source, Tier, TimelineEvent } from '../lib/types';

export const AS_OF = 'October 26, 2026';
export const AS_OF_SHORT = 'Oct 2026';

export const TIERS: Record<Tier, { label: string; long: string }> = {
  1: { label: 'Approved', long: 'FDA-approved for a specific condition, backed by controlled trials' },
  2: { label: 'Trial-backed', long: "Randomized human trials exist, but it isn't approved for the use promoted online" },
  3: { label: 'Early human', long: 'Only small, short, or uncontrolled human studies' },
  4: { label: 'Preclinical', long: 'Only animal or lab studies, with no reliable human data' },
  5: { label: 'Unstudied', long: 'No studies of this product or combination at all' },
};

export const FAMILIES: Record<FamilyKey, { name: string }> = {
  metabolic: { name: 'Weight & metabolic' },
  repair: { name: 'Repair & recovery' },
  gh: { name: 'Growth hormone' },
  skin: { name: 'Skin, hair & tan' },
  mind: { name: 'Mind & mood' },
  longevity: { name: 'Longevity & mitochondria' },
  immune: { name: 'Immune & gut' },
  sexual: { name: 'Sexual health & hormones' },
  lipo: { name: 'Lipotropics & nutrients' },
};

export const LEGAL: Record<LegalKey, { label: string; long: string }> = {
  approved: { label: 'FDA-approved', long: 'An FDA-approved prescription drug for a specific condition. Other uses are off-label, and compounded copies are generally not allowed.' },
  compoundable: { label: 'Compoundable with Rx', long: 'A licensed pharmacy may compound it for an individual prescription while FDA evaluates it (503A Category 1). Compounded drugs are not FDA-approved or checked for safety and effectiveness.' },
  pending: { label: 'Under FDA review', long: "Taken off FDA's safety-risk list in April 2026. Some were backed by FDA's advisory committee in July 2026 and others go before it by February 2027. Either way, pharmacies can't legally compound it yet: that needs an FDA rule or a formal access policy, and neither is in effect." },
  restricted: { label: 'FDA restricted', long: "On FDA's Category 2 list of compounding ingredients with significant safety risks. Pharmacies may not compound it, even with a prescription." },
  investigational: { label: 'In clinical trials', long: "An investigational drug still in company-run trials. It isn't approved, and anything sold online is not the trial product." },
  unapproved: { label: 'Unapproved', long: 'Not approved for any human use in the US and not legally compoundable. Sold online as a "research chemical."' },
  cosmetic: { label: 'Cosmetic ingredient', long: "Sold legally in topical skin and hair products. Cosmetic rules don't require proof that it works, and injecting it is a separate, unapproved use." },
  supplement: { label: 'Supplement or OTC', long: 'Sold as a dietary supplement or over the counter. FDA does not review supplements for effectiveness before sale.' },
  abroad: { label: 'Approved abroad only', long: 'Approved as a medicine in another country (for example Russia or Japan), but not in the US.' },
};

const S = {
  cat2: { t: 'FDA: bulk substances with significant safety risks', u: 'https://www.fda.gov/drugs/human-drug-compounding/certain-bulk-drug-substances-use-compounding-may-present-significant-safety-risks' },
  noms: { t: 'FDA: 503A nominations list (May 14, 2026)', u: 'https://www.fda.gov/media/94155/download' },
  reed: { t: 'Reed Smith (Oct 2024)', u: 'https://www.reedsmith.com/de/perspectives/2024/10/fda-certain-peptide-bulk-drug-substances-category-2-503a-bulks-pcac' },
  pcacOct24: { t: 'FDA PCAC minutes, Oct 29, 2024', u: 'https://www.fda.gov/media/185412/download' },
  pcacDec24: { t: 'FDA PCAC minutes, Dec 4, 2024', u: 'https://fda.gov/media/185642/download' },
  glp1Policy: { t: 'FDA: policies as GLP-1 supply stabilizes', u: 'https://www.fda.gov/drugs/drug-alerts-and-statements/fda-clarifies-policies-compounders-national-glp-1-supply-begins-stabilize' },
  glp1Concerns: { t: "FDA: concerns with unapproved GLP-1 drugs", u: 'https://www.fda.gov/drugs/drug-alerts-and-statements/fdas-concerns-unapproved-glp-1-drugs-used-weight-loss' },
  greenList: { t: 'FDA: GLP-1 ingredient green list (Sept 5, 2025)', u: 'https://www.fda.gov/news-events/press-announcements/fda-launches-green-list-protect-americans-illegal-imported-glp-1-drug-ingredients' },
  npr: { t: 'NPR (Mar 31, 2026)', u: 'https://npr.org/2026/03/31/nx-s1-5768206/peptides-rfk-fda-compounding-pharmacies' },
  orrick: { t: 'Orrick (Apr 16, 2026)', u: 'https://www.orrick.com/en/Insights/2026/04/FDA-Announces-Removal-of-12-Peptides-from-Category-2-and-Schedules-PCAC-Meetings' },
  fedReg: { t: 'Federal Register 2026-07361', u: 'https://www.federalregister.gov/documents/2026/04/16/2026-07361/pharmacy-compounding-advisory-committee-notice-of-meeting-establishment-of-a-public-docket-request' },
  wlMileHigh: { t: 'FDA warning letter, Mile High Compounds (Mar 31, 2026)', u: 'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/mile-high-compounds-llc-721600-03312026' },
  wlGram: { t: 'FDA warning letter, Gram Peptides (Mar 31, 2026)', u: 'https://www.fda.gov/inspections-compliance-enforcement-and-criminal-investigations/warning-letters/gram-peptides-721806-03312026' },
  ex503b: { t: 'FDA: proposed 503B exclusion (Apr 30, 2026)', u: 'https://www.fda.gov/news-events/press-announcements/fda-proposes-exclude-semaglutide-tirzepatide-and-liraglutide-503b-bulks-list' },
  ajmc: { t: 'AJMC (Jul 31, 2026)', u: 'https://www.ajmc.com/view/fda-panel-backs-6-peptides-for-compounding' },
  abc: { t: 'ABC News (Jul 24, 2026)', u: 'https://abcnews.com/Health/fda-advisers-narrowly-vote-add-6-peptides-drug/story?id=135064915' },
  ncpa: { t: 'NCPA (Jul 31, 2026)', u: 'https://ncpa.org/newsroom/qam/2026/07/31/fda-advisory-committee-nominates-six-peptides-pharmacies-compound' },
  doj: { t: 'DOJ, W.D. Mich. (Jul 23, 2026)', u: 'https://www.justice.gov/usao-wdmi/pr/2026_0723_Piper_Sentencing_PR' },
  glut: { t: 'FDA: supplement-grade glutathione (Aug 27, 2026)', u: 'https://www.fda.gov/drugs/human-drug-compounding/fda-reminds-compounders-not-use-dietary-supplement-grade-glutathione-injectables' },
  glutRecall: { t: 'FDA: Optimal Balance Pharmacy recall', u: 'https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts/optimal-balance-pharmacy-issues-voluntary-nationwide-recall-certain-lots-compounded-glutathione-200' },
  ca5: { t: 'Fifth Circuit, No. 25-10600', u: 'https://www.ca5.uscourts.gov/opinions/unpub/25/25-10600.0.pdf' },
  becker: { t: "Becker's (Oct 15, 2026)", u: 'https://www.beckershospitalreview.com/glp-1s/hhs-sends-peptide-compounding-plan-to-white-house-5-things-to-know/' },
  amspa: { t: 'American Med Spa Association (Oct 16, 2026)', u: 'https://www.americanmedspa.org/news/fda-peptide-interim-access-policy-white-house-review/' },
  pcacPage: { t: 'FDA PCAC meeting page', u: 'https://www.fda.gov/advisory-committees/pharmacy-compounding-advisory-committee/meeting-pharmacy-compounding-advisory-committee' },
  wada: { t: 'WADA 2026 Prohibited List', u: 'https://www.segas.gr/wp-content/uploads/2025/11/2026list_en_final_clean_september_2025.pdf' },
  usada: { t: 'USADA on BPC-157', u: 'https://www.usada.org/spirit-of-sport/bpc-157-peptide-prohibited/' },
  wada27: { t: 'World Rugby: 2027 List published', u: 'https://www.world.rugby/keep-rugby-clean/news/1048285/wada-publishes-2027-prohibited-list' },
  preprint: { t: 'Mendias & Awan preprint (Apr 2026)', u: 'https://www.preprints.org/manuscript/202604.1748' },
  jmir: { t: 'Ashraf et al., JMIR 2024', u: 'https://jmir.org/2024/1/e65440/PDF' },
  bacLabel: { t: 'Pfizer: Bacteriostatic Water label', u: 'https://labeling.pfizer.com/ShowLabeling.aspx?id=4666' },
  cdcVials: { t: 'CDC: multi-dose vials', u: 'https://www.cdc.gov/injectionsafety/providers/provider_faqs_multivials.html' },
  genscript: { t: 'GenScript: peptide storage (lab guidance)', u: 'https://www.genscript.com/peptide_storage_and_handling.html' },
  doseErr: { t: 'FDA: dosing errors with compounded semaglutide', u: 'https://www.fda.gov/drugs/human-drug-compounding/fda-alerts-health-care-providers-compounders-and-patients-dosing-errors-associated-compounded' },
  cellulitis: { t: 'MedlinePlus: cellulitis', u: 'https://medlineplus.gov/ency/article/000855.htm' },
  abscess: { t: 'MedlinePlus: abscess', u: 'https://medlineplus.gov/ency/article/001353.htm' },
  anaphylaxis: { t: 'MedlinePlus: anaphylaxis', u: 'https://medlineplus.gov/ency/article/000844.htm' },
  sharps: { t: "FDA: sharps disposal do's and don'ts", u: 'https://www.fda.gov/medical-devices/safely-using-sharps-needles-and-syringes-home-work-and-travel/dos-and-donts-proper-sharps-disposal' },
  sharps2: { t: 'FDA: getting rid of used needles', u: 'https://www.fda.gov/medical-devices/safely-using-sharps-needles-and-syringes-home-work-and-travel/best-way-get-rid-used-needles-and-other-sharps' },
} satisfies Record<string, Source>;

/** Oldest first. k: tighten = access narrowed, loosen = widened, next = scheduled or pending. */
export const TIMELINE: TimelineEvent[] = [
  { date: 'Sep 29, 2023', k: 'tighten', title: 'FDA puts popular peptides on its safety-risk list', body: 'About 19 peptides, including BPC-157, TB-500, CJC-1295 and ipamorelin, were placed in Category 2, which bars pharmacies from compounding them. FDA cited immune reactions from impurities and little human safety data.' },
  { date: 'Sep 27, 2024', k: '', title: 'Five peptides leave Category 2, but stay off limits', body: 'Nominations for AOD-9604, CJC-1295, ipamorelin, thymosin alpha-1 and Selank were withdrawn. That took them off the list without making them legal to compound.' },
  { date: 'Oct 2, 2024', k: 'tighten', title: 'Tirzepatide shortage declared over', body: 'FDA confirmed it again on Dec 19, 2024. Pharmacies had to stop making routine copies by March 2025.' },
  { date: 'Oct and Dec 2024', k: 'tighten', title: 'Advisory committee votes against six peptides', body: 'The committee voted against adding ipamorelin, MK-677, kisspeptin-10, CJC-1295, AOD-9604 and thymosin alpha-1 to the list of ingredients pharmacies may use.' },
  { date: 'Feb 21, 2025', k: 'tighten', title: 'Semaglutide shortage declared over', body: 'Routine compounded copies had to stop by May 2025. FDA also says semaglutide sodium and acetate salts are not the approved ingredient.' },
  { date: 'Sep 5, 2025', k: 'tighten', title: 'FDA "green list" for GLP-1 ingredients', body: 'Imported GLP-1 ingredients from facilities FDA has not checked can be held at the border. More than 50 warning letters followed that month.' },
  { date: 'Feb 27, 2026', k: '', title: 'HHS Secretary says about 14 peptides will change status', body: 'Robert F. Kennedy Jr. made the comment on a podcast. A month later HHS gave no timeline.' },
  { date: 'Mar 31, 2026', k: 'tighten', title: 'Warning letters to "research use only" sellers', body: 'FDA said the label does not change a product\'s legal status when dosing guides show it is meant for people, and that bacteriostatic water sold with peptides counts as a drug. Amazon listings for bacteriostatic water disappeared around the same time, without explanation.' },
  { date: 'Apr 15, 2026', k: 'loosen', title: 'FDA takes 12 peptides off its safety-risk list', body: 'BPC-157, KPV, TB-500, MOTS-c, DSIP, Semax and Epitalon were set for review in July. LL-37, dihexa, injectable GHK-Cu, Melanotan II and PEG-MGF were set for a later meeting. None became legal to compound.' },
  { date: 'Apr 30, 2026', k: 'tighten', title: 'FDA moves to keep GLP-1s off outsourcing lists', body: 'It proposed excluding semaglutide, tirzepatide and liraglutide from the list that large outsourcing facilities can compound from.' },
  { date: 'May 5, 2026', k: 'loosen', title: 'Topical GHK-Cu back in Category 1', body: 'Non-injectable GHK-Cu can again be compounded with a prescription. Injectable GHK-Cu still cannot.' },
  { date: 'Jul 23–24, 2026', k: 'loosen', title: 'Advisory committee narrowly backs six peptides', body: 'BPC-157, KPV and TB-500 (8 to 6), MOTS-c (7 to 5), Semax and Epitalon were recommended against the advice of FDA staff, who opposed all seven. DSIP was rejected. The votes are not binding.' },
  { date: 'Jul 23, 2026', k: 'tighten', title: 'Prison sentence for a "research" peptide seller', body: 'A Michigan seller of imported semaglutide and tirzepatide labeled "for research purposes only" was sentenced to 21 months.' },
  { date: 'Aug 27, 2026', k: 'tighten', title: 'Endotoxin reactions from compounded IV glutathione', body: 'FDA reported at least 30 patients with fever, chills, dizziness and shock-like symptoms after glutathione made from a supplement-grade ingredient. Two Texas pharmacies recalled product. The same day, a federal appeals court upheld FDA\'s GLP-1 shortage decisions.' },
  { date: 'Oct 14, 2026', k: 'next', title: 'Interim peptide access policy goes to the White House', body: 'An HHS "Interim Access Policy for Compounding Using Certain Peptides" is under review. Its text is not public and it is not in effect.' },
  { date: 'Jan 1, 2027', k: 'next', title: 'WADA 2027 Prohibited List takes effect', body: 'Peptides stay banned at all times for tested athletes. The status of GLP-1 drugs is unchanged.' },
  { date: 'By end of Feb 2027', k: 'next', title: 'Second advisory committee meeting', body: 'Scheduled to review LL-37, injectable GHK-Cu, dihexa, Melanotan II and PEG-MGF. No date set yet.' },
];

export const TIMELINE_SOURCES: Source[] = [S.cat2, S.reed, S.pcacOct24, S.pcacDec24, S.glp1Policy, S.greenList, S.npr, S.wlMileHigh, S.orrick, S.fedReg, S.ex503b, S.noms, S.ajmc, S.doj, S.glut, S.ca5, S.becker, S.pcacPage, S.wada27];

export const SAFETY: { cards: SafetyCard[]; legalIntro: string; questions: string[]; about: string } = {
  cards: [
    {
      title: 'Signs of infection or a bad reaction',
      tone: 'flag',
      items: [
        'Trouble breathing, wheezing, swelling of the face or tongue, hives, or feeling faint within minutes: call 911 and use epinephrine if you have it. Lie flat with your feet raised. Don\'t wait to see if it improves.',
        'Fever, chills, body aches or dizziness within hours of an injection or infusion can be a reaction to bacterial endotoxin. Get urgent care.',
        'Redness or swelling that keeps spreading, warm skin, red streaks, or fever: contact a clinician the same day. Go to the ER if it spreads fast or you feel very unwell.',
        'A red, raised, painful lump at the site may be an abscess that needs draining. Don\'t squeeze it.',
      ],
      sources: [S.anaphylaxis, S.cellulitis, S.abscess, S.glut],
    },
    {
      title: '"Research use only" is not a loophole',
      tone: 'caution',
      body: 'In 2026 warning letters, FDA said a "research use only" or "not for human consumption" label does not decide a product\'s legal status. Dosing charts, weight-loss claims and forum guides show it is meant for people, which makes it an unapproved drug. FDA also treats bacteriostatic water sold alongside peptides as a drug. Sellers have been prosecuted, including a 21-month sentence in July 2026.',
      sources: [S.wlMileHigh, S.wlGram, S.doj],
    },
    {
      title: 'What testing of online peptides found',
      body: 'An April 2026 analysis of about 6,300 voluntary test reports from 203 vendors (a preprint, not yet peer-reviewed) found 42% failed a pharmacy-style standard of 90 to 110% of the labeled amount and at least 98% purity. The wrong amount was the most common problem. About 10% of TB-500 and 9% of CJC-1295 samples did not contain the labeled peptide. Of the few samples tested for endotoxin, 15% had measurable levels, and purity did not predict it. A separate study of illegal online semaglutide found vials 29 to 39% stronger than labeled, with endotoxin.',
      items: ['A purity percentage on a certificate says nothing about sterility or endotoxin.', 'Because amounts vary, real doses can differ from the math by 5 to 10% or more.'],
      sources: [S.preprint, S.jmir],
    },
    {
      title: 'Even pharmacy products can go wrong',
      body: 'In August 2026 FDA reported at least 30 patients with fever, chills, pain, dizziness and shock-like symptoms after IV glutathione that licensed pharmacies made from a dietary-supplement-grade ingredient. FDA says supplement-grade ingredients are not appropriate for injectables. Ask your pharmacy where its ingredient comes from, and report any reaction to your clinician and to FDA MedWatch.',
      sources: [S.glut, S.glutRecall],
    },
    {
      title: 'Mixing a vial',
      items: [
        'Bacteriostatic water contains 0.9% benzyl alcohol. Its label says it is not for use in newborns.',
        'The preservative slows bacterial growth. It does not sterilize, so it can\'t make up for a contaminated vial or poor technique.',
        'Wash your hands, wipe the vial stopper with alcohol, and use a new sterile needle and syringe every time. Never leave a needle in the stopper.',
        'Label every vial with what it is, its concentration, and the date you mixed it.',
      ],
      sources: [S.bacLabel, S.cdcVials],
    },
    {
      title: 'Syringe math and 10× mistakes',
      body: 'Units on an insulin syringe measure volume, not dose. On a U-100 syringe, 100 units is 1 mL. FDA has reports of people drawing 50 units instead of 5 and getting 5 to 20 times their dose, with vomiting, pancreatitis and hospital stays. The same "10 units" is a different dose in every vial mixed differently. Use a syringe sized for your dose and check the math with your pharmacist.',
      sources: [S.doseErr],
    },
    {
      title: 'Storage and how long a vial lasts',
      items: [
        'Follow the storage directions on your pharmacy label.',
        'For manufactured multi-dose vials, the standard is to discard 28 days after opening unless the maker gives another date.',
        'The bacteriostatic water label says not to store mixed drugs unless the drug\'s maker says you can. Online peptides have no stability data, so "lasts X weeks in the fridge" claims are guesses.',
        'Lab suppliers advise keeping peptide powder frozen and away from light, and avoiding repeated freezing and thawing. That advice is for research labs, not a clinical label.',
      ],
      sources: [S.cdcVials, S.bacLabel, S.genscript],
    },
    {
      title: 'Getting rid of needles',
      items: [
        'Put used needles in a sharps container right away. Use an FDA-cleared one, or a heavy-duty plastic household container with a tight lid.',
        'Never put loose needles in the trash, the toilet, or recycling. Don\'t recap someone else\'s needle.',
        'When it is about three-quarters full, use a pharmacy or hospital drop box, a household hazardous waste site, or a mail-back program.',
        'Safe Needle Disposal: 1-800-643-1643.',
      ],
      sources: [S.sharps, S.sharps2],
    },
    {
      title: 'GLP-1 copies and "generics"',
      body: 'Approved semaglutide (Ozempic, Wegovy) and tirzepatide (Mounjaro, Zepbound) are legal with a prescription. With the shortages over, routine compounded copies ended in 2025 and a federal appeals court upheld FDA in August 2026. Compounding is still allowed only in narrow cases, such as an allergy to an ingredient. No compounded product is a "generic," and salt forms are not the approved ingredient. By May 2026 FDA had about 990 adverse event reports for compounded semaglutide and more than 730 for compounded tirzepatide. Counterfeit pens exist. Retatrutide is still in trials and cannot be compounded.',
      sources: [S.glp1Concerns, S.glp1Policy, S.ca5],
    },
    {
      title: 'For tested athletes and service members',
      body: 'Under the WADA 2026 list, these are banned at all times: BPC-157 (S0); growth hormone releasers such as CJC-1295, sermorelin, tesamorelin, ipamorelin, MK-677, GHRP-2 and GHRP-6, plus AOD-9604 and kisspeptin (S2.2); TB-500, IGF-1 and its analogs, and MGF (S2.3); and MOTS-c (S4.4). Most other unapproved peptides likely fall under the S0 catch-all. Ask USADA before using anything. BPC-157 is also on the US military\'s prohibited ingredient list. The 2027 list takes effect January 1, 2027.',
      sources: [S.wada, S.usada, S.wada27],
    },
  ],
  legalIntro: "A licensed US pharmacy can compound a drug for one person's prescription only from an ingredient that has an official USP standard, is part of an FDA-approved drug, or is on FDA's 503A list. While that list is being built, FDA sorts nominated ingredients into Category 1 (compounding tolerated), Category 2 (significant safety risks, not allowed) and Category 3 (not enough information). Coming off Category 2 does not make an ingredient legal to compound. And none of the research peptides here is FDA-approved: when sold online for people to use, they are unapproved drugs whatever the label says.",
  questions: [
    'Is this FDA-approved for my condition, or is it compounded or off-label?',
    'Which pharmacy makes it, and is it licensed in my state?',
    'For semaglutide or tirzepatide: is this the brand product or a compounded one, and which salt form?',
    'What is my exact dose in mg or mcg, and how many units is that on my syringe?',
    'How do I mix and store it, and how long can I use a vial once it is mixed?',
    'Which side effects mean I should stop, call you, or go to the ER?',
    'Does it interact with my other medicines, birth control, or conditions like pregnancy, diabetes or a history of cancer?',
    'How will we know if it is working, and when will we reassess or stop?',
    'What blood work or other monitoring do I need?',
    'Does the clinic sell this product, and what are my other options?',
    "I'm a drug-tested athlete or in the military. Is this banned for me?",
  ],
  about: `Peptide Ledger is an education and record-keeping tool, not medical advice. Each library entry summarizes published studies, FDA documents, product labels, court records and news reports checked as of ${AS_OF}, with links to its sources. Evidence tiers describe how good the human evidence is, not whether something is safe. US rules are changing quickly: an interim FDA access policy is under White House review and another advisory meeting is due by February 2027, so check the linked sources for anything newer. The app never suggests doses. Where doses appear, they are from an approved label or a published trial. Your log stays in this browser on this device and is never sent to a server.`,
};
