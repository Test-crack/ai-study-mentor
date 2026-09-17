/**
 * Landing-page copy, in English and Malayalam.
 *
 * Scope note: this powers the public landing page only. The authenticated app
 * is untranslated and keeps its own hardcoded strings — do not reach for this
 * module from inside a dashboard or feature screen without first agreeing on a
 * real app-wide i18n setup.
 *
 * Structure: everything here is text. Icons, hrefs, statuses, and the numeric
 * hero metric values live in LandingPage.tsx and are keyed against the objects
 * below, so the two languages can never disagree about where a link points or
 * which icon a card gets.
 *
 * Translation provenance: the Malayalam below was drafted for this page rather
 * than lifted from existing marketing material — it is not a back-translation
 * of anything already published.
 *
 * Register: everyday spoken Malayalam as used in Kerala newspaper and
 * advertising copy, not formal literary translation. Concretely that means
 * short sentences over long subordinate clauses; the words coaching staff
 * actually say ("പേപ്പർ നോക്കുക" for marking, "കൊഴിഞ്ഞുപോകുക" for dropping out,
 * "കുട്ടികൾ" for students) over Sanskritised equivalents; and English loanwords
 * kept where Kerala speech keeps them (ഗ്രാമർ, ടെസ്റ്റ്, ബാച്ച്, ഇൻസ്റ്റിറ്റ്യൂട്ട്,
 * ഡാഷ്ബോർഡ്) rather than replaced with coinages nobody uses. Exam and product
 * nouns (IELTS, Real Band, LexiGrid, WhatsApp, TestCrack, IA, WPM, DCS) stay in
 * Latin script, which is how they are written and said in these contexts.
 *
 * Not reviewed by a native speaker. Worth one pass before any major campaign.
 */

export type LandingLang = 'en' | 'ml';

export const LANDING_LANGS: readonly LandingLang[] = ['en', 'ml'];

/** Label for each language, written in that language. */
export const LANG_LABELS: Record<LandingLang, string> = {
  en: 'English',
  ml: 'മലയാളം',
};

type Feature = { title: string; description: string };

/** Fixed-length tuples so a missing card is a type error, not a blank slot. */
type FourFeatures = [Feature, Feature, Feature, Feature];
type SixFeatures = [Feature, Feature, Feature, Feature, Feature, Feature];
type ThreeFeatures = [Feature, Feature, Feature];

export interface LandingCopy {
  nav: {
    languageGroupLabel: string;
  };
  authProcessing: string;
  hero: {
    eyebrow: string;
    headline: string;
    headlineAccent: string;
    subhead: string;
    requestDemo: string;
    viewDemo: string;
    metrics: { bandLift: string; institutesLive: string; streakRetention: string };
    diagnosticLabel: string;
    realBandLabel: string;
    diagnosticBand: string;
    realBand: string;
    engineCaption: string;
  };
  pains: {
    eyebrow: string;
    headline: string;
    headlineAccent: string;
    subhead: string;
    cards: ThreeFeatures;
  };
  features: {
    headline: string;
    subhead: string;
    tablistLabel: string;
    tabs: { students: string; instructors: string; institutes: string };
    students: FourFeatures;
    instructors: FourFeatures;
    institutes: FourFeatures;
  };
  tools: {
    eyebrow: string;
    headline: string;
    headlineAccent: string;
    subhead: string;
    items: SixFeatures;
  };
  engines: {
    eyebrow: string;
    headline: string;
    headlineAccent: string;
    /** Body splits around a highlighted phrase, so each language picks its own break. */
    bodyBefore: string;
    bodyHighlight: string;
    bodyAfter: string;
    note: string;
    skills: {
      listening: { name: string; level: string };
      reading: { name: string; level: string };
      writing: { name: string; level: string };
      speaking: { name: string; level: string };
    };
  };
  howItWorks: {
    badge: string;
    headline: string;
    headlineAccent: string;
    subhead: string;
    steps: ThreeFeatures;
    footnote: string;
  };
  cta: {
    badge: string;
    headline: string;
    headlineAccent: string;
    subhead: string;
    requestDemo: string;
    pills: { onboarding: string; outreach: string };
  };
  contact: {
    eyebrow: string;
    headline: string;
    headlineAccent: string;
    subhead: string;
    emailLabel: string;
    emailNote: string;
    whatsappLabel: string;
    whatsappNote: string;
    formNudge: string;
  };
  footer: {
    tagline: string;
    description: string;
    location: string;
    columns: {
      platform: {
        heading: string;
        links: {
          diagnosticAssessment: string;
          dailyDrillEngine: string;
          lexigrid: string;
          adaptiveAssessments: string;
          mockTests: string;
          aiScoring: string;
        };
      };
      institutes: {
        heading: string;
        links: {
          commandCenter: string;
          tutorDashboards: string;
          batchReports: string;
          atRiskDetection: string;
          pilotOnboarding: string;
          viewDemo: string;
        };
      };
      company: {
        heading: string;
        links: {
          about: string;
          forStudents: string;
          forTutors: string;
          forInstitutes: string;
          requestDemo: string;
        };
      };
    };
    copyright: string;
    badges: { platformLive: string; keralaFirst: string };
  };
  demoModal: {
    title: string;
    closeLabel: string;
    intro: string;
    fields: {
      name: { label: string; placeholder: string };
      institute: { label: string; placeholder: string };
      city: { label: string; placeholder: string };
      whatsapp: { label: string; placeholder: string };
      email: { label: string; placeholder: string };
    };
    submit: string;
    disclaimer: string;
    sentTitle: string;
    sentBody: string;
    done: string;
  };
}

