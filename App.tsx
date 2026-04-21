/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect, useMemo } from 'react';
import {
  LayoutDashboard,
  FileEdit,
  CloudUpload,
  BarChart3,
  HelpCircle,
  Archive,
  Search,
  Bell,
  Settings,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  Tag,
  Users,
  Building2,
  Briefcase,
  Calendar,
  Info,
  Bold,
  Italic,
  List,
  ListOrdered,
  Table as TableIcon,
  Image as ImageIcon,
  Plus,
  ArrowRight,
  CheckCircle2,
  BookOpen,
  Bot,
  Activity,
  BarChart
} from 'lucide-react';

/** FastAPI analysis server base (no trailing slash). In Docker, nginx serves under /api/analysis/. */
const ANALYSIS_SERVER =
  import.meta.env.VITE_ANALYSIS_SERVER ?? 'https://abhilash6944-aerchain-procuremnt.hf.space/';
/** Ollama /api/chat URL. In Docker, use /api/ollama/api/chat (same-origin via nginx). */
const OLLAMA_CHAT_URL =
  import.meta.env.VITE_OLLAMA_CHAT_URL ?? 'http://localhost:11434/api/chat';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer,
  BarChart as ReBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  AreaChart, Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { extractContent } from './utils/documentParser';
import { DocumentViewer } from './components/DocumentViewer';
import { CitationsRenderer } from './components/CitationsRenderer';

// --- Types ---

interface LineItem {
  id: number;
  name: string;
  category: string;
  description: string;
  hsnSac: string;
  uom: string;
}

interface TimelineDate {
  label: string;
  date: string;
}

interface Question {
  id: number;
  text: string;
  tag: string;
}

// --- Constants ---

const sowPoints = [
  "Strategy & Planning", "Creative Quality", "Production Speed", 
  "Market Reach", "Media Optimization", "Compliance Score", 
  "Resource Density", "Project Governance"
];

const V_COLORS = ["#818cf8", "#f472b6", "#34d399", "#fbbf24", "#a78bfa", "#f87171", "#22d3ee", "#fb923c"];

// Base vendor data
const baseVendors = [
  {
    name: "Nexus Creative",
    status: "Verified",
    cost: 450000,
    scores: [8, 9, 7, 8, 9, 8, 7, 8],
    savings: 12,
    compliance: 94,
    color: "#818cf8"
  },
  {
    name: "Global Media Hub",
    status: "Premium",
    cost: 520000,
    scores: [9, 7, 9, 7, 8, 9, 9, 7],
    savings: 8,
    compliance: 98,
    color: "#f472b6"
  },
  {
    name: "Velocity Studios",
    status: "Fast Track",
    cost: 380000,
    scores: [7, 8, 8, 9, 7, 8, 8, 9],
    savings: 18,
    compliance: 88,
    color: "#34d399"
  }
];

// --- Components ---

// --- Data-Driven Recommendation Component ---

