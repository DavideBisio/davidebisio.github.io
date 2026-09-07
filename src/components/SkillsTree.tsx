import { useState } from 'react';
import type { SkillNode } from '../data/cv';

const levelColor: Record<string, string> = {
  expert: 'bg-sky-600',
  proficient: 'bg-sky-400',
  familiar: 'bg-sky-200',
};

function Node({ node, depth = 0 }: { node: SkillNode; depth?: number }) {
  const [open, setOpen] = useState(true);
  const hasChildren = !!node.children?.length;

  return (
    <li>
      <div
        className={`flex items-center gap-2 rounded-md py-1 ${hasChildren ? 'cursor-pointer select-none' : ''}`}
        onClick={() => hasChildren && setOpen((v) => !v)}
        role={hasChildren ? 'button' : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        onKeyDown={(e) => {
          if (hasChildren && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setOpen((v) => !v);
          }
        }}
      >
        {hasChildren ? (
          <span className="w-4 text-xs text-slate-400">{open ? '▾' : '▸'}</span>
        ) : (
          <span className="w-4" />
        )}
        <span className={depth === 0 ? 'font-semibold' : ''}>{node.name}</span>
        {node.level && (
          <span className={`h-2 w-2 rounded-full ${levelColor[node.level]}`} title={node.level} />
        )}
      </div>
      {hasChildren && open && (
        <ul className="ml-5 border-l border-slate-200 pl-4 dark:border-slate-800">
          {node.children!.map((child) => (
            <Node key={child.name} node={child} depth={depth + 1} />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function SkillsTree({ data }: { data: SkillNode[] }) {
  return (
    <ul className="space-y-1">
      {data.map((node) => (
        <Node key={node.name} node={node} />
      ))}
    </ul>
  );
}