const EN: LandingCopy = {
  nav: {
    languageGroupLabel: 'Choose page language',
  },
  authProcessing: 'Verifying your account...',
  hero: {
    eyebrow: 'Diagnostic-First IELTS Prep for Institutes',
    headline: "Lift your institute's band score average",
    headlineAccent: 'measurably.',
    subhead:
      "A complete education ecosystem for Kerala's coaching institutes — daily drills students stick to, assessments every three days, and a Real Band score tutors can act on.",
    requestDemo: 'Request Demo',
    viewDemo: 'View Demo',
    metrics: {
      bandLift: 'avg band lift',
      institutesLive: 'institutes live',
      streakRetention: 'streak retention',
    },
    diagnosticLabel: 'Diagnostic',
    realBandLabel: 'Real Band',
    diagnosticBand: 'Band 5.5',
    realBand: 'Band 7.5',
    engineCaption: 'via the TestCrack Engine',
  },
  pains: {
    eyebrow: 'The Industry Challenge',
    headline: 'Hidden roadblocks limiting your',
    headlineAccent: 'growth.',
    subhead:
      "Traditional coaching methods are burning out tutors and capping student outcomes. Here is what is standing in the way of your institute's scale.",
    cards: [
      {
        title: 'Band scores plateau — and nobody knows why',
        description:
          "Without sub-skill data, tutors can't see whether a student is stuck on coherence, grammar, or fluency — so practice stays generic and scores stay flat.",
      },
      {
        title: 'Tutors spend hours marking, not teaching',
        description:
          'Manual essay and speaking corrections eat 40–60% of tutor time — time that could be spent on high-value coaching and intervention.',
      },
      {
        title: 'Students disengage silently before exam day',
        description:
          'Without daily habits and visible progress, students drift away mid-course — and you find out only when they stop showing up. Lost revenue, lost referrals.',
      },
    ],
  },
  features: {
    headline: 'One Platform. Three Wins.',
    subhead:
      'Students build a daily habit, tutors get actionable data, and institute owners get measurable outcomes.',
    tablistLabel: 'Target Audience Features',
    tabs: { students: 'Students', instructors: 'Tutors', institutes: 'Institutes' },
    students: [
      {
        title: 'Diagnostic-First Start',
        description:
          'A one-time, four-skill baseline assessment (Listening, Reading, Writing, Speaking) builds your personal competency matrix — so from day one, you only drill what is actually weak.',
      },
      {
        title: 'Daily Drill Loop + DCS',
        description:
          'Three targeted micro-drills and the LexiGrid vocabulary game every day. Your Daily Competency Score gives you visible proof of progress before you even open a textbook.',
      },
      {
        title: 'Adaptive Internal Assessments',
        description:
          'Every three days, a 40-minute IA tests your two weakest sub-skills at your current band level. AI grades writing and speaking instantly — with feedback, not just a score.',
      },
      {
        title: 'Real Band + Momentum',
        description:
          'Monthly full-length mocks produce a Real Band score you can trust. Momentum points and daily streaks reward consistency — and unlock extra drills and earned mocks.',
      },
    ],
    instructors: [
      {
        title: 'At-Risk Auto Detection',
        description:
          'Rule-based flags from real data — broken streaks, missed internal assessments, declining bands, students stuck before diagnostics. Intervene before they drop, not after.',
      },
      {
        title: 'Live Band Score Table',
        description:
          "Every student's current band vs. target band, gap-sorted, with trend arrows from their last two assessments. Know exactly who needs you this week.",
      },
      {
        title: 'Student Deep Dive',
        description:
          'IA history with sub-skill breakdowns, mock band progression, 14-day drill trends, and sub-skill coverage maps — one page per student, zero spreadsheets.',
      },
      {
        title: 'Zero Manual Marking',
        description:
          'Nine AI scoring engines grade drills, writing tasks, and speaking responses against IELTS band descriptors. You review feedback and coach — the marking is done.',
      },
    ],
    institutes: [
      {
        title: 'Institute Command Center',
        description:
          'Cohort band averages, IA completion rates, engagement health, and goal-achievement segmentation across every batch — in one daily-updated view.',
      },
      {
        title: 'Batch Snapshot Reports',
        description:
          'One-page, printable batch performance summaries: engagement this week, IA results, mock outcomes, and the at-risk list. Ready for parents and stakeholders.',
      },
      {
        title: 'Diagnostic → Outcome Proof',
        description:
          'Show measurable improvement from baseline diagnostic to current Real Band per student and per batch — the proof that sells your institute.',
      },
      {
        title: 'B2B Onboarding + WhatsApp Outreach',
        description:
          "Built for Kerala's coaching ecosystem: structured institute onboarding, role-based access for your team, and WhatsApp nudges for disengaged students. (Outreach in build.)",
      },
    ],
  },
  tools: {
    eyebrow: 'What TestCrack Delivers',
    headline: 'Tools your institute can use',
    headlineAccent: 'today.',
    subhead:
      'Every feature exists for one reason: a daily learning loop students actually complete, with clear, trackable proof for tutors and owners.',
    items: [
      {
        title: 'Diagnostic Assessment Engine',
        description:
          'Every student starts with a four-skill baseline. Band scores and sub-skill breakdowns seed a live competency matrix — so practice is targeted from day one, not generic.',
      },
      {
        title: 'Daily Drill Engine + LexiGrid',
        description:
          'Three daily micro-drills targeting weak sub-skills, plus a daily vocabulary game. The Daily Competency Score gates progress and shows tutors exactly who practised today.',
      },
      {
        title: 'Adaptive Internal Assessments',
        description:
          "A 40-minute assessment every three days, auto-scheduled. Difficulty adapts to the student's current band; missed sessions carry forward so weak skills never slip through.",
      },
      {
        title: 'Monthly Mock Tests + Real Band',
        description:
          'Full IELTS simulations across all four skills, producing a Real Band score updated monthly. Motivated students can earn extra mocks with momentum points.',
      },
      {
        title: 'AI Speaking & Writing Scoring',
        description:
          'Nine scoring engines grade fluency, WPM, filler words, grammar, coherence, task response, and vocabulary against IELTS band descriptors — instantly, with feedback rationale.',
      },
      {
        title: 'Tutor & Institute Dashboards',
        description:
          'Batch engagement pulse, at-risk detection, band overview tables, student deep dives, and institute-level outcome reports — currently in pilot build for partner institutes.',
      },
    ],
  },
  engines: {
    eyebrow: 'Nine Scoring Engines',
    headline: 'From Diagnostic',
    headlineAccent: 'to Real Band.',
    bodyBefore: 'Nine scoring engines grade every drill, assessment, and mock against ',
    bodyHighlight: 'official IELTS band descriptors',
    bodyAfter:
      " — updating each student's live competency matrix after every attempt. No guesswork, no inflated scores.",
    note: 'Scored against IELTS band descriptors, 0–9 scale, rounded to the nearest 0.5.',
    skills: {
      listening: { name: 'Listening', level: 'Accuracy Engine' },
      reading: { name: 'Reading', level: 'Accuracy Engine' },
      writing: { name: 'Writing', level: 'Grammar · Coherence · Task · Vocab' },
      speaking: { name: 'Speaking', level: 'Fluency · WPM · Pronunciation' },
    },
  },
  howItWorks: {
    badge: 'The Learning Loop',
    headline: 'Band improvement, made',
    headlineAccent: 'systematic.',
    subhead:
      'Three connected stages take every student from baseline uncertainty to a Real Band score they — and you — can trust.',
    steps: [
      {
        title: 'Diagnose',
        description:
          'Every student takes a one-time, four-skill baseline assessment on joining. Band scores and sub-skill breakdowns seed their personal competency matrix — so the platform knows exactly where to focus before the first drill.',
      },
      {
        title: 'Drill Daily',
        description:
          'Each day, students complete targeted micro-drills on their weakest sub-skills plus the LexiGrid vocabulary game. Momentum points, daily streaks, and the Daily Competency Score turn practice into a habit — and show tutors who is engaged.',
      },
      {
        title: 'Assess & Prove',
        description:
          'Adaptive Internal Assessments every three days and a full mock test every month keep the competency matrix honest. The Real Band score moves visibly toward the target — measurable proof of progress for students, parents, and your institute.',
      },
    ],
    footnote: 'Diagnostic → Daily Loop → IA → Mock → Real Band. Every step measured.',
  },
  cta: {
    badge: 'Pilot Onboarding Open',
    headline: 'Ready to Lift Your',
    headlineAccent: 'Batch Averages?',
    subhead:
      'Join the Kerala coaching institutes piloting TestCrack — diagnostic-first IELTS prep with measurable outcomes from week one.',
    requestDemo: 'Request Demo',
    pills: {
      onboarding: 'Structured Institute Onboarding',
      outreach: 'WhatsApp-First Outreach',
    },
  },
  contact: {
    eyebrow: 'Get in Touch',
    headline: "We'd love to",
    headlineAccent: 'hear from you.',
    subhead:
      'Reach out directly — whether you have a question, want a walkthrough, or are ready to onboard your institute.',
    emailLabel: 'Email us',
    emailNote:
      'For partnerships, onboarding queries, or general enquiries — we reply within one working day.',
    whatsappLabel: 'WhatsApp us',
    whatsappNote:
      'Fastest way to reach us. Chat directly with the TestCrack team about demos or pilot onboarding.',
    formNudge: 'Or fill out the demo request form',
  },
  footer: {
    tagline: 'for Institutes',
    description:
      "Diagnostic-first IELTS prep for Kerala's coaching institutes. Daily drills students stick to, adaptive assessments every three days, and a Real Band score your tutors can act on.",
    location: 'Kochi, Kerala',
    columns: {
      platform: {
        heading: 'Platform',
        links: {
          diagnosticAssessment: 'Diagnostic Assessment',
          dailyDrillEngine: 'Daily Drill Engine',
          lexigrid: 'LexiGrid Vocabulary',
          adaptiveAssessments: 'Adaptive Assessments',
          mockTests: 'Mock Tests',
          aiScoring: 'AI Scoring Engines',
        },
      },
      institutes: {
        heading: 'Institutes',
        links: {
          commandCenter: 'Command Center',
          tutorDashboards: 'Tutor Dashboards',
          batchReports: 'Batch Reports',
          atRiskDetection: 'At-Risk Detection',
          pilotOnboarding: 'Pilot Onboarding',
          viewDemo: 'View Demo',
        },
      },
      company: {
        heading: 'Company',
        links: {
          about: 'About TestCrack',
          forStudents: 'For Students',
          forTutors: 'For Tutors',
          forInstitutes: 'For Institutes',
          requestDemo: 'Request Demo',
        },
      },
    },
    copyright:
      '© 2026 TestCrack. Diagnostic-first IELTS prep for institutes. All rights reserved.',
    badges: { platformLive: 'Platform Live', keralaFirst: 'Kerala-first EdTech' },
  },
  demoModal: {
    title: 'Request a Demo',
    closeLabel: 'Close demo request',
    intro:
      "Tell us about your institute and we'll reach out on WhatsApp to schedule a walkthrough.",
    fields: {
      name: { label: 'Your Name *', placeholder: 'e.g. Priya Nair' },
      institute: { label: 'Institute Name *', placeholder: 'e.g. Crest IELTS Academy, Kochi' },
      city: { label: 'City', placeholder: 'e.g. Kochi' },
      whatsapp: { label: 'WhatsApp Number *', placeholder: 'e.g. 9876543210' },
      email: { label: 'Email', placeholder: 'e.g. priya@crestielts.in' },
    },
    submit: 'Send via WhatsApp',
    disclaimer:
      'Opens WhatsApp with your details pre-filled — nothing is sent until you press send there.',
    sentTitle: 'Request sent!',
    sentBody:
      "We've opened WhatsApp with your details pre-filled. Hit send there and our team will get back to you within one working day.",
    done: 'Done',
  },
};
const ML: LandingCopy = {
  nav: {
    languageGroupLabel: 'ഭാഷ തിരഞ്ഞെടുക്കുക',
  },
  authProcessing: 'അക്കൗണ്ട് പരിശോധിക്കുന്നു...',
  hero: {
    eyebrow: 'IELTS പരിശീലനം, ഇൻസ്റ്റിറ്റ്യൂട്ടുകൾക്കായി',
    headline: 'നിങ്ങളുടെ ഇൻസ്റ്റിറ്റ്യൂട്ടിന്റെ ബാൻഡ് ശരാശരി ഉയർത്താം —',
    headlineAccent: 'കണക്കുകൾ സഹിതം.',
    subhead:
      'കേരളത്തിലെ കോച്ചിംഗ് സെന്ററുകൾക്കായി ഒരുക്കിയ പൂർണ പ്ലാറ്റ്ഫോം. കുട്ടികൾ മുടങ്ങാതെ ചെയ്യുന്ന ദിവസേനയുള്ള ഡ്രില്ലുകൾ, മൂന്നു ദിവസം കൂടുമ്പോൾ ഒരു ടെസ്റ്റ്, അധ്യാപകർക്ക് നേരിട്ട് ഉപയോഗിക്കാവുന്ന Real Band സ്കോർ.',
    requestDemo: 'ഡെമോ വേണം',
    viewDemo: 'ഡെമോ കാണാം',
    metrics: {
      bandLift: 'ശരാശരി ബാൻഡ് വർധന',
      institutesLive: 'സജീവ ഇൻസ്റ്റിറ്റ്യൂട്ടുകൾ',
      streakRetention: 'സ്ട്രീക്ക് തുടരുന്നവർ',
    },
    diagnosticLabel: 'ഡയഗ്നോസ്റ്റിക്',
    realBandLabel: 'Real Band',
    diagnosticBand: 'ബാൻഡ് 5.5',
    realBand: 'ബാൻഡ് 7.5',
    engineCaption: 'TestCrack എൻജിൻ വഴി',
  },
  pains: {
    eyebrow: 'ഈ മേഖലയിലെ വെല്ലുവിളി',
    headline: 'വളർച്ച മുടക്കുന്ന',
    headlineAccent: 'കാണാത്ത തടസ്സങ്ങൾ.',
    subhead:
      'പഴയ രീതിയിലുള്ള കോച്ചിംഗ് അധ്യാപകരെ തളർത്തുന്നു, കുട്ടികളുടെ ഫലത്തിന് പരിധിയിടുന്നു. നിങ്ങളുടെ ഇൻസ്റ്റിറ്റ്യൂട്ട് വളരാത്തതിന്റെ കാരണം ഇതൊക്കെയാകാം.',
    cards: [
      {
        title: 'ബാൻഡ് സ്കോർ കൂടുന്നില്ല - എന്താ കാരണം എന്ന് ആർക്കും അറിയില്ല.',
        description:
          'ഓരോ സബ്-സ്കില്ലിന്റെയും കണക്കില്ലെങ്കിൽ, കുട്ടി പിന്നിലാകുന്നത് ഗ്രാമറിലാണോ കോഹറൻസിലാണോ ഫ്ലുവൻസിയിലാണോ എന്ന് അധ്യാപകർക്ക് അറിയാൻ വഴിയില്ല. പരിശീലനം പൊതുവായിത്തന്നെ പോകും, സ്കോറും അവിടെത്തന്നെ നിൽക്കും.',
      },
      {
        title: 'ക്ലാസ് എടുക്കുന്നതിലും സമയം അധ്യാപകർ പോകുന്നത് പേപ്പർ നോക്കിയുമാണ്.',
        description:
          'റൈറ്റിംഗും സ്പീക്കിംഗും ഓരോന്നായി തിരുത്തുന്നതിന് അധ്യാപകരുടെ സമയത്തിന്റെ 40–60% പോകുന്നു. ശരിക്കും കുട്ടികൾക്കൊപ്പം ഇരിക്കാൻ ഉപയോഗിക്കാമായിരുന്ന സമയം.',
      },
      {
        title: 'പരീക്ഷ ആകുമ്പോഴേക്കും കുട്ടികൾക്ക് അവരുടെ കോൺഫിഡൻസ് നഷ്ടപ്പെട്ടുപോകുന്നു.',
        description:
          'ദിവസവും ചെയ്യാൻ ഒന്നുമില്ലെങ്കിൽ, പുരോഗതി കണ്ണിൽ കാണുന്നില്ലെങ്കിൽ, കോഴ്സിനിടയ്ക്കുതന്നെ കുട്ടികൾ അകന്നുപോകും. ക്ലാസിൽ വരാതാകുമ്പോഴാണ് നിങ്ങൾ അറിയുന്നത്. ഫീസും പോയി, റഫറലും പോയി.',
      },
    ],
  },
  features: {
    headline: 'ഒറ്റ പ്ലാറ്റ്ഫോം മൂന്ന് റോളുകൾ.',
    subhead:
      'കുട്ടികൾക്ക് ദിവസവും ഒരു ശീലം, അധ്യാപകർക്ക് കൃത്യമായ ഡാറ്റ, ഉടമകൾക്ക് കാണിക്കാൻ പറ്റുന്ന ഫലം.',
    tablistLabel: 'ഓരോ വിഭാഗത്തിനുമുള്ള സൗകര്യങ്ങൾ',
    tabs: { students: 'കുട്ടികൾ', instructors: 'അധ്യാപകർ', institutes: 'ഇൻസ്റ്റിറ്റ്യൂട്ടുകൾ' },
    students: [
      {
        title: 'തുടക്കം ഒരു ഡയഗ്നോസ്റ്റിക് ടെസ്റ്റിൽ',
        description:
          'ചേരുമ്പോൾത്തന്നെ നാല് സ്കില്ലിലും ഒരു ടെസ്റ്റ് (Listening, Reading, Writing, Speaking). അതിൽ നിന്നാണ് നിങ്ങളുടെ കോംപിറ്റൻസി മാട്രിക്സ് ഉണ്ടാകുന്നത്. ആദ്യ ദിവസം മുതൽ പിന്നിലുള്ള ഭാഗം മാത്രം പരിശീലിച്ചാൽ മതി.',
      },
      {
        title: 'ദിവസവും ഡ്രിൽ + DCS',
        description:
          'എല്ലാ ദിവസവും മൂന്ന് ചെറിയ ഡ്രില്ലുകളും LexiGrid വാക്ക് ഗെയിമും. പുസ്തകം തുറക്കുന്നതിനു മുൻപേ Daily Competency Score നിങ്ങളുടെ പുരോഗതി കാണിച്ചുതരും.',
      },
      {
        title: 'അഡാപ്റ്റീവ് ഇന്റേണൽ അസസ്മെന്റ്',
        description:
          'മൂന്നു ദിവസം കൂടുമ്പോൾ 40 മിനിറ്റ് IA. ഇപ്പോഴത്തെ ബാൻഡിൽ ഏറ്റവും പിന്നിലുള്ള രണ്ട് സബ്-സ്കില്ലാണ് ടെസ്റ്റ് ചെയ്യുക. റൈറ്റിംഗും സ്പീക്കിംഗും AI ഉടനെ നോക്കും — സ്കോർ മാത്രമല്ല, എന്തു ചെയ്യണമെന്നും പറയും.',
      },
      {
        title: 'Real Band + മൊമെന്റം',
        description:
          'മാസത്തിലൊരിക്കൽ മുഴുവൻ മോക്ക് ടെസ്റ്റ്. അതിൽ നിന്ന് വിശ്വസിക്കാവുന്ന Real Band സ്കോർ. മുടങ്ങാതെ ചെയ്യുന്നവർക്ക് മൊമെന്റം പോയിന്റും സ്ട്രീക്കും — അധിക ഡ്രില്ലും എക്സ്ട്രാ മോക്കും കിട്ടും.',
      },
    ],
    instructors: [
      {
        title: 'കൊഴിയാൻ സാധ്യതയുള്ളവരെ നേരത്തേ അറിയാം',
        description:
          'സ്ട്രീക്ക് മുറിഞ്ഞവർ, IA ചെയ്യാത്തവർ, ബാൻഡ് താഴുന്നവർ, ഡയഗ്നോസ്റ്റിക് പോലും കഴിഞ്ഞിട്ടില്ലാത്തവർ — എല്ലാം യഥാർഥ ഡാറ്റയിൽ നിന്ന്. കുട്ടി പോയ ശേഷമല്ല, അതിനു മുൻപേ ഇടപെടാം.',
      },
      {
        title: 'ബാൻഡ് സ്കോർ ഒറ്റ നോട്ടത്തിൽ',
        description:
          'ഓരോ കുട്ടിയുടെയും ഇപ്പോഴത്തെ ബാൻഡും ടാർഗറ്റ് ബാൻഡും, വ്യത്യാസത്തിന്റെ ക്രമത്തിൽ. കഴിഞ്ഞ രണ്ട് ടെസ്റ്റിലെ ട്രെൻഡും ഒപ്പം. ഈ ആഴ്ച ആരെയാണ് ശ്രദ്ധിക്കേണ്ടതെന്ന് കൃത്യമായി അറിയാം.',
      },
      {
        title: 'ഓരോ കുട്ടിയുടെയും പൂർണ ചിത്രം',
        description:
          'സബ്-സ്കിൽ തിരിച്ചുള്ള IA ചരിത്രം, മോക്ക് ബാൻഡിന്റെ പുരോഗതി, 14 ദിവസത്തെ ഡ്രിൽ ട്രെൻഡ്, കവർ ചെയ്ത സബ്-സ്കില്ലുകൾ — ഒരു കുട്ടിക്ക് ഒരു പേജ്. എക്സൽ ഷീറ്റ് വേണ്ട.',
      },
      {
        title: 'പേപ്പർ നോക്കൽ ഇനി വേണ്ട',
        description:
          'ഒൻപത് AI എൻജിനുകൾ ഡ്രില്ലും റൈറ്റിംഗ് ടാസ്കും സ്പീക്കിംഗ് ഉത്തരവും IELTS ബാൻഡ് ഡിസ്ക്രിപ്റ്റർ പ്രകാരം നോക്കും. നിങ്ങൾ ഫീഡ്ബാക്ക് വായിച്ച് കുട്ടിയെ പഠിപ്പിച്ചാൽ മതി.',
      },
    ],
    institutes: [
      {
        title: 'ഇൻസ്റ്റിറ്റ്യൂട്ടിന്റെ കമാൻഡ് സെന്റർ',
        description:
          'ഓരോ ബാച്ചിന്റെയും ശരാശരി ബാൻഡ്, IA പൂർത്തിയാക്കിയവരുടെ എണ്ണം, കുട്ടികളുടെ ആക്ടിവിറ്റി, ടാർഗറ്റ് നേടിയവർ — എല്ലാം ദിവസവും അപ്ഡേറ്റ് ആകുന്ന ഒറ്റ സ്ക്രീനിൽ.',
      },
      {
        title: 'ബാച്ച് സ്നാപ്ഷോട്ട് റിപ്പോർട്ട്',
        description:
          'ഒരു പേജിൽ പ്രിന്റെടുക്കാവുന്ന ബാച്ച് റിപ്പോർട്ട്: ഈ ആഴ്ചത്തെ ആക്ടിവിറ്റി, IA ഫലം, മോക്ക് ഫലം, ശ്രദ്ധിക്കേണ്ട കുട്ടികളുടെ പട്ടിക. രക്ഷിതാക്കൾക്ക് കൊടുക്കാൻ പാകത്തിന്.',
      },
      {
        title: 'ഡയഗ്നോസ്റ്റിക് മുതൽ ഫലം വരെ, തെളിവോടെ',
        description:
          'ആദ്യ ഡയഗ്നോസ്റ്റിക് മുതൽ ഇപ്പോഴത്തെ Real Band വരെ ഓരോ കുട്ടിയും ഓരോ ബാച്ചും എത്ര മെച്ചപ്പെട്ടെന്ന് കാണിക്കാം. നിങ്ങളുടെ ഇൻസ്റ്റിറ്റ്യൂട്ടിന്റെ മികവ് തെളിയിക്കുന്ന കണക്ക്.',
      },
      {
        title: 'B2B ഓൺബോർഡിംഗ് + WhatsApp ഔട്ട്‌റീച്ച്',
        description:
          'കേരളത്തിലെ കോച്ചിംഗ് രംഗത്തിനു വേണ്ടി ഉണ്ടാക്കിയത്: ചിട്ടയായ ഓൺബോർഡിംഗ്, ടീമിലെ ഓരോരുത്തർക്കും റോൾ അനുസരിച്ച് ആക്സസ്, മുടക്കുന്ന കുട്ടികൾക്ക് WhatsApp ഓർമപ്പെടുത്തൽ. (ഔട്ട്‌റീച്ച് വരുന്നതേയുള്ളൂ.)',
      },
    ],
  },
  tools: {
    eyebrow: 'TestCrack നൽകുന്നത്',
    headline: 'നിങ്ങളുടെ ഇൻസ്റ്റിറ്റ്യൂട്ടിന്',
    headlineAccent: 'ഇന്നുതന്നെ ഉപയോഗിക്കാം.',
    subhead:
      'ഓരോ ഫീച്ചറിനും ഒറ്റ ലക്ഷ്യം: കുട്ടികൾ ശരിക്കും ചെയ്തുതീർക്കുന്ന ഒരു പഠന ചക്രം. അധ്യാപകർക്കും ഉടമകൾക്കും ട്രാക്ക് ചെയ്യാൻ വ്യക്തമായ കണക്കും.',
    items: [
      {
        title: 'ഡയഗ്നോസ്റ്റിക് അസസ്മെന്റ് എൻജിൻ',
        description:
          'ഓരോ കുട്ടിയും തുടങ്ങുന്നത് നാല് സ്കില്ലിലെയും ഒരു ബേസ്‌ലൈൻ ടെസ്റ്റിൽ. ബാൻഡ് സ്കോറും സബ്-സ്കിൽ കണക്കും ചേർന്ന് ലൈവ് കോംപിറ്റൻസി മാട്രിക്സ് ഉണ്ടാകും. ആദ്യ ദിവസം മുതൽ പരിശീലനം പൊതുവായതല്ല, കൃത്യമായ ലക്ഷ്യത്തോടെയാണ്.',
      },
      {
        title: 'ദിവസേനയുള്ള ഡ്രിൽ എൻജിൻ + LexiGrid',
        description:
          'പിന്നിലുള്ള സബ്-സ്കില്ലുകൾ നോക്കി ദിവസവും മൂന്ന് ചെറിയ ഡ്രില്ലുകൾ, ഒപ്പം ഒരു വാക്ക് ഗെയിമും. Daily Competency Score പുരോഗതി നിയന്ത്രിക്കും, ഇന്ന് ആരൊക്കെ ചെയ്തെന്ന് അധ്യാപകർക്ക് കാണിക്കുകയും ചെയ്യും.',
      },
      {
        title: 'അഡാപ്റ്റീവ് ഇന്റേണൽ അസസ്മെന്റ്',
        description:
          'മൂന്നു ദിവസം കൂടുമ്പോൾ 40 മിനിറ്റ് ടെസ്റ്റ്, തനിയെ ഷെഡ്യൂൾ ആകും. കുട്ടിയുടെ ഇപ്പോഴത്തെ ബാൻഡ് നോക്കി കാഠിന്യം മാറും. ചെയ്യാതെ പോയവ അടുത്ത തവണത്തേക്ക് നീങ്ങും, ഒരു സ്കില്ലും വിട്ടുപോകില്ല.',
      },
      {
        title: 'മാസത്തിലൊരിക്കൽ മോക്ക് ടെസ്റ്റ് + Real Band',
        description:
          'നാല് സ്കില്ലിലും പൂർണമായ IELTS സിമുലേഷൻ. അതിൽ നിന്ന് മാസംതോറും പുതുക്കുന്ന Real Band സ്കോർ. നന്നായി ചെയ്യുന്ന കുട്ടികൾക്ക് മൊമെന്റം പോയിന്റ് കൊടുത്ത് എക്സ്ട്രാ മോക്ക് നേടാം.',
      },
      {
        title: 'AI സ്പീക്കിംഗ് & റൈറ്റിംഗ് സ്കോറിംഗ്',
        description:
          'ഒൻപത് എൻജിനുകൾ ഫ്ലുവൻസി, WPM, ഫില്ലർ വാക്കുകൾ, ഗ്രാമർ, കോഹറൻസ്, ടാസ്ക് റെസ്പോൺസ്, വൊക്കാബുലറി എന്നിവ IELTS ബാൻഡ് ഡിസ്ക്രിപ്റ്റർ പ്രകാരം നോക്കും — ഉടനടി, എന്തുകൊണ്ട് ആ സ്കോർ എന്നതിന്റെ കാരണവും സഹിതം.',
      },
      {
        title: 'അധ്യാപക, ഇൻസ്റ്റിറ്റ്യൂട്ട് ഡാഷ്ബോർഡ്',
        description:
          'ബാച്ചിന്റെ ആക്ടിവിറ്റി, കൊഴിയൽ മുന്നറിയിപ്പ്, ബാൻഡ് പട്ടിക, ഓരോ കുട്ടിയുടെയും വിശദാംശം, ഇൻസ്റ്റിറ്റ്യൂട്ട് തലത്തിലുള്ള റിപ്പോർട്ട് — പങ്കാളി ഇൻസ്റ്റിറ്റ്യൂട്ടുകൾക്കായി ഇപ്പോൾ പൈലറ്റ് ഘട്ടത്തിൽ.',
      },
    ],
  },
  engines: {
    eyebrow: 'ഒൻപത് സ്കോറിംഗ് എൻജിൻ',
    headline: 'ഡയഗ്നോസ്റ്റിക് മുതൽ',
    headlineAccent: 'Real Band വരെ.',
    bodyBefore: 'ഓരോ ഡ്രില്ലും ടെസ്റ്റും മോക്കും ഒൻപത് എൻജിനുകൾ നോക്കുന്നത് ',
    bodyHighlight: 'ഔദ്യോഗിക IELTS ബാൻഡ് ഡിസ്ക്രിപ്റ്റർ',
    bodyAfter:
      ' പ്രകാരമാണ്. ഓരോ തവണയും കുട്ടിയുടെ കോംപിറ്റൻസി മാട്രിക്സ് അപ്ഡേറ്റ് ആകും. ഊഹമില്ല, സ്കോർ പെരുപ്പിച്ചു കാണിക്കലുമില്ല.',
    note: 'IELTS ബാൻഡ് ഡിസ്ക്രിപ്റ്റർ പ്രകാരം, 0–9 സ്കെയിലിൽ, അടുത്ത 0.5-ലേക്ക്.',
    skills: {
      listening: { name: 'Listening', level: 'കൃത്യത എൻജിൻ' },
      reading: { name: 'Reading', level: 'കൃത്യത എൻജിൻ' },
      writing: { name: 'Writing', level: 'ഗ്രാമർ · കോഹറൻസ് · ടാസ്ക് · വൊക്കാബ്' },
      speaking: { name: 'Speaking', level: 'ഫ്ലുവൻസി · WPM · ഉച്ചാരണം' },
    },
  },
  howItWorks: {
    badge: 'പഠന ചക്രം',
    headline: 'ബാൻഡ് ഉയരാൻ ഇനി',
    headlineAccent: 'ഒരു ക്രമമുണ്ട്.',
    subhead:
      'പരസ്പരം ബന്ധിപ്പിച്ച മൂന്ന് ഘട്ടം. തുടക്കത്തിലെ ആശയക്കുഴപ്പത്തിൽ നിന്ന് ഓരോ കുട്ടിയെയും, നിങ്ങൾക്കും അവർക്കും വിശ്വസിക്കാവുന്ന ഒരു Real Band സ്കോറിലേക്ക്.',
    steps: [
      {
        title: 'കണ്ടെത്തുക',
        description:
          'ചേരുമ്പോൾത്തന്നെ നാല് സ്കില്ലിലും ഒരു ടെസ്റ്റ്. ബാൻഡ് സ്കോറും സബ്-സ്കിൽ കണക്കും ചേർന്ന് കുട്ടിയുടെ കോംപിറ്റൻസി മാട്രിക്സ് ഉണ്ടാകും. ആദ്യ ഡ്രില്ലിനു മുൻപേ എവിടെയാണ് ശ്രദ്ധിക്കേണ്ടതെന്ന് പ്ലാറ്റ്ഫോമിന് അറിയാം.',
      },
      {
        title: 'ദിവസവും പരിശീലിക്കുക',
        description:
          'ഏറ്റവും പിന്നിലുള്ള സബ്-സ്കില്ലുകളിൽ ദിവസവും ചെറിയ ഡ്രില്ലുകൾ, ഒപ്പം LexiGrid വാക്ക് ഗെയിം. മൊമെന്റം പോയിന്റും സ്ട്രീക്കും Daily Competency Score-ഉം ചേർന്ന് പരിശീലനം ഒരു ശീലമാകും. ആരൊക്കെ സജീവമാണെന്ന് അധ്യാപകർക്കും കാണാം.',
      },
      {
        title: 'പരിശോധിക്കുക, തെളിയിക്കുക',
        description:
          'മൂന്നു ദിവസം കൂടുമ്പോൾ അഡാപ്റ്റീവ് IA, മാസത്തിലൊരിക്കൽ മുഴുവൻ മോക്ക്. കോംപിറ്റൻസി മാട്രിക്സ് കൃത്യമായി നിൽക്കും. Real Band സ്കോർ ടാർഗറ്റിലേക്ക് നീങ്ങുന്നത് കണ്ണിൽ കാണാം — കുട്ടികൾക്കും രക്ഷിതാക്കൾക്കും നിങ്ങളുടെ ഇൻസ്റ്റിറ്റ്യൂട്ടിനും.',
      },
    ],
    footnote: 'ഡയഗ്നോസ്റ്റിക് → ദിവസവും ഡ്രിൽ → IA → മോക്ക് → Real Band. ഓരോ ഘട്ടത്തിലും കണക്കുണ്ട്.',
  },
  cta: {
    badge: 'പൈലറ്റ് ഓൺബോർഡിംഗ് തുടങ്ങി',
    headline: 'നിങ്ങളുടെ ബാച്ച് ശരാശരി',
    headlineAccent: 'ഉയർത്താൻ തയ്യാറാണോ?',
    subhead:
      'TestCrack പരീക്ഷിക്കുന്ന കേരളത്തിലെ കോച്ചിംഗ് സെന്ററുകൾക്കൊപ്പം ചേരൂ. ആദ്യ ആഴ്ച മുതൽ കണക്കിൽ കാണുന്ന ഫലം.',
    requestDemo: 'ഡെമോ വേണം',
    pills: {
      onboarding: 'ചിട്ടയായ ഓൺബോർഡിംഗ്',
      outreach: 'WhatsApp വഴി നേരിട്ട് ബന്ധപ്പെടൽ',
    },
  },
  contact: {
    eyebrow: 'ബന്ധപ്പെടാം',
    headline: 'കൂടുതൽ വിവരങ്ങൾക്കായി',
    headlineAccent: 'കോൺടാക്ട് ചെയ്യൂ.',
    subhead:
      'ഒരു സംശയമായാലും, ഡെമോ കാണാനായാലും, ഇൻസ്റ്റിറ്റ്യൂട്ട് ചേർക്കാനായാലും — നേരിട്ട് ബന്ധപ്പെടാം.',
    emailLabel: 'ഇമെയിൽ അയക്കൂ',
    emailNote:
      'പങ്കാളിത്തം, ഓൺബോർഡിംഗ്, മറ്റ് സംശയങ്ങൾ — ഒരു പ്രവൃത്തി ദിവസത്തിനകം മറുപടി ഉറപ്പ്.',
    whatsappLabel: 'WhatsApp-ൽ ബന്ധപ്പെടൂ',
    whatsappNote:
      'ഏറ്റവും വേഗം ഞങ്ങളെ കിട്ടുന്ന വഴി. ഡെമോയെക്കുറിച്ചും പൈലറ്റ് ഓൺബോർഡിംഗിനെക്കുറിച്ചും TestCrack ടീമിനോട് നേരിട്ട് ചോദിക്കാം.',
    formNudge: 'അല്ലെങ്കിൽ ഡെമോ ഫോം പൂരിപ്പിക്കൂ',
  },
  footer: {
    tagline: 'ഇൻസ്റ്റിറ്റ്യൂട്ടുകൾക്കായി',
    description:
      'കേരളത്തിലെ കോച്ചിംഗ് സെന്ററുകൾക്കുള്ള IELTS പരിശീലനം, തുടക്കം ഡയഗ്നോസ്റ്റിക്കിൽ. കുട്ടികൾ മുടങ്ങാതെ ചെയ്യുന്ന ദിവസേനയുള്ള ഡ്രില്ലുകൾ, മൂന്നു ദിവസം കൂടുമ്പോൾ അഡാപ്റ്റീവ് ടെസ്റ്റ്, അധ്യാപകർക്ക് നേരിട്ട് ഉപയോഗിക്കാവുന്ന Real Band സ്കോർ.',
    location: 'കൊച്ചി, കേരളം',
    columns: {
      platform: {
        heading: 'പ്ലാറ്റ്ഫോം',
        links: {
          diagnosticAssessment: 'ഡയഗ്നോസ്റ്റിക് അസസ്മെന്റ്',
          dailyDrillEngine: 'ദിവസേനയുള്ള ഡ്രിൽ എൻജിൻ',
          lexigrid: 'LexiGrid വാക്ക് ഗെയിം',
          adaptiveAssessments: 'അഡാപ്റ്റീവ് അസസ്മെന്റ്',
          mockTests: 'മോക്ക് ടെസ്റ്റ്',
          aiScoring: 'AI സ്കോറിംഗ് എൻജിൻ',
        },
      },
      institutes: {
        heading: 'ഇൻസ്റ്റിറ്റ്യൂട്ടുകൾ',
        links: {
          commandCenter: 'കമാൻഡ് സെന്റർ',
          tutorDashboards: 'അധ്യാപക ഡാഷ്ബോർഡ്',
          batchReports: 'ബാച്ച് റിപ്പോർട്ട്',
          atRiskDetection: 'കൊഴിയൽ മുന്നറിയിപ്പ്',
          pilotOnboarding: 'പൈലറ്റ് ഓൺബോർഡിംഗ്',
          viewDemo: 'ഡെമോ കാണാം',
        },
      },
      company: {
        heading: 'കമ്പനി',
        links: {
          about: 'TestCrack-നെക്കുറിച്ച്',
          forStudents: 'കുട്ടികൾക്കായി',
          forTutors: 'അധ്യാപകർക്കായി',
          forInstitutes: 'ഇൻസ്റ്റിറ്റ്യൂട്ടുകൾക്കായി',
          requestDemo: 'ഡെമോ വേണം',
        },
      },
    },
    copyright:
      '© 2026 TestCrack. ഇൻസ്റ്റിറ്റ്യൂട്ടുകൾക്കുള്ള IELTS പരിശീലനം. എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.',
    badges: { platformLive: 'പ്ലാറ്റ്ഫോം സജീവം', keralaFirst: 'കേരളത്തിന്റെ സ്വന്തം എഡ്‌ടെക്' },
  },
  demoModal: {
    title: 'ഡെമോ ബുക്ക് ചെയ്യൂ',
    closeLabel: 'ഡെമോ ഫോം അടയ്ക്കുക',
    intro:
      'നിങ്ങളുടെ ഇൻസ്റ്റിറ്റ്യൂട്ടിനെക്കുറിച്ച് പറയൂ. ഒരു വാക്ക്ത്രൂ ക്രമീകരിക്കാൻ ഞങ്ങൾ WhatsApp-ൽ ബന്ധപ്പെടാം.',
    fields: {
      name: { label: 'നിങ്ങളുടെ പേര് *', placeholder: 'ഉദാ. പ്രിയ നായർ' },
      institute: { label: 'ഇൻസ്റ്റിറ്റ്യൂട്ടിന്റെ പേര് *', placeholder: 'ഉദാ. ക്രെസ്റ്റ് IELTS അക്കാദമി, കൊച്ചി' },
      city: { label: 'സ്ഥലം', placeholder: 'ഉദാ. കൊച്ചി' },
      whatsapp: { label: 'WhatsApp നമ്പർ *', placeholder: 'ഉദാ. 9876543210' },
      email: { label: 'ഇമെയിൽ', placeholder: 'ഉദാ. priya@crestielts.in' },
    },
    submit: 'WhatsApp-ൽ അയക്കൂ',
    disclaimer:
      'നിങ്ങളുടെ വിവരങ്ങൾ ചേർത്ത് WhatsApp തുറക്കും. അവിടെ send അമർത്തുന്നതുവരെ ഒന്നും പോകില്ല.',
    sentTitle: 'അയച്ചു!',
    sentBody:
      'വിവരങ്ങൾ ചേർത്ത് WhatsApp തുറന്നിട്ടുണ്ട്. അവിടെ send അമർത്തൂ. ഒരു പ്രവൃത്തി ദിവസത്തിനകം ഞങ്ങളുടെ ടീം ബന്ധപ്പെടും.',
    done: 'ശരി',
  },
};

export const LANDING_COPY: Record<LandingLang, LandingCopy> = { en: EN, ml: ML };
