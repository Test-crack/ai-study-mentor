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
 * of anything already published. Exam and product nouns (IELTS, Real Band,
 * LexiGrid, WhatsApp, TestCrack, IA, WPM, DCS) are deliberately left in Latin
 * script, which is how they are written and said in Kerala coaching contexts;
 * transliterating them would read as unfamiliar, not as more Malayalam.
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
    languageGroupLabel: 'പേജിന്റെ ഭാഷ തിരഞ്ഞെടുക്കുക',
  },
  authProcessing: 'നിങ്ങളുടെ അക്കൗണ്ട് പരിശോധിക്കുന്നു...',
  hero: {
    eyebrow: 'സ്ഥാപനങ്ങൾക്കായി ഡയഗ്നോസ്റ്റിക്-ഫസ്റ്റ് IELTS പരിശീലനം',
    headline: 'നിങ്ങളുടെ സ്ഥാപനത്തിന്റെ ശരാശരി ബാൻഡ് സ്കോർ ഉയരും —',
    headlineAccent: 'അളക്കാവുന്ന വിധത്തിൽ.',
    subhead:
      'കേരളത്തിലെ കോച്ചിംഗ് സ്ഥാപനങ്ങൾക്കായുള്ള സമ്പൂർണ വിദ്യാഭ്യാസ ഇക്കോസിസ്റ്റം — വിദ്യാർഥികൾ മുടങ്ങാതെ ചെയ്യുന്ന ദൈനംദിന ഡ്രില്ലുകൾ, മൂന്നു ദിവസം കൂടുമ്പോഴുള്ള മൂല്യനിർണയങ്ങൾ, അധ്യാപകർക്ക് പ്രയോജനപ്പെടുത്താവുന്ന Real Band സ്കോർ.',
    requestDemo: 'ഡെമോ ആവശ്യപ്പെടുക',
    viewDemo: 'ഡെമോ കാണുക',
    metrics: {
      bandLift: 'ശരാശരി ബാൻഡ് വർധന',
      institutesLive: 'സജീവ സ്ഥാപനങ്ങൾ',
      streakRetention: 'സ്ട്രീക്ക് നിലനിർത്തൽ',
    },
    diagnosticLabel: 'ഡയഗ്നോസ്റ്റിക്',
    realBandLabel: 'Real Band',
    diagnosticBand: 'ബാൻഡ് 5.5',
    realBand: 'ബാൻഡ് 7.5',
    engineCaption: 'TestCrack എൻജിൻ വഴി',
  },
  pains: {
    eyebrow: 'ഈ രംഗത്തെ വെല്ലുവിളി',
    headline: 'നിങ്ങളുടെ വളർച്ചയെ തടയുന്ന',
    headlineAccent: 'മറഞ്ഞിരിക്കുന്ന പ്രതിബന്ധങ്ങൾ.',
    subhead:
      'പരമ്പരാഗത കോച്ചിംഗ് രീതികൾ അധ്യാപകരെ തളർത്തുകയും വിദ്യാർഥികളുടെ ഫലങ്ങൾക്ക് പരിധി വെക്കുകയും ചെയ്യുന്നു. നിങ്ങളുടെ സ്ഥാപനത്തിന്റെ വളർച്ചയ്ക്ക് തടസ്സമാകുന്നത് ഇതൊക്കെയാണ്.',
    cards: [
      {
        title: 'ബാൻഡ് സ്കോർ ഒരിടത്ത് നിൽക്കുന്നു — കാരണം ആർക്കും അറിയില്ല',
        description:
          'സബ്-സ്കിൽ ഡാറ്റ ഇല്ലാതെ, ഒരു വിദ്യാർഥി കോഹറൻസിലാണോ വ്യാകരണത്തിലാണോ ഫ്ലുവൻസിയിലാണോ പിന്നോട്ടു നിൽക്കുന്നതെന്ന് അധ്യാപകർക്ക് കാണാനാകില്ല — അതുകൊണ്ട് പരിശീലനം പൊതുവായിത്തന്നെ തുടരുന്നു, സ്കോറുകൾ ഉയരുന്നുമില്ല.',
      },
      {
        title: 'അധ്യാപകർ മണിക്കൂറുകൾ ചെലവഴിക്കുന്നത് പഠിപ്പിക്കാനല്ല, മാർക്കിടാനാണ്',
        description:
          'എഴുത്തും സ്പീക്കിംഗും സ്വയം തിരുത്തുന്നത് അധ്യാപകരുടെ സമയത്തിന്റെ 40–60% എടുക്കുന്നു — ഉയർന്ന മൂല്യമുള്ള കോച്ചിംഗിനും ഇടപെടലിനും ഉപയോഗിക്കാമായിരുന്ന സമയം.',
      },
      {
        title: 'പരീക്ഷയ്ക്കു മുൻപേ വിദ്യാർഥികൾ നിശ്ശബ്ദമായി പിൻവാങ്ങുന്നു',
        description:
          'ദൈനംദിന ശീലങ്ങളും കാണാവുന്ന പുരോഗതിയും ഇല്ലെങ്കിൽ വിദ്യാർഥികൾ കോഴ്സിനിടയിൽ അകന്നുപോകുന്നു — അവർ വരാതാകുമ്പോൾ മാത്രമേ നിങ്ങൾ അറിയുന്നുള്ളൂ. നഷ്ടപ്പെടുന്നത് വരുമാനവും റഫറലുകളും.',
      },
    ],
  },
  features: {
    headline: 'ഒരു പ്ലാറ്റ്ഫോം. മൂന്നു നേട്ടങ്ങൾ.',
    subhead:
      'വിദ്യാർഥികൾക്ക് ദൈനംദിന ശീലം, അധ്യാപകർക്ക് പ്രയോജനപ്പെടുത്താവുന്ന ഡാറ്റ, സ്ഥാപന ഉടമകൾക്ക് അളക്കാവുന്ന ഫലങ്ങൾ.',
    tablistLabel: 'ഓരോ വിഭാഗത്തിനുമുള്ള സവിശേഷതകൾ',
    tabs: { students: 'വിദ്യാർഥികൾ', instructors: 'അധ്യാപകർ', institutes: 'സ്ഥാപനങ്ങൾ' },
    students: [
      {
        title: 'ഡയഗ്നോസ്റ്റിക്കോടെ തുടക്കം',
        description:
          'ഒറ്റത്തവണ നടത്തുന്ന നാല് സ്കിൽ ബേസ്‌ലൈൻ അസസ്മെന്റ് (Listening, Reading, Writing, Speaking) നിങ്ങളുടെ വ്യക്തിഗത കോംപിറ്റൻസി മാട്രിക്സ് തയ്യാറാക്കുന്നു — അതിനാൽ ആദ്യ ദിവസം മുതൽ ദുർബലമായ ഭാഗങ്ങൾ മാത്രം പരിശീലിച്ചാൽ മതി.',
      },
      {
        title: 'ദൈനംദിന ഡ്രിൽ ലൂപ്പ് + DCS',
        description:
          'എല്ലാ ദിവസവും ലക്ഷ്യബോധമുള്ള മൂന്ന് മൈക്രോ-ഡ്രില്ലുകളും LexiGrid പദസമ്പത്ത് ഗെയിമും. ഒരു പാഠപുസ്തകം തുറക്കുന്നതിനു മുൻപേ നിങ്ങളുടെ Daily Competency Score പുരോഗതിയുടെ വ്യക്തമായ തെളിവു നൽകുന്നു.',
      },
      {
        title: 'അഡാപ്റ്റീവ് ഇന്റേണൽ അസസ്മെന്റുകൾ',
        description:
          'മൂന്നു ദിവസം കൂടുമ്പോൾ, 40 മിനിറ്റ് ദൈർഘ്യമുള്ള ഒരു IA നിങ്ങളുടെ നിലവിലെ ബാൻഡ് നിലവാരത്തിൽ ഏറ്റവും ദുർബലമായ രണ്ട് സബ്-സ്കില്ലുകൾ പരിശോധിക്കുന്നു. എഴുത്തും സ്പീക്കിംഗും AI ഉടനടി വിലയിരുത്തുന്നു — വെറും സ്കോർ മാത്രമല്ല, ഫീഡ്ബാക്കും.',
      },
      {
        title: 'Real Band + മൊമെന്റം',
        description:
          'മാസംതോറുമുള്ള മുഴുനീള മോക്ക് ടെസ്റ്റുകൾ വിശ്വസിക്കാവുന്ന ഒരു Real Band സ്കോർ നൽകുന്നു. മൊമെന്റം പോയിന്റുകളും ദൈനംദിന സ്ട്രീക്കുകളും സ്ഥിരതയ്ക്ക് പ്രതിഫലം നൽകുന്നു — കൂടുതൽ ഡ്രില്ലുകളും അധിക മോക്ക് ടെസ്റ്റുകളും തുറന്നുകിട്ടും.',
      },
    ],
    instructors: [
      {
        title: 'റിസ്കിലുള്ളവരെ സ്വയം കണ്ടെത്തൽ',
        description:
          'യഥാർഥ ഡാറ്റയിൽ നിന്നുള്ള നിയമാധിഷ്ഠിത സൂചനകൾ — മുറിഞ്ഞ സ്ട്രീക്കുകൾ, ചെയ്യാതെ പോയ ഇന്റേണൽ അസസ്മെന്റുകൾ, താഴുന്ന ബാൻഡുകൾ, ഡയഗ്നോസ്റ്റിക് കഴിയാതെ നിൽക്കുന്ന വിദ്യാർഥികൾ. അവർ കൊഴിഞ്ഞുപോയ ശേഷമല്ല, അതിനു മുൻപേ ഇടപെടുക.',
      },
      {
        title: 'ലൈവ് ബാൻഡ് സ്കോർ പട്ടിക',
        description:
          'ഓരോ വിദ്യാർഥിയുടെയും നിലവിലെ ബാൻഡും ലക്ഷ്യ ബാൻഡും, വ്യത്യാസത്തിന്റെ ക്രമത്തിൽ, അവസാന രണ്ട് അസസ്മെന്റുകളിൽ നിന്നുള്ള ട്രെൻഡ് സൂചികകളോടെ. ഈ ആഴ്ച ആർക്കാണ് നിങ്ങളുടെ സഹായം വേണ്ടതെന്ന് കൃത്യമായി അറിയാം.',
      },
      {
        title: 'വിദ്യാർഥിയുടെ വിശദ ചിത്രം',
        description:
          'സബ്-സ്കിൽ വിശകലനത്തോടെയുള്ള IA ചരിത്രം, മോക്ക് ബാൻഡ് പുരോഗതി, 14 ദിവസത്തെ ഡ്രിൽ ട്രെൻഡുകൾ, സബ്-സ്കിൽ കവറേജ് മാപ്പുകൾ — ഓരോ വിദ്യാർഥിക്കും ഒരു പേജ്, സ്പ്രെഡ്ഷീറ്റുകൾ ഒന്നുമില്ല.',
      },
      {
        title: 'സ്വയം മാർക്കിടേണ്ട ആവശ്യമില്ല',
        description:
          'ഒൻപത് AI സ്കോറിംഗ് എൻജിനുകൾ ഡ്രില്ലുകളും റൈറ്റിംഗ് ടാസ്കുകളും സ്പീക്കിംഗ് ഉത്തരങ്ങളും IELTS ബാൻഡ് ഡിസ്ക്രിപ്റ്ററുകൾ അനുസരിച്ച് വിലയിരുത്തുന്നു. നിങ്ങൾ ഫീഡ്ബാക്ക് പരിശോധിച്ച് പരിശീലനം നൽകിയാൽ മതി — മാർക്കിടൽ പൂർത്തിയായിക്കഴിഞ്ഞു.',
      },
    ],
    institutes: [
      {
        title: 'സ്ഥാപനത്തിന്റെ കമാൻഡ് സെന്റർ',
        description:
          'ബാച്ച് തിരിച്ചുള്ള ശരാശരി ബാൻഡ്, IA പൂർത്തീകരണ നിരക്ക്, ഇടപഴകലിന്റെ നില, ലക്ഷ്യം നേടിയവരുടെ വിഭജനം — എല്ലാം ദിവസേന പുതുക്കുന്ന ഒറ്റ കാഴ്ചയിൽ.',
      },
      {
        title: 'ബാച്ച് സ്നാപ്ഷോട്ട് റിപ്പോർട്ടുകൾ',
        description:
          'ഒരു പേജിൽ പ്രിന്റെടുക്കാവുന്ന ബാച്ച് പ്രകടന സംഗ്രഹം: ഈ ആഴ്ചത്തെ ഇടപഴകൽ, IA ഫലങ്ങൾ, മോക്ക് ഫലങ്ങൾ, റിസ്കിലുള്ളവരുടെ പട്ടിക. രക്ഷിതാക്കൾക്കും പങ്കാളികൾക്കും നൽകാൻ തയ്യാർ.',
      },
      {
        title: 'ഡയഗ്നോസ്റ്റിക് → ഫലത്തിന്റെ തെളിവ്',
        description:
          'ബേസ്‌ലൈൻ ഡയഗ്നോസ്റ്റിക് മുതൽ ഇപ്പോഴത്തെ Real Band വരെയുള്ള അളക്കാവുന്ന പുരോഗതി ഓരോ വിദ്യാർഥിക്കും ഓരോ ബാച്ചിനും കാണിക്കുക — നിങ്ങളുടെ സ്ഥാപനത്തിന്റെ മികവ് തെളിയിക്കുന്ന രേഖ.',
      },
      {
        title: 'B2B ഓൺബോർഡിംഗ് + WhatsApp ഔട്ട്‌റീച്ച്',
        description:
          'കേരളത്തിലെ കോച്ചിംഗ് രംഗത്തിനായി തയ്യാറാക്കിയത്: ചിട്ടയായ സ്ഥാപന ഓൺബോർഡിംഗ്, നിങ്ങളുടെ ടീമിന് റോൾ അടിസ്ഥാനമാക്കിയ ആക്സസ്, സജീവമല്ലാത്ത വിദ്യാർഥികൾക്ക് WhatsApp ഓർമപ്പെടുത്തലുകൾ. (ഔട്ട്‌റീച്ച് വികസന ഘട്ടത്തിൽ.)',
      },
    ],
  },
  tools: {
    eyebrow: 'TestCrack നൽകുന്നത്',
    headline: 'നിങ്ങളുടെ സ്ഥാപനത്തിന്',
    headlineAccent: 'ഇന്നുതന്നെ ഉപയോഗിക്കാവുന്ന ടൂളുകൾ.',
    subhead:
      'ഓരോ സവിശേഷതയ്ക്കും ഒരു കാരണമേയുള്ളൂ: വിദ്യാർഥികൾ ശരിക്കും പൂർത്തിയാക്കുന്ന ഒരു ദൈനംദിന പഠന ലൂപ്പ്, അധ്യാപകർക്കും ഉടമകൾക്കും വ്യക്തവും ട്രാക്ക് ചെയ്യാവുന്നതുമായ തെളിവുകളോടെ.',
    items: [
      {
        title: 'ഡയഗ്നോസ്റ്റിക് അസസ്മെന്റ് എൻജിൻ',
        description:
          'ഓരോ വിദ്യാർഥിയും നാല് സ്കിൽ ബേസ്‌ലൈനിൽ നിന്നാണ് തുടങ്ങുന്നത്. ബാൻഡ് സ്കോറുകളും സബ്-സ്കിൽ വിശകലനവും ചേർന്ന് ഒരു ലൈവ് കോംപിറ്റൻസി മാട്രിക്സ് രൂപപ്പെടുത്തുന്നു — അതിനാൽ ആദ്യ ദിവസം മുതൽ പരിശീലനം പൊതുവായതല്ല, ലക്ഷ്യബോധമുള്ളതാണ്.',
      },
      {
        title: 'ദൈനംദിന ഡ്രിൽ എൻജിൻ + LexiGrid',
        description:
          'ദുർബലമായ സബ്-സ്കില്ലുകൾ ലക്ഷ്യമിട്ട് ദിവസേന മൂന്ന് മൈക്രോ-ഡ്രില്ലുകൾ, ഒപ്പം ഒരു പദസമ്പത്ത് ഗെയിമും. Daily Competency Score പുരോഗതി നിയന്ത്രിക്കുകയും ഇന്ന് ആരൊക്കെ പരിശീലിച്ചെന്ന് അധ്യാപകർക്ക് കൃത്യമായി കാണിക്കുകയും ചെയ്യുന്നു.',
      },
      {
        title: 'അഡാപ്റ്റീവ് ഇന്റേണൽ അസസ്മെന്റുകൾ',
        description:
          'മൂന്നു ദിവസം കൂടുമ്പോൾ 40 മിനിറ്റ് അസസ്മെന്റ്, സ്വയം ഷെഡ്യൂൾ ചെയ്യപ്പെടുന്നു. വിദ്യാർഥിയുടെ നിലവിലെ ബാൻഡിന് അനുസരിച്ച് കാഠിന്യം ക്രമീകരിക്കുന്നു; ചെയ്യാതെ പോയവ അടുത്ത തവണത്തേക്ക് നീങ്ങുന്നതിനാൽ ദുർബലമായ സ്കില്ലുകൾ ഒരിക്കലും വിട്ടുപോകില്ല.',
      },
      {
        title: 'മാസംതോറുമുള്ള മോക്ക് ടെസ്റ്റുകൾ + Real Band',
        description:
          'നാല് സ്കില്ലുകളിലും പൂർണമായ IELTS സിമുലേഷനുകൾ, മാസംതോറും പുതുക്കുന്ന Real Band സ്കോർ നൽകുന്നു. താൽപര്യമുള്ള വിദ്യാർഥികൾക്ക് മൊമെന്റം പോയിന്റുകൾ ഉപയോഗിച്ച് അധിക മോക്ക് ടെസ്റ്റുകൾ നേടാം.',
      },
      {
        title: 'AI സ്പീക്കിംഗ് & റൈറ്റിംഗ് സ്കോറിംഗ്',
        description:
          'ഒൻപത് സ്കോറിംഗ് എൻജിനുകൾ ഫ്ലുവൻസി, WPM, ഫില്ലർ വാക്കുകൾ, വ്യാകരണം, കോഹറൻസ്, ടാസ്ക് റെസ്പോൺസ്, പദസമ്പത്ത് എന്നിവ IELTS ബാൻഡ് ഡിസ്ക്രിപ്റ്ററുകൾ അനുസരിച്ച് വിലയിരുത്തുന്നു — ഉടനടി, ഫീഡ്ബാക്കിന്റെ കാരണവും സഹിതം.',
      },
      {
        title: 'അധ്യാപക, സ്ഥാപന ഡാഷ്ബോർഡുകൾ',
        description:
          'ബാച്ചിന്റെ ഇടപഴകൽ നില, റിസ്ക് കണ്ടെത്തൽ, ബാൻഡ് അവലോകന പട്ടികകൾ, വിദ്യാർഥികളുടെ വിശദ ചിത്രം, സ്ഥാപനതല ഫല റിപ്പോർട്ടുകൾ — പങ്കാളി സ്ഥാപനങ്ങൾക്കായി നിലവിൽ പൈലറ്റ് ഘട്ടത്തിൽ.',
      },
    ],
  },
  engines: {
    eyebrow: 'ഒൻപത് സ്കോറിംഗ് എൻജിനുകൾ',
    headline: 'ഡയഗ്നോസ്റ്റിക് മുതൽ',
    headlineAccent: 'Real Band വരെ.',
    bodyBefore: 'ഒൻപത് സ്കോറിംഗ് എൻജിനുകൾ ഓരോ ഡ്രില്ലും അസസ്മെന്റും മോക്കും ',
    bodyHighlight: 'ഔദ്യോഗിക IELTS ബാൻഡ് ഡിസ്ക്രിപ്റ്ററുകൾ',
    bodyAfter:
      ' അനുസരിച്ച് വിലയിരുത്തുന്നു — ഓരോ ശ്രമത്തിനുശേഷവും ഓരോ വിദ്യാർഥിയുടെയും ലൈവ് കോംപിറ്റൻസി മാട്രിക്സ് പുതുക്കുന്നു. ഊഹങ്ങളില്ല, പെരുപ്പിച്ച സ്കോറുകളുമില്ല.',
    note: 'IELTS ബാൻഡ് ഡിസ്ക്രിപ്റ്ററുകൾ അനുസരിച്ച്, 0–9 സ്കെയിലിൽ, ഏറ്റവും അടുത്ത 0.5-ലേക്ക് ക്രമപ്പെടുത്തി.',
    skills: {
      listening: { name: 'Listening', level: 'കൃത്യതാ എൻജിൻ' },
      reading: { name: 'Reading', level: 'കൃത്യതാ എൻജിൻ' },
      writing: { name: 'Writing', level: 'വ്യാകരണം · കോഹറൻസ് · ടാസ്ക് · പദസമ്പത്ത്' },
      speaking: { name: 'Speaking', level: 'ഫ്ലുവൻസി · WPM · ഉച്ചാരണം' },
    },
  },
  howItWorks: {
    badge: 'പഠന ലൂപ്പ്',
    headline: 'ബാൻഡ് പുരോഗതി, ഇനി',
    headlineAccent: 'ചിട്ടയോടെ.',
    subhead:
      'പരസ്പരം ബന്ധിപ്പിച്ച മൂന്ന് ഘട്ടങ്ങൾ ഓരോ വിദ്യാർഥിയെയും തുടക്കത്തിലെ അനിശ്ചിതത്വത്തിൽ നിന്ന് അവർക്കും നിങ്ങൾക്കും വിശ്വസിക്കാവുന്ന ഒരു Real Band സ്കോറിലേക്ക് എത്തിക്കുന്നു.',
    steps: [
      {
        title: 'കണ്ടെത്തുക',
        description:
          'ചേരുമ്പോൾത്തന്നെ ഓരോ വിദ്യാർഥിയും ഒറ്റത്തവണത്തെ നാല് സ്കിൽ ബേസ്‌ലൈൻ അസസ്മെന്റ് ചെയ്യുന്നു. ബാൻഡ് സ്കോറുകളും സബ്-സ്കിൽ വിശകലനവും അവരുടെ വ്യക്തിഗത കോംപിറ്റൻസി മാട്രിക്സിന് അടിത്തറയിടുന്നു — അതിനാൽ ആദ്യ ഡ്രില്ലിനു മുൻപുതന്നെ എവിടെയാണ് ശ്രദ്ധ വേണ്ടതെന്ന് പ്ലാറ്റ്ഫോമിന് അറിയാം.',
      },
      {
        title: 'ദിവസവും പരിശീലിക്കുക',
        description:
          'ഓരോ ദിവസവും വിദ്യാർഥികൾ തങ്ങളുടെ ഏറ്റവും ദുർബലമായ സബ്-സ്കില്ലുകളിൽ ലക്ഷ്യബോധമുള്ള മൈക്രോ-ഡ്രില്ലുകളും LexiGrid പദസമ്പത്ത് ഗെയിമും പൂർത്തിയാക്കുന്നു. മൊമെന്റം പോയിന്റുകളും ദൈനംദിന സ്ട്രീക്കുകളും Daily Competency Score-ഉം പരിശീലനത്തെ ഒരു ശീലമാക്കി മാറ്റുന്നു — ആരൊക്കെ സജീവമാണെന്ന് അധ്യാപകർക്ക് കാണിക്കുകയും ചെയ്യുന്നു.',
      },
      {
        title: 'വിലയിരുത്തുക, തെളിയിക്കുക',
        description:
          'മൂന്നു ദിവസം കൂടുമ്പോഴുള്ള അഡാപ്റ്റീവ് ഇന്റേണൽ അസസ്മെന്റുകളും മാസംതോറുമുള്ള മുഴുനീള മോക്ക് ടെസ്റ്റും കോംപിറ്റൻസി മാട്രിക്സിനെ കൃത്യമായി നിലനിർത്തുന്നു. Real Band സ്കോർ ലക്ഷ്യത്തിലേക്ക് പ്രകടമായി നീങ്ങുന്നു — വിദ്യാർഥികൾക്കും രക്ഷിതാക്കൾക്കും നിങ്ങളുടെ സ്ഥാപനത്തിനും അളക്കാവുന്ന തെളിവ്.',
      },
    ],
    footnote: 'ഡയഗ്നോസ്റ്റിക് → ദൈനംദിന ലൂപ്പ് → IA → മോക്ക് → Real Band. ഓരോ ഘട്ടവും അളക്കപ്പെടുന്നു.',
  },
  cta: {
    badge: 'പൈലറ്റ് ഓൺബോർഡിംഗ് ആരംഭിച്ചു',
    headline: 'നിങ്ങളുടെ ബാച്ച് ശരാശരി',
    headlineAccent: 'ഉയർത്താൻ തയ്യാറാണോ?',
    subhead:
      'TestCrack പൈലറ്റ് ചെയ്യുന്ന കേരളത്തിലെ കോച്ചിംഗ് സ്ഥാപനങ്ങൾക്കൊപ്പം ചേരുക — ആദ്യ ആഴ്ച മുതൽ അളക്കാവുന്ന ഫലങ്ങൾ നൽകുന്ന ഡയഗ്നോസ്റ്റിക്-ഫസ്റ്റ് IELTS പരിശീലനം.',
    requestDemo: 'ഡെമോ ആവശ്യപ്പെടുക',
    pills: {
      onboarding: 'ചിട്ടയായ സ്ഥാപന ഓൺബോർഡിംഗ്',
      outreach: 'WhatsApp മുൻനിർത്തിയുള്ള ഔട്ട്‌റീച്ച്',
    },
  },
  contact: {
    eyebrow: 'ബന്ധപ്പെടുക',
    headline: 'നിങ്ങളിൽ നിന്ന്',
    headlineAccent: 'കേൾക്കാൻ ഞങ്ങൾക്ക് സന്തോഷം.',
    subhead:
      'നേരിട്ട് ബന്ധപ്പെടാം — ഒരു സംശയമുണ്ടെങ്കിലും, ഒരു വാക്ക്ത്രൂ വേണമെങ്കിലും, നിങ്ങളുടെ സ്ഥാപനം ഓൺബോർഡ് ചെയ്യാൻ തയ്യാറാണെങ്കിലും.',
    emailLabel: 'ഞങ്ങൾക്ക് ഇമെയിൽ അയക്കുക',
    emailNote:
      'പങ്കാളിത്തം, ഓൺബോർഡിംഗ് സംബന്ധമായ സംശയങ്ങൾ, പൊതുവായ അന്വേഷണങ്ങൾ — ഒരു പ്രവൃത്തി ദിവസത്തിനകം ഞങ്ങൾ മറുപടി നൽകും.',
    whatsappLabel: 'WhatsApp-ൽ ബന്ധപ്പെടുക',
    whatsappNote:
      'ഞങ്ങളെ ബന്ധപ്പെടാനുള്ള ഏറ്റവും വേഗമേറിയ വഴി. ഡെമോ, പൈലറ്റ് ഓൺബോർഡിംഗ് എന്നിവയെക്കുറിച്ച് TestCrack ടീമുമായി നേരിട്ട് സംസാരിക്കാം.',
    formNudge: 'അല്ലെങ്കിൽ ഡെമോ അഭ്യർഥന ഫോം പൂരിപ്പിക്കുക',
  },
  footer: {
    tagline: 'സ്ഥാപനങ്ങൾക്കായി',
    description:
      'കേരളത്തിലെ കോച്ചിംഗ് സ്ഥാപനങ്ങൾക്കായുള്ള ഡയഗ്നോസ്റ്റിക്-ഫസ്റ്റ് IELTS പരിശീലനം. വിദ്യാർഥികൾ മുടങ്ങാതെ ചെയ്യുന്ന ദൈനംദിന ഡ്രില്ലുകൾ, മൂന്നു ദിവസം കൂടുമ്പോഴുള്ള അഡാപ്റ്റീവ് അസസ്മെന്റുകൾ, നിങ്ങളുടെ അധ്യാപകർക്ക് പ്രയോജനപ്പെടുത്താവുന്ന Real Band സ്കോർ.',
    location: 'കൊച്ചി, കേരളം',
    columns: {
      platform: {
        heading: 'പ്ലാറ്റ്ഫോം',
        links: {
          diagnosticAssessment: 'ഡയഗ്നോസ്റ്റിക് അസസ്മെന്റ്',
          dailyDrillEngine: 'ദൈനംദിന ഡ്രിൽ എൻജിൻ',
          lexigrid: 'LexiGrid പദസമ്പത്ത്',
          adaptiveAssessments: 'അഡാപ്റ്റീവ് അസസ്മെന്റുകൾ',
          mockTests: 'മോക്ക് ടെസ്റ്റുകൾ',
          aiScoring: 'AI സ്കോറിംഗ് എൻജിനുകൾ',
        },
      },
      institutes: {
        heading: 'സ്ഥാപനങ്ങൾ',
        links: {
          commandCenter: 'കമാൻഡ് സെന്റർ',
          tutorDashboards: 'അധ്യാപക ഡാഷ്ബോർഡുകൾ',
          batchReports: 'ബാച്ച് റിപ്പോർട്ടുകൾ',
          atRiskDetection: 'റിസ്ക് കണ്ടെത്തൽ',
          pilotOnboarding: 'പൈലറ്റ് ഓൺബോർഡിംഗ്',
          viewDemo: 'ഡെമോ കാണുക',
        },
      },
      company: {
        heading: 'കമ്പനി',
        links: {
          about: 'TestCrack-നെക്കുറിച്ച്',
          forStudents: 'വിദ്യാർഥികൾക്കായി',
          forTutors: 'അധ്യാപകർക്കായി',
          forInstitutes: 'സ്ഥാപനങ്ങൾക്കായി',
          requestDemo: 'ഡെമോ ആവശ്യപ്പെടുക',
        },
      },
    },
    copyright:
      '© 2026 TestCrack. സ്ഥാപനങ്ങൾക്കായുള്ള ഡയഗ്നോസ്റ്റിക്-ഫസ്റ്റ് IELTS പരിശീലനം. എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തം.',
    badges: { platformLive: 'പ്ലാറ്റ്ഫോം സജീവം', keralaFirst: 'കേരളം മുൻനിർത്തിയുള്ള എഡ്‌ടെക്' },
  },
  demoModal: {
    title: 'ഡെമോ അഭ്യർഥിക്കുക',
    closeLabel: 'ഡെമോ അഭ്യർഥന അടയ്ക്കുക',
    intro:
      'നിങ്ങളുടെ സ്ഥാപനത്തെക്കുറിച്ച് പറയൂ, ഒരു വാക്ക്ത്രൂ ക്രമീകരിക്കാൻ ഞങ്ങൾ WhatsApp-ൽ ബന്ധപ്പെടാം.',
    fields: {
      name: { label: 'നിങ്ങളുടെ പേര് *', placeholder: 'ഉദാ. പ്രിയ നായർ' },
      institute: { label: 'സ്ഥാപനത്തിന്റെ പേര് *', placeholder: 'ഉദാ. ക്രെസ്റ്റ് IELTS അക്കാദമി, കൊച്ചി' },
      city: { label: 'നഗരം', placeholder: 'ഉദാ. കൊച്ചി' },
      whatsapp: { label: 'WhatsApp നമ്പർ *', placeholder: 'ഉദാ. 9876543210' },
      email: { label: 'ഇമെയിൽ', placeholder: 'ഉദാ. priya@crestielts.in' },
    },
    submit: 'WhatsApp വഴി അയക്കുക',
    disclaimer:
      'നിങ്ങളുടെ വിവരങ്ങൾ ചേർത്ത് WhatsApp തുറക്കും — അവിടെ അയയ്ക്കുക അമർത്തുന്നതുവരെ ഒന്നും അയക്കില്ല.',
    sentTitle: 'അഭ്യർഥന അയച്ചു!',
    sentBody:
      'നിങ്ങളുടെ വിവരങ്ങൾ ചേർത്ത് WhatsApp തുറന്നിട്ടുണ്ട്. അവിടെ അയയ്ക്കുക, ഒരു പ്രവൃത്തി ദിവസത്തിനകം ഞങ്ങളുടെ ടീം നിങ്ങളെ ബന്ധപ്പെടും.',
    done: 'പൂർത്തിയായി',
  },
};

export const LANDING_COPY: Record<LandingLang, LandingCopy> = { en: EN, ml: ML };
