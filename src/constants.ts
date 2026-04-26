import { GradeLevel, Standard, Question, TopicNode } from './types';

// Expanded list of Florida B.E.S.T. Standards to ensure coverage across all grades
export const FLORIDA_STANDARDS: Standard[] = [
  {
    grade: GradeLevel.K,
    code: 'MA.K.NSO.1.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.1 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.NSO.1.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.2 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.NSO.1.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.3 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.NSO.1.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.4 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.NSO.1.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.5 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.NSO.2.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.1 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.NSO.2.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.2 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.NSO.2.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.3 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.NSO.2.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.4 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.NSO.2.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.5 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.NSO.3.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.1 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.NSO.3.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.2 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.NSO.3.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.3 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.NSO.3.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.4 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.NSO.3.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.5 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.AR.1.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.1 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.AR.1.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.2 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.AR.1.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.3 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.AR.1.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.4 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.AR.1.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.5 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.AR.2.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.1 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.AR.2.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.2 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.AR.2.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.3 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.AR.2.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.4 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.AR.2.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.5 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.AR.3.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.1 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.AR.3.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.2 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.AR.3.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.3 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.AR.3.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.4 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.AR.3.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.5 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.GR.1.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.1 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.GR.1.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.2 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.GR.1.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.3 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.GR.1.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.4 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.GR.1.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.5 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.GR.2.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.1 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.GR.2.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.2 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.GR.2.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.3 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.GR.2.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.4 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.GR.2.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.5 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.GR.3.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.1 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.GR.3.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.2 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.GR.3.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.3 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.GR.3.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.4 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.GR.3.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.5 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.M.1.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.1 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.M.1.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.2 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.M.1.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.3 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.M.1.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.4 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.M.1.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.5 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.M.2.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.1 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.M.2.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.2 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.M.2.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.3 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.M.2.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.4 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.M.2.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.5 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.M.3.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.1 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.M.3.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.2 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.M.3.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.3 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.M.3.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.4 for grade K.'
  },
  {
    grade: GradeLevel.K,
    code: 'MA.K.M.3.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.5 for grade K.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.NSO.1.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.1 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.NSO.1.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.2 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.NSO.1.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.3 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.NSO.1.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.4 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.NSO.1.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.5 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.NSO.2.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.1 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.NSO.2.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.2 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.NSO.2.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.3 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.NSO.2.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.4 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.NSO.2.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.5 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.NSO.3.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.1 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.NSO.3.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.2 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.NSO.3.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.3 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.NSO.3.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.4 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.NSO.3.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.5 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.AR.1.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.1 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.AR.1.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.2 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.AR.1.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.3 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.AR.1.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.4 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.AR.1.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.5 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.AR.2.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.1 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.AR.2.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.2 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.AR.2.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.3 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.AR.2.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.4 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.AR.2.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.5 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.AR.3.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.1 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.AR.3.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.2 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.AR.3.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.3 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.AR.3.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.4 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.AR.3.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.5 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.GR.1.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.1 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.GR.1.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.2 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.GR.1.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.3 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.GR.1.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.4 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.GR.1.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.5 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.GR.2.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.1 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.GR.2.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.2 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.GR.2.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.3 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.GR.2.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.4 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.GR.2.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.5 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.GR.3.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.1 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.GR.3.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.2 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.GR.3.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.3 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.GR.3.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.4 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.GR.3.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.5 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.M.1.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.1 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.M.1.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.2 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.M.1.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.3 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.M.1.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.4 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.M.1.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.5 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.M.2.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.1 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.M.2.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.2 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.M.2.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.3 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.M.2.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.4 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.M.2.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.5 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.M.3.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.1 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.M.3.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.2 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.M.3.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.3 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.M.3.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.4 for grade 1.'
  },
  {
    grade: GradeLevel.G1,
    code: 'MA.1.M.3.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.5 for grade 1.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.NSO.1.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.1 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.NSO.1.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.2 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.NSO.1.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.3 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.NSO.1.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.4 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.NSO.1.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.5 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.NSO.2.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.1 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.NSO.2.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.2 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.NSO.2.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.3 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.NSO.2.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.4 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.NSO.2.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.5 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.NSO.3.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.1 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.NSO.3.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.2 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.NSO.3.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.3 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.NSO.3.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.4 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.NSO.3.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.5 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.AR.1.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.1 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.AR.1.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.2 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.AR.1.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.3 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.AR.1.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.4 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.AR.1.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.5 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.AR.2.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.1 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.AR.2.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.2 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.AR.2.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.3 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.AR.2.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.4 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.AR.2.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.5 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.AR.3.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.1 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.AR.3.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.2 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.AR.3.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.3 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.AR.3.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.4 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.AR.3.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.5 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.GR.1.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.1 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.GR.1.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.2 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.GR.1.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.3 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.GR.1.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.4 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.GR.1.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.5 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.GR.2.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.1 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.GR.2.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.2 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.GR.2.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.3 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.GR.2.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.4 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.GR.2.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.5 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.GR.3.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.1 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.GR.3.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.2 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.GR.3.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.3 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.GR.3.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.4 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.GR.3.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.5 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.M.1.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.1 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.M.1.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.2 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.M.1.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.3 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.M.1.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.4 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.M.1.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.5 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.M.2.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.1 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.M.2.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.2 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.M.2.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.3 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.M.2.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.4 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.M.2.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.5 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.M.3.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.1 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.M.3.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.2 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.M.3.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.3 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.M.3.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.4 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.M.3.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.5 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.FR.1.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.1 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.FR.1.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.2 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.FR.1.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.3 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.FR.1.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.4 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.FR.1.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.5 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.FR.2.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.1 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.FR.2.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.2 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.FR.2.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.3 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.FR.2.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.4 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.FR.2.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.5 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.FR.3.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.1 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.FR.3.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.2 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.FR.3.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.3 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.FR.3.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.4 for grade 2.'
  },
  {
    grade: GradeLevel.G2,
    code: 'MA.2.FR.3.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.5 for grade 2.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.NSO.1.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.NSO.1.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.NSO.1.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.NSO.1.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.NSO.1.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.NSO.2.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.NSO.2.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.NSO.2.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.NSO.2.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.NSO.2.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.NSO.3.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.NSO.3.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.NSO.3.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.NSO.3.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.NSO.3.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.AR.1.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.AR.1.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.AR.1.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.AR.1.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.AR.1.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.AR.2.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.AR.2.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.AR.2.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.AR.2.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.AR.2.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.AR.3.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.AR.3.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.AR.3.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.AR.3.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.AR.3.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.GR.1.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.GR.1.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.GR.1.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.GR.1.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.GR.1.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.GR.2.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.GR.2.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.GR.2.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.GR.2.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.GR.2.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.GR.3.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.GR.3.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.GR.3.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.GR.3.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.GR.3.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.M.1.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.M.1.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.M.1.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.M.1.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.M.1.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.M.2.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.M.2.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.M.2.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.M.2.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.M.2.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.M.3.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.M.3.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.M.3.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.M.3.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.M.3.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.FR.1.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.FR.1.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.FR.1.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.FR.1.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.FR.1.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.FR.2.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.FR.2.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.FR.2.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.FR.2.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.FR.2.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.FR.3.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.FR.3.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.FR.3.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.FR.3.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.FR.3.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.DP.1.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.DP.1.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.DP.1.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.DP.1.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.DP.1.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.DP.2.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.DP.2.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.DP.2.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.DP.2.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.DP.2.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.5 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.DP.3.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.1 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.DP.3.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.2 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.DP.3.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.3 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.DP.3.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.4 for grade 3.'
  },
  {
    grade: GradeLevel.G3,
    code: 'MA.3.DP.3.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.5 for grade 3.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.NSO.1.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.NSO.1.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.NSO.1.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.NSO.1.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.NSO.1.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.NSO.2.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.NSO.2.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.NSO.2.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.NSO.2.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.NSO.2.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.NSO.3.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.NSO.3.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.NSO.3.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.NSO.3.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.NSO.3.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.AR.1.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.AR.1.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.AR.1.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.AR.1.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.AR.1.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.AR.2.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.AR.2.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.AR.2.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.AR.2.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.AR.2.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.AR.3.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.AR.3.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.AR.3.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.AR.3.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.AR.3.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.GR.1.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.GR.1.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.GR.1.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.GR.1.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.GR.1.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.GR.2.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.GR.2.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.GR.2.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.GR.2.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.GR.2.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.GR.3.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.GR.3.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.GR.3.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.GR.3.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.GR.3.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.M.1.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.M.1.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.M.1.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.M.1.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.M.1.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.M.2.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.M.2.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.M.2.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.M.2.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.M.2.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.M.3.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.M.3.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.M.3.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.M.3.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.M.3.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.FR.1.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.FR.1.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.FR.1.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.FR.1.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.FR.1.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.FR.2.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.FR.2.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.FR.2.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.FR.2.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.FR.2.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.FR.3.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.FR.3.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.FR.3.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.FR.3.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.FR.3.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.DP.1.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.DP.1.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.DP.1.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.DP.1.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.DP.1.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.DP.2.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.DP.2.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.DP.2.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.DP.2.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.DP.2.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.5 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.DP.3.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.1 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.DP.3.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.2 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.DP.3.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.3 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.DP.3.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.4 for grade 4.'
  },
  {
    grade: GradeLevel.G4,
    code: 'MA.4.DP.3.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.5 for grade 4.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.NSO.1.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.NSO.1.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.NSO.1.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.NSO.1.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.NSO.1.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.NSO.2.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.NSO.2.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.NSO.2.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.NSO.2.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.NSO.2.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.NSO.3.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.NSO.3.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.NSO.3.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.NSO.3.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.NSO.3.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.AR.1.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.AR.1.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.AR.1.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.AR.1.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.AR.1.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.AR.2.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.AR.2.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.AR.2.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.AR.2.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.AR.2.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.AR.3.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.AR.3.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.AR.3.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.AR.3.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.AR.3.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.GR.1.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.GR.1.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.GR.1.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.GR.1.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.GR.1.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.GR.2.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.GR.2.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.GR.2.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.GR.2.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.GR.2.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.GR.3.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.GR.3.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.GR.3.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.GR.3.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.GR.3.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.M.1.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.M.1.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.M.1.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.M.1.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.M.1.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.M.2.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.M.2.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.M.2.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.M.2.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.M.2.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.M.3.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.M.3.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.M.3.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.M.3.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.M.3.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.FR.1.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.FR.1.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.FR.1.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.FR.1.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.FR.1.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.FR.2.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.FR.2.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.FR.2.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.FR.2.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.FR.2.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.FR.3.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.FR.3.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.FR.3.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.FR.3.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.FR.3.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.DP.1.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.DP.1.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.DP.1.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.DP.1.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.DP.1.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.DP.2.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.DP.2.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.DP.2.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.DP.2.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.DP.2.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.5 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.DP.3.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.1 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.DP.3.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.2 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.DP.3.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.3 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.DP.3.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.4 for grade 5.'
  },
  {
    grade: GradeLevel.G5,
    code: 'MA.5.DP.3.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.5 for grade 5.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.NSO.1.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.NSO.1.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.NSO.1.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.NSO.1.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.NSO.1.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.NSO.2.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.NSO.2.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.NSO.2.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.NSO.2.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.NSO.2.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.NSO.3.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.NSO.3.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.NSO.3.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.NSO.3.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.NSO.3.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.AR.1.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.AR.1.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.AR.1.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.AR.1.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.AR.1.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.AR.2.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.AR.2.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.AR.2.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.AR.2.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.AR.2.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.AR.3.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.AR.3.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.AR.3.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.AR.3.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.AR.3.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.GR.1.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.GR.1.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.GR.1.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.GR.1.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.GR.1.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.GR.2.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.GR.2.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.GR.2.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.GR.2.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.GR.2.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.GR.3.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.GR.3.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.GR.3.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.GR.3.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.GR.3.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.M.1.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.M.1.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.M.1.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.M.1.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.M.1.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.M.2.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.M.2.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.M.2.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.M.2.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.M.2.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.M.3.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.M.3.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.M.3.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.M.3.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.M.3.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.FR.1.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.FR.1.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.FR.1.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.FR.1.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.FR.1.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.FR.2.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.FR.2.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.FR.2.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.FR.2.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.FR.2.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.FR.3.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.FR.3.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.FR.3.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.FR.3.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.FR.3.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.DP.1.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.DP.1.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.DP.1.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.DP.1.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.DP.1.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.DP.2.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.DP.2.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.DP.2.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.DP.2.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.DP.2.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.5 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.DP.3.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.1 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.DP.3.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.2 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.DP.3.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.3 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.DP.3.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.4 for grade 6.'
  },
  {
    grade: GradeLevel.G6,
    code: 'MA.6.DP.3.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.5 for grade 6.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.NSO.1.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.NSO.1.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.NSO.1.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.NSO.1.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.NSO.1.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.NSO.2.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.NSO.2.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.NSO.2.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.NSO.2.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.NSO.2.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.NSO.3.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.NSO.3.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.NSO.3.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.NSO.3.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.NSO.3.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.AR.1.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.AR.1.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.AR.1.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.AR.1.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.AR.1.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.AR.2.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.AR.2.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.AR.2.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.AR.2.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.AR.2.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.AR.3.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.AR.3.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.AR.3.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.AR.3.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.AR.3.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.GR.1.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.GR.1.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.GR.1.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.GR.1.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.GR.1.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.GR.2.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.GR.2.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.GR.2.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.GR.2.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.GR.2.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.GR.3.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.GR.3.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.GR.3.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.GR.3.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.GR.3.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.M.1.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.M.1.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.M.1.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.M.1.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.M.1.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.M.2.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.M.2.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.M.2.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.M.2.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.M.2.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.M.3.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.M.3.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.M.3.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.M.3.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.M.3.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.FR.1.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.FR.1.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.FR.1.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.FR.1.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.FR.1.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.FR.2.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.FR.2.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.FR.2.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.FR.2.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.FR.2.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.FR.3.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.FR.3.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.FR.3.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.FR.3.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.FR.3.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.DP.1.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.DP.1.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.DP.1.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.DP.1.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.DP.1.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.DP.2.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.DP.2.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.DP.2.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.DP.2.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.DP.2.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.5 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.DP.3.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.1 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.DP.3.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.2 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.DP.3.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.3 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.DP.3.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.4 for grade 7.'
  },
  {
    grade: GradeLevel.G7,
    code: 'MA.7.DP.3.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.5 for grade 7.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.NSO.1.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.NSO.1.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.NSO.1.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.NSO.1.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.NSO.1.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 1.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.NSO.2.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.NSO.2.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.NSO.2.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.NSO.2.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.NSO.2.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 2.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.NSO.3.1',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.NSO.3.2',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.NSO.3.3',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.NSO.3.4',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.NSO.3.5',
    description: 'Number Sense and Operations: Understand, compare, and operate on numbers. Target level 3.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.AR.1.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.AR.1.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.AR.1.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.AR.1.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.AR.1.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 1.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.AR.2.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.AR.2.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.AR.2.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.AR.2.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.AR.2.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 2.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.AR.3.1',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.AR.3.2',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.AR.3.3',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.AR.3.4',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.AR.3.5',
    description: 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts. Target level 3.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.GR.1.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.GR.1.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.GR.1.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.GR.1.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.GR.1.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 1.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.GR.2.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.GR.2.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.GR.2.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.GR.2.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.GR.2.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 2.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.GR.3.1',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.GR.3.2',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.GR.3.3',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.GR.3.4',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.GR.3.5',
    description: 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry. Target level 3.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.M.1.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.M.1.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.M.1.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.M.1.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.M.1.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 1.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.M.2.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.M.2.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.M.2.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.M.2.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.M.2.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 2.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.M.3.1',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.M.3.2',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.M.3.3',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.M.3.4',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.M.3.5',
    description: 'Measurement: Measure length, time, weight, and conversions. Target level 3.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.FR.1.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.FR.1.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.FR.1.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.FR.1.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.FR.1.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 1.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.FR.2.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.FR.2.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.FR.2.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.FR.2.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.FR.2.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 2.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.FR.3.1',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.FR.3.2',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.FR.3.3',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.FR.3.4',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.FR.3.5',
    description: 'Fractions: Understand parts of a whole, equivalent fractions, and operations. Target level 3.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.DP.1.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.DP.1.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.DP.1.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.DP.1.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.DP.1.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 1.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.DP.2.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.DP.2.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.DP.2.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.DP.2.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.DP.2.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 2.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.DP.3.1',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.DP.3.2',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.DP.3.3',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.DP.3.4',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.DP.3.5',
    description: 'Data Analysis and Probability: Analyze datasets, mean/median, and probability. Target level 3.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.F.1.1',
    description: 'Functions: Understand and evaluate linear and non-linear functions. Target level 1.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.F.1.2',
    description: 'Functions: Understand and evaluate linear and non-linear functions. Target level 1.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.F.1.3',
    description: 'Functions: Understand and evaluate linear and non-linear functions. Target level 1.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.F.1.4',
    description: 'Functions: Understand and evaluate linear and non-linear functions. Target level 1.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.F.1.5',
    description: 'Functions: Understand and evaluate linear and non-linear functions. Target level 1.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.F.2.1',
    description: 'Functions: Understand and evaluate linear and non-linear functions. Target level 2.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.F.2.2',
    description: 'Functions: Understand and evaluate linear and non-linear functions. Target level 2.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.F.2.3',
    description: 'Functions: Understand and evaluate linear and non-linear functions. Target level 2.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.F.2.4',
    description: 'Functions: Understand and evaluate linear and non-linear functions. Target level 2.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.F.2.5',
    description: 'Functions: Understand and evaluate linear and non-linear functions. Target level 2.5 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.F.3.1',
    description: 'Functions: Understand and evaluate linear and non-linear functions. Target level 3.1 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.F.3.2',
    description: 'Functions: Understand and evaluate linear and non-linear functions. Target level 3.2 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.F.3.3',
    description: 'Functions: Understand and evaluate linear and non-linear functions. Target level 3.3 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.F.3.4',
    description: 'Functions: Understand and evaluate linear and non-linear functions. Target level 3.4 for grade 8.'
  },
  {
    grade: GradeLevel.G8,
    code: 'MA.8.F.3.5',
    description: 'Functions: Understand and evaluate linear and non-linear functions. Target level 3.5 for grade 8.'
  },
];

