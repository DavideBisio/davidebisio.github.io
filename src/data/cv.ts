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
  title: 'Senior Digital Verification Engineer',
  location: 'Italy',
  email: 'davide.bisio92@gmail.com',
  summary:
    'Digital verification engineer with a background in UVM testbench development, formal verification, and analog/DSP modeling for mixed-signal designs. Currently applying the same rigor to integrating AI tooling — Claude Code skills, plugins, and automated workflows — into engineering practice.',
  links: [{ label: 'GitHub', url: 'https://github.com/davidebisio' }],
};

export const experience: Experience[] = [
  {
    role: 'Sr Digital Verification Engineer',
    company: 'Allegro MicroSystems Europe Ltd.',
    start: 'Oct 2023',
    end: 'Present',
    highlights: [
      'UVM testbench deployment and UVC development for verification environments.',
      'Formal verification of digital designs.',
      'Analog modeling for verification, with Python and Git-based tooling.',
      'AI solutions: deep dive into Claude Code — developing skills, plugins, and automated workflows integrated into the engineering process; integrating AI into applications.',
    ],
  },
  {
    role: 'Digital Verification Engineer',
    company: 'STMicroelectronics',
    location: 'Milan',
    start: '2018',
    end: 'Oct 2023',
    highlights: [
      'In charge of introducing new verification methodologies and assessing/improving verification workflow.',
      'DSP modeling and assertion-based verification (SVA).',
      'Reference point for verification practices within the team.',
    ],
  },
  {
    role: 'Powertrain Electronics',
    company: 'Team H2politO, Politecnico di Torino',
    start: '2014',
    end: '2015',
    highlights: [
      'Developed the powertrain electronics, dashboard UI, datalogging and telemetry for a two-seat hybrid vehicle prototype.',
      'Twice led the electronics division to compete at the Shell Eco-marathon (Rotterdam).',
    ],
  },
];

export const education: Education[] = [
  {
    degree: "Master's Degree in Electronic Engineering",
    school: 'Politecnico di Torino',
    start: '2015',
    end: '2018',
    notes: 'Thesis: real-time modeling and testbench implementation of digital signal processing for MEMS sensors. Final grade: 103/110.',
  },
  {
    degree: "Bachelor's Degree in Electronic Engineering",
    school: 'Politecnico di Torino',
    start: '2011',
    end: '2015',
    notes: 'Final grade: 84/110.',
  },
];

export const skillsTree: SkillNode[] = [
  {
    name: 'Verification',
    children: [
      { name: 'UVM (SystemVerilog)', level: 'expert' },
      { name: 'UVC Development', level: 'expert' },
      { name: 'Formal Verification (Jasper Gold)', level: 'expert' },
      { name: 'Assertion-Based Verification (SVA)', level: 'expert' },
      { name: 'Functional & Code Coverage', level: 'proficient' },
      { name: 'Low Power Verification (UPF)', level: 'proficient' },
      { name: 'Gate-Level / Post-Layout Simulation', level: 'proficient' },
    ],
  },
  {
    name: 'Languages & Scripting',
    children: [
      { name: 'SystemVerilog', level: 'expert' },
      { name: 'Python', level: 'proficient' },
      { name: 'MATLAB', level: 'proficient' },
      { name: 'Tcl / AWK', level: 'familiar' },
    ],
  },
  {
    name: 'Tools',
    children: [
      { name: 'Git', level: 'expert' },
      { name: 'Cadence Xcelium / Indago / vManager', level: 'proficient' },
    ],
  },
  {
    name: 'Domain Modeling',
    children: [
      { name: 'Analog Modeling for Verification', level: 'proficient' },
      { name: 'DSP / MEMS Sensor Modeling', level: 'proficient' },
    ],
  },
  {
    name: 'AI & Automation',
    children: [
      { name: 'Claude Code (skills, plugins, workflows)', level: 'proficient' },
      { name: 'AI Integration in Applications', level: 'proficient' },
    ],
  },
];
