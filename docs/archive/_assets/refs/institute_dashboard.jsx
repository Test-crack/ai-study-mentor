import { useState } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

// ─── TOKENS ───────────────────────────────────────────────────────────────────
const C = {
  indigo:"#4338CA", indigoD:"#3730A3", indigoL:"#EEF2FF", indigoM:"#C7D2FE",
  navy:"#1E2A4A",   navyL:"#2D3E6B",
  teal:"#0D9488",   tealL:"#CCFBF1",
  green:"#059669",  greenL:"#D1FAE5",
  amber:"#D97706",  amberL:"#FEF3C7",
  red:"#DC2626",    redL:"#FEE2E2",
  purple:"#7C3AED", purpleL:"#EDE9FE",
  coral:"#DC4C1B",  coralL:"#FAECE7",
  w:"#FFFFFF",
  g50:"#F9FAFB", g100:"#F3F4F6", g200:"#E5E7EB",
  g400:"#9CA3AF", g500:"#6B7280", g600:"#4B5563", g800:"#1F2937",
};

// ─── EXAM CONFIG (the exam-agnostic layer) ─────────────────────────────────
const EXAMS = {
  IELTS: {
    label:"IELTS", color:C.indigo, bg:C.indigoL, icon:"🎓",
    skills:["Listening","Reading","Writing","Speaking"],
    scoreLabel:"Band Score", scoreRange:"0–9", scoreSuffix:"",
    batches:4, students:62, avgScore:5.8, passTarget:7.0,
    description:"Academic & General Training",
  },
  GMAT: {
    label:"GMAT", color:C.teal, bg:C.tealL, icon:"📐",
    skills:["Verbal","Quant","Integrated Reasoning","Analytical Writing"],
    scoreLabel:"Total Score", scoreRange:"200–800", scoreSuffix:"pts",
    batches:2, students:24, avgScore:580, passTarget:700,
    description:"Focus Verbal + Quant",
  },
  PTE: {
    label:"PTE Academic", color:C.purple, bg:C.purpleL, icon:"💻",
    skills:["Speaking","Writing","Reading","Listening"],
    scoreLabel:"PTE Score", scoreRange:"10–90", scoreSuffix:"pts",
    batches:1, students:18, avgScore:58, passTarget:65,
    description:"Pearson English",
  },
  AWS: {
    label:"AWS Cloud", color:C.amber, bg:C.amberL, icon:"☁️",
    skills:["Cloud Concepts","Security","Technology","Billing"],
    scoreLabel:"Score", scoreRange:"100–1000", scoreSuffix:"pts",
    batches:1, students:12, avgScore:720, passTarget:720,
    description:"Solutions Architect · Cloud Practitioner",
  },
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const BATCHES = [
  {id:1,name:"IELTS Morning A",exam:"IELTS",instructor:"Meera Joseph",students:18,avgBand:5.9,atRisk:2,start:"Mar 2026",end:"Jul 2026",status:"active"},
  {id:2,name:"IELTS Evening B",exam:"IELTS",instructor:"Rahul Das",students:15,avgBand:5.6,atRisk:3,start:"Apr 2026",end:"Aug 2026",status:"active"},
  {id:3,name:"IELTS Weekend",exam:"IELTS",instructor:"Meera Joseph",students:16,avgBand:6.1,atRisk:1,start:"Feb 2026",end:"Jun 2026",status:"active"},
  {id:4,name:"IELTS Advanced",exam:"IELTS",instructor:"Priya Nair",students:13,avgBand:6.4,atRisk:0,start:"May 2026",end:"Sep 2026",status:"active"},
  {id:5,name:"GMAT Intensive",exam:"GMAT",instructor:"Arjun Menon",students:14,avgBand:590,atRisk:2,start:"Apr 2026",end:"Jul 2026",status:"active"},
  {id:6,name:"GMAT Weekend",exam:"GMAT",instructor:"Arjun Menon",students:10,avgBand:565,atRisk:1,start:"May 2026",end:"Aug 2026",status:"active"},
  {id:7,name:"PTE Starter",exam:"PTE",instructor:"Priya Nair",students:18,avgBand:56,atRisk:3,start:"May 2026",end:"Jul 2026",status:"active"},
  {id:8,name:"AWS Certification",exam:"AWS",instructor:"Rahul Das",students:12,avgBand:720,atRisk:0,start:"Apr 2026",end:"Jun 2026",status:"active"},
];

const INSTRUCTORS = [
  {name:"Meera Joseph",exams:["IELTS"],batches:2,students:34,avgImprovement:0.82,alertsResolved:8,rating:4.8},
  {name:"Rahul Das",exams:["IELTS","AWS"],batches:3,students:27,avgImprovement:0.65,alertsResolved:5,rating:4.5},
  {name:"Priya Nair",exams:["IELTS","PTE"],batches:2,students:31,avgImprovement:0.74,alertsResolved:6,rating:4.7},
  {name:"Arjun Menon",exams:["GMAT"],batches:2,students:24,avgImprovement:45,alertsResolved:3,rating:4.6},
];

const REVENUE_DATA = [
  {month:"Jan",revenue:42000,students:38,plans:5},
  {month:"Feb",revenue:58000,students:44,plans:6},
  {month:"Mar",revenue:71000,students:52,plans:8},
  {month:"Apr",revenue:84000,students:64,plans:10},
  {month:"May",revenue:96000,students:74,plans:12},
  {month:"Jun",revenue:112000,students:86,plans:14},
];

const PLAN_MIX = [
  {name:"Starter",value:28,color:C.teal},
  {name:"Growth",value:48,color:C.indigo},
  {name:"Enterprise",value:24,color:C.purple},
];

const ALERTS = [
  {level:"critical",name:"Sreejith Menon",batch:"IELTS Morning A",msg:"Exam in 15 days. Inactive 6 days. Band 4.75 vs target 7.0",exam:"IELTS",days:15},
  {level:"critical",name:"Meera Chandran",batch:"IELTS Evening B",msg:"Bands declining. Inactive 4 days. Exam in 35 days",exam:"IELTS",days:35},
  {level:"dropout",name:"Deepak Mathew",batch:"GMAT Intensive",msg:"Inactive 18 days. Only 3 sessions. Exam in 40 days",exam:"GMAT",days:40},
  {level:"plateau",name:"Ananya Thomas",batch:"IELTS Morning A",msg:"Listening stuck at 5.5 for 3 consecutive assessments",exam:"IELTS",days:38},
  {level:"plateau",name:"Rahul PTE",batch:"PTE Starter",msg:"Speaking sub-score plateau at 52 for 4 sessions",exam:"PTE",days:22},
];

const LEAD_DATA = [
  {month:"Mar",leads:12,conversions:8},
  {month:"Apr",leads:19,conversions:13},
  {month:"May",leads:27,conversions:18},
  {month:"Jun",leads:34,conversions:24},
];

const ACQUISITION = [
  {source:"WhatsApp Referral",count:38,color:C.green},
  {source:"Google Search",count:22,color:C.indigo},
  {source:"Institute Referral",count:18,color:C.teal},
  {source:"Social Media",count:12,color:C.purple},
  {source:"Walk-in",count:10,color:C.amber},
];

const READY_STUDENTS = [
  {name:"Aditi Mohan",exam:"IELTS",band:"6.75 (predicted)",skills:"Speaking 6.5 · Fluency 7.0 · Lexical 6.5",status:"exam_ready"},
  {name:"Kiran Suresh",exam:"IELTS",band:"6.75 (mock)",skills:"All skills ≥ 6.5 · Coherence 7.0",status:"exam_ready"},
  {name:"Rahul Varma",exam:"GMAT",band:"690 (mock)",skills:"Verbal 38 · Quant 47",status:"near_ready"},
];

// ─── MICRO COMPONENTS ─────────────────────────────────────────────────────────
const Pill = ({children,color,bg,small=false}) => (
  <span style={{display:"inline-block",padding:small?"1px 8px":"3px 10px",borderRadius:20,
    fontSize:small?10:11,fontWeight:700,background:bg||C.indigoL,color:color||C.indigo,
    letterSpacing:".03em"}}>{children}</span>
);

const Kpi = ({val,label,sub,color=C.indigo,trend}) => (
  <div style={{background:C.w,borderRadius:14,padding:"16px 18px",border:`1px solid ${C.g200}`,
    boxShadow:`0 1px 4px rgba(67,56,202,.06)`}}>
    <div style={{fontSize:28,fontWeight:800,color,letterSpacing:"-1px",lineHeight:1}}>{val}</div>
    <div style={{fontSize:12,fontWeight:600,color:C.g800,marginTop:4}}>{label}</div>
    {sub && <div style={{fontSize:11,color:C.g400,marginTop:2}}>{sub}</div>}
    {trend && <div style={{fontSize:11,color:C.green,fontWeight:600,marginTop:4}}>↑ {trend}</div>}
  </div>
);

const SectionHeader = ({title,sub,right}) => (
  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",marginBottom:14}}>
    <div>
      <div style={{fontSize:15,fontWeight:700,color:C.navy}}>{title}</div>
      {sub && <div style={{fontSize:11,color:C.g400,marginTop:2}}>{sub}</div>}
    </div>
    {right}
  </div>
);

const Card = ({children,style={}}) => (
  <div style={{background:C.w,borderRadius:14,border:`1px solid ${C.g200}`,
    boxShadow:`0 1px 4px rgba(67,56,202,.06)`,overflow:"hidden",...style}}>{children}</div>
);

const Dot = ({color,size=8}) => (
  <div style={{width:size,height:size,borderRadius:"50%",background:color,flexShrink:0,
    boxShadow:`0 0 0 ${size/2}px ${color}33`}} />
);

// ─── EXAM SWITCHER ────────────────────────────────────────────────────────────
const ExamSwitcher = ({active,onChange}) => (
  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
    {Object.entries(EXAMS).map(([key,ex])=>{
      const isActive = active===key;
      return (
        <button key={key} onClick={()=>onChange(key)}
          style={{display:"flex",alignItems:"center",gap:7,padding:"8px 14px",borderRadius:10,
            border:`1.5px solid ${isActive?ex.color:C.g200}`,
            background:isActive?ex.bg:C.w,
            color:isActive?ex.color:C.g500,
            fontFamily:"inherit",fontSize:13,fontWeight:isActive?700:500,
            cursor:"pointer",transition:"all .15s"}}>
          <span style={{fontSize:16}}>{ex.icon}</span>
          <span>{ex.label}</span>
          <span style={{fontSize:10,background:isActive?ex.color:C.g100,
            color:isActive?C.w:C.g400,padding:"1px 6px",borderRadius:20,fontWeight:700}}>
            {ex.batches}
          </span>
        </button>
      );
    })}
  </div>
);

// ─── VIEWS ────────────────────────────────────────────────────────────────────
const OverviewTab = ({exam,examData}) => {
  const examBatches = BATCHES.filter(b=>exam==="ALL"||b.exam===exam);
  const examAlerts = ALERTS.filter(a=>exam==="ALL"||a.exam===exam);
  const totalStudents = examBatches.reduce((s,b)=>s+b.students,0);
  const totalRisk = examBatches.reduce((s,b)=>s+b.atRisk,0);

  return (
    <div style={{display:"flex",flexDirection:"column",gap:16}}>
      {/* KPIs */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
        <Kpi val={examBatches.length} label="Active Batches" sub={exam==="ALL"?"All exams":examData?.label} color={examData?.color||C.indigo} trend="2 this month" />
        <Kpi val={totalStudents} label="Enrolled Students" sub="Across all batches" color={C.teal} trend="14 this week" />
        <Kpi val={totalRisk} label="Need Attention" sub="Alerts active now" color={totalRisk>2?C.red:C.amber} />
        <Kpi val={`₹${(REVENUE_DATA.at(-1).revenue/1000).toFixed(0)}K`} label="Revenue This Month" sub="Jun 2026" color={C.green} trend="↑ 16% MoM" />
        <Kpi val="86%" label="Retention Rate" sub="Students still active" color={C.purple} trend="↑ 4% MoM" />
      </div>

      {/* Alerts + Batch health */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1.4fr",gap:14}}>
        {/* Alerts */}
        <Card>
          <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.g100}`,
            display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div style={{fontSize:13,fontWeight:700,color:C.navy}}>Live Alerts</div>
            <Pill color={C.red} bg={C.redL}>{examAlerts.length} active</Pill>
          </div>
          <div style={{padding:"8px 10px",maxHeight:260,overflowY:"auto",display:"flex",flexDirection:"column",gap:6}}>
            {examAlerts.map((a,i)=>{
              const isCrit = a.level==="critical"||a.level==="dropout";
              return (
                <div key={i} style={{padding:"9px 12px",borderRadius:9,
                  background:isCrit?C.redL:C.amberL,
                  border:`1px solid ${isCrit?C.red+"33":C.amber+"33"}`,
                  display:"flex",gap:9,alignItems:"flex-start"}}>
                  <span style={{fontSize:15,flexShrink:0}}>{isCrit?"🚨":"⚠️"}</span>
                  <div>
                    <div style={{display:"flex",gap:6,alignItems:"center",marginBottom:2}}>
                      <span style={{fontSize:12,fontWeight:700,color:isCrit?C.red:C.amber}}>{a.name}</span>
                      <Pill small color={EXAMS[a.exam]?.color} bg={EXAMS[a.exam]?.bg}>{a.exam}</Pill>
                    </div>
                    <div style={{fontSize:11,color:C.g600,lineHeight:1.4}}>{a.msg}</div>
                    <div style={{fontSize:10,color:C.g400,marginTop:3}}>Batch: {a.batch} · {a.days} days to exam</div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Batch health table */}
        <Card>
          <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.g100}`}}>
            <div style={{fontSize:13,fontWeight:700,color:C.navy}}>Batch Health</div>
          </div>
          <div style={{overflow:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead>
                <tr style={{background:C.g50}}>
                  {["Batch","Exam","Instructor","Students","Avg Score","At Risk","Status"].map(h=>(
                    <th key={h} style={{padding:"8px 12px",textAlign:"left",fontSize:10,
                      fontWeight:700,color:C.g400,textTransform:"uppercase",letterSpacing:".04em",
                      whiteSpace:"nowrap"}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {examBatches.map((b,i)=>{
                  const ex = EXAMS[b.exam];
                  return (
                    <tr key={b.id} style={{borderTop:`1px solid ${C.g100}`,background:i%2===0?C.w:C.g50}}>
                      <td style={{padding:"9px 12px",fontWeight:600,color:C.navy}}>{b.name}</td>
                      <td style={{padding:"9px 12px"}}><Pill small color={ex?.color} bg={ex?.bg}>{b.exam}</Pill></td>
                      <td style={{padding:"9px 12px",color:C.g600}}>{b.instructor}</td>
                      <td style={{padding:"9px 12px",textAlign:"center",fontWeight:600}}>{b.students}</td>
                      <td style={{padding:"9px 12px",textAlign:"center",fontWeight:700,
                        color:C.indigo}}>{b.avgBand}</td>
                      <td style={{padding:"9px 12px",textAlign:"center"}}>
                        {b.atRisk>0?<Pill small color={b.atRisk>2?C.red:C.amber} bg={b.atRisk>2?C.redL:C.amberL}>{b.atRisk}</Pill>
                          :<span style={{fontSize:11,color:C.green}}>✓ 0</span>}
                      </td>
                      <td style={{padding:"9px 12px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:5}}>
                          <Dot color={b.status==="active"?C.green:C.amber} size={6} />
                          <span style={{fontSize:11,color:C.g500,textTransform:"capitalize"}}>{b.status}</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};

const FinancialTab = () => (
  <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      <Kpi val="₹1.12L" label="Monthly Revenue" sub="Jun 2026" color={C.green} trend="16% MoM" />
      <Kpi val="₹5.83L" label="Revenue YTD" sub="Jan–Jun 2026" color={C.teal} trend="On track for ₹12L" />
      <Kpi val="116" label="Total Students" sub="Across all exams" color={C.indigo} />
      <Kpi val="₹966" label="Avg Revenue / Student" sub="Monthly" color={C.purple} trend="↑ ₹84 MoM" />
    </div>

    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:14}}>
      <Card>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.g100}`}}>
          <SectionHeader title="Revenue & Student Growth" sub="Monthly Jan–Jun 2026" />
        </div>
        <div style={{padding:16}}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={REVENUE_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.g100} />
              <XAxis dataKey="month" tick={{fontSize:11}} />
              <YAxis yAxisId="rev" tick={{fontSize:10}} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`} />
              <YAxis yAxisId="stu" orientation="right" tick={{fontSize:10}} />
              <Tooltip formatter={(v,n)=>n==="Revenue"?[`₹${v.toLocaleString()}`,n]:[v,n]} />
              <Legend iconType="circle" wrapperStyle={{fontSize:11}} />
              <Line yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue" stroke={C.green} strokeWidth={2.5} dot={{r:4}} />
              <Line yAxisId="stu" type="monotone" dataKey="students" name="Students" stroke={C.indigo} strokeWidth={2} dot={{r:3}} strokeDasharray="5 3" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.g100}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.navy}}>Plan Distribution</div>
        </div>
        <div style={{padding:16,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={PLAN_MIX} cx="50%" cy="50%" innerRadius={40} outerRadius={65}
                dataKey="value" nameKey="name" paddingAngle={3}>
                {PLAN_MIX.map((e,i)=><Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip formatter={(v)=>[`${v} students`,""]} />
            </PieChart>
          </ResponsiveContainer>
          {PLAN_MIX.map(p=>(
            <div key={p.name} style={{display:"flex",justifyContent:"space-between",
              width:"100%",padding:"5px 0",borderBottom:`1px solid ${C.g100}`}}>
              <div style={{display:"flex",alignItems:"center",gap:7}}>
                <div style={{width:10,height:10,borderRadius:3,background:p.color}} />
                <span style={{fontSize:12,color:C.g600}}>{p.name}</span>
              </div>
              <div style={{fontSize:12,fontWeight:700,color:C.navy}}>{p.value} students</div>
            </div>
          ))}
        </div>
      </Card>
    </div>

    <Card>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.g100}`}}>
        <SectionHeader title="Revenue by Exam Type" sub="Jun 2026" />
      </div>
      <div style={{padding:16}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
          {Object.entries(EXAMS).map(([key,ex])=>{
            const rev = {IELTS:84000,GMAT:18400,PTE:7200,AWS:2400}[key];
            const pct = Math.round(rev/112000*100);
            return (
              <div key={key} style={{padding:"14px 16px",borderRadius:12,background:ex.bg,border:`1px solid ${ex.color}33`}}>
                <div style={{display:"flex",gap:8,alignItems:"center",marginBottom:8}}>
                  <span style={{fontSize:18}}>{ex.icon}</span>
                  <span style={{fontSize:12,fontWeight:700,color:ex.color}}>{ex.label}</span>
                </div>
                <div style={{fontSize:22,fontWeight:800,color:ex.color}}>₹{(rev/1000).toFixed(1)}K</div>
                <div style={{fontSize:11,color:C.g500,marginTop:2}}>{pct}% of total · {ex.students} students</div>
                <div style={{height:4,background:`${ex.color}22`,borderRadius:99,marginTop:10}}>
                  <div style={{height:"100%",width:`${pct}%`,background:ex.color,borderRadius:99}} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  </div>
);

const MarketingTab = () => (
  <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      <Kpi val="34" label="Leads This Month" sub="Jun 2026" color={C.indigo} trend="↑ 26% MoM" />
      <Kpi val="71%" label="Lead → Enroll Rate" sub="Conversion rate" color={C.green} trend="↑ 8% MoM" />
      <Kpi val="₹1,890" label="Cost per Acquisition" sub="Avg across sources" color={C.amber} />
      <Kpi val="4.2x" label="Institute Referral Rate" sub="Instit referred by students" color={C.purple} />
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Card>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.g100}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.navy}}>Lead Pipeline — Last 4 Months</div>
        </div>
        <div style={{padding:16}}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={LEAD_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke={C.g100} />
              <XAxis dataKey="month" tick={{fontSize:11}} />
              <YAxis tick={{fontSize:11}} />
              <Tooltip />
              <Legend iconType="circle" wrapperStyle={{fontSize:11}} />
              <Bar dataKey="leads" name="Leads" fill={C.indigoM} radius={[4,4,0,0]} />
              <Bar dataKey="conversions" name="Enrolled" fill={C.indigo} radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.g100}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.navy}}>Student Acquisition Sources</div>
        </div>
        <div style={{padding:"10px 16px",display:"flex",flexDirection:"column",gap:8}}>
          {ACQUISITION.map((a,i)=>{
            const total = ACQUISITION.reduce((s,x)=>s+x.count,0);
            const pct = Math.round(a.count/total*100);
            return (
              <div key={i}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:4}}>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <div style={{width:10,height:10,borderRadius:3,background:a.color}} />
                    <span style={{fontSize:12,color:C.g600}}>{a.source}</span>
                  </div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <span style={{fontSize:11,color:C.g400}}>{a.count} students</span>
                    <Pill small color={a.color} bg={`${a.color}22`}>{pct}%</Pill>
                  </div>
                </div>
                <div style={{height:6,background:C.g100,borderRadius:99}}>
                  <div style={{height:"100%",width:`${pct}%`,background:a.color,borderRadius:99,transition:"width .4s"}} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>

    <Card>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.g100}`,background:`linear-gradient(90deg,${C.purpleL},${C.indigoL})`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.navy}}>Content & Campaign Performance</div>
        <div style={{fontSize:11,color:C.g500,marginTop:2}}>LinkedIn · Instagram · YouTube · WhatsApp</div>
      </div>
      <div style={{padding:14,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:10}}>
        {[
          {platform:"LinkedIn",posts:12,impressions:"8.4K",engagement:"6.2%",leads:14,icon:"💼",color:C.indigo},
          {platform:"Instagram",posts:18,impressions:"12.1K",engagement:"4.8%",leads:8,icon:"📸",color:C.purple},
          {platform:"YouTube",posts:4,impressions:"3.2K",engagement:"7.4%",leads:6,icon:"▶️",color:C.red},
          {platform:"WhatsApp",posts:"—",impressions:"—",engagement:"—",leads:38,icon:"💬",color:C.green},
        ].map(p=>(
          <div key={p.platform} style={{padding:"12px 14px",borderRadius:10,border:`1px solid ${C.g200}`,background:C.g50}}>
            <div style={{display:"flex",gap:7,alignItems:"center",marginBottom:8}}>
              <span style={{fontSize:20}}>{p.icon}</span>
              <span style={{fontSize:12,fontWeight:700,color:p.color}}>{p.platform}</span>
            </div>
            {[["Posts",p.posts],["Impressions",p.impressions],["Engagement",p.engagement],["Leads",p.leads]].map(([k,v])=>(
              <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"3px 0",
                borderBottom:`1px solid ${C.g200}`}}>
                <span style={{fontSize:10,color:C.g400}}>{k}</span>
                <span style={{fontSize:11,fontWeight:700,color:C.navy}}>{v}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </Card>
  </div>
);

const InstructorTab = () => (
  <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
      <Kpi val="4" label="Active Instructors" sub="Across all exams" color={C.indigo} />
      <Kpi val="8" label="Total Batches" sub="All running" color={C.teal} />
      <Kpi val="0.76" label="Avg Band Improvement" sub="Per student per instructor" color={C.green} />
      <Kpi val="22" label="Alerts Resolved" sub="This month" color={C.purple} />
    </div>

    <Card>
      <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.g100}`}}>
        <div style={{fontSize:13,fontWeight:700,color:C.navy}}>Instructor Performance Comparison</div>
        <div style={{fontSize:11,color:C.g400,marginTop:2}}>Which instructor is producing the best results</div>
      </div>
      <div style={{overflow:"auto"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
          <thead>
            <tr style={{background:C.g50}}>
              {["Instructor","Exams","Batches","Students","Avg Improvement","Alerts Resolved","Rating"].map(h=>(
                <th key={h} style={{padding:"9px 14px",textAlign:"left",fontSize:10,fontWeight:700,
                  color:C.g400,textTransform:"uppercase",letterSpacing:".04em",whiteSpace:"nowrap"}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {INSTRUCTORS.sort((a,b)=>b.avgImprovement-a.avgImprovement).map((ins,i)=>(
              <tr key={ins.name} style={{borderTop:`1px solid ${C.g100}`,background:i===0?C.greenL:i%2===0?C.w:C.g50}}>
                <td style={{padding:"10px 14px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <div style={{width:32,height:32,borderRadius:"50%",background:C.indigo,
                      display:"flex",alignItems:"center",justifyContent:"center",
                      fontSize:13,fontWeight:700,color:C.w,flexShrink:0}}>
                      {ins.name.split(" ").map(n=>n[0]).join("")}
                    </div>
                    <div>
                      <div style={{fontWeight:700,color:C.navy,fontSize:13}}>{ins.name}</div>
                      {i===0 && <Pill small color={C.green} bg={C.greenL}>Top Performer</Pill>}
                    </div>
                  </div>
                </td>
                <td style={{padding:"10px 14px"}}>
                  <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
                    {ins.exams.map(e=><Pill key={e} small color={EXAMS[e]?.color} bg={EXAMS[e]?.bg}>{e}</Pill>)}
                  </div>
                </td>
                <td style={{padding:"10px 14px",textAlign:"center",fontWeight:600}}>{ins.batches}</td>
                <td style={{padding:"10px 14px",textAlign:"center",fontWeight:600}}>{ins.students}</td>
                <td style={{padding:"10px 14px",textAlign:"center"}}>
                  <span style={{fontWeight:700,fontSize:14,
                    color:ins.avgImprovement>0.75?C.green:ins.avgImprovement>0.6?C.indigo:C.amber}}>
                    {ins.exams.includes("GMAT")?`+${ins.avgImprovement}pts`:`+${ins.avgImprovement} bands`}
                  </span>
                </td>
                <td style={{padding:"10px 14px",textAlign:"center",color:C.purple,fontWeight:600}}>{ins.alertsResolved}</td>
                <td style={{padding:"10px 14px",textAlign:"center"}}>
                  <span style={{fontWeight:700,color:C.amber}}>★ {ins.rating}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      {INSTRUCTORS.slice(0,2).map(ins=>(
        <Card key={ins.name} style={{padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:14}}>
            <div style={{display:"flex",gap:10,alignItems:"center"}}>
              <div style={{width:40,height:40,borderRadius:"50%",background:C.indigo,
                display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:C.w}}>
                {ins.name.split(" ").map(n=>n[0]).join("")}
              </div>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:C.navy}}>{ins.name}</div>
                <div style={{display:"flex",gap:4,marginTop:2}}>
                  {ins.exams.map(e=><Pill key={e} small color={EXAMS[e]?.color} bg={EXAMS[e]?.bg}>{e}</Pill>)}
                </div>
              </div>
            </div>
            <span style={{fontSize:14,fontWeight:700,color:C.amber}}>★ {ins.rating}</span>
          </div>
          {[["Batches managed",ins.batches],["Students taught",ins.students],
            ["Avg improvement",ins.exams.includes("GMAT")?`+${ins.avgImprovement}pts`:`+${ins.avgImprovement} bands`],
            ["Alerts resolved",`${ins.alertsResolved} this month`]].map(([k,v])=>(
            <div key={k} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",
              borderBottom:`1px solid ${C.g100}`}}>
              <span style={{fontSize:12,color:C.g500}}>{k}</span>
              <span style={{fontSize:12,fontWeight:700,color:C.navy}}>{v}</span>
            </div>
          ))}
        </Card>
      ))}
    </div>
  </div>
);

const CareerTab = () => (
  <div style={{display:"flex",flexDirection:"column",gap:16}}>
    <div style={{background:`linear-gradient(135deg,${C.navy},${C.navyL})`,borderRadius:14,padding:"20px 24px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <Pill color="#C7D2FE" bg="rgba(67,56,202,.3)">Hireflow — Career Launch Layer</Pill>
          <div style={{fontSize:20,fontWeight:800,color:C.w,marginTop:10,lineHeight:1.2}}>
            Your students don't just pass exams.<br/>They get placed.
          </div>
          <div style={{fontSize:12,color:"rgba(255,255,255,.6)",marginTop:8,maxWidth:500}}>
            TestCrack's sub-skill performance data is the most verified candidate profile in the market. Employers hire based on 8 weeks of AI-assessed competency — not just a score certificate.
          </div>
        </div>
        <div style={{textAlign:"right",flexShrink:0}}>
          <div style={{fontSize:28,fontWeight:800,color:"#818CF8"}}>3</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,.5)"}}>Students exam-ready<br/>for placement</div>
        </div>
      </div>
    </div>

    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Card>
        <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.g100}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.navy}}>Students Ready for Placement</div>
          <div style={{fontSize:11,color:C.g400,marginTop:2}}>Achieved target band or predicted score within range</div>
        </div>
        <div style={{padding:12,display:"flex",flexDirection:"column",gap:8}}>
          {READY_STUDENTS.map((s,i)=>{
            const isReady = s.status==="exam_ready";
            return (
              <div key={i} style={{padding:"11px 14px",borderRadius:10,
                background:isReady?C.greenL:C.amberL,border:`1px solid ${isReady?C.green+"33":C.amber+"33"}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:C.navy,marginBottom:3}}>{s.name}</div>
                    <Pill small color={EXAMS[s.exam]?.color} bg={EXAMS[s.exam]?.bg}>{s.exam}</Pill>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:14,fontWeight:800,color:isReady?C.green:C.amber}}>{s.band}</div>
                    <Pill small color={isReady?C.green:C.amber} bg={isReady?C.greenL:C.amberL}>
                      {isReady?"Exam Ready":"Near Ready"}
                    </Pill>
                  </div>
                </div>
                <div style={{fontSize:11,color:C.g600,marginTop:6,padding:"6px 0",
                  borderTop:`1px solid ${isReady?C.green+"22":C.amber+"22"}`}}>
                  Sub-skill profile: {s.skills}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <div style={{padding:"13px 16px",borderBottom:`1px solid ${C.g100}`}}>
          <div style={{fontSize:13,fontWeight:700,color:C.navy}}>Placement Pipeline</div>
        </div>
        <div style={{padding:16,display:"flex",flexDirection:"column",gap:10}}>
          {[
            {stage:"Sub-skill Profile Generated",count:14,color:C.indigo,desc:"Students with 4+ Internal Assessments"},
            {stage:"Target Band Achieved",count:5,color:C.teal,desc:"Verified through formal assessment"},
            {stage:"Mock Test Cleared",count:3,color:C.green,desc:"Predicted band within 0.5 of target"},
            {stage:"Ready for Employer Matching",count:3,color:C.purple,desc:"Hireflow profile activated"},
            {stage:"Placed / Interview Stage",count:1,color:C.amber,desc:"Employer engaged via Hireflow"},
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",gap:12,alignItems:"center"}}>
              <div style={{width:36,height:36,borderRadius:9,background:`${s.color}22`,
                display:"flex",alignItems:"center",justifyContent:"center",
                fontSize:16,fontWeight:800,color:s.color,flexShrink:0}}>{s.count}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:12,fontWeight:600,color:C.navy}}>{s.stage}</div>
                <div style={{fontSize:10,color:C.g400}}>{s.desc}</div>
              </div>
              <div style={{width:80,height:6,background:C.g100,borderRadius:99}}>
                <div style={{height:"100%",width:`${(s.count/14)*100}%`,background:s.color,borderRadius:99}} />
              </div>
            </div>
          ))}
        </div>
        <div style={{margin:"0 16px 16px",padding:"12px 14px",background:`linear-gradient(135deg,${C.purpleL},${C.indigoL})`,
          borderRadius:10,border:`1px solid ${C.indigoM}`}}>
          <div style={{fontSize:11,fontWeight:700,color:C.purple,marginBottom:4}}>Coming in Phase 3</div>
          <div style={{fontSize:11,color:C.g600,lineHeight:1.6}}>
            AI-powered employer-candidate matching based on sub-skill verified profiles. Employers browse candidates by skill score, not just IELTS band. Your placement cell becomes a data-driven recruitment engine.
          </div>
        </div>
      </Card>
    </div>
  </div>
);

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function InstituteDashboard() {
  const [activeExam, setActiveExam] = useState("IELTS");
  const [activeTab, setActiveTab] = useState("overview");

  const examData = EXAMS[activeExam];
  const totalAlerts = ALERTS.length;

  const TABS = [
    {id:"overview",   label:"Overview",    icon:"🏠"},
    {id:"financial",  label:"Financial",   icon:"💰"},
    {id:"marketing",  label:"Marketing",   icon:"📣"},
    {id:"instructors",label:"Instructors", icon:"👩‍🏫"},
    {id:"career",     label:"Career Launch",icon:"🚀"},
  ];

  return (
    <div style={{fontFamily:"'DM Sans',system-ui,sans-serif",background:C.g50,minHeight:"100vh",display:"flex",flexDirection:"column"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:#C7D2FE;border-radius:2px}
        button{font-family:inherit;}
      `}</style>

      {/* Top bar */}
      <div style={{background:C.navy,padding:"0 24px",display:"flex",alignItems:"center",
        justifyContent:"space-between",height:54,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:14}}>
          <div style={{width:32,height:32,background:C.indigo,borderRadius:8,display:"flex",
            alignItems:"center",justifyContent:"center",fontSize:16,color:C.w,fontWeight:800}}>T</div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:C.w,lineHeight:1}}>TestCrack</div>
            <div style={{fontSize:10,color:"rgba(255,255,255,.4)"}}>Institute Dashboard · Bright Future IELTS Academy</div>
          </div>
        </div>
        <div style={{display:"flex",gap:8,alignItems:"center"}}>
          <div style={{display:"flex",alignItems:"center",gap:6,padding:"5px 12px",
            background:"rgba(220,38,38,.2)",borderRadius:8,border:"1px solid rgba(220,38,38,.3)"}}>
            <span style={{fontSize:12}}>🚨</span>
            <span style={{fontSize:12,fontWeight:700,color:C.red}}>{totalAlerts} alerts</span>
          </div>
          <div style={{width:32,height:32,borderRadius:"50%",background:C.indigo,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:C.w,fontWeight:700}}>
            PK
          </div>
        </div>
      </div>

      {/* Exam switcher bar */}
      <div style={{background:C.w,padding:"12px 24px",borderBottom:`1px solid ${C.g200}`,
        display:"flex",alignItems:"center",gap:16,flexShrink:0}}>
        <div style={{fontSize:12,fontWeight:600,color:C.g400,flexShrink:0}}>Active Exam:</div>
        <ExamSwitcher active={activeExam} onChange={setActiveExam} />
        {examData && (
          <div style={{marginLeft:"auto",padding:"6px 14px",borderRadius:9,
            background:examData.bg,border:`1px solid ${examData.color}33`,flexShrink:0}}>
            <span style={{fontSize:12,fontWeight:700,color:examData.color}}>
              {examData.icon} {examData.label} · {examData.students} students · Avg {examData.scoreLabel}: {examData.avgScore}{examData.scoreSuffix}
            </span>
          </div>
        )}
      </div>

      {/* Section tabs */}
      <div style={{background:C.w,padding:"0 24px",borderBottom:`1px solid ${C.g200}`,
        display:"flex",gap:0,flexShrink:0}}>
        {TABS.map(t=>{
          const isA = activeTab===t.id;
          return (
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              style={{display:"flex",gap:6,alignItems:"center",padding:"12px 18px",
                border:"none",borderBottom:`2.5px solid ${isA?C.indigo:"transparent"}`,
                background:"transparent",color:isA?C.indigo:C.g500,
                fontSize:13,fontWeight:isA?700:500,cursor:"pointer",transition:"all .15s",
                whiteSpace:"nowrap"}}>
              <span style={{fontSize:15}}>{t.icon}</span>{t.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div style={{flex:1,padding:"20px 24px",overflow:"auto"}}>
        {activeTab==="overview"    && <OverviewTab exam={activeExam} examData={examData} />}
        {activeTab==="financial"   && <FinancialTab />}
        {activeTab==="marketing"   && <MarketingTab />}
        {activeTab==="instructors" && <InstructorTab />}
        {activeTab==="career"      && <CareerTab />}
      </div>
    </div>
  );
}
