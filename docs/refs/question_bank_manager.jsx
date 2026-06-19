import { useState, useRef } from "react";

const C = {
  indigo:"#4338CA", indigoD:"#3730A3", indigoL:"#EEF2FF", indigoM:"#C7D2FE",
  navy:"#1E2A4A", navyL:"#2D3E6B",
  teal:"#0D9488", tealL:"#CCFBF1",
  green:"#059669", greenL:"#D1FAE5",
  amber:"#D97706", amberL:"#FEF3C7",
  red:"#DC2626", redL:"#FEE2E2",
  purple:"#7C3AED", purpleL:"#EDE9FE",
  coral:"#DC4C1B", coralL:"#FAECE7",
  w:"#FFFFFF", g50:"#F9FAFB", g100:"#F3F4F6",
  g200:"#E5E7EB", g300:"#D1D5DB", g400:"#9CA3AF",
  g500:"#6B7280", g600:"#4B5563", g800:"#1F2937",
};

// ── EXAM REGISTRY (SuperAdmin controlled) ─────────────────────────────────────
const EXAM_REGISTRY = [
  {
    id:"IELTS", label:"IELTS", icon:"🎓", tier:"base", status:"active",
    color:C.indigo, bg:C.indigoL,
    description:"International English Language Testing System",
    variants:["Academic","General Training"],
    skills:["Listening","Reading","Writing","Speaking"],
    scoring:{ type:"band", range:[0,9], increment:0.5, label:"Band Score" },
    evalLogic:{ listening:"mcq_band_table", reading:"mcq_band_table", writing:"gemini_ielts_writing", speaking:"gemini_ielts_speaking" },
    questionCount:{ diagnostic:40, drill:120, ia:80, mock:160 },
    institutes:14, banks:3,
  },
  {
    id:"GMAT", label:"GMAT Focus", icon:"📐", tier:"premium", status:"active",
    color:C.teal, bg:C.tealL,
    description:"Graduate Management Admission Test",
    variants:["GMAT Focus Edition"],
    skills:["Verbal Reasoning","Quantitative Reasoning","Data Insights"],
    scoring:{ type:"points", range:[205,805], increment:10, label:"Total Score" },
    evalLogic:{ verbal:"mcq_gmat_verbal", quant:"mcq_gmat_quant", data_insights:"mcq_gmat_di" },
    questionCount:{ diagnostic:36, drill:90, ia:60, mock:64 },
    institutes:6, banks:2,
  },
  {
    id:"PTE", label:"PTE Academic", icon:"💻", tier:"premium", status:"active",
    color:C.purple, bg:C.purpleL,
    description:"Pearson Test of English Academic",
    variants:["PTE Academic","PTE Core"],
    skills:["Speaking","Writing","Reading","Listening"],
    scoring:{ type:"points", range:[10,90], increment:1, label:"PTE Score" },
    evalLogic:{ speaking:"gemini_pte_speaking", writing:"gemini_pte_writing", reading:"mcq_pte_reading", listening:"mcq_pte_listening" },
    questionCount:{ diagnostic:32, drill:96, ia:64, mock:128 },
    institutes:4, banks:1,
  },
  {
    id:"AWS_SAA", label:"AWS SAA-C03", icon:"☁️", tier:"premium", status:"active",
    color:C.amber, bg:C.amberL,
    description:"AWS Solutions Architect Associate",
    variants:["SAA-C03","Cloud Practitioner CLF-C02"],
    skills:["Cloud Concepts","Security","Technology","Billing & Support"],
    scoring:{ type:"points", range:[100,1000], increment:1, label:"Score", passmark:720 },
    evalLogic:{ all:"mcq_aws_weighted" },
    questionCount:{ diagnostic:20, drill:60, ia:40, mock:65 },
    institutes:3, banks:1,
  },
  {
    id:"TOEFL", label:"TOEFL iBT", icon:"🌐", tier:"premium", status:"coming_soon",
    color:C.coral, bg:C.coralL,
    description:"Test of English as a Foreign Language",
    variants:["TOEFL iBT","TOEFL Essentials"],
    skills:["Reading","Listening","Speaking","Writing"],
    scoring:{ type:"points", range:[0,120], increment:1, label:"Total Score" },
    evalLogic:{ speaking:"gemini_toefl_speaking", writing:"gemini_toefl_writing", reading:"mcq_toefl", listening:"mcq_toefl" },
    questionCount:{ diagnostic:0, drill:0, ia:0, mock:0 },
    institutes:0, banks:0,
  },
];