const StrategyRecommendation = ({ extractedData, costData, radarData }: any) => {
  const [selectedScenario, setSelectedScenario] = (useState as any)('Cost');

  const reports = extractedData?.reports || [];
  
  if (reports.length === 0) {
    return (
      <section className="bg-white rounded-[40px] p-12 border border-slate-200 shadow-2xl">
         <div className="text-center space-y-4">
           <Bot size={48} className="text-slate-300 mx-auto" />
           <p className="text-slate-500 font-bold">Analysis results required for detailed strategy recommendation.</p>
         </div>
      </section>
    );
  }

  // Calculate bests
  const bestCost = [...reports].sort((a, b) => a.totalCost - b.totalCost)[0];
  const bestSpeed = [...reports].sort((a, b) => {
    const aS = a.scores.Speed || a.scores.Production || 0;
    const bS = b.scores.Speed || b.scores.Production || 0;
    return bS - aS;
  })[0];
  const bestCompliance = [...reports].sort((a, b) => {
    const aC = a.scores.Compliance || 0;
    const bC = b.scores.Compliance || 0;
    return bC - aC;
  })[0];

  // Logic for split award
  const splitPossible = reports.length >= 2;
  const bestCreative = [...reports].sort((a, b) => (b.scores.Creative || 0) - (a.scores.Creative || 0))[0];
  const bestMedia = [...reports].sort((a, b) => (b.scores.Media || 0) - (a.scores.Media || 0))[0];
  
  const isSplitBetter = splitPossible && (bestCreative.vendorName !== bestMedia.vendorName);

  const scenarioData: any = {
    Cost: {
      title: "Lowest Cost Pathway",
      vendor: bestCost.vendorName,
      impact: "Maximizes remaining budget for media amplification.",
      savings: `$${((1.35e6 - bestCost.totalCost) / 1000).toFixed(0)}K`,
      confidence: 94,
      risk: "Potential delay in high-fidelity TVC production due to lower resource allocation.",
      businessValue: "Ideal for testing market proof-of-concept with minimal capital risk. Frees up ~$200k for performance-driven media buying."
    },
    Speed: {
      title: "Fastest Delivery Pathway",
      vendor: bestSpeed.vendorName,
      impact: "Accelerates SEA launch by an estimated 3 weeks.",
      savings: `$${((1.35e6 - bestSpeed.totalCost) / 1000).toFixed(0)}K`,
      confidence: 88,
      risk: "Premium pricing for express creative resources and rapid deployment.",
      businessValue: "Maximizes first-mover advantage in competitive SEA health drink segments. Estimated +12% lift in market share due to early launch."
    },
    Compliance: {
      title: "Maximum Compliance Pathway",
      vendor: bestCompliance.vendorName,
      impact: "Zero regulatory rejection risk in cross-border markets.",
      savings: `$${((1.35e6 - bestCompliance.totalCost) / 1000).toFixed(0)}K`,
      confidence: 98,
      risk: "More conservative creative approach to meet strict regulatory guidelines.",
      businessValue: "Ensures 100% brand safety. Avoids potential $200k+ in regulatory fines and protect local broadcast licenses."
    }
  };

  const current = scenarioData[selectedScenario];

  return (
    <section className="bg-white rounded-[40px] p-12 border border-slate-200 relative overflow-hidden group shadow-2xl transition-all">
       <div className="absolute top-0 right-0 p-8 opacity-5 rotate-12 group-hover:scale-110 transition-transform">
         <Sparkles size={200} className="text-primary" />
       </div>
       
       <div className="relative z-10">
         <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-8">
           <div className="flex items-center gap-3">
             <div className="p-3 bg-primary/10 rounded-2xl">
               <Sparkles size={24} className="text-primary" />
             </div>
             <div>
               <span className="bg-primary text-white text-[10px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-lg shadow-primary/20">Executive Strategy Recommendation</span>
               <p className="text-xs text-slate-500 font-medium mt-1">Multi-scenario data analysis across all vendor submissions</p>
             </div>
           </div>
           
           <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
              {(['Cost', 'Speed', 'Compliance'] as const).map(s => (
                <button 
                  key={s} 
                  onClick={() => setSelectedScenario(s)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${selectedScenario === s ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  {s} Path
                </button>
              ))}
           </div>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
           <div className="space-y-10">
             <div>
               <h3 className="text-3xl font-black text-slate-900 leading-tight mb-4">
                 Strategic Recommendation: <br/><span className="text-primary underline decoration-primary/20">{isSplitBetter ? "Hybrid Split Award" : `Single Award Pathway`}</span>
               </h3>
               
               <div className="bg-primary/5 border border-primary/20 rounded-3xl p-8 shadow-sm">
                  <p className="text-lg font-bold text-slate-800 leading-relaxed italic">
                    {isSplitBetter ? (
                      <>“Recommendation: Split the mandate between <span className="text-primary"> {bestCreative.vendorName} </span> for Strategy & Production and <span className="text-indigo-600"> {bestMedia.vendorName} </span> for Media.”</>
                    ) : (
                      <>“Recommendation: Award a single consolidated mandate to <span className="text-primary"> {current.vendor} </span> to simplify governance and maximize price leverage.”</>
                    )}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                        <Activity size={12} className="text-primary" /> Projected Savings
                      </p>
                      <p className="text-2xl font-black text-emerald-500">{current.savings}</p>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1 flex items-center gap-1.5">
                        <Users size={12} className="text-indigo-500" /> Confidence Index
                      </p>
                      <p className="text-2xl font-black text-indigo-500">{current.confidence}%</p>
                    </div>
                  </div>
               </div>
             </div>

             <div className="space-y-6">
               <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                 <div className="w-4 h-[1px] bg-primary" /> Detailed Business Rationale
               </h4>
               <div className="grid grid-cols-1 gap-4">
                 <div className="p-6 bg-emerald-50/50 border border-emerald-100 rounded-3xl group/item hover:bg-emerald-50 transition-all">
                   <div className="flex items-center justify-between mb-3">
                     <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">✓ Profit & Performance Benefits</p>
                     <CheckCircle2 size={16} className="text-emerald-500" />
                   </div>
                   <p className="text-sm text-emerald-900 font-medium leading-relaxed">{current.businessValue}</p>
                 </div>
                 <div className="p-6 bg-rose-50/50 border border-rose-100 rounded-3xl group/item hover:bg-rose-50 transition-all">
                   <div className="flex items-center justify-between mb-3">
                     <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest">⚠ Trade-offs & Risks</p>
                     <Info size={16} className="text-rose-400" />
                   </div>
                   <p className="text-sm text-rose-900 font-medium leading-relaxed">{current.risk}</p>
                 </div>
               </div>
             </div>
           </div>

           <div className="space-y-10">
              <div className="bg-slate-50 border border-slate-100 rounded-[40px] p-10 shadow-inner">
                <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center justify-between">
                  <span>Capability Heatmap: {current.vendor}</span>
                  <span className="text-[10px] text-slate-400">vs Competition</span>
                </h4>
                
                <div className="space-y-8">
                   {['Strategy', 'Media', 'Production', 'Compliance'].map(capability => {
                     const score = current.vendor === bestCost.vendorName ? 85 : 92;
                     return (
                       <div key={capability} className="space-y-3">
                         <div className="flex justify-between items-end">
                           <p className="text-xs font-bold text-slate-700">{capability} Depth</p>
                           <p className="text-xs font-black text-slate-900">{score}%</p>
                         </div>
                         <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                           <motion.div 
                             initial={{ width: 0 }}
                             animate={{ width: `${score}%` }}
                             className={`h-full ${score > 90 ? 'bg-primary' : 'bg-indigo-400'}`}
                            />
                         </div>
                       </div>
                     );
                   })}

                   <div className="pt-8 border-t border-slate-200 space-y-4">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Incremental ROI Benchmarks</p>
                      <div className="flex gap-4">
                        <div className="flex-1 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Impact</p>
                           <p className="text-lg font-black text-emerald-500">+18.4%</p>
                        </div>
                        <div className="flex-1 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm text-center">
                           <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Launch Delay</p>
                           <p className="text-lg font-black text-slate-900">0 Days</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>

              <div className="p-8 bg-slate-900 rounded-[40px] text-white relative overflow-hidden shadow-2xl">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[60px] rounded-full" />
                 <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-4">Strategic Summary</p>
                 <p className="text-base font-medium leading-relaxed italic text-slate-300 relative z-10">
                   "Selecting **{isSplitBetter ? `${bestCreative.vendorName} + ${bestMedia.vendorName}` : current.vendor}** leverages superior domain expertise while optimizing for {selectedScenario.toLowerCase()}. This choice balances aggressive SEA market reach with {current.confidence}% compliance certainty, ensuring a premium brand debut for NutriKid."
                 </p>
              </div>
           </div>
         </div>
       </div>
    </section>
  );
};

const SidebarItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
  <a
    href="#"
    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${active
      ? 'bg-white shadow-sm text-primary font-semibold'
      : 'text-slate-500 hover:text-primary hover:bg-white/50'
      }`}
  >
    <Icon size={20} className={active ? 'text-primary' : 'group-hover:text-primary'} />
    <span className="text-[11px] uppercase tracking-widest font-bold">{label}</span>
  </a>
);

const InputField = ({ label, icon: Icon, value, readOnly = false }: { label: string, icon?: any, value: string, readOnly?: boolean }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <div className="relative flex items-center">
      {Icon && <Icon size={16} className="absolute left-3 text-slate-400" />}
      <input
        className={`w-full bg-slate-50 border border-slate-200 rounded-lg py-2.5 ${Icon ? 'pl-10' : 'px-4'} pr-4 text-sm text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all`}
        type="text"
        defaultValue={value}
        readOnly={readOnly}
      />
    </div>
  </div>
);

const SelectField = ({ label, options, defaultValue }: { label: string, options: string[], defaultValue: string }) => (
  <div className="space-y-1.5">
    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
    <div className="relative">
      <select className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg py-2.5 px-4 text-sm text-slate-800 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none transition-all">
        {options.map(opt => <option key={opt} selected={opt === defaultValue}>{opt}</option>)}
      </select>
      <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

export default function App() {
  const [currentStep, setCurrentStep] = useState<'RFQ' | 'Vendor' | 'Dashboard'>('RFQ');
  const [activeScenario, setActiveScenario] = useState<'Standard' | 'Cost-Optimized' | 'Best-Value'>('Standard');
  const [isScopeExpanded, setIsScopeExpanded] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [selectedFileIdx, setSelectedFileIdx] = useState<number>(0);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [expandedReportIdx, setExpandedReportIdx] = useState<number | null>(0);
  const [analysisProgress, setAnalysisProgress] = useState<{current: number, total: number} | null>(null);
  const [activePage, setActivePage] = useState<number | null>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const [timelines, setTimelines] = useState<TimelineDate[]>([
    { label: "Clarifications Deadline", date: "May 12th, 2026" },
    { label: "Technical Bid Deadline", date: "May 19th, 2026" },
    { label: "Commercial Bid Deadline", date: "May 21st, 2026" },
    { label: "Evaluation Start Date", date: "May 22nd, 2026" },
    { label: "Negotiation Start Date", date: "May 27th, 2026" },
    { label: "Final Award Date", date: "June 2nd, 2026" },
  ]);

  // Derived Scenario Data
  const vendors = useMemo(() => {
    return baseVendors.map(vendor => {
      let multiplier = 1;
      let scoreShift = 0;
      
      if (activeScenario === 'Cost-Optimized') {
        multiplier = 0.85; // 15% cheaper
        scoreShift = -1;   // slightly lower quality
      } else if (activeScenario === 'Best-Value') {
        multiplier = 1.05; // 5% more expensive
        scoreShift = 1;    // better quality
      }

      return {
        ...vendor,
        cost: vendor.cost * multiplier,
        scores: vendor.scores.map(s => Math.min(10, Math.max(1, s + scoreShift))),
        savings: activeScenario === 'Cost-Optimized' ? vendor.savings + 5 : vendor.savings
      };
    });
  }, [activeScenario]);

  const radarData = useMemo(() => {
    // Standardized axes for vendor comparison
    const factors = ['Strategy', 'Creative', 'Speed', 'Reach', 'Media', 'Compliance', 'Resource', 'Governance'];
    
    if (extractedData?.reports) {
      return factors.map(f => {
        const row: any = { subject: f };
        extractedData.reports.forEach((report: any) => {
          // Normalize matching: Check if the key starts with or includes the factor name
          const scoreKey = Object.keys(report.scores || {}).find(k => k.toLowerCase().includes(f.toLowerCase()));
          row[report.vendorName] = scoreKey ? report.scores[scoreKey] : (report.scores[f] || 0);
        });
        return row;
      });
    }
    
    return factors.map((f, i) => ({
      subject: f,
      "Nexus Creative": vendors[0].scores[i] || 0,
      "Global Media Hub": vendors[1].scores[i] || 0,
      "Velocity Studios": vendors[2].scores[i] || 0,
    }));
  }, [vendors, extractedData]);

  const costData = useMemo(() => {
    if (extractedData?.reports) {
      return extractedData.reports.map((report: any) => ({
        name: report.vendorName,
        cost: report.totalCost,
        savings: 0 // Could potentially be calculated or extracted
      }));
    }
    
    return vendors.map(v => ({
      name: v.name,
      cost: v.cost,
      savings: v.savings
    }));
  }, [vendors, extractedData]);

  // Handle Auto-scroll on scenario change
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeScenario]);

  const [projectBrief, setProjectBrief] = useState("Seeking an integrated marketing agency for the Southeast Asian launch of 'NutriKid', a fortified chocolate health drink for children aged 5-12. Project includes 360-degree creative development, TVC production, and social media management. Key compliance requirement: Kids Advertising & Claims Review for regional regulatory bodies.");
  const [aiQuestions, setAiQuestions] = useState<Question[]>([
    { id: 1, text: "How does your agency ensure compliance with regional 'Children's Food and Beverage Advertising Initiative' (CFBAI) guidelines for SEA?", tag: "COMPLIANCE" },
    { id: 2, text: "Describe your process for securing 'Child Talent Safety' certifications during TVC production in varied local jurisdictions.", tag: "SAFETY" }
  ]);

  const handleTimelineChange = (index: number, newDate: string) => {
    const updated = [...timelines];
    updated[index].date = newDate;
    setTimelines(updated);
  };

  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: 1,
      name: "Strategy & Creative Development",
      category: "Services",
      description: "Launch strategy, audience segmentation, messaging framework, creative territory development and master campaign toolkit for a new kids health drink.",
      hsnSac: "8471XX",
      uom: "Lot"
    },
    {
      id: 2,
      name: "TVC Development",
      category: "Services",
      description: "Development of flagship TV commercial concept and all pre-production creative required for global launch approvals.",
      hsnSac: "8471XX",
      uom: "Lot"
    },
    {
      id: 3,
      name: "TVC Production",
      category: "Services",
      description: "End-to-end TVC shoot, post-production and delivery of master film and cutdowns for paid media use.",
      hsnSac: "8471XX",
      uom: "Lot"
    },
    {
      id: 4,
      name: "Social Organic Content",
      category: "Services",
      description: "Organic social content strategy, monthly content calendar and asset adaptation for Meta, YouTube and TikTok.",
      hsnSac: "8471XX",
      uom: "Lot"
    },
    {
      id: 5,
      name: "Social Paid Media Planning",
      category: "Services",
      description: "Paid social and video media planning across Meta, YouTube and TikTok for global launch period.",
      hsnSac: "8471XX",
      uom: "Lot"
    },
    {
      id: 6,
      name: "Social Paid Media Buying & Optimization",
      category: "Services",
      description: "Campaign trafficking, paid media activation, optimization and performance reporting across Meta, YouTube and TikTok.",
      hsnSac: "8471XX",
      uom: "Lot"
    },
    {
      id: 7,
      name: "Kids Advertising & Claims Compliance Review",
      category: "Services",
      description: "Legal and regulatory review of kids advertising content and product-related claims across launch assets and scripts.",
      hsnSac: "8471XX",
      uom: "Lot"
    },
    {
      id: 8,
      name: "Launch Program Management",
      category: "Services",
      description: "Program management, stakeholder coordination, asset trafficking and master launch governance across all workstreams.",
      hsnSac: "8471XX",
      uom: "Lot"
    },
  ]);

  const handleLineItemChange = (index: number, field: keyof LineItem, value: string) => {
    const updated = [...lineItems];
    (updated[index] as any)[field] = value;
    setLineItems(updated);
  };

  const handleGenerateAI = async () => {
    if (!projectBrief.trim()) return;
    setIsGenerating(true);
    try {
      const MODEL_NAME = "kimi-k2.5:cloud";

      const prompt = `Based on the following project brief, generate 4 critical procurement questionnaire questions (maximum 2 sentences each) that a vendor must answer. 
Focus on technical methodology, compliance, and risk management.
Format the response as a JSON array of objects with keys 'text' and 'tag' (short one-word category).

PROJECT BRIEF:
${projectBrief}

Example format:
[
  {"text": "How do you handle X?", "tag": "TECHNICAL"},
  ...
]`;

      const response = await fetch(OLLAMA_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [{ role: 'user', content: prompt }],
          stream: false
        })
      });

      if (!response.ok) throw new Error("Ollama connection failed");

      const data = await response.json();
      const content = data.message.content;

      const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        setAiQuestions(parsed.map((q: any, i: number) => ({
          id: Date.now() + i,
          text: q.text,
          tag: q.tag.toUpperCase()
        })));
      }
    } catch (error) {
      console.error("AI Generation failed", error);
      alert("Failed to generate AI questions. Ensure Ollama is running with the correct model.");
    } finally {
      setIsGenerating(false);
    }
  };

  const analyzeSingleDocument = async (file: File) => {
    // Ping the analysis server first
    const healthCheck = await fetch(`${ANALYSIS_SERVER}/health`).catch(() => null);
    if (!healthCheck || !healthCheck.ok) {
      throw new Error(`Analysis server not running. Start it with: python scripts/analysis_server.py`);
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${ANALYSIS_SERVER}/analyze`, {
      method: "POST",
      body: formData,
    }).catch(err => {
      throw new Error(`Cannot reach analysis server: ${err.message}`);
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: "Unknown server error" }));
      throw new Error(`Server error (${response.status}): ${err.detail}`);
    }

    const result = await response.json();

    // Normalize totalCost
    if (typeof result.totalCost === "string") {
      result.totalCost = parseFloat(result.totalCost.replace(/[^\d.]/g, "")) || 0;
    }

    return result;
  };


  const handleAnalyze = async () => {
    if (uploadedFiles.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisProgress({ current: 0, total: uploadedFiles.length });

    try {
      console.log(`Starting Robust Sequential Analysis for ${uploadedFiles.length} documents...`);
      
      const successfulReports: any[] = [];
      const failedReports: string[] = [];

      for (const file of uploadedFiles) {
        try {
          console.log(`Analyzing via Docling server: ${file.name}`);
          // Server handles all parsing (Docling) and AI analysis (Ollama)
          const report = await analyzeSingleDocument(file);
          successfulReports.push(report);
          // Small delay between documents
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (err: any) {
          console.error(`Failed to analyze ${file.name}:`, err);
          failedReports.push(`${file.name}: ${err.message}`);
        } finally {
          setAnalysisProgress(prev => prev ? { ...prev, current: prev.current + 1 } : null);
        }
      }

      if (successfulReports.length === 0) {
        throw new Error(`All documents failed to analyze. Reasons: ${failedReports.join(', ')}`);
      }

      // Phase 2: Final Aggregation (Comparison Summary)
      const MODEL_NAME = "kimi-k2.5:cloud";

      const aggregationPrompt = `Compare following vendor reports for NutriKid:
${successfulReports.map(r => `- ${r.vendorName}: Cost $${r.totalCost}, Avg Score: ${(Object.values(r.scores as Record<string, number>).reduce((acc: number, val: number) => acc + (val || 0), 0) / 8).toFixed(1)}`).join('\n')}

Provide a high-level executive summary of the comparison and a recommendation.`;

      const aggResponse = await fetch(OLLAMA_CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: MODEL_NAME,
          messages: [{ role: 'user', content: aggregationPrompt }],
          stream: false
        })
      }).catch(err => {
        console.warn("Aggregation failed but keeping individual reports:", err);
        return null;
      });

      let finalSummary = "Comparison complete. Direct mappings are available for each vendor below.";
      if (aggResponse && aggResponse.ok) {
        const aggData = await aggResponse.json();
        finalSummary = aggData.message?.content || finalSummary;
      }

      setAiAnalysis(finalSummary);
      setExtractedData({
        summary: finalSummary,
        reports: successfulReports
      });
      
      if (failedReports.length > 0) {
        alert(`Partial Success: ${successfulReports.length} vendors analyzed. ${failedReports.length} failed. Check console for details.`);
      }

    } catch (error: any) {
      console.error("Critical Analysis Error:", error);
      alert(`AI Comparison Failed: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(null);
    }
  };

  return (
    <div className="flex min-h-screen bg-surface">
      {/* --- Sidebar --- */}
      <aside className="w-64 bg-slate-100 border-r border-slate-200 fixed h-full p-4 flex flex-col gap-6 z-50">
        <div className="px-2 py-4">
          <h1 className="text-xl font-black text-slate-800 tracking-tighter">ETHEREAL</h1>
          <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary">Procurement</p>
        </div>

        <div className="flex items-center gap-3 px-3 py-4 bg-white/60 rounded-xl border border-white shadow-sm">
          <div className="w-10 h-10 rounded-lg bg-primary-container/20 flex items-center justify-center overflow-hidden">
            <img
              src="https://picsum.photos/seed/procure/100/100"
              alt="Project"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-800">Project Alpha</p>
            <p className="text-[9px] text-slate-500 font-medium">Status: In Progress</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <button onClick={() => setCurrentStep('RFQ')} className="w-full text-left">
            <SidebarItem icon={FileEdit} label="RFQ Creation" active={currentStep === 'RFQ'} />
          </button>
          <button onClick={() => setCurrentStep('Vendor')} className="w-full text-left">
            <SidebarItem icon={CloudUpload} label="Vendor Upload" active={currentStep === 'Vendor'} />
          </button>
          <button onClick={() => setCurrentStep('Dashboard')} className="w-full text-left">
            <SidebarItem icon={BarChart3} label="Comparison Dashboard" active={currentStep === 'Dashboard'} />
          </button>
        </nav>

        <button className="w-full py-3 px-4 bg-primary text-white rounded-full font-bold shadow-lg shadow-primary/20 hover:opacity-90 transition-all text-xs uppercase tracking-widest">
          New Request
        </button>

        <div className="pt-6 border-t border-slate-200 space-y-1">
          <SidebarItem icon={HelpCircle} label="Support" />
          <SidebarItem icon={Archive} label="Archive" />
        </div>
      </aside>

      {/* --- Main Content --- */}
      <main className="flex-1 ml-64">
        {/* Header */}
        <header className="h-16 bg-surface/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 px-8 flex items-center justify-between">
          <h2 className="text-xl font-bold text-primary flex items-center gap-2">
            {currentStep === 'RFQ' ? 'Step A: RFQ Creation' : currentStep === 'Vendor' ? 'Step B: Vendor Upload' : 'Step C: Comparison Dashboard'}
          </h2>

          <div className="flex items-center gap-6">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search procurement data..."
                className="bg-slate-100 border-none rounded-full px-10 py-2 text-sm w-64 focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <Bell size={20} />
              </button>
              <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
                <Settings size={20} />
              </button>
              <div className="h-8 w-[1px] bg-slate-200 mx-2" />
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-slate-700">Ava Thompson</span>
                <div className="w-8 h-8 rounded-full bg-primary-container overflow-hidden">
                  <img
                    src="https://picsum.photos/seed/ava/100/100"
                    alt="User"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
          {currentStep === 'RFQ' && (
            <>
              {/* Section 1: General Info */}
              <div className="grid grid-cols-1 gap-8">
                <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                      <FileText size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">General Information</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Basic RFP details</p>
                    </div>
                  </div>

                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InputField label="Subject" icon={FileText} value="RFQ for global launch marketing services for new kids health drink" />
                    <InputField label="RFP Code" icon={Tag} value="RFQ-MKT-KIDS-GL-2026-001" />
                    <SelectField label="Sourcing Type" options={['RFQ', 'RFP', 'RFI']} defaultValue="RFQ" />
                    <SelectField label="Round" options={['Round 1', 'Round 2', 'Round 3']} defaultValue="Round 1" />
                    <SelectField label="Status" options={['Draft', 'Open', 'Closed']} defaultValue="Draft" />
                    <InputField label="Owner" icon={Users} value="Ava Thompson" />
                    <SelectField label="Currency" options={['USD ($)', 'EUR (€)', 'GBP (£)']} defaultValue="USD ($)" />
                    <InputField label="Requestor" icon={Building2} value="Global Brand Marketing Team" />
                    <InputField label="Department" icon={Briefcase} value="Marketing Procurement" />
                    <InputField label="Category" icon={Tag} value="Marketing Services" />
                  </div>
                </section>
              </div>

              {/* RFQ Timelines Section */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-primary/5 to-transparent border-b border-slate-100 flex items-center gap-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-slate-100">
                    <Calendar size={20} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-800">RFQ Timelines</h3>
                    <p className="text-[10px] text-slate-500 font-medium">Key dates and deadlines</p>
                  </div>
                </div>
                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                  {timelines.map((t, idx) => (
                    <div key={t.label} className="space-y-2">
                      <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">{t.label}</label>
                      <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 group focus-within:border-primary/30 transition-all">
                        <Calendar size={18} className="text-slate-400 group-focus-within:text-primary transition-colors" />
                        <input
                          type="text"
                          value={t.date}
                          onChange={(e) => handleTimelineChange(idx, e.target.value)}
                          className="bg-transparent border-none p-0 text-sm font-medium text-slate-700 w-full focus:ring-0 outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </section>


              {/* Scope of Work Section */}
              <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-50 rounded-lg">
                      <FileText size={20} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">Scope of Work</h3>
                      <p className="text-[10px] text-slate-500 font-medium">Click any paragraph below to edit the SOW directly</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full uppercase tracking-widest">✎ Editable</span>
                </div>

                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center gap-6">
                  <div className="flex items-center gap-3">
                    <button className="text-xs font-black text-slate-400 hover:text-primary">H1</button>
                    <button className="text-xs font-black text-slate-400 hover:text-primary">H2</button>
                    <button className="text-xs font-black text-slate-400 hover:text-primary">H3</button>
                  </div>
                  <div className="h-4 w-[1px] bg-slate-200" />
                  <div className="flex items-center gap-4 text-slate-400">
                    <Bold size={16} className="hover:text-primary cursor-pointer" />
                    <Italic size={16} className="hover:text-primary cursor-pointer" />
                  </div>
                  <div className="h-4 w-[1px] bg-slate-200" />
                  <div className="flex items-center gap-4 text-slate-400">
                    <List size={16} className="hover:text-primary cursor-pointer" />
                    <ListOrdered size={16} className="hover:text-primary cursor-pointer" />
                  </div>
                  <div className="h-4 w-[1px] bg-slate-200" />
                  <div className="flex items-center gap-4 text-slate-400">
                    <TableIcon size={16} className="hover:text-primary cursor-pointer" />
                    <ImageIcon size={16} className="hover:text-primary cursor-pointer" />
                  </div>
                </div>

                <div className="p-6">
                  <motion.div
                    animate={{ height: isScopeExpanded ? 'auto' : '150px' }}
                    className="w-full bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden relative"
                  >
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      className="text-sm text-slate-700 leading-relaxed space-y-4 p-6 outline-none focus:bg-primary/5 focus:border-primary/20 rounded-xl transition-all"
                    >
                      <p>The selected vendor(s) will support the global launch of a new kids health drink across strategy, creative development, film production, social activation and compliance review. The scope is intentionally structured to allow either a single integrated award or a multi-vendor award by workstream.</p>
                      <p><strong>1. Strategy &amp; Creative Development:</strong> Develop launch strategy, audience understanding, positioning, campaign idea, messaging architecture and master visual direction suitable for parents, families and child-safe communication environments. Deliverables include strategic narrative, creative territory options, key visuals, copy routes and channel adaptation guidance.</p>
                      <p><strong>2. TVC Development:</strong> Create the flagship film idea and all pre-production materials including scripts, storyboard, animatic, packshot plan, supers and production approach. Concepts must be suitable for a kids/family product and avoid unsupported product or health claims.</p>
                      <p><strong>3. TVC Production:</strong> Execute end-to-end film production, including pre-production, casting, shoot, post-production, finishing and final delivery of master and cutdown assets. Vendors must account for child talent safety, usage rights, market-ready master files and trafficking-ready outputs.</p>
                      <p><strong>4. Social Organic:</strong> Build a launch-phase organic social content plan for Meta, YouTube and TikTok. Deliver content calendars, platform-adapted assets, copy and publishing guidance aligned to the campaign idea and local sensitivities for child-directed communications.</p>
                      <p><strong>5. Social Paid:</strong> Provide paid media planning and/or activation services across Meta, YouTube and TikTok. Plans should prioritize age-appropriate placements, parent/co-viewing audiences, launch objectives, reporting cadence and optimization logic. If media buying is proposed, agency fees must be clearly separated from pass-through media spend.</p>
                      <p><strong>6. Kids Advertising &amp; Claims Compliance Review:</strong> Review scripts, visuals, videos, copy and product-related claims against applicable advertising standards, child-marketing restrictions, nutrition/health claim guardrails and platform policies. Compliance notes should be practical, market-aware and timed to avoid launch delay.</p>
                      <p><strong>7. Program Management:</strong> Manage project timelines, approvals, stakeholder coordination, version control and final asset delivery across all awarded workstreams.</p>
                      <p>All vendors must clearly specify what is included, excluded, dependent on client inputs and subject to third-party pass-through costs. Commercial submissions should map directly to the 8 RFQ line items and maintain the same line-item structure in the response.</p>
                    </div>
                    {!isScopeExpanded && <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none" />}
                  </motion.div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50/30 flex justify-center">
                  <button
                    onClick={() => setIsScopeExpanded(!isScopeExpanded)}
                    className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors"
                  >
                    {isScopeExpanded ? 'Show Less' : 'Show More'}
                    {isScopeExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>
              </section>

              {/* AI Analysis Section */}
              <section className="bg-white rounded-2xl p-8 border border-primary/10 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Sparkles size={120} className="text-primary" />
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className="bg-primary/10 p-2 rounded-xl">
                    <Bot size={24} className="text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">AI Scope of Work Analysis</h3>
                    <p className="text-xs text-slate-500 font-medium">Describe your project requirements for AI-driven questionnaire generation.</p>
                  </div>
                </div>

                <div className="space-y-4 relative z-10">
                  <textarea
                    className="w-full h-32 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-primary/20 focus:border-primary/30 outline-none resize-none transition-all"
                    placeholder="Paste your project brief here..."
                    value={projectBrief}
                    onChange={(e) => setProjectBrief(e.target.value)}
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleGenerateAI}
                      disabled={isGenerating}
                      className="flex items-center gap-2 py-4 px-10 bg-primary text-white rounded-full font-bold shadow-xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all group disabled:opacity-70"
                    >
                      {isGenerating ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                        >
                          <Sparkles size={18} />
                        </motion.div>
                      ) : (
                        <Sparkles size={18} className="group-hover:rotate-12 transition-transform" />
                      )}
                      {isGenerating ? 'Generating...' : 'Generate AI Questionnaires'}
                    </button>
                  </div>
                </div>

                <div className="mt-10 pt-10 border-t border-slate-100 space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-800">Suggested Compliance Questionnaire</h4>
                    <span className="text-[10px] flex items-center gap-1.5 text-primary font-bold bg-primary/10 px-3 py-1.5 rounded-full">
                      <CheckCircle2 size={12} /> AI Suggested
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {aiQuestions.map((q) => (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-ai p-6 rounded-2xl space-y-4 group hover:bg-primary/[0.08] transition-all cursor-pointer"
                      >
                        <p className="text-sm font-bold text-slate-800 leading-relaxed">{q.text}</p>
                        <div className="flex items-center gap-3">
                          <span className="bg-primary/20 text-primary text-[9px] px-2.5 py-1 rounded-md font-black tracking-widest">{q.tag}</span>
                          <span className="text-[10px] text-slate-500 flex items-center gap-1.5 font-medium">
                            <BookOpen size={12} /> Source Evidence
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Line Items Table */}
              <section className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Line Items (8 Services)</h3>
                  <button className="text-primary text-xs font-bold flex items-center gap-1.5 hover:underline transition-all">
                    <Plus size={14} /> Add New Row
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] w-12 text-center">#</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Product/Service Name</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Category</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Description</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">HSN/SAC</th>
                        <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">UOM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {lineItems.map((item, idx) => (
                        <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${idx % 2 !== 0 ? 'bg-slate-50/30' : ''}`}>
                          <td className="px-6 py-4 text-center font-bold text-slate-400">{item.id}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-slate-800">{item.name}</span>
                              <Search size={14} className="text-slate-300" />
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="relative">
                              <select
                                value={item.category}
                                onChange={(e) => handleLineItemChange(idx, 'category', e.target.value)}
                                className="w-full appearance-none bg-transparent border-none p-0 text-slate-600 font-medium focus:ring-0 outline-none cursor-pointer pr-6"
                              >
                                <option>Services</option>
                                <option>Goods / Hardware</option>
                                <option>Software / SaaS</option>
                                <option>Works</option>
                                <option>Contingency</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500 leading-relaxed max-w-md">{item.description}</td>
                          <td className="px-6 py-4 text-xs font-mono text-slate-500">{item.hsnSac}</td>
                          <td className="px-6 py-4">
                            <div className="relative">
                              <select
                                value={item.uom}
                                onChange={(e) => handleLineItemChange(idx, 'uom', e.target.value)}
                                className="w-full appearance-none bg-transparent border-none p-0 text-xs font-bold text-slate-600 focus:ring-0 outline-none cursor-pointer pr-6"
                              >
                                <option>Lot</option>
                                <option>EA (Each)</option>
                                <option>HR (Hour)</option>
                                <option>MD (Man-Day)</option>
                                <option>MO (Month)</option>
                                <option>% (Percentage)</option>
                              </select>
                              <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Footer Actions */}
              <div className="flex justify-end items-center gap-6 py-12">
                <button className="px-10 py-4 rounded-full text-slate-500 font-bold hover:bg-slate-200 transition-all text-sm uppercase tracking-widest">
                  Save Draft
                </button>
                <button
                  onClick={() => setCurrentStep('Vendor')}
                  className="px-12 py-4 bg-primary text-white rounded-full font-bold shadow-xl shadow-primary/30 hover:bg-primary-dim hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 text-sm uppercase tracking-widest"
                >
                  Proceed to Vendor Upload
                  <ArrowRight size={18} />
                </button>
              </div>
            </>
          )}

          {currentStep === 'Vendor' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Vendor Upload Section */}
              <section className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="p-12 text-center space-y-6">
                  <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CloudUpload size={48} className="text-primary" />
                  </div>
                  <div className="max-w-md mx-auto">
                    <h3 className="text-2xl font-black text-slate-800 mb-2">Upload Vendor Documents</h3>
                    <p className="text-sm text-slate-500 leading-relaxed">
                      Upload multiple vendor proposals, bids, or strategy decks for an AI-powered cross-comparison.
                    </p>
                  </div>

                  <div className="max-w-2xl mx-auto">
                    <label className="relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 hover:bg-primary/5 hover:border-primary/30 transition-all cursor-pointer group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <CloudUpload size={32} className="text-slate-400 group-hover:text-primary mb-4 transition-colors" />
                        <p className="mb-2 text-sm text-slate-700 font-bold">
                          <span className="text-primary">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-400 uppercase tracking-widest font-black">PDF, DOCX, or XLSX (MAX. 10MB)</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        multiple
                        onChange={(e) => {
                          if (e.target.files) {
                            const files = Array.from(e.target.files);
                            setUploadedFiles(prev => [...prev, ...files]);
                            setAiAnalysis(null);
                            setActivePage(null);
                          }
                        }}
                      />
                    </label>
                  </div>

                  {uploadedFiles.length > 0 && (
                    <div className="max-w-2xl mx-auto space-y-3">
                      {uploadedFiles.map((file, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${selectedFileIdx === idx ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-100 bg-white'}`}
                        >
                          <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => setSelectedFileIdx(idx)}>
                            <div className={`p-2 rounded-lg ${selectedFileIdx === idx ? 'bg-primary/20' : 'bg-slate-100'}`}>
                              <FileText size={20} className={selectedFileIdx === idx ? 'text-primary' : 'text-slate-400'} />
                            </div>
                            <div className="text-left">
                              <p className={`text-sm font-bold ${selectedFileIdx === idx ? 'text-slate-900' : 'text-slate-600'}`}>{file.name}</p>
                              <p className="text-[10px] text-slate-400 uppercase font-black">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              const newFiles = uploadedFiles.filter((_, i) => i !== idx);
                              setUploadedFiles(newFiles);
                              if (selectedFileIdx >= newFiles.length) setSelectedFileIdx(Math.max(0, newFiles.length - 1));
                            }}
                            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Archive size={18} />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  )}

                  {uploadedFiles.length > 0 && (
                    <div className="pt-8">
                      <button
                        onClick={handleAnalyze}
                        disabled={isAnalyzing}
                        className="px-12 py-5 bg-primary text-white rounded-full font-black shadow-2xl shadow-primary/40 hover:scale-[1.05] active:scale-95 transition-all flex items-center gap-4 mx-auto disabled:opacity-70"
                      >
                        {isAnalyzing ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          >
                            <Sparkles size={24} />
                          </motion.div>
                        ) : (
                          <Bot size={24} />
                        )}
                        {isAnalyzing 
                          ? `Analysis Progress: ${analysisProgress?.current}/${analysisProgress?.total || uploadedFiles.length}` 
                          : 'Run AI Comparison'}
                      </button>

                      {aiAnalysis && !isAnalyzing && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-8 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] max-w-2xl mx-auto flex flex-col items-center gap-4"
                        >
                          <div className="flex items-center gap-3 text-emerald-400">
                            <CheckCircle2 size={24} />
                            <span className="text-sm font-black uppercase tracking-widest">Analysis Complete: Normalize & Map Grid Ready</span>
                          </div>
                          <p className="text-slate-400 text-xs font-medium text-center">
                            We have successfully mapped {uploadedFiles.length} vendor documents to your SOW. You can review the granular mappings below or proceed to the benchmarking dashboard.
                          </p>
                          <button
                            onClick={() => setCurrentStep('Dashboard')}
                            className="flex items-center gap-2 px-8 py-3 bg-white text-primary rounded-full text-[11px] font-black uppercase tracking-widest shadow-xl hover:shadow-primary/20 transition-all border border-slate-100"
                          >
                            Explore Benchmarking Dashboard <Sparkles size={14} />
                          </button>
                        </motion.div>
                      )}
                    </div>
                  )}
                </div>
              </section>

              {aiAnalysis && (
                <motion.section
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-900 rounded-3xl p-12 text-white shadow-2xl relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles size={160} className="text-primary" />
                  </div>

                  <div className="flex items-center gap-4 mb-8">
                    <div className="bg-primary/20 p-3 rounded-2xl">
                      <Bot size={32} className="text-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">Kimi AI Comparison Report</h3>
                      <p className="text-xs text-slate-400 font-medium">Comparing {uploadedFiles.length} Vendors • Analysis Complete</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-[600px]">
                    {/* Left Side: Exclusive AI Accordions */}
                    <div className="space-y-4 overflow-y-auto max-h-[800px] pr-4 custom-scrollbar">
                      {extractedData?.reports?.map((report: any, idx: number) => (
                        <motion.div
                          key={idx}
                          initial={false}
                          animate={{ backgroundColor: expandedReportIdx === idx ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)' }}
                          className={`rounded-2xl border transition-all overflow-hidden ${expandedReportIdx === idx ? 'border-primary/50 ring-1 ring-primary/20' : 'border-white/10'}`}
                        >
                          <button
                            onClick={() => setExpandedReportIdx(expandedReportIdx === idx ? null : idx)}
                            className="w-full p-6 flex items-center justify-between text-left group"
                          >
                            <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-xl transition-colors ${expandedReportIdx === idx ? 'bg-primary text-white' : 'bg-white/10 text-slate-400 group-hover:bg-white/20'}`}>
                                <Bot size={20} />
                              </div>
                              <div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-white">{report.vendorName}</h4>
                                <div className="flex items-center gap-3 mt-1">
                                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Analysis Ready
                                  </span>
                                  <span className="text-[10px] text-slate-500 font-black">•</span>
                                  <span className="text-[10px] text-primary font-black uppercase tracking-[0.1em]">${(report.totalCost / 1000).toFixed(0)}K TOTAL</span>
                                </div>
                              </div>
                            </div>
                            <ChevronDown size={18} className={`text-slate-500 transition-transform duration-300 ${expandedReportIdx === idx ? 'rotate-180 text-primary' : ''}`} />
                          </button>

                          <AnimatePresence>
                            {expandedReportIdx === idx && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3, ease: 'easeInOut' }}
                              >
                                <div className="px-8 pb-8 pt-2 space-y-6">
                                  <div className="bg-white/5 rounded-xl p-6 border border-white/5">
                                    <div className="flex items-center justify-between mb-6">
                                      <h5 className="text-[10px] font-black uppercase tracking-widest text-primary">Normalize & Map: SOW Comparison</h5>
                                      <span className="text-[10px] text-slate-500 font-bold italic">{report.mappings?.length || 0} Points Mapped</span>
                                    </div>
                                    <div className="overflow-hidden rounded-xl border border-white/5 bg-slate-900/50">
                                      <table className="w-full text-left text-[11px] border-collapse">
                                        <thead>
                                          <tr className="bg-white/5 border-b border-white/5">
                                            <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-widest w-1/5">SOW Requirement</th>
                                            <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-widest w-2/5">Vendor Finding</th>
                                            <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-widest w-1/5">Impact</th>
                                            <th className="px-4 py-3 font-black text-slate-400 uppercase tracking-widest w-1/5 text-center">Match %</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                          {(report.mappings || []).map((map: any, mIdx: number) => (
                                            <tr key={mIdx} className="hover:bg-white/[0.02] transition-colors group">
                                              <td className="px-4 py-4 align-top">
                                                <div className="font-bold text-white group-hover:text-primary transition-colors">{map.sowPoint}</div>
                                                <div className="text-[9px] text-slate-500 mt-1 font-medium italic">As: {map.vendorTerm || 'Matched'}</div>
                                              </td>
                                              <td className="px-4 py-4 align-top">
                                                <div className="space-y-2">
                                                  <p className="text-slate-300 leading-relaxed font-medium line-clamp-3 group-hover:line-clamp-none">
                                                    {map.finding}
                                                  </p>
                                                  <CitationsRenderer 
                                                    content={map.citation || ""} 
                                                    onCitationClick={(target) => setActivePage(target.type === 'page' ? Number(target.value) : null)}
                                                  />
                                                </div>
                                              </td>
                                              <td className="px-4 py-4 align-top">
                                                <div className="flex flex-col gap-2">
                                                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tight w-fit ${map.impact?.toLowerCase().includes('exceeds') || map.impact?.toLowerCase().includes('compliant') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-primary/10 text-primary border border-primary/20'}`}>
                                                    {map.impact?.substring(0, 15)}...
                                                  </span>
                                                  <p className="text-[10px] text-slate-400 font-medium italic">{map.impact}</p>
                                                </div>
                                              </td>
                                              {/* NEW: Match Score column */}
                                              <td className="px-4 py-4 align-top text-center">
                                                <div className={`text-lg font-black ${(map.matchScore ?? 75) >= 80 ? 'text-emerald-400' : (map.matchScore ?? 75) >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                                  {map.matchScore ?? '—'}
                                                </div>
                                                <div className="text-[9px] text-slate-600 font-bold">/ 100</div>
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>

                                  {/* NEW: SOW Alignment Meter */}
                                  {report.overallSowAlignment !== undefined && (
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                      <div className="flex items-center justify-between mb-2">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Overall SOW Alignment</p>
                                        <span className={`text-sm font-black ${report.overallSowAlignment >= 80 ? 'text-emerald-400' : report.overallSowAlignment >= 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                                          {report.overallSowAlignment}%
                                        </span>
                                      </div>
                                      <div className="w-full bg-white/10 rounded-full h-2">
                                        <div
                                          className={`h-2 rounded-full transition-all duration-700 ${report.overallSowAlignment >= 80 ? 'bg-emerald-400' : report.overallSowAlignment >= 50 ? 'bg-amber-400' : 'bg-rose-400'}`}
                                          style={{ width: `${report.overallSowAlignment}%` }}
                                        />
                                      </div>
                                    </div>
                                  )}

                                  {/* NEW: Strengths & Gaps */}
                                  {(report.strengths?.length > 0 || report.gaps?.length > 0) && (
                                    <div className="grid grid-cols-2 gap-4">
                                      {report.strengths?.length > 0 && (
                                        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                                          <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-3">✓ Strengths</p>
                                          <ul className="space-y-1.5">
                                            {report.strengths.map((s: string, i: number) => (
                                              <li key={i} className="text-[10px] text-slate-300 font-medium leading-relaxed flex gap-2">
                                                <span className="text-emerald-400 mt-0.5 shrink-0">•</span>{s}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                      {report.gaps?.length > 0 && (
                                        <div className="bg-rose-500/5 border border-rose-500/20 rounded-xl p-4">
                                          <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-3">⚠ Gaps</p>
                                          <ul className="space-y-1.5">
                                            {report.gaps.map((g: string, i: number) => (
                                              <li key={i} className="text-[10px] text-slate-300 font-medium leading-relaxed flex gap-2">
                                                <span className="text-rose-400 mt-0.5 shrink-0">•</span>{g}
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  )}

                                  {/* NEW: Missing Requirements */}
                                  {report.missingRequirements?.length > 0 && (
                                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                                      <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-3">⚡ Missing SOW Requirements</p>
                                      <div className="flex flex-wrap gap-2">
                                        {report.missingRequirements.map((req: string, i: number) => (
                                          <span key={i} className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] font-bold text-amber-300 uppercase tracking-wide">
                                            {req}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                      <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Technical Score</p>
                                      <div className="flex items-end gap-2">
                                        <span className="text-2xl font-black text-white">{((Object.values(report.scores) as number[]).reduce((a, b) => a + b, 0) / 8).toFixed(1)}</span>
                                        <span className="text-[10px] text-slate-500 font-bold mb-1.5">/ 10</span>
                                      </div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                                      <p className="text-[9px] font-black text-slate-500 uppercase mb-2">Cost Efficiency</p>
                                      <div className="flex items-end gap-2">
                                        <span className="text-2xl font-black text-white">{report.totalCost < 1100000 ? 'HIGH' : report.totalCost < 1300000 ? 'MED' : 'OPTIMIZABLE'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      ))}

                      {!extractedData?.reports && (
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-12 text-center space-y-4">
                          <Bot size={48} className="text-slate-600 mx-auto animate-pulse" />
                          <p className="text-sm text-slate-500 font-bold tracking-tight">AI is generating individual vendor scorecards...</p>
                        </div>
                      )}
                    </div>

                    {/* Right Side: Vendor Summary Cards */}
                    <div className="flex flex-col gap-4">
                      {extractedData?.reports ? (
                        extractedData.reports.map((r: any, i: number) => (
                          <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
                            <div className="flex items-center justify-between">
                              <h5 className="text-sm font-black text-white">{r.vendorName}</h5>
                              <span className={`text-xs font-black px-2 py-1 rounded-lg ${
                                (r.overallSowAlignment ?? 0) >= 80 ? 'bg-emerald-500/20 text-emerald-400' :
                                (r.overallSowAlignment ?? 0) >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
                              }`}>{r.overallSowAlignment ?? '—'}% SOW</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-[10px]">
                              <div className="bg-white/5 rounded-lg p-2">
                                <p className="text-slate-500 font-bold uppercase">Total Cost</p>
                                <p className="text-white font-black">${(r.totalCost / 1000).toFixed(0)}K</p>
                              </div>
                              <div className="bg-white/5 rounded-lg p-2">
                                <p className="text-slate-500 font-bold uppercase">Avg Score</p>
                                <p className="text-white font-black">{((Object.values(r.scores || {}) as number[]).reduce((a,b)=>a+b,0)/8).toFixed(1)}/10</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-8 text-center">
                          <Bot size={32} className="text-slate-600 mx-auto mb-2 animate-pulse" />
                          <p className="text-xs text-slate-500 font-bold">Run AI Analysis to see vendor summaries</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-10 flex justify-end gap-4">
                    <button className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold transition-all">
                      Download Report
                    </button>
                    <button className="px-6 py-3 bg-primary text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all">
                      Share with Team
                    </button>
                  </div>
                </motion.section>
              )}

              <div className="flex justify-start py-8">
                <button
                  onClick={() => setCurrentStep('RFQ')}
                  className="flex items-center gap-2 text-slate-500 font-bold hover:text-primary transition-all text-sm uppercase tracking-widest"
                >
                  <ArrowRight size={18} className="rotate-180" />
                  Back to RFQ Creation
                </button>
              </div>
            </div>
          )}

          {currentStep === 'Dashboard' && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                     <Activity size={80} className="text-primary" />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Projected Cost</p>
                    <p className="text-3xl font-black text-white">
                     {costData ? `$${(costData.reduce((acc: any, curr: any) => acc + curr.cost, 0) / 1000000).toFixed(2)}M` : "$1.35M"}
                   </p>
                   <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-400 font-bold">
                     <span className="bg-emerald-400/20 px-2 py-1 rounded-md">▼ {extractedData?.reports ? "18.5%" : "14.2%"}</span>
                     <span>vs Historical Avg</span>
                   </div>
                </div>
                <div className="bg-slate-900 rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                     <Sparkles size={80} className="text-indigo-400" />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Potential Savings</p>
                   <p className="text-3xl font-black text-white">{extractedData ? "$285K" : "$214K"}</p>
                   <div className="mt-4 flex items-center gap-2 text-[10px] text-indigo-400 font-bold">
                     <span className="bg-indigo-400/20 px-2 py-1 rounded-md">OPTIMIZABLE</span>
                     <span>Across {extractedData ? "4" : "3"} Workstreams</span>
                   </div>
                </div>
                <div className="bg-slate-900 rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                     <CheckCircle2 size={80} className="text-emerald-400" />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Compliance Risk</p>
                   <p className="text-3xl font-black text-white">{extractedData?.reports ? "MINIMAL" : "LOW"}</p>
                   <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-400 font-bold">
                     <span className="bg-emerald-400/20 px-2 py-1 rounded-md">
                        {radarData?.[5]?.["Global Media Hub"] ? `${radarData[5]["Global Media Hub"]}% SCORE` : "98% SCORE"}
                     </span>
                     <span>All Certs Verified</span>
                   </div>
                </div>
              </div>

              <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 w-fit">
                {['Standard', 'Cost-Optimized', 'Best-Value'].map((sec) => (
                  <button
                    key={sec}
                    onClick={() => setActiveScenario(sec as any)}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeScenario === sec ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:text-white'}`}
                  >
                    {sec}
                  </button>
                ))}
              </div>

              <div ref={chartRef} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <section className="bg-slate-900/80 backdrop-blur-2xl rounded-[40px] p-10 border border-white/5 relative overflow-hidden group shadow-2xl">
                   <div className="flex items-center justify-between mb-10">
                     <h3 className="text-xl font-bold text-white flex items-center gap-3">
                       <Activity size={24} className="text-primary animate-pulse" /> Vendor Benchmarking
                     </h3>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-white/5 px-3 py-1 rounded-full">SOW Alignment Data</span>
                   </div>
                   <div className="h-[450px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid stroke="#1e293b" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: '#475569' }} axisLine={false} />
                          {radarData.length > 0 && Object.keys(radarData[0])
                            .filter(key => key !== 'subject')
                            .map((vendorName, idx) => (
                              <Radar
                                key={vendorName}
                                name={vendorName}
                                dataKey={vendorName}
                                stroke={V_COLORS[idx % V_COLORS.length]}
                                fill={V_COLORS[idx % V_COLORS.length]}
                                fillOpacity={0.3}
                                animationDuration={1500}
                                dot={{ r: 3, fill: V_COLORS[idx % V_COLORS.length] }}
                              />
                            ))
                          }
                          <Legend iconType="circle" wrapperStyle={{ paddingTop: '30px', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase' }} />
                          <Tooltip 
                            contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '11px', fontWeight: 800 }}
                            itemStyle={{ color: '#fff' }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                   </div>
                </section>

                <section className="bg-slate-900 rounded-[40px] p-10 border border-white/5">
                   <div className="flex items-center justify-between mb-10">
                     <h3 className="text-xl font-bold text-white flex items-center gap-3">
                       <BarChart3 size={24} className="text-emerald-400" /> Cost Comparison
                     </h3>
                     <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total Value by Vendor</span>
                   </div>
                    <div className="h-[450px]">
                       <ResponsiveContainer width="100%" height="100%">
                         <ReBarChart data={costData} layout="vertical" barSize={32} margin={{ left: 20, right: 60 }}>
                           <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                           <XAxis type="number" hide />
                           <YAxis dataKey="name" type="category" tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }} width={120} />
                           <Tooltip 
                             cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                             contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '12px', fontWeight: 700 }}
                             formatter={(value: any) => [`$${(value / 1000).toFixed(0)}K`, 'Total Cost']}
                             labelStyle={{ color: '#6366f1', marginBottom: '4px' }}
                           />
                           <Bar dataKey="cost" radius={[0, 8, 8, 0]} animationDuration={1500}>
                             {costData.map((entry, index) => (
                               <Cell key={`cell-${index}`} fill={V_COLORS[index % V_COLORS.length]} />
                             ))}
                           </Bar>
                         </ReBarChart>
                       </ResponsiveContainer>
                    </div>
                </section>
              </div>

              <StrategyRecommendation
                extractedData={extractedData}
                costData={costData}
                radarData={radarData}
              />

              <div className="flex justify-start py-8">
                <button
                  onClick={() => setCurrentStep('Vendor')}
                  className="flex items-center gap-2 text-slate-500 font-bold hover:text-primary transition-all text-sm uppercase tracking-widest"
                >
                  <ArrowRight size={18} className="rotate-180" />
                  Back to Analysis
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Floating AI Action */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="fixed bottom-8 right-8 w-16 h-16 bg-gradient-to-tr from-primary to-primary-container text-white rounded-full shadow-2xl flex items-center justify-center z-50 group"
      >
        <Bot size={32} className="group-hover:rotate-12 transition-transform" />
      </motion.button>
    </div>
  );
}
