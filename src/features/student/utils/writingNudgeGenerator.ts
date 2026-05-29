// ─────────────────────────────────────────────────────────────────────────────
// FILE LOCATION: src/features/student/utils/writingNudgeGenerator.ts
// CREATE THIS FILE — it does not exist yet.
// ─────────────────────────────────────────────────────────────────────────────

export interface LocalNudge {
  nudge:           string;
  sentence_frame:  string;
  punctuation_tip: string | null;
}

const TOPIC_NUDGE_POOLS: Array<{
  keywords: string[];
  nudges: Array<{ nudge: string; sentence_frame: string }>;
}> = [
  {
    keywords: ['education', 'school', 'learning', 'university', 'student', 'academic', 'funding'],
    nudges: [
      {
        nudge: "Good start — you've introduced your position clearly. Now think about WHY education matters beyond the statement itself. Consider expanding on the long-term societal impact: how does investing in education change economic outcomes for a country over a generation?",
        sentence_frame: "In the long run, a well-educated population tends to... which in turn leads to...",
      },
      {
        nudge: "You're building your argument well. One thing to strengthen it: give a concrete example — a country, a policy, or a statistic. Examiners reward task response that moves from opinion to evidence.",
        sentence_frame: "For instance, countries such as Finland, which heavily invest in education, have demonstrated that...",
      },
      {
        nudge: "Nice progress. Your body paragraph needs a counterargument to show balance. Briefly acknowledge the opposing view before returning to your position — this signals analytical thinking to the examiner.",
        sentence_frame: "While some may argue that sports and recreation are equally vital for..., this view overlooks the fact that...",
      },
    ],
  },
  {
    keywords: ['sport', 'sports', 'recreation', 'fitness', 'health', 'exercise', 'physical', 'athlete'],
    nudges: [
      {
        nudge: "You're making a solid point about health. Now push further — what specific outcomes does sport investment produce? Think about mental health, community cohesion, or national productivity. One fully developed idea is stronger than three surface-level ones.",
        sentence_frame: "Beyond physical fitness, regular participation in sports has been shown to..., which directly contributes to...",
      },
      {
        nudge: "Good — you've stated your view on sports. Now try to link it back to the government's role. Why should the government fund this rather than leaving it to the private sector? That gap in your argument is worth filling.",
        sentence_frame: "The government has a unique responsibility to fund sports infrastructure because private investment alone cannot ensure...",
      },
      {
        nudge: "Your argument is building momentum. Consider adding a real-world example — a country or city that invested heavily in recreational infrastructure and saw measurable social benefits. This elevates your response from opinion to evidence.",
        sentence_frame: "A compelling example can be seen in..., where government investment in sports facilities resulted in...",
      },
    ],
  },
  {
    keywords: ['technology', 'internet', 'digital', 'ai', 'artificial intelligence', 'computer', 'online', 'social media'],
    nudges: [
      {
        nudge: "You've started well with your position. Technology arguments work best when you separate benefits from risks clearly. Try structuring your next paragraph around one specific benefit with a concrete example rather than listing several broadly.",
        sentence_frame: "One of the most significant advantages of technology is..., as evidenced by the way...",
      },
      {
        nudge: "Strong opening stance. Now consider the human element — how does this technology affect different groups differently? Examiners look for nuance: does this apply equally to all ages, income groups, or regions?",
        sentence_frame: "However, it is important to note that access to technology is not uniform, particularly for... who may find that...",
      },
      {
        nudge: "Good progress. Your argument needs a cause-and-effect chain: don't just say technology causes X — show the mechanism. Why does it cause X? Through what process?",
        sentence_frame: "This occurs because technology fundamentally changes the way people..., which subsequently leads to...",
      },
    ],
  },
  {
    keywords: ['environment', 'climate', 'pollution', 'renewable', 'carbon', 'green', 'nature', 'sustainability', 'global warming'],
    nudges: [
      {
        nudge: "Good beginning. Environmental essays score higher when they move from the problem to the solution quickly. You've identified an issue — now show what specific action should follow and who is responsible for it.",
        sentence_frame: "To address this, governments must implement... while simultaneously encouraging individuals to...",
      },
      {
        nudge: "You're covering the topic well. One gap: you haven't yet addressed economic trade-offs. Examiners expect you to acknowledge that green solutions can be costly — then explain why the long-term benefits outweigh the short-term costs.",
        sentence_frame: "Although transitioning to renewable energy requires significant initial investment, the economic benefits in the long term include...",
      },
      {
        nudge: "Strong position. Try adding a specific reference point — even an approximation works. 'Studies suggest that...' or 'It is estimated that...' signals academic writing style to the examiner.",
        sentence_frame: "According to recent reports, approximately... tonnes of carbon dioxide are released annually due to..., highlighting the urgent need for...",
      },
    ],
  },
  {
    keywords: ['government', 'policy', 'law', 'democracy', 'politics', 'tax', 'spending', 'public', 'society'],
    nudges: [
      {
        nudge: "Good start. Policy-based arguments need to distinguish between what governments should do and what they actually do — and why that gap exists. Try building that tension into your next paragraph.",
        sentence_frame: "While the ideal role of government is to..., in practice many administrations prioritise... due to...",
      },
      {
        nudge: "You're engaging the topic well. Consider adding a specific example of a country whose policy worked (or failed) — this moves your argument from theoretical to evidenced.",
        sentence_frame: "This can be seen in the case of..., where the government's decision to... resulted in both... and...",
      },
      {
        nudge: "Nice progress. Your argument is still quite broad. Narrow it down to one specific policy mechanism in your next paragraph — taxation, legislation, subsidies, or public campaigns — and explain how it works in practice.",
        sentence_frame: "One effective mechanism governments can use is..., which works by... and has been shown to produce...",
      },
    ],
  },
  {
    keywords: ['work', 'job', 'employment', 'career', 'business', 'economy', 'salary', 'remote', 'office'],
    nudges: [
      {
        nudge: "Good opening. Employment essays benefit from addressing both the employer's and the employee's perspective. You've covered one side — try bringing in the other to show balanced thinking.",
        sentence_frame: "From the employer's perspective..., whereas employees often find that..., creating a tension that...",
      },
      {
        nudge: "Solid progress. Now push into consequences: if this trend continues, what happens to workers in five years? Examiners reward forward-thinking analysis.",
        sentence_frame: "If this pattern continues unchecked, it is likely that... which will ultimately lead to...",
      },
      {
        nudge: "You've stated a clear view. The next step is to support it with a real-world parallel — a sector, company, or country where this played out.",
        sentence_frame: "This dynamic is already visible in the... sector, where... has led to significant changes in the way...",
      },
    ],
  },
  {
    keywords: ['city', 'urban', 'rural', 'transport', 'traffic', 'infrastructure', 'housing', 'population'],
    nudges: [
      {
        nudge: "Good foundation. Urban development arguments are strengthened by comparing two contrasting examples — one that handled this well and one that didn't. That contrast makes your argument much more persuasive.",
        sentence_frame: "A useful contrast can be drawn between... and..., where differing approaches to... produced starkly different outcomes.",
      },
      {
        nudge: "You're on the right track. Now think about who is most affected by this issue — specific groups like low-income residents or daily commuters make abstract arguments feel real and grounded.",
        sentence_frame: "This issue disproportionately affects..., who rely on... and therefore face the greatest challenges when...",
      },
      {
        nudge: "Solid start. Think about the long-term timeline: what are the 20-year consequences if this problem is not addressed? Examiners value candidates who can project consequences, not just describe current problems.",
        sentence_frame: "If left unaddressed, this issue is projected to worsen over the next two decades, particularly as... continues to...",
      },
    ],
  },
  {
    keywords: ['family', 'children', 'parenting', 'marriage', 'divorce', 'elderly', 'generation', 'youth'],
    nudges: [
      {
        nudge: "Good start. Family-based arguments benefit from acknowledging how traditional values conflict with modern realities. Explore that tension rather than picking one side too quickly.",
        sentence_frame: "Although traditional views emphasise..., modern family structures increasingly reflect a reality where...",
      },
      {
        nudge: "You're making a valid point. Now add a cause — why has this change happened? Social, economic, or technological shifts usually drive family structure changes. Naming one makes your argument feel much more grounded.",
        sentence_frame: "This shift can largely be attributed to..., which has fundamentally altered the way families...",
      },
      {
        nudge: "Solid progress. Consider the impact on children specifically — they are often the group most discussed in IELTS family topics and examiners expect you to address their welfare explicitly.",
        sentence_frame: "Perhaps most significantly, this has a direct impact on children, who... and may grow up to...",
      },
    ],
  },
];

