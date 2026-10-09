import {
  GapType,
  type GapAnalysis,
  type Question,
  type QuizResult,
  type RemedialSlide,
  type Standard,
} from '../types';

export const FIXTURE_STANDARD: Standard = {
  code: 'MA.4.FR.2.2',
  description:
    'Add and subtract fractions with like denominators, including mixed numbers and fractions greater than one, with procedural reliability.',
  grade: 'Grade 4',
  clarifications: [
    'Instruction includes the use of word form, manipulatives, drawings, the properties of operations or number lines.',
    'Within this benchmark, the expectation is not to simplify or use lowest terms.',
  ],
  purposeAndStrategies: [
    'Use visual models (area models, fraction strips, number lines) before moving to symbols.',
    'Connect adding fractions to adding whole-number units: 2 fifths + 1 fifth = 3 fifths.',
  ],
  misconceptions: [
    'Students may add the denominators as well as the numerators (2/5 + 1/5 = 3/10).',
    'Students may not recognize that a fraction greater than one can be written as a mixed number.',
  ],
  tieredInstruction: [],
};

export const FIXTURE_QUESTIONS: Question[] = [
  {
    id: 'fixture-q1',
    text: 'What is 2/5 + 1/5?',
    options: ['3/10', '3/5', '2/10', '1/5'],
    correctAnswerIndex: 1,
    explanation: 'The parts are fifths. 2 fifths and 1 fifth make 3 fifths, so the answer is 3/5.',
    animationDescription: '',
    difficulty: 'Medium',
  },
  {
    id: 'fixture-q2',
    text: 'Maya ran 3/8 of a mile in the morning and 4/8 of a mile after school. How far did she run in all?',
    options: ['7/16 mile', '7/8 mile', '1/8 mile', '12/8 mile'],
    correctAnswerIndex: 1,
    explanation: '3 eighths plus 4 eighths is 7 eighths. The size of each part stays eighths.',
    animationDescription: '',
    difficulty: 'Hard',
  },
  {
    id: 'fixture-q3',
    text: 'Which mixed number is equal to 9/4?',
    options: ['9 1/4', '2 1/4', '1 5/4', '4 1/9'],
    correctAnswerIndex: 1,
    explanation: '8/4 is 2 wholes, and 1/4 is left over, so 9/4 = 2 1/4.',
    animationDescription: '',
    difficulty: 'Hard',
  },
  {
    id: 'fixture-q4',
    text: 'What is 5/6 + 2/6?',
    options: ['7/12', '7/6', '3/6', '10/6'],
    correctAnswerIndex: 1,
    explanation: '5 sixths plus 2 sixths is 7 sixths, which is more than one whole.',
    animationDescription: '',
    difficulty: 'Medium',
  },
];

export const FIXTURE_RESULTS: QuizResult[] = [
  { questionIndex: 0, selectedOptionIndex: 0, isCorrect: false, timeTaken: 30, difficulty: 'Medium' },
  { questionIndex: 1, selectedOptionIndex: 0, isCorrect: false, timeTaken: 41, difficulty: 'Hard' },
  { questionIndex: 2, selectedOptionIndex: 0, isCorrect: false, timeTaken: 38, difficulty: 'Hard' },
  { questionIndex: 3, selectedOptionIndex: 1, isCorrect: true, timeTaken: 22, difficulty: 'Medium' },
];

