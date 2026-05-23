// SKILLS.md - Enhanced Skill System
export interface Skill {
  id: string;
  name: string;
  category: 'web' | 'mobile' | 'desktop' | 'game';
  description: string;
  preview?: string;
  tags: string[];
  rating: number;
}

export const skills: Skill[] = [
  {
    id: 'web-prototype',
    name: 'Web Prototype',
    category: 'web',
    description: '快速构建Web原型，支持响应式布局和交互效果',
    tags: ['prototype', 'responsive', 'layout'],
    rating: 4.8,
  },
  {
    id: 'dashboard',
    name: 'Dashboard Design',
    category: 'web',
    description: '数据仪表板设计技能，支持多种图表和数据可视化',
    tags: ['dashboard', 'charts', 'data-viz'],
    rating: 4.5,
  },
  {
    id: 'mobile-app',
    name: 'Mobile App',
    category: 'mobile',
    description: '移动应用设计技能，支持iOS和Android平台',
    tags: ['mobile', 'ios', 'android'],
    rating: 4.7,
  },
];

export function getSkillsByCategory(category: Skill['category']): Skill[] {
  return skills.filter(s => s.category === category);
}

export function searchSkills(query: string): Skill[] {
  const q = query.toLowerCase();
  return skills.filter(s =>
    s.name.toLowerCase().includes(q) ||
    s.description.toLowerCase().includes(q) ||
    s.tags.some(t => t.includes(q))
  );
}

export function compareSkills(a: Skill, b: Skill): { same: string[]; diff: string[] } {
  const aKeys = [...a.tags, a.category, a.name];
  const bKeys = [...b.tags, b.category, b.name];
  return {
    same: aKeys.filter(x => bKeys.includes(x)),
    diff: [...aKeys.filter(x => !bKeys.includes(x)), ...bKeys.filter(x => !aKeys.includes(x))],
  };
}