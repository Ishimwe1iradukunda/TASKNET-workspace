import React from 'react';

interface SecondarySidebarProps {
  title: string;
  children: React.ReactNode;
}

export function SecondarySidebar({ title, children }: SecondarySidebarProps) {
  return (
    <div className="w-80 bg-muted/30 border-r border-border flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