export const MTR_STANDARDS = [
  "MA.K12.MTR.1.1: Actively participate in effortful learning.",
  "MA.K12.MTR.2.1: Demonstrate understanding by representing problems in multiple ways.",
  "MA.K12.MTR.4.1: Engage in discussions that reflect on the mathematical thinking of self and others.",
  "MA.K12.MTR.5.1: Use patterns and structure to help understand and connect mathematical concepts."
];

// Mock Item Bank to simulate pre-written questions
export const MOCK_ITEM_BANK: Record<string, Question[]> = {
  // Sample bank for Grade 4 Multiplication
  'MA.4.NSO.2.1': [
    {
      id: 'ib-4-1',
      text: 'What is the product of 12 and 8?',
      options: ['86', '96', '104', '98'],
      correctAnswerIndex: 1,
      explanation: '10 x 8 = 80, 2 x 8 = 16. 80 + 16 = 96.',
      animationDescription: 'An area model showing a 10x8 rectangle and a 2x8 rectangle combining.',
      difficulty: 'Medium'
    },
    {
      id: 'ib-4-2',
      text: 'Which equation represents a related division fact for 7 x 6 = 42?',
      options: ['42 ÷ 7 = 6', '42 - 6 = 36', '6 + 7 = 13', '42 x 1 = 42'],
      correctAnswerIndex: 0,
      explanation: 'Multiplication and division are inverse operations.',
      animationDescription: 'A number bond showing 42 at the top splitting into 7 and 6.',
      difficulty: 'Easy'
    },
    {
      id: 'ib-4-3',
      text: 'If you have 9 bags with 9 marbles in each, how many marbles do you have in total?',
      options: ['18', '72', '81', '90'],
      correctAnswerIndex: 2,
      explanation: 'This is a multiplication fact: 9 x 9 = 81.',
      animationDescription: 'A grid of 9 rows and 9 columns filling up.',
      difficulty: 'Medium'
    },
    {
      id: 'ib-4-4',
      text: 'Select the pair of factors that equals 144.',
      options: ['10 x 12', '11 x 11', '12 x 12', '12 x 13'],
      correctAnswerIndex: 2,
      explanation: '12 squared is 144.',
      animationDescription: 'A large 12x12 grid.',
      difficulty: 'Hard'
    },
    {
      id: 'ib-4-5',
      text: 'What is 11 x 11?',
      options: ['111', '121', '122', '110'],
      correctAnswerIndex: 1,
      explanation: '11 x 10 = 110, plus one more group of 11 is 121.',
      animationDescription: 'Visual decomposition of 11x11 into 10x10, 10x1, 1x10, 1x1.',
      difficulty: 'Medium'
    }
  ],
  // Sample bank for Kindergarten Counting
  'MA.K.NSO.1.1': [
     {
       id: 'ib-k-1',
       text: 'How many blue circles are shown?',
       options: ['3', '4', '5', '6'],
       correctAnswerIndex: 2,
       explanation: 'There are 5 circles.',
       animationDescription: 'Counting 1, 2, 3, 4, 5',
       visual: '<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="125" r="30" fill="#3b82f6"/><circle cx="125" cy="125" r="30" fill="#3b82f6"/><circle cx="200" cy="125" r="30" fill="#3b82f6"/><circle cx="275" cy="125" r="30" fill="#3b82f6"/><circle cx="350" cy="125" r="30" fill="#3b82f6"/></svg>',
       difficulty: 'Easy'
     },
     {
       id: 'ib-k-2',
       text: 'Count the stars.',
       options: ['2', '3', '4', '1'],
       correctAnswerIndex: 1,
       explanation: 'There are 3 stars.',
       animationDescription: 'Stars lighting up',
       visual: '<svg viewBox="0 0 400 250" xmlns="http://www.w3.org/2000/svg"><path d="M100 125 L115 170 L70 140 L130 140 L85 170 Z" fill="#f59e0b" transform="translate(0,-20)"/><path d="M200 125 L215 170 L170 140 L230 140 L185 170 Z" fill="#f59e0b" transform="translate(0,-20)"/><path d="M300 125 L315 170 L270 140 L330 140 L285 170 Z" fill="#f59e0b" transform="translate(0,-20)"/></svg>',
       difficulty: 'Easy'
     }
  ]
};

