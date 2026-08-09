import 'server-only'
import Anthropic from '@anthropic-ai/sdk'

// AI report drafting — server-only (CLAUDE.md §2). The draft is ALWAYS
// editable by the teacher before export; nothing here auto-sends (§11).

export interface ReportDraftInput {
  studentName: string
  className: string
  lessonsCompleted: number
  lessonsTotal: number
  completedLessonTitles: string[]
  attendanceSummary: string
  rawNotes: string
}

const SYSTEM_PROMPT = `You draft student progress reports for Kodecoon Academy, a robotics and coding school for children in Indonesia. You write on behalf of the teacher, addressed to the student's parents.

Rules:
- Use ONLY the data provided: lesson progress, attendance, and the teacher's rough notes. Never invent achievements, incidents, or details.
- Warm, professional, encouraging tone. Specific over generic praise.
- 2 to 4 short paragraphs of plain prose. No headings, no bullet lists, no salutation or signature lines — the report template adds those.
- Write in English. The teacher reviews and edits before anything is sent.`

export async function draftReportText(input: ReportDraftInput): Promise<string> {
  const anthropic = new Anthropic({
    // Two attempts at 25s sit inside the route's 60s maxDuration, so a slow
    // Claude call surfaces as our own 502 ("write it manually", SDD.md §8)
    // instead of Vercel killing the function and returning a raw 504.
    timeout: 25_000,
    maxRetries: 1,
  })

  const context = [
    `Student: ${input.studentName}`,
    `Class: ${input.className}`,
    `Progress: ${input.lessonsCompleted} of ${input.lessonsTotal} lessons completed`,
    input.completedLessonTitles.length > 0
      ? `Completed lessons: ${input.completedLessonTitles.join(', ')}`
      : 'Completed lessons: none recorded yet',
    `Attendance: ${input.attendanceSummary}`,
    '',
    "Teacher's rough notes:",
    input.rawNotes,
  ].join('\n')

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-8',
    // max_tokens caps thinking AND response text together. At 2048 an adaptive
    // thinking pass could eat the budget and truncate the report mid-sentence;
    // this is a ceiling, not a reservation, so the headroom costs nothing.
    max_tokens: 16_000,
    // Explicit, not omitted: on Opus 4.8 an absent `thinking` field means no
    // thinking at all (unlike Opus 5, where adaptive is the default).
    thinking: { type: 'adaptive' },
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: `Draft the progress report from this data:\n\n${context}`,
      },
    ],
  })

  const text = response.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim()

  if (!text) {
    throw new Error('Claude returned an empty draft')
  }
  return text
}