const EVAL_LOGIC_REGISTRY = {
  mcq_band_table: { label:"MCQ → Band Table", desc:"Correct answers mapped to IELTS band via official conversion table", ai:false },
  gemini_ielts_writing: { label:"Gemini IELTS Writing", desc:"Task Response, Coherence, Lexical, Grammar scored by Gemini 2.5 Flash against IELTS descriptors", ai:true },
  gemini_ielts_speaking: { label:"Gemini IELTS Speaking", desc:"Fluency, Lexical, Grammar, Pronunciation via Google STT → Gemini 2.5 Flash", ai:true },
  mcq_gmat_verbal: { label:"MCQ GMAT Verbal", desc:"Adaptive scoring logic based on item difficulty and accuracy", ai:false },
  mcq_gmat_quant: { label:"MCQ GMAT Quant", desc:"Correct/incorrect with difficulty weighting", ai:false },
  mcq_gmat_di: { label:"MCQ GMAT Data Insights", desc:"Multi-source reasoning accuracy scoring", ai:false },
  gemini_pte_speaking: { label:"Gemini PTE Speaking", desc:"Oral fluency and pronunciation scored against PTE criteria", ai:true },
  gemini_pte_writing: { label:"Gemini PTE Writing", desc:"Content, form, grammar, vocabulary scored against PTE rubric", ai:true },
  mcq_pte_reading: { label:"MCQ PTE Reading", desc:"Multiple choice and re-order paragraph scoring", ai:false },
  mcq_pte_listening: { label:"MCQ PTE Listening", desc:"Summarize spoken text and select missing word", ai:false },
  mcq_aws_weighted: { label:"MCQ AWS Weighted", desc:"Single and multiple answer questions with AWS scaled scoring", ai:false },
};

// Mock question bank data
const MOCK_BANKS = {
  IELTS: [
    { id:"ielts-official-v3", name:"IELTS Official Bank v3.0", type:"official", status:"active", questions:400, lastUpdated:"Jun 2026", coverage:"All skills · A/B/C levels · Diagnostic+Drill+IA+Mock" },
    { id:"ielts-speaking-ext", name:"Speaking Extension Pack", type:"official", status:"active", questions:120, lastUpdated:"May 2026", coverage:"Speaking only · B/C levels · Advanced fluency drills" },
    { id:"ielts-kerala-custom", name:"Kerala Institute Custom Pack", type:"custom", institute:"Bright Future", status:"active", questions:48, lastUpdated:"Jun 2026", coverage:"Writing Task 2 · Local topics" },
  ],
  GMAT: [
    { id:"gmat-official-v1", name:"GMAT Focus Official Bank v1.0", type:"official", status:"active", questions:260, lastUpdated:"Apr 2026", coverage:"Verbal+Quant+DI · All levels" },
    { id:"gmat-verbal-ext", name:"Verbal Reasoning Extension", type:"official", status:"draft", questions:80, lastUpdated:"Jun 2026", coverage:"Verbal only · Advanced" },
  ],
  PTE: [
    { id:"pte-official-v1", name:"PTE Academic Official Bank v1.0", type:"official", status:"active", questions:180, lastUpdated:"May 2026", coverage:"All skills · B/C levels" },
  ],
  AWS_SAA: [
    { id:"aws-saa-v1", name:"AWS SAA-C03 Official Bank v1.0", type:"official", status:"active", questions:150, lastUpdated:"Mar 2026", coverage:"All domains · Exam-weighted" },
  ],
};

// ── COMPONENTS ────────────────────────────────────────────────────────────────
const Card = ({children,style={}}) => (
  <div style={{background:C.w,borderRadius:14,border:`1px solid ${C.g200}`,
    boxShadow:"0 1px 4px rgba(67,56,202,.06)",overflow:"hidden",...style}}>{children}</div>
);

const Pill = ({children,color,bg,small=false}) => (
  <span style={{display:"inline-block",padding:small?"2px 8px":"3px 11px",borderRadius:20,
    fontSize:small?10:11,fontWeight:700,background:bg||C.indigoL,color:color||C.indigo}}>{children}</span>
);

const Btn = ({children,onClick,variant="primary",small=false,icon,disabled=false}) => {
  const styles = {
    primary:  { bg:C.indigo, color:C.w, border:"none" },
    secondary:{ bg:C.indigoL, color:C.indigo, border:`1px solid ${C.indigoM}` },
    ghost:    { bg:"transparent", color:C.g500, border:`1px solid ${C.g200}` },
    danger:   { bg:C.redL, color:C.red, border:`1px solid ${C.red}33` },
    success:  { bg:C.greenL, color:C.green, border:`1px solid ${C.green}33` },
  };
  const s = styles[variant];
  return (
    <button onClick={onClick} disabled={disabled}
      style={{display:"inline-flex",alignItems:"center",gap:6,
        padding:small?"6px 12px":"9px 16px",borderRadius:9,
        background:s.bg,color:s.color,border:s.border,
        fontSize:small?11:13,fontWeight:600,cursor:disabled?"not-allowed":"pointer",
        opacity:disabled?.45:1,fontFamily:"inherit",transition:"all .15s",whiteSpace:"nowrap"}}>
      {icon&&<span>{icon}</span>}{children}
    </button>
  );
};