// Hierarchical Data for Sidebar
export const TOPIC_TREE: TopicNode[] = [
  {
    id: 'G4',
    title: 'Grade 4',
    type: 'grade',
    children: [
      {
        id: 'G4-NSO',
        title: 'Number Sense and Operations (NSO)',
        type: 'strand',
        children: [
           { id: 'G4-NSO-ADD', title: 'Addition & Subtraction', type: 'topic', associatedStandards: ['MA.4.NSO.1.1'] },
           { id: 'G4-NSO-MULT', title: 'Multiplication & Division', type: 'topic', associatedStandards: ['MA.4.NSO.2.1'] },
           { id: 'G4-NSO-PV', title: 'Place Value', type: 'topic' },
           { id: 'G4-NSO-ROUND', title: 'Rounding & Estimation', type: 'topic' }
        ]
      },
      {
        id: 'G4-FR',
        title: 'Fractions (FR)',
        type: 'strand',
        children: [
           { id: 'G4-FR-EQUIV', title: 'Equivalent Fractions', type: 'topic' },
           { id: 'G4-FR-OPS', title: 'Decomposing Fractions', type: 'topic', associatedStandards: ['MA.4.FR.2.1'] }
        ]
      },
      { id: 'G4-M', title: 'Measurement (M)', type: 'strand', children: [{id: 'G4-M-TOOLS', title: 'Measuring Tools', type: 'topic', associatedStandards: ['MA.4.M.1.1']}] },
      { id: 'G4-GR', title: 'Geometric Reasoning (GR)', type: 'strand', children: [{id: 'G4-GR-ANG', title: 'Angles', type: 'topic', associatedStandards: ['MA.4.GR.1.1']}] },
    ]
  },
  {
    id: 'K',
    title: 'Kindergarten',
    type: 'grade',
    children: [
      {
         id: 'K-NSO',
         title: 'Number Sense',
         type: 'strand',
         children: [
            { id: 'K-NSO-COUNT', title: 'Counting Objects', type: 'topic', associatedStandards: ['MA.K.NSO.1.1'] },
            { id: 'K-NSO-WR', title: 'Writing Numerals', type: 'topic' }
         ]
      },
      {
         id: 'K-AR',
         title: 'Algebraic Reasoning',
         type: 'strand',
         children: [
            { id: 'K-AR-TEN', title: 'Making Ten', type: 'topic', associatedStandards: ['MA.K.AR.1.1'] }
         ]
      }
    ]
  },
  // Generic placeholders for other grades to demonstrate structure
  { id: 'G1', title: 'Grade 1', type: 'grade', children: [{ id: 'G1-NSO', title: 'Number Sense', type: 'strand', children: [{id: 'G1-NSO-120', title: 'Counting to 120', type: 'topic'}]}] },
  { id: 'G2', title: 'Grade 2', type: 'grade', children: [{ id: 'G2-NSO', title: 'Number Sense', type: 'strand', children: [{id: 'G2-NSO-ADD', title: 'Add/Sub 100', type: 'topic'}]}] },
  { id: 'G3', title: 'Grade 3', type: 'grade', children: [{ id: 'G3-NSO', title: 'Number Sense', type: 'strand', children: [{id: 'G3-NSO-MULT', title: 'Multiplication Facts', type: 'topic'}]}] },
  { id: 'G5', title: 'Grade 5', type: 'grade', children: [{ id: 'G5-NSO', title: 'Number Sense', type: 'strand', children: [{id: 'G5-NSO-DEC', title: 'Decimals', type: 'topic'}]}] },
  { id: 'G6', title: 'Grade 6', type: 'grade', children: [{ id: 'G6-NSO', title: 'Number Sense', type: 'strand', children: [{id: 'G6-NSO-RAT', title: 'Rational Numbers', type: 'topic'}]}] },
  { id: 'G7', title: 'Grade 7', type: 'grade', children: [{ id: 'G7-NSO', title: 'Number Sense', type: 'strand', children: [{id: 'G7-NSO-RE', title: 'Rewriting Rationals', type: 'topic'}]}] },
  { id: 'G8', title: 'Grade 8', type: 'grade', children: [{ id: 'G8-AR', title: 'Algebraic Reasoning', type: 'strand', children: [{id: 'G8-AR-LIN', title: 'Linear Equations', type: 'topic'}]}] },
];