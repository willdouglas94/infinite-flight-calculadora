import React from 'react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

export default function ChartsButton({ icao }: { icao?: string }) {
  const safeIcao = (icao || '').toUpperCase();

  const links: { label: string; href: string }[] = [
    { label: `ChartFox (Login Req)`, href: `https://chartfox.org/${safeIcao}` },
    { label: `Google Search`, href: `https://www.google.com/search?q=${safeIcao}+charts+pdf` },
  ];

  if (safeIcao.startsWith('SB') || safeIcao.startsWith('SS')) {
    links.splice(1, 0, { label: 'AISWEB (Brasil)', href: `https://aisweb.decea.mil.br/?i=aerodromos&codigo=${safeIcao}` });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" className="ml-2 h-10 w-10 p-2" aria-label="Charts for ICAO">
          ☰
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end" className="w-56 bg-card border-avionics-border">
        <div className="p-2 text-xs text-muted-foreground">Charts for {safeIcao || '—'}</div>
        {links.map((l) => (
          <DropdownMenuItem key={l.href} asChild>
            <a href={l.href} target="_blank" rel="noreferrer" className="w-full block">{l.label}</a>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