// Excel column preview
const EXCEL_PREVIEW = [
  {skill:"LISTENING",subSkill:"Detail",level:"A",type:"Diagnostic",prompt:"The speaker mentions that the conference will be held…",answer:"B",qType:"MCQ",rubric:""},
  {skill:"READING",subSkill:"Inference",level:"B",type:"Drill",prompt:"Based on paragraph 3, the author implies that…",answer:"TRUE",qType:"T/F/NG",rubric:""},
  {skill:"WRITING",subSkill:"Task Response",level:"B",type:"Internal Assessment",prompt:"Some people think that all university students should study…",answer:"",qType:"Essay",rubric:"IELTS_TA_V3"},
  {skill:"SPEAKING",subSkill:"Fluency",level:"A",type:"Drill",prompt:"Describe your daily morning routine.",answer:"",qType:"AudioResponse",rubric:"IELTS_FC_V3"},
  {skill:"LISTENING",subSkill:"Gist",level:"C",type:"Mock",prompt:"What is the main purpose of the woman's call?",answer:"C",qType:"MCQ",rubric:""},
];

const VALIDATION_RESULTS = [
  {row:3,col:"Sub-skill",val:"Taks Response",status:"error",msg:"Unknown sub-skill 'Taks Response'. Did you mean 'Task Response'?"},
  {row:7,col:"Level",val:"D",status:"error",msg:"Invalid level 'D'. Must be A, B, or C."},
  {row:12,col:"Rubric",val:"",status:"warning",msg:"Missing rubric for Writing question. Will default to IELTS_TA_V3."},
  {row:18,col:"Answer",val:"",status:"warning",msg:"MCQ question has no answer key. Student responses will not be auto-scored."},
  {row:24,col:"Q Type",val:"Essay",status:"info",msg:"AI grading will be used. Ensure exam type has a Gemini evaluation logic configured."},
];

