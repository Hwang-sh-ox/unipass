
import { GoogleGenAI } from "@google/genai";
import { AdmissionData, StatsData } from "../types";

// Helper function to parse AI response into a key-value object
const parseAIResponse = (rawText: string): Record<string, string> => {
  const sections: Record<string, string> = {};
  
  // This regex matches:
  // 1. A numbered header (e.g., "1. 전형 일정:")
  //    (\d+\.\s*([^:\n]+):\s*)
  //      - Group 1: Full header (e.g., "1. 전형 일정:")
  //      - Group 2: Actual title (e.g., "전형 일정")
  // 2. Captures the content following it, up to the start of the next numbered header or end of string.
  //    ([\s\S]*?) non-greedy match for any character (including newlines)
  //    (?=\n\s*\d+\.|\s*$) lookahead for the start of next section or end of string (optional whitespace at end)
  const sectionContentRegex = /(\d+\.\s*([^:\n]+):\s*)([\s\S]*?)(?=\n\s*\d+\.|\s*$)/g;
  
  let match;
  while ((match = sectionContentRegex.exec(rawText)) !== null) {
    const titleKey = match[2].trim(); // e.g., "전형 일정"
    let content = match[3] ? match[3].trim() : ""; // Content after the header
    
    // If content is empty after trimming, ensure it's "정보 없음"
    if (!content) {
      content = "정보 없음";
    }
    
    sections[titleKey] = content;
  }
  
  // For sections that might be missing from AI's response entirely,
  // ensure they get "정보 없음" if not already parsed.
  const allExpectedTitles = [
    "전형 일정",
    "전형별 평가방법 및 평가 기준",
    "학교 생활 기록부 반영 방법 및 반영 비율",
    "면접 비율 및 면접 형태",
    "논술 문제 형태",
  ];
  allExpectedTitles.forEach(title => {
    if (!sections[title]) {
      sections[title] = "정보 없음";
    }
  });

  return sections;
};

export const fetchAdmissionInfo = async (university: string, year: number): Promise<AdmissionData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    ${university}의 ${year}학년도 입학처 홈페이지 자료를 바탕으로 다음 정보를 조사해줘.
    각 항목은 번호와 제목으로 시작하고, 콜론(:)으로 구분되며, 그 내용은 다음 항목 제목이 나오기 전까지의 내용이야.

    1. 전형 일정: (수시/정시 원서접수, 면접, 합격자 발표 등 항목별로 한 줄씩)
    2. 전형별 평가방법 및 평가 기준: (평가 방법 및 기준을 상세히 설명)
    3. 학교 생활 기록부 반영 방법 및 반영 비율: (반영 교과, 학년별 반영 비율 등)
    4. 면접 비율 및 면접 형태: (면접 진행 방식, 평가 항목 등)
    5. 논술 문제 형태: (있는 경우만, 출제 경향, 문제 유형 등)

    모든 답변은 한국어로 해줘.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const rawText = response.text || "정보를 불러오지 못했습니다.";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  const links = groundingChunks
    .filter((chunk: any) => chunk.web)
    .map((chunk: any) => ({
      title: chunk.web.title || "출처",
      uri: chunk.web.uri
    }));

  const parsedSections = parseAIResponse(rawText);

  let schedule: string[] = ["데이터를 찾을 수 없습니다."];
  const scheduleContent = parsedSections["전형 일정"] || "정보 없음";
  if (scheduleContent !== "정보 없음") {
    schedule = scheduleContent.split('\n').filter(l => l.trim() !== '');
  }
  
  const evaluationMethod = parsedSections["전형별 평가방법 및 평가 기준"] || "정보 없음";
  const studentRecordRatio = parsedSections["학교 생활 기록부 반영 방법 및 반영 비율"] || "정보 없음";
  const interviewInfo = parsedSections["면접 비율 및 면접 형태"] || "정보 없음";
  const essayInfo = parsedSections["논술 문제 형태"] || "정보 없음";

  return {
    schedule,
    evaluationMethod,
    criteria: evaluationMethod, 
    studentRecordRatio,
    interviewInfo,
    essayInfo,
    links
  };
};

export const fetchStats = async (university: string, year: number): Promise<StatsData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    ${university}의 ${year}학년도 입시 결과(합격선)를 매우 상세하게 조사해서 리스트 형태로 보여줘.
    반드시 다음 항목을 포함하고 가독성 좋게 줄바꿈해줘:

    1. [수시 교과 전형] 주요 학과별 최종 합격자 평균 등급 (최대한 구체적인 수치)
    2. [정시 수능 전형] 주요 학과별 50% 컷 (백분위 기준)
    3. [정시 수능 전형] 주요 학과별 70% 컷 (백분위 기준)
    4. 기타 특이사항 (최저학력기준 유무 등)

    수치가 정확하지 않다면 '조사된 범위'를 적어주고, 반드시 항목마다 줄바꿈을 적용해줘.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "데이터를 조회할 수 없습니다.";
  
  return {
    year,
    susiKyogwa: text,
    jeongsi50: "상세 내용 참조", 
    jeongsi70: "상세 내용 참조"  
  };
};

export const fetchExamQuestions = async (university: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    ${university}의 최근 기출문제 정보를 조사해줘.
    - 기출문제를 직접 볼 수 있는 입학처 내의 구체적인 게시판 경로 또는 버튼 클릭 유도 문구
    - 최근 출제된 문항의 핵심 주제 요약
    - 논술이나 면접의 경우 문제의 형태(제시문 기반, 인성 면접 등)
    
    가독성 있게 항목별로 줄바꿈해서 답변해줘.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return response.text || "기출문제 정보를 찾을 수 없습니다.";
};
