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
    'Digital verification engineer with 8+ years of experience in UVM testbench development, formal verification, and analog/DSP modeling for mixed-signal designs. Increasingly focused on applying AI to verification engineering — building data-processing and workflow tooling around Claude Code.',
  links: [{ label: 'GitHub', url: 'https://github.com/davidebisio' }],
};

export const experience: Experience[] = [
  {
    role: 'Senior Digital Verification Engineer',
    company: 'Allegro MicroSystems Europe Ltd.',
    start: '2023',
    end: 'Present',
    highlights: [
      'Develop data-processing and intelligent workflow applications that apply AI to verification engineering problems, including a deep dive into Claude Code — building skills, plugins, and automated workflows now part of the team\'s day-to-day practice.',
      'Own UVM testbench deployment and UVC development for verification environments.',
      'Drive formal verification of digital designs.',
      'Fault injection specialist, using Siemens Austemper SafetyScope & KaleidoScope for functional safety verification.',
      'Build analog models for verification, with Python and Git-based tooling.',
    ],
  },
  {
    role: 'Digital Verification Engineer',
    company: 'STMicroelectronics',
    location: 'Milan',
    start: '2018',
    end: '2023',
    highlights: [
      'Delivered real-time DSP modeling and assertion-based (SVA) verification for dynamic simulations of randomized configuration changes in mixed-signal designs.',
      'Implemented updated UVM specifications to optimize testbenches and enhance test case coverage, driving verification-workflow improvements across the team.',
      'Served as the team\'s go-to reference for verification practices.',
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
      { name: 'Fault Injection', level: 'expert' },
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
      { name: 'Tcl / AWK', level: 'familiar' },
    ],
  },
  {
    name: 'Tools',
    children: [
      { name: 'Cadence JasperGold', level: 'expert' },
      { name: 'Cadence Xcelium / Indago / vManager', level: 'proficient' },
      { name: 'Siemens Austemper SafetyScope & KaleidoScope (Fault Injection)', level: 'expert' },
      { name: 'Jama Connect (Jama Software)', level: 'proficient' },
      { name: 'MATLAB', level: 'proficient' },
      { name: 'Git', level: 'expert' },
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
      { name: 'AI-Driven Data Processing & Workflow Apps', level: 'proficient' },
    ],
  },
];
