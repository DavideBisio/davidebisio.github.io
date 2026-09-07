export interface SkillNode {
  name: string;
  level?: 'familiar' | 'proficient' | 'expert';
  children?: SkillNode[];
}

export interface Experience {
  role: string;
  company: string;
  location?: string;
  start: string;
  end?: string;
  highlights: string[];
}

export interface Education {
  degree: string;
  school: string;
  start: string;
  end?: string;
  notes?: string;
}

export const profile = {
  name: 'Davide Bisio',
  title: 'Software Engineer',
  location: 'Italy',
  email: 'davide.bisio92@gmail.com',
  summary:
    'Software engineer with a focus on building reliable, well-tested systems. Replace this with your real summary.',
  links: [
    { label: 'GitHub', url: 'https://github.com/davidebisio' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/REPLACE_ME' },
  ],
};

export const experience: Experience[] = [
  {
    role: 'Software Engineer',
    company: 'Replace With Company',
    location: 'Remote',
    start: '2022',
    end: 'Present',
    highlights: [
      'Replace with a concrete achievement, ideally with a number.',
      'Replace with another achievement.',
    ],
  },
];

export const education: Education[] = [
  {
    degree: 'Replace With Degree',
    school: 'Replace With University',
    start: '2014',
    end: '2018',
  },
];

export const skillsTree: SkillNode[] = [
  {
    name: 'Languages',
    children: [
      { name: 'TypeScript', level: 'expert' },
      { name: 'Python', level: 'proficient' },
      { name: 'Go', level: 'familiar' },
    ],
  },
  {
    name: 'Frontend',
    children: [
      { name: 'React', level: 'expert' },
      { name: 'Astro', level: 'proficient' },
    ],
  },
  {
    name: 'Backend',
    children: [
      { name: 'Node.js', level: 'expert' },
      { name: 'PostgreSQL', level: 'proficient' },
    ],
  },
  {
    name: 'Tools & Practices',
    children: [
      { name: 'Git', level: 'expert' },
      { name: 'Docker', level: 'proficient' },
      { name: 'CI/CD', level: 'proficient' },
    ],
  },
];
