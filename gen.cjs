const fs = require('fs');

const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8'];
const domains = ['NSO', 'AR', 'GR', 'M', 'FR', 'DP', 'F'];

let content = "import { GradeLevel, Standard, Question, TopicNode } from './types';\\n\\nexport const FLORIDA_STANDARDS: Standard[] = [\\n";

const descMap = {
  'NSO': 'Number Sense and Operations: Understand, compare, and operate on numbers.',
  'AR': 'Algebraic Reasoning: Solve equations, understand patterns, and algebraic concepts.',
  'GR': 'Geometric Reasoning: Identify figures, calculate area/volume, and understand geometry.',
  'M': 'Measurement: Measure length, time, weight, and conversions.',
  'FR': 'Fractions: Understand parts of a whole, equivalent fractions, and operations.',
  'DP': 'Data Analysis and Probability: Analyze datasets, mean/median, and probability.',
  'F': 'Functions: Understand and evaluate linear and non-linear functions.'
};

grades.forEach(g => {
    const gradeEnum = g === 'K' ? 'GradeLevel.K' : 'GradeLevel.G' + g;
    
    domains.forEach(d => {
        // Skip some domains for certain grades
        if ((g === 'K' || g === '1' || g === '2') && (d === 'FR' || d === 'DP' || d === 'F')) {
            if (!(g === '2' && d === 'FR')) return;
        }
        if (g !== '8' && d === 'F') return; // Functions mostly G8
        
        for (let i = 1; i <= 3; i++) {
            for (let j = 1; j <= 5; j++) {
                // Generate a realistic amount of sub-standards
                let sCode = "MA." + g + "." + d + "." + i + "." + j;
                let desc = descMap[d] + " Target level " + i + "." + j + " for grade " + g + ".";
                
                content += "  {\\n";
                content += "    grade: " + gradeEnum + ",\\n";
                content += "    code: '" + sCode + "',\\n";
                content += "    description: '" + desc + "'\\n";
                content += "  },\\n";
            }
        }
    });
});

content += "];\\n";
fs.writeFileSync('./standards-gen.js', content);
