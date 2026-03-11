import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Factory, Lightbulb, FileText, Image as ImageIcon, Film, Tags, ChevronLeft, ChevronRight, Loader2, Play, Plus, Trash2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import * as geminiService from './services/gemini';
import { sounds } from './utils/sounds';
import BackgroundSlider from './components/BackgroundSlider';

interface AppState {
  view: 'dashboard' | 'editor';
  drafts: dbService.Draft[];
  currentDraft: Partial<dbService.Draft> | null;
  step: number;
  topic: string;
  ideas: string[];
  selectedIdea: string;
  script: string;
  thumbnailPrompt: string;
  thumbnailUrl: string;
  assets: string;
  metadata: string;
  isLoading: boolean;
  error: string | null;
}

const STEPS = [
  { id: 1, title: 'الفكرة', icon: Factory },
  { id: 2, title: 'العناوين', icon: Lightbulb },
  { id: 3, title: 'الاسكريبت', icon: FileText },
  { id: 4, title: 'الصورة المصغرة', icon: ImageIcon },
  { id: 5, title: 'ملحقات المونتاج', icon: Film },
  { id: 6, title: 'البيانات الوصفية', icon: Tags },
];

export default function App() {
  const [state, setState] = useState<AppState>({
    view: 'dashboard',
    drafts: [],
    currentDraft: null,
    step: 1,
    topic: '',
    ideas: [],
    selectedIdea: '',
    script: '',
    thumbnailPrompt: '',
    thumbnailUrl: '',
    assets: '',
    metadata: '',
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    loadDrafts();
  }, []);

  const loadDrafts = async () => {
    const drafts = await dbService.fetchDrafts();
    setState(prev => ({ ...prev, drafts }));
  };

  const saveCurrentDraft = async (updates: Partial<AppState> = {}) => {
    const newState = { ...state, ...updates };
    const draft = {
      id: newState.currentDraft?.id,
      topic: newState.topic,
      ideas: JSON.stringify(newState.ideas),
      selectedIdea: newState.selectedIdea,
      script: newState.script,
      thumbnailPrompt: newState.thumbnailPrompt,
      thumbnailUrl: newState.thumbnailUrl,
      assets: newState.assets,
      metadata: newState.metadata,
      step: newState.step,
    };
    await dbService.saveDraft(draft);
    await loadDrafts();
  };

  const handleCreateNew = () => {
    sounds.playClick();
    setState({
      view: 'editor',
      currentDraft: null,
      step: 1,
      topic: '',
      ideas: [],
      selectedIdea: '',
      script: '',
      thumbnailPrompt: '',
      thumbnailUrl: '',
      assets: '',
      metadata: '',
      isLoading: false,
      error: null,
      drafts: state.drafts
    });
  };

  const handleLoadDraft = (draft: dbService.Draft) => {
    sounds.playClick();
    setState({
      view: 'editor',
      currentDraft: draft,
      step: draft.step,
      topic: draft.topic,
      ideas: JSON.parse(draft.ideas || '[]'),
      selectedIdea: draft.selectedIdea,
      script: draft.script,
      thumbnailPrompt: draft.thumbnailPrompt,
      thumbnailUrl: draft.thumbnailUrl,
      assets: draft.assets,
      metadata: draft.metadata,
      isLoading: false,
      error: null,
      drafts: state.drafts
    });
  };

  const updateState = (updates: Partial<AppState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  };

  const handleGenerateIdeas = async () => {
    if (!state.topic.trim()) return;
    sounds.playClick();
    updateState({ isLoading: true, error: null });
    try {
      const ideas = await geminiService.generateIdeas(state.topic);
      sounds.playSuccess();
      updateState({ ideas, step: 2, isLoading: false });
      await saveCurrentDraft({ ideas, step: 2 });
    } catch (err: any) {
      updateState({ error: err.message, isLoading: false });
    }
  };

  const handleSelectIdea = async (idea: string) => {
    sounds.playClick();
    updateState({ selectedIdea: idea, isLoading: true, error: null });
    try {
      const script = await geminiService.generateScript(idea);
      sounds.playSuccess();
      updateState({ script, step: 3, isLoading: false });
      await saveCurrentDraft({ selectedIdea: idea, script, step: 3 });
    } catch (err: any) {
      updateState({ error: err.message, isLoading: false });
    }
  };

  const handleGenerateThumbnail = async () => {
    sounds.playClick();
    updateState({ isLoading: true, error: null });
    try {
      const prompt = await geminiService.generateThumbnailPrompt(state.selectedIdea, state.script);
      updateState({ thumbnailPrompt: prompt });
      const url = await geminiService.generateThumbnailImage(prompt);
      sounds.playSuccess();
      updateState({ thumbnailUrl: url, step: 4, isLoading: false });
      await saveCurrentDraft({ thumbnailPrompt: prompt, thumbnailUrl: url, step: 4 });
    } catch (err: any) {
      updateState({ error: err.message, isLoading: false });
    }
  };

  const handleGenerateAssets = async () => {
    sounds.playClick();
    updateState({ isLoading: true, error: null });
    try {
      const assets = await geminiService.generateAssets(state.selectedIdea, state.script);
      sounds.playSuccess();
      updateState({ assets, step: 5, isLoading: false });
      await saveCurrentDraft({ assets, step: 5 });
    } catch (err: any) {
      updateState({ error: err.message, isLoading: false });
    }
  };

  const handleGenerateMetadata = async () => {
    sounds.playClick();
    updateState({ isLoading: true, error: null });
    try {
      const metadata = await geminiService.generateMetadata(state.selectedIdea, state.script);
      sounds.playSuccess();
      updateState({ metadata, step: 6, isLoading: false });
      await saveCurrentDraft({ metadata, step: 6 });
    } catch (err: any) {
      updateState({ error: err.message, isLoading: false });
    }
  };

  const renderDashboard = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">مسودات المحتوى</h2>
        <button onClick={handleCreateNew} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold flex items-center gap-2">
          <Plus className="w-5 h-5" />
          <span>فيديو جديد</span>
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {state.drafts.map(draft => (
          <div key={draft.id} className="bg-slate-900/60 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 space-y-4">
            <h3 className="text-xl font-bold text-white">{draft.topic || 'بدون عنوان'}</h3>
            <p className="text-slate-400 text-sm">آخر تحديث: {new Date(draft.updated_at).toLocaleString('ar-EG')}</p>
            <div className="flex gap-2">
              <button onClick={() => handleLoadDraft(draft)} className="flex-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg">إكمال</button>
              <button onClick={async () => { await dbService.deleteDraft(draft.id); loadDrafts(); }} className="px-4 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded-lg"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );

  const renderStepContent = () => {
    switch (state.step) {
      case 1:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white drop-shadow-md">ماذا تريد أن تصنع اليوم؟</h2>
              <p className="text-slate-300 drop-shadow-sm">أدخل اسم المنتج أو العلامة التجارية (مثال: كوكاكولا، سيارات تيسلا، هواتف آيفون)</p>
            </div>
            <div className="flex gap-4 max-w-2xl mx-auto">
              <input
                type="text"
                value={state.topic}
                onChange={(e) => updateState({ topic: e.target.value })}
                placeholder="أدخل اسم المنتج هنا..."
                className="flex-1 px-6 py-4 rounded-2xl bg-slate-900/60 backdrop-blur-xl border-2 border-slate-700/50 text-white placeholder:text-slate-400 focus:border-indigo-400 focus:ring-4 focus:ring-indigo-400/20 transition-all text-lg shadow-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateIdeas()}
              />
              <button
                onClick={handleGenerateIdeas}
                disabled={state.isLoading || !state.topic.trim()}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-2xl font-bold text-lg transition-all shadow-md hover:shadow-lg flex items-center gap-2"
              >
                {state.isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Play className="w-6 h-6" />}
                <span>ابدأ</span>
              </button>
            </div>
          </motion.div>
        );
      case 2:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-3xl mx-auto"
          >
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-white drop-shadow-md">اختر عنواناً جذاباً</h2>
              <p className="text-slate-300 drop-shadow-sm">تم توليد هذه العناوين بناءً على فكرتك، اختر الأنسب لكتابة الاسكريبت.</p>
            </div>
            <div className="grid gap-4">
              {state.ideas.map((idea, index) => (
                <button
                  key={index}
                  onClick={() => handleSelectIdea(idea)}
                  disabled={state.isLoading}
                  className="p-6 text-right bg-slate-900/60 backdrop-blur-xl border-2 border-slate-700/50 hover:border-indigo-400 rounded-2xl shadow-sm hover:shadow-md transition-all group flex items-center justify-between"
                >
                  <span className="text-lg font-semibold text-slate-100 group-hover:text-indigo-300">{idea}</span>
                  <ChevronLeft className="w-6 h-6 text-slate-400 group-hover:text-indigo-400 transition-transform group-hover:-translate-x-1" />
                </button>
              ))}
            </div>
          </motion.div>
        );
      case 3:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white drop-shadow-md">الاسكريبت</h2>
              <button
                onClick={handleGenerateThumbnail}
                disabled={state.isLoading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2"
              >
                {state.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>التالي: الصورة المصغرة</span>}
                {!state.isLoading && <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-700/50 prose prose-invert prose-lg max-w-none rtl:prose-p:text-right rtl:prose-headings:text-right">
              <ReactMarkdown>{state.script}</ReactMarkdown>
            </div>
          </motion.div>
        );
      case 4:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white drop-shadow-md">الصورة المصغرة</h2>
              <button
                onClick={handleGenerateAssets}
                disabled={state.isLoading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2"
              >
                {state.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>التالي: ملحقات المونتاج</span>}
                {!state.isLoading && <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-700/50 space-y-6">
              {state.thumbnailUrl ? (
                <div className="space-y-4">
                  <img src={state.thumbnailUrl} alt="Thumbnail" className="w-full rounded-2xl shadow-md" />
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
                    <h4 className="font-semibold text-slate-200 mb-2">الوصف المستخدم (Prompt):</h4>
                    <p className="text-slate-300 text-sm font-mono" dir="ltr">{state.thumbnailPrompt}</p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                  <ImageIcon className="w-16 h-16 mb-4 opacity-50" />
                  <p>جاري توليد الصورة المصغرة...</p>
                </div>
              )}
            </div>
          </motion.div>
        );
      case 5:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white drop-shadow-md">ملحقات المونتاج</h2>
              <button
                onClick={handleGenerateMetadata}
                disabled={state.isLoading}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2"
              >
                {state.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <span>التالي: البيانات الوصفية</span>}
                {!state.isLoading && <ChevronLeft className="w-5 h-5" />}
              </button>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-700/50 prose prose-invert prose-lg max-w-none rtl:prose-p:text-right rtl:prose-headings:text-right">
              <ReactMarkdown>{state.assets}</ReactMarkdown>
            </div>
          </motion.div>
        );
      case 6:
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white drop-shadow-md">البيانات الوصفية (SEO)</h2>
              <button
                onClick={() => {
                  sounds.playTransition();
                  updateState({ step: 1, topic: '', ideas: [], selectedIdea: '', script: '', thumbnailPrompt: '', thumbnailUrl: '', assets: '', metadata: '' });
                }}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition-all shadow-sm flex items-center gap-2"
              >
                <Factory className="w-5 h-5" />
                <span>فيديو جديد</span>
              </button>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-xl p-8 rounded-3xl shadow-sm border border-slate-700/50 prose prose-invert prose-lg max-w-none rtl:prose-p:text-right rtl:prose-headings:text-right">
              <ReactMarkdown>{state.metadata}</ReactMarkdown>
            </div>
          </motion.div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-transparent font-sans text-white selection:bg-indigo-500/30">
      <BackgroundSlider />
      <header className="bg-slate-900/60 backdrop-blur-xl border-b border-slate-800/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setState(prev => ({ ...prev, view: 'dashboard' }))}>
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-inner">
              <Factory className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                مصنع المحتوى
              </h1>
              <p className="text-xs font-medium text-slate-400">مساعدك الذكي لقنوات الصناعة</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {state.view === 'dashboard' ? renderDashboard() : (
          <>
            <div className="mb-12">
              <div className="flex items-center justify-between max-w-4xl mx-auto relative">
                <div className="absolute left-0 right-0 top-1/2 h-1 bg-slate-800/50 -z-10 rounded-full" />
                <div 
                  className="absolute right-0 top-1/2 h-1 bg-indigo-500 -z-10 rounded-full transition-all duration-500"
                  style={{ width: `${((state.step - 1) / (STEPS.length - 1)) * 100}%` }}
                />
                
                {STEPS.map((step) => {
                  const Icon = step.icon;
                  const isActive = state.step === step.id;
                  const isCompleted = state.step > step.id;
                  
                  return (
                    <div key={step.id} className="flex flex-col items-center gap-2 relative bg-transparent px-2">
                      <div 
                        className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 ${
                          isActive 
                            ? 'bg-indigo-600 border-indigo-400/30 text-white scale-110 shadow-[0_0_20px_rgba(79,70,229,0.5)]' 
                            : isCompleted 
                              ? 'bg-indigo-600 border-indigo-600 text-white' 
                              : 'bg-slate-800/80 border-slate-700 text-slate-400 backdrop-blur-sm'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-sm font-medium transition-colors drop-shadow-sm ${
                        isActive ? 'text-indigo-300 font-bold' : isCompleted ? 'text-slate-300' : 'text-slate-500'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <AnimatePresence>
              {state.error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="max-w-4xl mx-auto mb-8 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-center justify-between"
                >
                  <span>{state.error}</span>
                  <button onClick={() => updateState({ error: null })} className="text-red-500 hover:text-red-700">
                    ✕
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {renderStepContent()}
            </AnimatePresence>
          </>
        )}
      </main>
    </div>
  );
}
