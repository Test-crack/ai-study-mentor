// Spoken English Internal Assessment — record-and-submit speaking, graded by the viva pipeline
// (backend /api/ia/se/*). Thin wrapper over the shared SeSpeakingRunner.
import SeSpeakingRunner from "./SeSpeakingRunner";

const SpokenEnglishIAPage = () => (
  <SeSpeakingRunner
    questionsUrl="/api/ia/se/questions"
    submitUrl="/api/ia/se/submit"
    cacheKind="ia"
    introTitle="Internal assessment"
    introBlurb={(n) => `${n} short speaking prompts on the areas you've been working on. Speak naturally — this updates your CEFR sub-scores.`}
    resultTitle="Assessment complete"
    notReadyMsg="Your internal assessment isn't ready yet — content is being prepared."
  />
);

export default SpokenEnglishIAPage;
