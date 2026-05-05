import OpenAI from "openai";

import {
  buildStudentSummaryUserPrompt,
  STUDENT_SUMMARY_SYSTEM_PROMPT,
} from "@/lib/ai/prompts/summary-for-student";
import {
  buildTeacherSummaryUserPrompt,
  TEACHER_SUMMARY_SYSTEM_PROMPT,
} from "@/lib/ai/prompts/summary-for-teacher";

export type StudentSummary = {
  learned: string[];
  achievements: string[];
  homework: string[];
  next_lesson_note: string;
};

export type TeacherSummary = {
  lesson_flow: string;
  teaching_highlights: string[];
  observations: string[];
  questions_for_reflection: string[];
};

function ensureOpenAiKey() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEYが設定されていません。");
  }
}

function getOpenAIClient() {
  ensureOpenAiKey();
  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
}

export async function generateStudentSummary(
  transcript: string
): Promise<StudentSummary> {
  const client = getOpenAIClient();

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: STUDENT_SUMMARY_SYSTEM_PROMPT },
      { role: "user", content: buildStudentSummaryUserPrompt(transcript) },
    ],
    temperature: 0.5,
  });

  const content = completion.choices[0]?.message.content;
  if (!content) throw new Error("No content returned");

  return JSON.parse(content) as StudentSummary;
}

export async function generateTeacherSummary(
  transcript: string
): Promise<TeacherSummary> {
  const client = getOpenAIClient();

  const completion = await client.chat.completions.create({
    model: "gpt-4o",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: TEACHER_SUMMARY_SYSTEM_PROMPT },
      { role: "user", content: buildTeacherSummaryUserPrompt(transcript) },
    ],
    temperature: 0.3,
  });

  const content = completion.choices[0]?.message.content;
  if (!content) throw new Error("No content returned");

  return JSON.parse(content) as TeacherSummary;
}

export async function generateBothSummaries(transcript: string) {
  const [studentSummary, teacherSummary] = await Promise.all([
    generateStudentSummary(transcript),
    generateTeacherSummary(transcript),
  ]);

  return { studentSummary, teacherSummary };
}
