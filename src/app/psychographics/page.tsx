'use client';
import { useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import psychoData from '@/data/mock/psychographics.json';
import type { AdviserPersona, ConsumerPersona } from '@/types';
import { PersonaCard } from '@/components/psychographics/PersonaCard';

export default function PsychographicsPage() {
  return <PsychographicsClient data={psychoData as any} />;
}

function PsychographicsClient({ data }: { data: { adviserPersonas: AdviserPersona[]; consumerPersonas: ConsumerPersona[] } }) {
  const [tab, setTab] = useState<'adviser' | 'consumer'>('adviser');
  const personas = tab === 'adviser' ? data.adviserPersonas : data.consumerPersonas;

  return (
    <div>
      <PageHeader
        title="Psychographics & Personas"
        subtitle="Adviser-side and consumer-side market segments"
        source="Adviser Ratings / Investment Trends / Modelled segments"
        asAtDate="2024"
      />
      <div className="flex border rounded-lg overflow-hidden w-fit mb-6 bg-white">
        {(['adviser','consumer'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 text-sm font-medium ${tab === t ? 'bg-blue-600 text-white' : 'text-muted-foreground hover:bg-muted'}`}>
            {t === 'adviser' ? 'Adviser Personas' : 'Consumer Personas'}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {personas.map((p: any) => <PersonaCard key={p.id} persona={p} />)}
      </div>
    </div>
  );
}
