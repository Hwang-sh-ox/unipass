
import { GoogleGenAI } from "@google/genai";
import { AdmissionData, StatsData } from "../types";

export const fetchAdmissionInfo = async (university: string, year: number): Promise<AdmissionData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    ${university}의 ${year}학년도 입학처 홈페이지 자료를 바탕으로 다음 정보를 조사해줘.
    반드시 한국어로 답변하고, 각 항목별로 가독성 있게 줄바꿈을 해줘.

    1. 전형 일정 (수시/정시 원서접수, 면접, 합격자 발표 등 항목별로 한 줄씩)
    2. 전형별 평가방법 및 평가 기준
    3. 학교 생활 기록부 반영 방법 및 반영 비율
    4. 면접 비율 및 면접 형태
    5. 논술 문제 형태 (있는 경우만)

    자료의 출처 URL들을 함께 포함해줘.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  const text = response.text || "정보를 불러오지 못했습니다.";
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  
  const links = groundingChunks
    .filter((chunk: any) => chunk.web)
    .map((chunk: any) => ({
      title: chunk.web.title || "출처",
      uri: chunk.web.uri
    }));

  const parts = text.split('\n\n');
  const scheduleLine = parts.find(p => p.includes("전형 일정")) || "";
  const schedule = scheduleLine.split('\n').filter(line => line.trim() !== "" && !line.includes("전형 일정"));

  return {
    schedule: schedule.length > 0 ? schedule : ["데이터를 찾을 수 없습니다."],
    evaluationMethod: parts.find(p => p.includes("평가방법")) || "정보 없음",
    criteria: parts.find(p => p.includes("평가 기준")) || "정보 없음",
    studentRecordRatio: parts.find(p => p.includes("생활 기록부")) || "정보 없음",
    interviewInfo: parts.find(p => p.includes("면접")) || "정보 없음",
    essayInfo: parts.find(p => p.includes("논술")) || "정보 없음",
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
  
  // 가공된 텍스트를 통째로 전달하여 UI에서 렌더링하도록 구조 유지
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
