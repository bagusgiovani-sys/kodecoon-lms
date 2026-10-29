export interface LearningLesson {
  id: string; title: string; minutes: number; objective: string
  materials: string; steps: string; evidence: string
}
export interface LearningCourse {
  id: string; title: string; category: string; ages: string; level: string
  description: string; prerequisite: string; lessons: LearningLesson[]
}
export interface LearningAssignment {
  id: string; title: string; classId: string; lessonId: string; courseId: string
  due: string; instructions: string
}
export interface LearningSubmission {
  id: string; assignmentId: string; studentId: string; url: string; reflection: string
  submittedAt: string; feedback: string; status: 'submitted' | 'revision' | 'approved'
}
export interface LearningData {
  courses: LearningCourse[]
  classCourses: Record<string, string>
  assignments: LearningAssignment[]
  submissions: LearningSubmission[]
}

const moduleCatalog = [
  { id: 'rce', title: 'RCE — Robotic Coder Elementary', category: 'Robotics' },
  { id: 'rcj', title: 'RCJ — Robotic Coder Junior', category: 'Robotics' },
  { id: 'rcb', title: 'RCB — Robotic Coder Basic', category: 'Robotics' },
  { id: 'rci', title: 'RCI — Robotic Coder Intermediate', category: 'Robotics' },
  { id: 'rca', title: 'RCA — Robotic Coder Advance', category: 'Robotics' },
  { id: 'scjr', title: 'SCjr — Scratch Junior', category: 'Coding' },
  { id: 'sc-101', title: 'SC 101 — Scratch Level 1', category: 'Coding' },
  { id: 'sc-102', title: 'SC 102 — Scratch Level 2', category: 'Coding' },
  { id: 'ac-201', title: 'AC 201 — App Coder Level 1', category: 'Coding' },
  { id: 'ac-202', title: 'AC 202 — App Coder Level 2', category: 'Coding' },
  ...Array.from({ length: 4 }, (_, i) => ({ id: `rgd-${i + 1}`, title: `RGD ${i + 1} — Roblox Game Development Level ${i + 1}`, category: 'Coding' })),
  ...Array.from({ length: 2 }, (_, i) => ({ id: `wc-30${i + 1}`, title: `WC 30${i + 1} — Web Coder Level ${i + 1}`, category: 'Coding' })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: `pcb-${i + 1}`, title: `PCB ${i + 1} — Python Coder Basic Level ${i + 1}`, category: 'Coding' })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: `pci-${i + 1}`, title: `PCI ${i + 1} — Python Coder Intermediate Level ${i + 1}`, category: 'Coding' })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: `pca-${i + 1}`, title: `PCA ${i + 1} — Python Coder Advance Level ${i + 1}`, category: 'Coding' })),
  { id: 'camp-vibe-coding', title: 'Vibe Coding', category: 'Holiday Camp' },
  { id: 'camp-genai', title: 'GenAI', category: 'Holiday Camp' },
  ...Array.from({ length: 5 }, (_, i) => ({ id: `camp-minecraft-${i + 1}`, title: `Minecraft Game Development Level ${i + 1}`, category: 'Holiday Camp' })),
  ...Array.from({ length: 4 }, (_, i) => ({ id: `camp-roblox-${i + 1}`, title: `Roblox Game Development Level ${i + 1}`, category: 'Holiday Camp' })),
  { id: 'camp-robotic', title: 'Robotic', category: 'Holiday Camp' },
]

export function createLearningData(): LearningData {
  return {
    classCourses: {}, assignments: [], submissions: [],
    courses: moduleCatalog.map(module => ({
      ...module,
      ages: 'Not set', level: 'Not set',
      description: 'Module title provided by Kodecoon. Lesson details and Drive materials will be added when available.',
      prerequisite: 'Not provided yet.', lessons: [],
    })),
  }
}

export function safeProjectUrl(value: string): boolean {
  try { return new URL(value).protocol === 'https:' } catch { return false }
}
