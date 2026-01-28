
import React, { useState, useEffect } from 'react';
import { REGIONS, UNIVERSITY_DATA, YEARS } from './constants';
import { Tab, AdmissionData, StatsData } from './types';
import { fetchAdmissionInfo, fetchStats, fetchExamQuestions } from './services/geminiService';
import { Search, MapPin, GraduationCap, Calendar, BarChart3, FileText, ChevronRight, CheckCircle2, AlertCircle, Info, TrendingUp } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

const App: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>(REGIONS[0]);
  const [selectedUni, setSelectedUni] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(YEARS[0]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.INFO);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [admissionData, setAdmissionData] = useState<AdmissionData | null>(null);
  const [statsData, setStatsData] = useState<StatsData | null>(null);
  const [examText, setExamText] = useState<string>("");

  const universities = UNIVERSITY_DATA[selectedRegion] || [];

  const handleSearch = async () => {
    if (!selectedUni) return;
    setLoading(true);
    try {
      const info = await fetchAdmissionInfo(selectedUni, selectedYear);
      setAdmissionData(info);
      const stats = await fetchStats(selectedUni, selectedYear);
      setStatsData(stats);
      const exams = await fetchExamQuestions(selectedUni);
      setExamText(exams);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUni) {
      handleSearch();
    }
  }, [selectedUni, selectedYear]);

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <header className="bg-indigo-700 text-white py-8 shadow-lg">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <GraduationCap size={36} />
            UniPass <span className="text-indigo-200 font-light text-xl">| 전국 대학 입시 포털</span>
          </h1>
          <p className="mt-2 text-indigo-100 opacity-80">원하는 대학의 전형 일정부터 기출문제까지 한 번에 확인하세요.</p>
        </div>
      </header>

      {/* Selectors Bar */}
      <div className="sticky top-0 z-10 glass-effect border-b py-4 shadow-sm px-4">
        <div className="container mx-auto flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap gap-3 items-center flex-1">
            <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2 shadow-sm min-w-[150px]">
              <MapPin size={18} className="text-indigo-600" />
              <select 
                value={selectedRegion} 
                onChange={(e) => {
                  setSelectedRegion(e.target.value);
                  setSelectedUni("");
                }}
                className="outline-none bg-transparent w-full text-sm font-medium"
              >
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2 shadow-sm min-w-[200px]">
              <GraduationCap size={18} className="text-indigo-600" />
              <select 
                value={selectedUni} 
                onChange={(e) => setSelectedUni(e.target.value)}
                className="outline-none bg-transparent w-full text-sm font-medium"
              >
                <option value="">대학 선택</option>
                {universities.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white rounded-lg border px-3 py-2 shadow-sm">
              <Calendar size={18} className="text-indigo-600" />
              <select 
                value={selectedYear} 
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="outline-none bg-transparent text-sm font-medium"
              >
                {YEARS.map(y => <option key={y} value={y}>{y}학년도</option>)}
              </select>
            </div>
          </div>
          
          <button 
            onClick={handleSearch}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-50"
            disabled={!selectedUni || loading}
          >
            {loading ? "검색 중..." : <><Search size={18} /> 조회하기</>}
          </button>
        </div>
      </div>

      <main className="container mx-auto px-4 mt-8">
        {!selectedUni ? (
          <div className="flex flex-col items-center justify-center py-32 text-slate-400">
            <Search size={64} strokeWidth={1} />
            <p className="mt-4 text-xl">지역과 대학을 선택하여 정보를 확인하세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Tabs */}
            <aside className="lg:col-span-1 space-y-2">
              {Object.values(Tab).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                    activeTab === tab 
                      ? "bg-indigo-600 text-white shadow-lg translate-x-1" 
                      : "bg-white text-slate-600 hover:bg-indigo-50 border shadow-sm"
                  }`}
                >
                  <span className="font-semibold">{tab}</span>
                  <ChevronRight size={18} />
                </button>
              ))}
            </aside>

            {/* Main Content Area */}
            <div className="lg:col-span-3 bg-white rounded-2xl shadow-xl border border-slate-100 p-6 min-h-[600px]">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                  <p className="mt-4 text-slate-500">전국 입시 데이터를 동기화하는 중입니다...</p>
                </div>
              ) : (
                <>
                  {activeTab === Tab.INFO && admissionData && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div>
                        <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-700 border-b pb-2 mb-4">
                          <Calendar size={20} /> 전형 일정
                        </h3>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                          {admissionData.schedule.map((line, idx) => (
                            <p key={idx} className="mb-2 last:mb-0 text-slate-700 flex items-start gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0"></span>
                              {line}
                            </p>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoCard title="평가 방법 및 기준" content={admissionData.evaluationMethod} icon={<CheckCircle2 className="text-green-500" />} />
                        <InfoCard title="학생부 반영 방식" content={admissionData.studentRecordRatio} icon={<FileText className="text-blue-500" />} />
                        <InfoCard title="면접 정보" content={admissionData.interviewInfo} icon={<CheckCircle2 className="text-orange-500" />} />
                        <InfoCard title="논술 전형 정보" content={admissionData.essayInfo} icon={<FileText className="text-purple-500" />} />
                      </div>

                      {admissionData.links.length > 0 && (
                        <div className="mt-6">
                          <h4 className="font-semibold text-slate-700 mb-2">관련 링크 및 출처</h4>
                          <div className="flex flex-wrap gap-3">
                            {admissionData.links.map((link, i) => (
                              <a 
                                key={i} 
                                href={link.uri} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full border border-indigo-100 hover:bg-indigo-100 transition-colors flex items-center gap-1"
                              >
                                {link.title} <ChevronRight size={12} />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === Tab.STATS && statsData && (
                    <div className="animate-in fade-in duration-500 space-y-6">
                      <div className="flex items-center justify-between border-b pb-4">
                        <h3 className="text-2xl font-bold flex items-center gap-2 text-indigo-700">
                          <TrendingUp size={24} /> {selectedYear}학년도 입시 결과 상세 분석
                        </h3>
                        <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm font-bold">
                          {selectedUni}
                        </span>
                      </div>

                      <div className="bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-2">
                          <Info size={18} className="text-indigo-600" />
                          <h4 className="font-bold text-slate-800">전형별 합격선 및 데이터 요약</h4>
                        </div>
                        <div className="p-6">
                          <div className="prose prose-slate max-w-none">
                            <div className="space-y-4 whitespace-pre-wrap text-slate-700 leading-relaxed">
                              {statsData.susiKyogwa.split('\n').map((line, i) => {
                                const isHeader = line.match(/^(\d+\.|\[|#)/);
                                return (
                                  <p key={i} className={`${isHeader ? "text-lg font-bold text-indigo-900 mt-6 first:mt-0" : "pl-4 border-l-2 border-slate-100"}`}>
                                    {line}
                                  </p>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 50% 컷, 70% 컷 개별 StatCard는 상세 분석 텍스트에 통합되었으므로 제거 */}
                      {/* 이전에 존재하던 50% / 70% 컷 관련 UI를 완전히 제거합니다. */}


                      <div className="bg-amber-50 p-5 rounded-xl border border-amber-200 flex gap-3 items-start">
                        <AlertCircle className="text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-bold text-amber-900 mb-1">참고 및 주의사항</p>
                          <p className="text-sm text-amber-800 leading-relaxed">
                            본 데이터는 AI가 대학별 공지사항과 입시 통계자료를 취합하여 분석한 결과입니다. 
                            매년 입시 난이도와 경쟁률에 따라 실제 합격선은 크게 변동될 수 있으므로, 최종 지원 전에는 반드시 해당 대학 입학처의 <b>최종 모집요강</b>과 <b>공식 입시 결과</b>를 재확인하시기 바랍니다.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === Tab.EXAM && (
                    <div className="animate-in fade-in duration-500">
                      <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-700 border-b pb-2 mb-4">
                        <FileText size={22} /> 최근 기출 문제 및 출제 경향
                      </h3>
                      <div className="whitespace-pre-wrap text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-200">
                        {examText}
                      </div>
                      <div className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex flex-col items-center text-center">
                        <h4 className="font-bold text-indigo-900 mb-2">연습이 필요하신가요?</h4>
                        <p className="text-sm text-indigo-700 mb-4">AI와 함께 실제 면접/논술 문항을 연습하고 피드백을 받아보세요.</p>
                        <button 
                          className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2 active:scale-95"
                          onClick={() => setActiveTab(Tab.PRACTICE)}
                        >
                          실전 문제 풀이 모드로 이동 <ChevronRight size={18} />
                        </button>
                      </div>
                    </div>
                  )}

                  {activeTab === Tab.PRACTICE && (
                    <PracticeInterface university={selectedUni} />
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

const InfoCard: React.FC<{title: string, content: string, icon: React.ReactNode}> = ({ title, content, icon }) => (
  <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm hover:shadow-md transition-shadow h-full">
    <div className="flex items-center gap-2 mb-3">
      {icon}
      <h4 className="font-bold text-slate-800">{title}</h4>
    </div>
    <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
      {content}
    </div>
  </div>
);

const PracticeInterface: React.FC<{ university: string }> = ({ university }) => {
  const [userAnswer, setUserAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);

  const mockQuestion = `${university} 입학 전형 중 '지원 동기 및 학업 계획'을 500자 내외로 서술하라는 면접 예상 문항이 있습니다. 본인의 강점을 포함해 답안을 작성해 보세요.`;

  const handleCheck = async () => {
    if (!userAnswer.trim()) return;
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `
          다음은 ${university} 지원자의 모범 답안 작성을 위한 연습입니다.
          질문: ${mockQuestion}
          사용자 답변: ${userAnswer}
          
          위 답변에 대해 평가와 보완점을 피드백해주고, 모범 정답 방향성을 제시해줘.
        `
      });
      setFeedback(response.text || "");
    } catch (e) {
      console.error(e);
      setFeedback("피드백을 생성하는 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <h3 className="text-xl font-bold text-indigo-700 mb-4 flex items-center gap-2">
        <CheckCircle2 size={22} /> 실전 연습 및 피드백
      </h3>
      <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100 mb-6">
        <p className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
          <Info size={16} /> Q. 면접/논술 실전 문항
        </p>
        <p className="text-indigo-800 text-lg leading-relaxed">{mockQuestion}</p>
      </div>

      <div className="relative">
        <textarea
          value={userAnswer}
          onChange={(e) => setUserAnswer(e.target.value)}
          className="w-full h-64 p-5 border-2 border-slate-200 rounded-2xl shadow-inner outline-none focus:ring-2 focus:ring-indigo-500 mb-4 resize-none text-slate-700 leading-relaxed transition-all focus:border-indigo-300"
          placeholder="이곳에 당신의 답변을 입력하세요 (글자 수에 구애받지 않고 논리적으로 작성해보세요)..."
        />
        <div className="absolute bottom-8 right-4 text-xs text-slate-400 font-medium">
          {userAnswer.length}자 입력됨
        </div>
      </div>

      <button
        onClick={handleCheck}
        disabled={loading || !userAnswer}
        className="w-full bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
      >
        {loading ? (
          <>
            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
            AI가 답변을 분석하는 중입니다...
          </>
        ) : "답안 제출 및 전문가 수준 AI 피드백 받기"}
      </button>

      {feedback && (
        <div className="mt-8 bg-white border-2 border-indigo-200 p-8 rounded-2xl shadow-xl animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3 mb-4 text-indigo-700">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <GraduationCap size={24} />
            </div>
            <h4 className="font-bold text-xl">AI 정답 체크 및 심층 분석 리포트</h4>
          </div>
          <div className="whitespace-pre-wrap text-slate-700 leading-relaxed bg-slate-50 p-6 rounded-xl border border-slate-100 italic">
            {feedback}
          </div>
          <div className="mt-6 flex justify-end">
            <button 
              onClick={() => {setUserAnswer(""); setFeedback("");}}
              className="text-indigo-600 font-bold hover:underline text-sm"
            >
              새로운 질문으로 다시 연습하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
