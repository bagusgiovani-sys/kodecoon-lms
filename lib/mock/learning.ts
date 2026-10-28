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
export function createLearningData(): LearningData {
  return {
    classCourses: {}, assignments: [], submissions: [],
    courses: [
      { id: 'rover-lab', title: 'Rover mission lab', category: 'Robotics', ages: '8–12', level: 'Beginner', description: 'Build, test, and improve a robot that navigates a mission course.', prerequisite: 'No coding experience needed. Teacher-guided kit setup.', lessons: [
        { id: 'first-drive', title: 'Your first controlled drive', minutes: 60, objective: 'Predict how motor duration changes distance and explain a fair test.', materials: 'Classroom robot kit, charged battery, measuring tape, clear floor space.', steps: 'Inspect the wheels and confirm the robot is safe to run.\nMark a start line and predict where a two-second drive will stop.\nBuild a start → motors forward → wait → stop program in your kit’s editor.\nRun three trials with the same speed and record each distance.\nChange only the drive duration. Compare the results with your prediction.', evidence: 'A short demonstration video or project link, three measured distances, and one explanation of what changed.' },
        { id: 'obstacle-stop', title: 'Sense, decide, stop', minutes: 60, objective: 'Use a sensor condition to stop before an obstacle.', materials: 'Robot with distance sensor, a cardboard obstacle, measuring tape.', steps: 'Read the distance sensor while moving an obstacle by hand.\nChoose a stopping distance and explain your choice.\nAdd a repeat loop that checks the distance before moving.\nTest from three starting positions on a clear floor.\nImprove your stopping rule and describe one limitation.', evidence: 'Project link or video showing three tests and a reflection on sensor reliability.' }
      ] },
      { id: 'game-studio', title: 'Creative game studio', category: 'Coding', ages: '9–13', level: 'Beginner', description: 'Turn a playful idea into an interactive game with events and variables.', prerequisite: 'Comfortable using a mouse and keyboard.', lessons: [
        { id: 'character-controls', title: 'Make a character respond', minutes: 45, objective: 'Use events to connect player input to character movement.', materials: 'Computer with a block-coding editor such as Scratch.', steps: 'Sketch a character and a simple scene.\nCreate a start event that resets the character position.\nMap two keys to opposite movement directions.\nAsk a partner to test the controls without instructions.\nRefine the controls based on their feedback.', evidence: 'A shared project link and a short explanation of each event.' },
        { id: 'score-challenge', title: 'Build a scoring challenge', minutes: 60, objective: 'Use a variable to track score and reset the game consistently.', materials: 'Your character-controls project and a block-coding editor.', steps: 'Add an object for the player to collect.\nCreate a score variable and reset it when the game starts.\nIncrease the score once per collected object.\nTest repeated contact and fix any accidental extra points.\nAdd a win condition and explain how it works.', evidence: 'A project link, one test case, and a description of a bug you fixed.' }
      ] },
      { id: 'build-lab', title: 'Little engineering lab', category: 'Competition', ages: '6–8', level: 'Starter', description: 'Explore structures and motion through hands-on building challenges.', prerequisite: 'No prior experience; adult supervision for small parts.', lessons: [
        { id: 'strong-bridge', title: 'Build a stronger bridge', minutes: 45, objective: 'Compare two structures and explain which supports more weight.', materials: 'Building bricks or craft sticks, two supports, identical small test weights.', steps: 'Draw a bridge that spans the gap between two supports.\nBuild your first design and predict its strength.\nAdd identical weights one at a time with teacher supervision.\nChange the support pattern and repeat the test.\nCompare both designs and explain your improvement.', evidence: 'Photos of both designs and a count of the weights each supported.' },
        { id: 'gear-motion', title: 'Discover gears in motion', minutes: 45, objective: 'Predict the direction of connected gears.', materials: 'Age-appropriate gear kit and building base.', steps: 'Connect two gears and predict their rotation direction.\nTurn one gear slowly to check your prediction.\nAdd a third gear and predict again.\nBuild a moving creation using the gear chain.\nShow a partner how motion travels through your design.', evidence: 'A demonstration video and a drawing with rotation arrows.' }
      ] },
    ],
  }
}

export function safeProjectUrl(value: string): boolean {
  try { return new URL(value).protocol === 'https:' } catch { return false }
}