export const FIXTURE_ANALYSIS: GapAnalysis = {
  standardCode: FIXTURE_STANDARD.code,
  confidenceScore: 78,
  summary:
    'The student adds the denominators as well as the numerators when combining fractions, including in a word problem, and does not yet convert a fraction greater than one into a mixed number.',
  identifiedGaps: [
    {
      gapType: GapType.Conceptual,
      description: 'Treats the denominator as a count to combine rather than the size of each part.',
      relatedQuestions: [1, 2],
      misconception: '2/5 + 1/5 = 3/10 because you add the tops and the bottoms.',
    },
    {
      gapType: GapType.Procedural,
      description: 'Does not decompose a fraction greater than one into wholes and a leftover part.',
      relatedQuestions: [3],
      misconception: '9/4 is written as 9 1/4.',
    },
  ],
  subSkills: [
    { name: 'Add like-denominator fractions', description: 'Sums with denominators up to 12', correctCount: 1, totalCount: 2 },
    { name: 'Fraction word problems', description: 'Fractions in context', correctCount: 0, totalCount: 1 },
    { name: 'Mixed numbers', description: 'Convert fractions greater than one', correctCount: 0, totalCount: 1 },
  ],
  attemptRows: [
    {
      attemptOrder: 1, questionIndex: 0, questionId: 'fixture-q1', standardCode: 'MA.4.FR.2.2', strandCode: 'FR',
      selectedOptionIndex: 0, selectedOptionText: '3/10', correctOptionText: '3/5', isCorrect: false, timeTakenSec: 30,
      difficultyPresented: 'Medium', adaptiveDecisionReason: '', sourceType: 'novel', generatedByAi: true,
      misconceptionSignal: '', strategyTip: '', tieredNextStep: '',
    },
    {
      attemptOrder: 2, questionIndex: 1, questionId: 'fixture-q2', standardCode: 'MA.4.FR.2.2', strandCode: 'FR',
      selectedOptionIndex: 0, selectedOptionText: '7/16 mile', correctOptionText: '7/8 mile', isCorrect: false, timeTakenSec: 41,
      difficultyPresented: 'Hard', adaptiveDecisionReason: '', sourceType: 'novel', generatedByAi: true,
      misconceptionSignal: '', strategyTip: '', tieredNextStep: '',
    },
    {
      attemptOrder: 3, questionIndex: 2, questionId: 'fixture-q3', standardCode: 'MA.4.FR.2.2', strandCode: 'FR',
      selectedOptionIndex: 0, selectedOptionText: '9 1/4', correctOptionText: '2 1/4', isCorrect: false, timeTakenSec: 38,
      difficultyPresented: 'Hard', adaptiveDecisionReason: '', sourceType: 'novel', generatedByAi: true,
      misconceptionSignal: '', strategyTip: '', tieredNextStep: '',
    },
    {
      attemptOrder: 4, questionIndex: 3, questionId: 'fixture-q4', standardCode: 'MA.4.FR.2.2', strandCode: 'FR',
      selectedOptionIndex: 1, selectedOptionText: '7/6', correctOptionText: '7/6', isCorrect: true, timeTakenSec: 22,
      difficultyPresented: 'Medium', adaptiveDecisionReason: '', sourceType: 'novel', generatedByAi: true,
      misconceptionSignal: '', strategyTip: '', tieredNextStep: '',
    },
  ],
  teacherActions: ['Reteach fraction addition with fraction strips before moving to symbols.'],
  studentActions: ['Draw a bar model before adding.'],
  reliabilityFlags: [],
};