// ── SUPERADMIN VIEWS ──────────────────────────────────────────────────────────
const SAExamRegistry = ({onSelect}) => (
  <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
      <div>
        <div style={{fontSize:15,fontWeight:700,color:C.navy}}>Exam Registry</div>
        <div style={{fontSize:11,color:C.g400,marginTop:2}}>All exams available on the TestCrack platform. You control what institutes can access.</div>
      </div>
      <Btn icon="➕" variant="primary">Add Exam Type</Btn>
    </div>

    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      {EXAM_REGISTRY.map(exam=>{
        const isComing = exam.status==="coming_soon";
        return (
          <Card key={exam.id}>
            <div style={{padding:"16px 20px",display:"flex",gap:16,alignItems:"flex-start"}}>
              {/* Icon + name */}
              <div style={{width:48,height:48,borderRadius:12,background:exam.bg,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                {exam.icon}
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:4}}>
                  <span style={{fontSize:15,fontWeight:700,color:C.navy}}>{exam.label}</span>
                  <Pill color={exam.color} bg={exam.bg} small>{exam.tier==="base"?"Base Plan":"Premium Pack"}</Pill>
                  {isComing
                    ? <Pill color={C.g400} bg={C.g100} small>Coming Soon</Pill>
                    : <Pill color={C.green} bg={C.greenL} small>● Live</Pill>}
                </div>
                <div style={{fontSize:12,color:C.g500,marginBottom:8}}>{exam.description}</div>
                <div style={{display:"flex",gap:20,fontSize:11,color:C.g400}}>
                  <span>Skills: <strong style={{color:C.navy}}>{exam.skills.join(" · ")}</strong></span>
                  <span>Scoring: <strong style={{color:exam.color}}>{exam.scoring.label} {exam.scoring.range[0]}–{exam.scoring.range[1]}</strong></span>
                  {!isComing && <span>Institutes: <strong style={{color:C.navy}}>{exam.institutes}</strong></span>}
                  {!isComing && <span>Question Banks: <strong style={{color:C.navy}}>{exam.banks}</strong></span>}
                </div>
              </div>
              {/* Eval logic chips */}
              <div style={{display:"flex",flexDirection:"column",gap:4,minWidth:200}}>
                <div style={{fontSize:10,fontWeight:700,color:C.g400,textTransform:"uppercase",letterSpacing:".06em",marginBottom:2}}>Eval Logic</div>
                {Object.entries(exam.evalLogic).slice(0,2).map(([skill,logic])=>{
                  const l = EVAL_LOGIC_REGISTRY[logic];
                  return l ? (
                    <div key={skill} style={{display:"flex",gap:5,alignItems:"center",
                      padding:"3px 8px",borderRadius:6,background:l.ai?C.purpleL:C.g100,
                      border:`1px solid ${l.ai?C.purple+"33":C.g200}`}}>
                      <span style={{fontSize:10}}>{l.ai?"🤖":"📊"}</span>
                      <span style={{fontSize:10,color:l.ai?C.purple:C.g600,fontWeight:500}}>{l.label}</span>
                    </div>
                  ) : null;
                })}
                {Object.keys(exam.evalLogic).length>2 &&
                  <div style={{fontSize:10,color:C.g400,paddingLeft:8}}>+{Object.keys(exam.evalLogic).length-2} more</div>}
              </div>
              {/* Actions */}
              <div style={{display:"flex",flexDirection:"column",gap:6,flexShrink:0}}>
                <Btn small variant="secondary" onClick={()=>onSelect(exam.id)} icon="📚">Manage Banks</Btn>
                <Btn small variant="ghost" icon="⚙️">Configure Logic</Btn>
                {isComing && <Btn small variant="success" icon="🚀">Launch</Btn>}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  </div>
);

const SAQuestionBankManager = ({examId, onBack}) => {
  const exam = EXAM_REGISTRY.find(e=>e.id===examId);
  const banks = MOCK_BANKS[examId] || [];
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <div style={{display:"flex",gap:10,alignItems:"center"}}>
        <Btn variant="ghost" small onClick={onBack} icon="←">Back</Btn>
        <div style={{flex:1}}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <span style={{fontSize:18}}>{exam?.icon}</span>
            <span style={{fontSize:15,fontWeight:700,color:C.navy}}>{exam?.label} — Question Banks</span>
            <Pill color={exam?.color} bg={exam?.bg} small>{banks.filter(b=>b.status==="active").length} active</Pill>
          </div>
          <div style={{fontSize:11,color:C.g400,marginTop:2}}>
            These banks are available to institutes with {exam?.label} enabled on their plan
          </div>
        </div>
        <Btn variant="primary" icon="⬆️" onClick={()=>setShowUpload(true)}>Upload New Bank</Btn>
      </div>

      {showUpload && (
        <Card style={{border:`2px dashed ${exam?.color||C.indigo}`}}>
          <ExcelUploadFlow examId={examId} exam={exam} onClose={()=>setShowUpload(false)} />
        </Card>
      )}

      {banks.map(bank=>(
        <Card key={bank.id}>
          <div style={{padding:"14px 18px",display:"flex",gap:14,alignItems:"center"}}>
            <div style={{width:40,height:40,borderRadius:10,
              background:bank.type==="official"?exam?.bg:C.amberL,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
              {bank.type==="official"?"📚":"🏛️"}
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
                <span style={{fontSize:13,fontWeight:700,color:C.navy}}>{bank.name}</span>
                <Pill small color={bank.type==="official"?exam?.color:C.amber}
                  bg={bank.type==="official"?exam?.bg:C.amberL}>
                  {bank.type==="official"?"Official":"Custom"}
                </Pill>
                <Pill small color={bank.status==="active"?C.green:C.amber}
                  bg={bank.status==="active"?C.greenL:C.amberL}>
                  {bank.status}
                </Pill>
              </div>
              <div style={{fontSize:11,color:C.g500}}>{bank.coverage}</div>
              {bank.institute && <div style={{fontSize:10,color:C.amber,marginTop:2}}>Uploaded by: {bank.institute}</div>}
            </div>
            <div style={{textAlign:"center",padding:"0 16px"}}>
              <div style={{fontSize:22,fontWeight:800,color:exam?.color}}>{bank.questions}</div>
              <div style={{fontSize:10,color:C.g400}}>questions</div>
            </div>
            <div style={{fontSize:11,color:C.g400}}>{bank.lastUpdated}</div>
            <div style={{display:"flex",gap:6}}>
              <Btn small variant="secondary" icon="👁️">Preview</Btn>
              <Btn small variant="ghost" icon="✏️">Edit</Btn>
              {bank.type==="custom" && <Btn small variant="danger" icon="✕">Remove</Btn>}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

const SAEvalLogicEditor = () => (
  <div style={{display:"flex",flexDirection:"column",gap:14}}>
    <div>
      <div style={{fontSize:15,fontWeight:700,color:C.navy}}>Evaluation Logic Registry</div>
      <div style={{fontSize:11,color:C.g400,marginTop:2}}>
        These are the scoring engines that evaluate student answers. Only SuperAdmin can configure these. Institutes cannot change evaluation logic.
      </div>
    </div>
    <Card style={{border:`2px solid ${C.red+"33"}`,background:C.redL}}>
      <div style={{padding:"12px 16px",display:"flex",gap:10,alignItems:"flex-start"}}>
        <span style={{fontSize:18}}>🔒</span>
        <div>
          <div style={{fontSize:12,fontWeight:700,color:C.red}}>Access Control — Critical</div>
          <div style={{fontSize:11,color:C.g600,lineHeight:1.6}}>
            Evaluation logic is locked to SuperAdmin only. Institutes cannot modify how answers are scored. This protects the integrity of all band scores and prevents institutes from inflating student results.
          </div>
        </div>
      </div>
    </Card>
    <div style={{display:"flex",flexDirection:"column",gap:8}}>
      {Object.entries(EVAL_LOGIC_REGISTRY).map(([key,logic])=>(
        <Card key={key}>
          <div style={{padding:"12px 16px",display:"flex",gap:12,alignItems:"flex-start"}}>
            <div style={{width:36,height:36,borderRadius:9,
              background:logic.ai?C.purpleL:C.g100,
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>
              {logic.ai?"🤖":"📊"}
            </div>
            <div style={{flex:1}}>
              <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:3}}>
                <span style={{fontSize:13,fontWeight:700,color:C.navy}}>{logic.label}</span>
                <Pill small color={logic.ai?C.purple:C.teal} bg={logic.ai?C.purpleL:C.tealL}>
                  {logic.ai?"AI Graded":"Rule Based"}
                </Pill>
              </div>
              <div style={{fontSize:11,color:C.g500}}>{logic.desc}</div>
            </div>
            <Btn small variant="ghost" icon="⚙️">Configure Prompt</Btn>
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// ── EXCEL UPLOAD FLOW ─────────────────────────────────────────────────────────
const ExcelUploadFlow = ({examId, exam, onClose}) => {
  const [step, setStep] = useState("upload"); // upload | validating | preview | confirmed
  const [progress, setProgress] = useState(0);
  const fileRef = useRef();

  const simulate = () => {
    setStep("validating");
    let p = 0;
    const iv = setInterval(()=>{
      p += Math.random()*20+5;
      if(p>=100){ clearInterval(iv); setProgress(100); setTimeout(()=>setStep("preview"),400); }
      else setProgress(Math.min(p,95));
    },200);
  };

  return (
    <div style={{padding:"20px 24px"}}>
      {/* Step indicator */}
      <div style={{display:"flex",gap:0,marginBottom:20}}>
        {[["upload","1","Upload File"],["validating","2","Validate"],["preview","3","Preview & Map"],["confirmed","4","Confirm Import"]].map(([s,n,l],i,arr)=>{
          const states = ["upload","validating","preview","confirmed"];
          const idx = states.indexOf(s);
          const curIdx = states.indexOf(step);
          const done = curIdx > idx;
          const active = curIdx === idx;
          return (
            <div key={s} style={{display:"flex",alignItems:"center",flex:i<arr.length-1?1:"auto"}}>
              <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{width:28,height:28,borderRadius:"50%",
                  background:done?C.green:active?C.indigo:C.g200,
                  color:done||active?C.w:C.g400,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  fontSize:12,fontWeight:700}}>
                  {done?"✓":n}
                </div>
                <div style={{fontSize:10,fontWeight:done||active?600:400,
                  color:done?C.green:active?C.indigo:C.g400,whiteSpace:"nowrap"}}>{l}</div>
              </div>
              {i<arr.length-1 && (
                <div style={{flex:1,height:2,background:done?C.green:C.g200,margin:"0 6px",marginBottom:14}} />
              )}
            </div>
          );
        })}
      </div>

      {step==="upload" && (
        <div>
          <div style={{marginBottom:14}}>
            <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:4}}>Upload Question Bank Excel File</div>
            <div style={{fontSize:11,color:C.g500}}>Exam: {exam?.label} · Accepted format: .xlsx · Max 5,000 rows</div>
          </div>

          {/* Required columns */}
          <Card style={{marginBottom:14,border:`1px solid ${C.indigoM}`}}>
            <div style={{padding:"12px 16px"}}>
              <div style={{fontSize:12,fontWeight:700,color:C.indigo,marginBottom:8}}>Required Excel Column Structure</div>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                  <thead>
                    <tr>{["skill","sub_skill","level","question_type","prompt","answer","q_type","rubric_id"].map(h=>(
                      <th key={h} style={{padding:"5px 10px",background:C.indigo,color:C.w,fontWeight:700,
                        fontSize:10,textAlign:"left",letterSpacing:".04em",whiteSpace:"nowrap"}}>{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody>
                    {EXCEL_PREVIEW.slice(0,3).map((row,i)=>(
                      <tr key={i} style={{borderBottom:`1px solid ${C.g100}`,background:i%2===0?C.w:C.g50}}>
                        {[row.skill,row.subSkill,row.level,row.type,
                          row.prompt.substring(0,35)+"…",row.answer||"(AI graded)",row.qType,row.rubric||"—"].map((v,j)=>(
                          <td key={j} style={{padding:"5px 10px",color:C.g600,fontFamily:"monospace",fontSize:10}}>{v}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Drop zone */}
          <div onClick={()=>fileRef.current?.click()}
            style={{border:`2px dashed ${exam?.color||C.indigo}`,borderRadius:12,padding:"32px",
              textAlign:"center",cursor:"pointer",background:exam?.bg||C.indigoL,transition:"all .15s"}}
            onMouseEnter={e=>e.currentTarget.style.opacity=".8"}
            onMouseLeave={e=>e.currentTarget.style.opacity="1"}>
            <div style={{fontSize:36,marginBottom:10}}>📂</div>
            <div style={{fontSize:14,fontWeight:700,color:exam?.color||C.indigo,marginBottom:4}}>
              Drop your .xlsx file here or click to browse
            </div>
            <div style={{fontSize:11,color:C.g500}}>
              Download the template below to ensure correct column headers
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls" style={{display:"none"}} onChange={simulate} />
          </div>

          <div style={{display:"flex",gap:8,marginTop:12,justifyContent:"space-between",alignItems:"center"}}>
            <Btn variant="secondary" icon="⬇️" small>Download Template ({exam?.label})</Btn>
            <div style={{display:"flex",gap:8}}>
              <Btn variant="ghost" small onClick={onClose}>Cancel</Btn>
              <Btn variant="primary" icon="▶️" onClick={simulate}>Start Validation</Btn>
            </div>
          </div>
        </div>
      )}

      {step==="validating" && (
        <div style={{textAlign:"center",padding:"20px 0"}}>
          <div style={{fontSize:36,marginBottom:12}}>🔍</div>
          <div style={{fontSize:14,fontWeight:700,color:C.navy,marginBottom:4}}>Validating your question bank…</div>
          <div style={{fontSize:11,color:C.g500,marginBottom:16}}>Checking column structure, skill names, levels, answer formats, and rubric IDs</div>
          <div style={{height:8,background:C.g100,borderRadius:99,margin:"0 auto",maxWidth:400}}>
            <div style={{height:"100%",width:`${progress}%`,background:C.indigo,borderRadius:99,transition:"width .2s"}} />
          </div>
          <div style={{fontSize:12,color:C.indigo,marginTop:8,fontWeight:600}}>{Math.round(progress)}%</div>
        </div>
      )}

      {(step==="preview"||step==="confirmed") && (
        <div>
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            {[["395","Questions valid",C.green,C.greenL],["4","Warnings",C.amber,C.amberL],["2","Errors to fix",C.red,C.redL]].map(([v,l,c,bg])=>(
              <div key={l} style={{flex:1,padding:"10px 14px",borderRadius:10,background:bg,border:`1px solid ${c}33`,textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:800,color:c}}>{v}</div>
                <div style={{fontSize:11,color:C.g600,marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>

          <div style={{maxHeight:200,overflowY:"auto",marginBottom:14,display:"flex",flexDirection:"column",gap:5}}>
            {VALIDATION_RESULTS.map((r,i)=>{
              const cfg = {error:{c:C.red,bg:C.redL,icon:"✕"},warning:{c:C.amber,bg:C.amberL,icon:"⚠"},info:{c:C.indigo,bg:C.indigoL,icon:"ℹ"}}[r.status];
              return (
                <div key={i} style={{padding:"8px 12px",borderRadius:8,background:cfg.bg,
                  border:`1px solid ${cfg.c}33`,display:"flex",gap:8,alignItems:"flex-start"}}>
                  <span style={{fontSize:12,flexShrink:0,color:cfg.c}}>{cfg.icon}</span>
                  <div style={{flex:1}}>
                    <div style={{fontSize:11,color:cfg.c,fontWeight:600}}>Row {r.row} · Column: {r.col} · Value: "{r.val}"</div>
                    <div style={{fontSize:11,color:C.g600}}>{r.msg}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Question preview table */}
          <Card style={{marginBottom:14}}>
            <div style={{padding:"10px 14px",borderBottom:`1px solid ${C.g100}`,fontSize:12,fontWeight:700,color:C.navy}}>
              Question Preview (first 5 of 395 valid)
            </div>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:11}}>
                <thead>
                  <tr style={{background:C.g50}}>
                    {["Skill","Sub-skill","Level","Type","Prompt (truncated)","Answer/Eval","Q Type"].map(h=>(
                      <th key={h} style={{padding:"6px 10px",textAlign:"left",fontSize:10,fontWeight:700,
                        color:C.g400,textTransform:"uppercase",whiteSpace:"nowrap"}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {EXCEL_PREVIEW.map((row,i)=>(
                    <tr key={i} style={{borderTop:`1px solid ${C.g100}`,background:i%2===0?C.w:C.g50}}>
                      <td style={{padding:"6px 10px",fontWeight:600,color:C.indigo}}>{row.skill}</td>
                      <td style={{padding:"6px 10px",color:C.g600}}>{row.subSkill}</td>
                      <td style={{padding:"6px 10px",textAlign:"center"}}>
                        <Pill small color={row.level==="A"?C.amber:row.level==="B"?C.indigo:C.teal}
                          bg={row.level==="A"?C.amberL:row.level==="B"?C.indigoL:C.tealL}>{row.level}</Pill>
                      </td>
                      <td style={{padding:"6px 10px",color:C.g600}}>{row.type}</td>
                      <td style={{padding:"6px 10px",color:C.g600,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{row.prompt}</td>
                      <td style={{padding:"6px 10px"}}>{row.answer?<Pill small color={C.green} bg={C.greenL}>{row.answer}</Pill>:<Pill small color={C.purple} bg={C.purpleL}>AI Graded</Pill>}</td>
                      <td style={{padding:"6px 10px",color:C.g500,fontSize:10}}>{row.qType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {step==="confirmed" && (
            <div style={{padding:"14px 18px",borderRadius:12,background:C.greenL,border:`1px solid ${C.green}33`,
              display:"flex",gap:10,alignItems:"center"}}>
              <span style={{fontSize:24}}>✅</span>
              <div>
                <div style={{fontSize:13,fontWeight:700,color:C.green}}>Import Successful</div>
                <div style={{fontSize:11,color:C.g600}}>395 questions added to IELTS Official Bank v3.1 and are now available to all institutes with IELTS enabled.</div>
              </div>
            </div>
          )}

          {step==="preview" && (
            <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
              <Btn variant="ghost" small onClick={onClose}>Cancel</Btn>
              <Btn variant="secondary" small icon="✏️">Fix Errors First</Btn>
              <Btn variant="primary" icon="✅" onClick={()=>setStep("confirmed")}>Confirm Import (395 valid questions)</Btn>
            </div>
          )}
          {step==="confirmed" && <div style={{display:"flex",justifyContent:"flex-end"}}><Btn variant="secondary" small onClick={onClose}>Close</Btn></div>}
        </div>
      )}
    </div>
  );
};

// ── INSTITUTE VIEWS ───────────────────────────────────────────────────────────
const InstExamSwitcher = () => {
  const [active, setActive] = useState("IELTS");
  const [showCustom, setShowCustom] = useState(false);
  const enabled = ["IELTS","GMAT"];
  const exam = EXAM_REGISTRY.find(e=>e.id===active);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:14}}>
      <Card style={{border:`1px solid ${C.indigoM}`,background:C.indigoL}}>
        <div style={{padding:"14px 18px",display:"flex",gap:12,alignItems:"flex-start"}}>
          <span style={{fontSize:24}}>💡</span>
          <div>
            <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:3}}>Your Plan: Growth</div>
            <div style={{fontSize:11,color:C.g600,lineHeight:1.6}}>
              You have access to <strong>IELTS</strong> (base) and <strong>GMAT Focus</strong> (premium add-on).
              To unlock PTE Academic or AWS Certification banks, contact TestCrack to upgrade.
            </div>
          </div>
          <Btn small variant="secondary">Upgrade Plan</Btn>
        </div>
      </Card>

      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr) repeat(2,1fr)",gap:10}}>
        {EXAM_REGISTRY.map(ex=>{
          const isEnabled = enabled.includes(ex.id);
          const isActive = active===ex.id;
          return (
            <div key={ex.id} onClick={()=>isEnabled&&setActive(ex.id)}
              style={{borderRadius:12,padding:"14px 16px",
                border:`2px solid ${isActive?ex.color:isEnabled?ex.color+"44":C.g200}`,
                background:isActive?ex.bg:isEnabled?C.w:C.g50,
                cursor:isEnabled?"pointer":"not-allowed",opacity:isEnabled?1:.6,
                transition:"all .15s",position:"relative"}}>
              {!isEnabled && (
                <div style={{position:"absolute",top:8,right:8,fontSize:14}}>🔒</div>
              )}
              <div style={{fontSize:22,marginBottom:6}}>{ex.icon}</div>
              <div style={{fontSize:13,fontWeight:700,color:isActive?ex.color:isEnabled?C.navy:C.g400}}>{ex.label}</div>
              <div style={{fontSize:11,color:C.g500,marginTop:2}}>{isEnabled?"Enabled":"Not in plan"}</div>
              {isEnabled && (
                <Pill small color={ex.color} bg={`${ex.color}22`} style={{marginTop:4}}>
                  {BATCHES.filter(b=>b.exam===ex.id).length} batches
                </Pill>
              )}
            </div>
          );
        })}
      </div>

      {exam && (
        <Card>
          <div style={{padding:"16px 20px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
              <div style={{display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:24}}>{exam.icon}</span>
                <div>
                  <div style={{fontSize:15,fontWeight:700,color:C.navy}}>{exam.label}</div>
                  <div style={{fontSize:11,color:C.g400}}>{exam.description}</div>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <Btn small variant="secondary" icon="➕">Create Batch</Btn>
                <Btn small variant="ghost" icon="👁️">Preview Questions</Btn>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
              {[
                ["Skills",exam.skills.length+" skills"],
                ["Scoring",`${exam.scoring.label} ${exam.scoring.range[0]}–${exam.scoring.range[1]}`],
                ["Question Bank",(MOCK_BANKS[active]||[]).filter(b=>b.status==="active").reduce((s,b)=>s+b.questions,0)+" questions"],
                ["Your Batches",BATCHES.filter(b=>b.exam===active).length+" active"],
              ].map(([k,v])=>(
                <div key={k} style={{padding:"10px 12px",borderRadius:9,background:exam.bg,border:`1px solid ${exam.color}33`}}>
                  <div style={{fontSize:10,color:exam.color,fontWeight:700,textTransform:"uppercase",letterSpacing:".04em"}}>{k}</div>
                  <div style={{fontSize:13,fontWeight:700,color:C.navy,marginTop:3}}>{v}</div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Custom bank section (Enterprise only) */}
      <Card style={{border:`1px solid ${C.amber+"55"}`}}>
        <div style={{padding:"14px 18px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <div style={{fontSize:13,fontWeight:700,color:C.navy}}>Custom Question Banks</div>
                <Pill small color={C.amber} bg={C.amberL}>Enterprise Only</Pill>
              </div>
              <div style={{fontSize:11,color:C.g500,marginTop:2}}>
                Upload your own supplementary questions. TestCrack's scoring engine evaluates them — you provide the questions, we provide the AI grading.
              </div>
            </div>
            <Btn small variant="ghost" disabled>Upgrade to Enterprise</Btn>
          </div>
          <div style={{padding:"12px 14px",borderRadius:9,background:C.g50,border:`1px dashed ${C.g300}`,
            display:"flex",gap:10,alignItems:"center",opacity:.6}}>
            <span style={{fontSize:20}}>🔒</span>
            <div style={{fontSize:12,color:C.g500}}>
              Custom bank upload available on Enterprise plan. Your questions use the same AI evaluation engine — you control content, TestCrack controls quality.
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function QuestionBankManager() {
  const [mode, setMode] = useState("superadmin"); // superadmin | institute
  const [saView, setSaView] = useState("registry"); // registry | bank_manager | eval_logic
  const [selectedExam, setSelectedExam] = useState(null);

  const handleSelectExam = (id) => { setSelectedExam(id); setSaView("bank_manager"); };
  const handleBack = () => { setSelectedExam(null); setSaView("registry"); };

  return (
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:C.g50,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        button{font-family:inherit;cursor:pointer;}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#C7D2FE;border-radius:2px}
      `}</style>

      {/* Top bar */}
      <div style={{background:C.navy,padding:"0 24px",height:52,display:"flex",alignItems:"center",
        justifyContent:"space-between",flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:30,height:30,background:C.indigo,borderRadius:8,display:"flex",
            alignItems:"center",justifyContent:"center",fontSize:15,color:C.w,fontWeight:800}}>T</div>
          <span style={{fontSize:14,fontWeight:700,color:C.w}}>TestCrack</span>
          <span style={{fontSize:11,color:"rgba(255,255,255,.3)"}}>/ Question Bank Manager</span>
        </div>

        {/* Mode toggle */}
        <div style={{display:"flex",background:"rgba(255,255,255,.08)",borderRadius:9,padding:3,gap:2}}>
          {[["superadmin","🛡️ SuperAdmin"],["institute","🏛️ Institute View"]].map(([m,l])=>(
            <button key={m} onClick={()=>setMode(m)}
              style={{padding:"6px 14px",borderRadius:7,border:"none",
                background:mode===m?"#fff":"transparent",
                color:mode===m?C.navy:"rgba(255,255,255,.6)",
                fontSize:12,fontWeight:mode===m?700:500,transition:"all .15s"}}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* SuperAdmin sub-nav */}
      {mode==="superadmin" && (
        <div style={{background:C.navyL,padding:"0 24px",display:"flex",gap:0,borderBottom:`1px solid rgba(255,255,255,.1)`}}>
          {[["registry","📋 Exam Registry"],["eval_logic","⚙️ Evaluation Logic"]].map(([v,l])=>(
            <button key={v} onClick={()=>setSaView(v)}
              style={{padding:"10px 18px",border:"none",borderBottom:`2.5px solid ${saView===v?"#818CF8":"transparent"}`,
                background:"transparent",color:saView===v?"#C7D2FE":"rgba(255,255,255,.4)",
                fontSize:12,fontWeight:saView===v?700:400,cursor:"pointer",transition:"all .15s"}}>
              {l}
            </button>
          ))}
        </div>
      )}

      {/* Content */}
      <div style={{flex:1,padding:"20px 24px",overflow:"auto",maxWidth:1100,margin:"0 auto",width:"100%"}}>
        {mode==="superadmin" && saView==="registry" && <SAExamRegistry onSelect={handleSelectExam} />}
        {mode==="superadmin" && saView==="bank_manager" && selectedExam && <SAQuestionBankManager examId={selectedExam} onBack={handleBack} />}
        {mode==="superadmin" && saView==="eval_logic" && <SAEvalLogicEditor />}
        {mode==="institute" && <InstExamSwitcher />}
      </div>

      {/* Bottom legend */}
      <div style={{borderTop:`1px solid ${C.g200}`,padding:"10px 24px",background:C.w,
        display:"flex",gap:16,alignItems:"center",flexShrink:0}}>
        <span style={{fontSize:11,fontWeight:700,color:C.g400,textTransform:"uppercase",letterSpacing:".06em"}}>Architecture:</span>
        {[["🔒 Eval Logic","SuperAdmin only — institutes cannot change scoring",C.red],
          ["📚 Official Banks","SuperAdmin creates, all institutes use",C.indigo],
          ["🏛️ Custom Banks","Enterprise institutes upload, TestCrack scores",C.amber],
          ["🤖 AI Graded","Gemini 2.5 Flash via existing pipeline",C.purple],
          ["📊 Rule Based","MCQ / band table / weighted scoring",C.teal]].map(([l,t,c])=>(
          <div key={l} title={t} style={{display:"flex",gap:5,alignItems:"center",cursor:"help"}}>
            <div style={{width:8,height:8,borderRadius:2,background:c,flexShrink:0}} />
            <span style={{fontSize:10,color:C.g500}}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