const GENERIC_NUDGES: Array<{ nudge: string; sentence_frame: string }> = [
  {
    nudge: "Good start — you have a clear position. Now your task is to support it with at least one concrete example or piece of evidence. Move from 'I believe X' to 'X is true because Y, as demonstrated by Z'.",
    sentence_frame: "To illustrate this point, consider the example of..., which clearly shows that...",
  },
  {
    nudge: "You're building your argument well. One thing many students miss at this stage: make sure your topic sentence does two things — states the main idea AND signals how it connects to your overall thesis.",
    sentence_frame: "This further supports the idea that..., because it demonstrates how...",
  },
  {
    nudge: "Nice progress. Think about your conclusion paragraph now — even though you're not there yet, the strongest essays loop back to the question explicitly. Keep that in mind as you write the middle sections.",
    sentence_frame: "In conclusion, although both sides present valid perspectives, the evidence suggests that... and therefore...",
  },
  {
    nudge: "Good work so far. You're making claims but could add one more layer of reasoning. For each point you make, ask: 'So what? Why does this matter?' That answer becomes your next sentence.",
    sentence_frame: "The significance of this becomes clear when we consider that..., especially in the context of...",
  },
];

function detectPunctuationIssue(text: string): string | null {
  if (/\.\s+[a-z]/.test(text)) {
    return "It looks like some sentences after a full stop don't start with a capital letter. In formal writing, always capitalise the first word of a new sentence.";
  }
  if (/\b(dont|cant|wont|didnt|isnt|arent|wasnt|havent|hasnt|wouldnt|shouldnt|couldnt|ive|id|youre|theyre|weve|theyve)\b/.test(text.toLowerCase())) {
    return "Check your contractions — for example 'dont' should be 'don't'. In formal IELTS writing it is better to avoid contractions entirely and write 'do not' instead.";
  }
  const segments = text.split(/[.!?]/);
  if (segments.some(s => s.trim().split(/\s+/).length > 45)) {
    return "One of your sentences is very long. Try breaking it into two sentences with a full stop, or use a semicolon (;) to join two closely related clauses.";
  }
  if (/[a-z]\s+(however|therefore|moreover|furthermore|nevertheless)\s+[a-z]/.test(text.toLowerCase())) {
    return "When using words like 'however', 'therefore', or 'furthermore' in the middle of a sentence, surround them with commas — e.g. 'This is important, however, because...'";
  }
  return null;
}

export function generateLocalNudge(
  topic: string,
  studentText: string,
  nudgeCount: number,
): LocalNudge {
  const topicLower = topic.toLowerCase();
  const textLower  = studentText.toLowerCase();

  let matchedPool: Array<{ nudge: string; sentence_frame: string }> | null = null;
  for (const pool of TOPIC_NUDGE_POOLS) {
    if (pool.keywords.some(kw => topicLower.includes(kw) || textLower.includes(kw))) {
      matchedPool = pool.nudges;
      break;
    }
  }

  const pool     = matchedPool ?? GENERIC_NUDGES;
  const selected = pool[nudgeCount % pool.length];

  return {
    nudge:           selected.nudge,
    sentence_frame:  selected.sentence_frame,
    punctuation_tip: detectPunctuationIssue(studentText),
  };
}