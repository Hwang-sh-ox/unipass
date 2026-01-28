
export interface University {
  id: string;
  name: string;
  region: string;
  website?: string;
}

export interface AdmissionData {
  schedule: string[];
  evaluationMethod: string;
  criteria: string;
  studentRecordRatio: string;
  interviewInfo: string;
  essayInfo: string;
  links: { title: string; uri: string }[];
}

export interface StatsData {
  year: number;
  susiKyogwa: string;
  jeongsi50: string;
  jeongsi70: string;
}

export interface ExamQuestion {
  id: string;
  question: string;
  correctAnswer: string;
}

export enum Tab {
  INFO = '전형 정보',
  STATS = '입시 결과',
  EXAM = '기출 문제',
  PRACTICE = '문제 풀이'
}