const barSvg = (parts: number, shaded: Array<string | null>) => {
  const width = 520 / parts;
  const cells = Array.from({ length: parts }, (_, i) =>
    `<rect x="${40 + i * width}" y="150" width="${width}" height="100" fill="${shaded[i] ?? '#ffffff'}" stroke="#171525" stroke-width="3"/>`,
  ).join('');
  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400"><rect width="600" height="400" fill="#ffffff"/>${cells}</svg>`,
  )}`;
};

/** A structured deck shaped like real gpt-5.5 output, for layout work in the dev gallery. */
export const FIXTURE_DECK: RemedialSlide[] = [
  {
    slideNumber: 1,
    layout: 'gap_overview',
    title: 'Where we got stuck',
    subtitle: 'A pattern we can fix today',
    content: '',
    keyPoints: [
      'You chose 3/10 for 2/5 + 1/5.',
      'We will keep fifths the same size.',
      'We will make wholes from extra parts.',
    ],
    talkingPoints: [
      'I noticed a pattern in your answers, and it is fixable.',
      'For 2/5 + 1/5, you picked 3/10 because you added both numbers.',
      'Question: If the parts are fifths, what should the answer still be? Correct reply: fifths.',
    ],
    vocabulary: [
      { term: 'denominator', meaning: 'The bottom number that names the part size.' },
      { term: 'numerator', meaning: 'The top number that tells how many parts.' },
    ],
    visualDescription: '',
    gapAddressed: 'Denominator as count',
    imageStatus: 'none',
  },
  {
    slideNumber: 2,
    layout: 'concept',
    title: 'Fifths stay fifths when you add',
    subtitle: 'Add how many, not the size',
    content: '',
    keyPoints: [
      'When the parts match, add only the number of parts.',
      'The denominator names the size of each part.',
      'The numerator tells how many parts you have.',
    ],
    talkingPoints: [
      'Fractions are like counting named things: 2 apples plus 1 apple is 3 apples.',
      'In 2/5 + 1/5, we are counting fifths.',
      'Question: What does the 5 tell us? Correct reply: the parts are fifths.',
    ],
    vocabulary: [{ term: 'like denominators', meaning: 'Fractions with the same bottom number.' }],
    visualDescription: 'A bar split into 5 equal parts with 3 parts shaded.',
    generatedImageBase64: barSvg(5, ['#3b82f6', '#3b82f6', '#3b82f6']),
    gapAddressed: 'Denominator as count',
    imageStatus: 'verified',
  },
  {
    slideNumber: 3,
    layout: 'model',
    title: 'Sixths stay sixths on a bar',
    subtitle: 'A picture shows the rule',
    content: '',
    keyPoints: [
      'Split the bar into 6 equal parts.',
      'Shade 2/6, then shade 3/6 more.',
      'Count the shaded sixths: 5 sixths.',
      'The bottom number stays 6.',
    ],
    talkingPoints: [
      'This bar is cut into 6 equal parts, so every piece is a sixth.',
      'Question: Are the pieces still sixths after we add them? Correct reply: yes.',
    ],
    vocabulary: [{ term: 'equal parts', meaning: 'Pieces that are the same size.' }],
    visualDescription: 'A bar split into 6 equal parts, 2 shaded blue and 3 shaded green.',
    generatedImageBase64: barSvg(6, ['#3b82f6', '#3b82f6', '#22c55e', '#22c55e', '#22c55e']),
    gapAddressed: 'Denominator as count',
    imageStatus: 'verified',
  },
  {
    slideNumber: 4,
    layout: 'worked_example',
    title: 'Add parts, then make wholes',
    subtitle: 'Fractions can be more than one',
    content: '',
    keyPoints: ['Every 4 fourths make 1 whole.'],
    workedExample: {
      problem: 'Add 5/4 + 2/4. Write it as a mixed number.',
      steps: [
        'Both fractions are fourths, so keep /4.',
        'Add the numerators: 5 + 2 = 7.',
        '7/4 means 7 fourths.',
        '4/4 is 1 whole, with 3/4 left over.',
      ],
      answer: '5/4 + 2/4 = 7/4 = 1 3/4',
    },
    talkingPoints: [
      'First, we keep the denominator because all the pieces are fourths.',
      'Question: How many fourths make 1 whole? Correct reply: 4/4.',
    ],
    vocabulary: [{ term: 'mixed number', meaning: 'A whole number and a fraction together.' }],
    visualDescription: 'Seven 1/4 pieces with four of them circled as one whole.',
    gapAddressed: 'Decompose greater fractions',
    imageStatus: 'rejected',
  },
  {
    slideNumber: 5,
    layout: 'mistake_fix',
    title: 'Do not add the denominators',
    subtitle: 'The part size stays the same',
    content: '',
    keyPoints: ['Add the tops. Keep the bottom.'],
    misconception: {
      wrong: '3/8 + 4/8 = 7/16',
      why: 'Adding the denominators turns eighths into sixteenths, a different part size.',
      fix: '3/8 + 4/8 = 7/8',
    },
    talkingPoints: [
      'This matches your answer on the running problem.',
      'Question: What size parts did Maya run? Correct reply: eighths.',
    ],
    vocabulary: [{ term: 'eighths', meaning: 'Equal parts when one whole is split into 8 pieces.' }],
    visualDescription: '',
    gapAddressed: 'Denominator as count',
    imageStatus: 'none',
  },
  {
    slideNumber: 6,
    layout: 'try_it',
    title: 'Make wholes from extra parts',
    subtitle: 'Your turn',
    content: '',
    keyPoints: ['Keep fifths as fifths.', 'Trade 5/5 for 1 whole.'],
    checkQuestion: { prompt: 'What is 6/5 + 2/5? Write it as a mixed number.', answer: '6/5 + 2/5 = 8/5 = 1 3/5' },
    talkingPoints: [
      'Try this one by counting fifths first.',
      'Question: How many fifths make 1 whole? Correct reply: 5/5.',
    ],
    vocabulary: [{ term: 'greater than one', meaning: 'More than one whole.' }],
    visualDescription: '',
    gapAddressed: 'Decompose greater fractions',
    imageStatus: 'none',
  },
];
