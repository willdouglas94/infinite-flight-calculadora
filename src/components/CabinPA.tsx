import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Megaphone, VolumeX, StopCircle, RotateCcw } from 'lucide-react';

interface Props {
  arrivalIcao?: string;
  temp?: number | null;
}

type Btn = {
  key: string;
  label: { en: string; pt: string };
  buildText: (ctx: { arrivalIcao?: string; temp?: number | null; lang: 'en' | 'pt' }) => string;
  voice?: { rate?: number; pitch?: number };
};

const BUTTONS: Btn[] = [
  {
    key: 'boarding',
    label: { en: 'Boarding', pt: 'Embarque' },
    buildText: () =>
      `Ladies and gentlemen, welcome aboard. We will begin boarding shortly. Please have your boarding pass ready and observe the signage for your seat.`,
    voice: { rate: 1.0, pitch: 1.0 },
  },
  {
    key: 'safety',
    label: { en: 'Safety Demo', pt: 'Demonstração de Segurança' },
    buildText: () =>
      `For your safety, please pay attention to the safety demonstration. Fasten your seatbelt, stow your tray table, and make sure your seat is in the upright position.`,
    voice: { rate: 0.95, pitch: 0.95 },
  },
  {
    key: 'prepare_takeoff',
    label: { en: 'Prepare for Takeoff', pt: 'Preparar Decolagem' },
    buildText: () =>
      `Cabin crew prepare the cabin for departure. Please ensure all carry-ons are stowed and your seatbelts are securely fastened. We are preparing for takeoff.`,
    voice: { rate: 1.0, pitch: 1.0 },
  },
  {
    key: 'service',
    label: { en: 'Service', pt: 'Serviço' },
    buildText: () =>
      `The cabin crew will begin beverage and snack service shortly. Please remain seated while service is in progress and keep your seatbelt fastened.`,
    voice: { rate: 1.05, pitch: 1.05 },
  },
  {
    key: 'prepare_landing',
    label: { en: 'Prepare for Landing', pt: 'Preparar Pouso' },
    buildText: () =>
      `We are preparing for landing. Please return your seat to the upright position, stow your tray tables, and secure all carry-on items.`,
    voice: { rate: 0.98, pitch: 0.98 },
  },
  {
    key: 'welcome',
    label: { en: 'Welcome', pt: 'Bem-vindos' },
    buildText: ({ arrivalIcao, temp, lang }) => {
      if (lang === 'pt') {
        const dest = arrivalIcao || 'seu destino';
        const tempPart = typeof temp === 'number' ? ` A temperatura local é de ${Math.round(temp)} graus.` : '';
        return `Senhoras e senhores, bem-vindos a ${dest}.${tempPart} Obrigado por voar conosco.`;
      }
      const dest = arrivalIcao || 'your destination';
      const tempPart = typeof temp === 'number' ? ` The local temperature is ${Math.round(temp)} degrees.` : '';
      return `Ladies and gentlemen, welcome to ${dest}.${tempPart} Thank you for flying with us.`;
    }
  }
];

export default function CabinPA({ arrivalIcao, temp }: Props) {
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [langOverride, setLangOverride] = useState<'auto' | 'en' | 'pt'>(() => {
    try { return (typeof window !== 'undefined' && (localStorage.getItem('cabinpa_lang') as any)) || 'auto'; } catch { return 'auto'; }
  });
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string | null>(() => {
    try { return (typeof window !== 'undefined' && localStorage.getItem('cabinpa_voice')) || null; } catch { return null; }
  });

  const navIsPt = typeof navigator !== 'undefined' && navigator.language?.toLowerCase().startsWith('pt');
  const isPt = langOverride === 'auto' ? navIsPt : langOverride === 'pt';
  const langCode = isPt ? 'pt-BR' : 'en-US';
  const shortLang = isPt ? 'pt' : 'en';

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    const load = () => {
      const v = window.speechSynthesis.getVoices() || [];
      setVoices(v);
      if (!selectedVoiceURI && v.length) {
        const pref = v.find(x => x.lang && x.lang.toLowerCase().startsWith(shortLang));
        setSelectedVoiceURI(pref?.voiceURI || v[0]?.voiceURI || null);
      }
    };

    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => { try { (window.speechSynthesis as any).onvoiceschanged = null; } catch {} };
  }, [shortLang, selectedVoiceURI]);

  const resetPreferences = () => {
    try {
      localStorage.removeItem('cabinpa_lang');
      localStorage.removeItem('cabinpa_voice');
    } catch {}
    setLangOverride('auto');
    setSelectedVoiceURI(null);
  };

  // persist preferences
  useEffect(() => {
    try {
      localStorage.setItem('cabinpa_lang', langOverride);
    } catch {}
  }, [langOverride]);

  useEffect(() => {
    try {
      if (selectedVoiceURI) localStorage.setItem('cabinpa_voice', selectedVoiceURI);
      else localStorage.removeItem('cabinpa_voice');
    } catch {}
  }, [selectedVoiceURI]);

  const speakText = (key: string, text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('SpeechSynthesis API não disponível neste navegador.');
      return;
    }

    // stop current
    stopAll();

    const u = new SpeechSynthesisUtterance(text);
    // default voice params
    u.rate = 1; // natural
    u.pitch = 1;
    u.lang = langCode;

    // apply voice params from the button if provided (lookup by key)
    try {
      const btn = BUTTONS.find(b => b.key === key);
      if (btn && btn.voice) {
        if (typeof btn.voice.rate === 'number') u.rate = btn.voice.rate;
        if (typeof btn.voice.pitch === 'number') u.pitch = btn.voice.pitch;
      }
    } catch {}

    // use selected voice if provided, otherwise try to pick a voice matching language
    try {
      const available = voices.length ? voices : window.speechSynthesis.getVoices();
      if (selectedVoiceURI) {
        const chosen = available.find(v => v.voiceURI === selectedVoiceURI || v.name === selectedVoiceURI);
        if (chosen) u.voice = chosen;
      } else if (available && available.length > 0) {
        const match = available.find(v => v.lang && v.lang.toLowerCase().startsWith(shortLang));
        if (match) u.voice = match;
      }
    } catch {}

    u.onstart = () => setPlayingKey(key);
    u.onend = () => {
      setPlayingKey(null);
      utterRef.current = null;
    };
    u.onerror = () => {
      setPlayingKey(null);
      utterRef.current = null;
    };

    utterRef.current = u;
    window.speechSynthesis.speak(u);
  };

  const stopAll = () => {
    try {
      window.speechSynthesis.cancel();
    } catch {}
    setPlayingKey(null);
    utterRef.current = null;
  };

  return (
    <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" title={isPt ? 'PA Cabine' : 'Cabin PA'} className="text-slate-300 hover:text-white">
            <Megaphone className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="right" className="w-[360px] bg-card border-avionics-border">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-primary" />
              {isPt ? 'PA Cabine' : 'Cabin PA'}
            </SheetTitle>
          </SheetHeader>

          <Card className="p-3 mt-2 bg-avionics-panel border-avionics-border">
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex-1">
                <div className="text-xs text-muted-foreground">{isPt ? 'Idioma' : 'Language'}</div>
                <select
                  value={langOverride}
                  onChange={(e) => setLangOverride(e.target.value as any)}
                  className="bg-transparent border border-avionics-border text-sm rounded px-2 py-1 w-full"
                >
                  <option value="auto">{isPt ? 'Automático' : 'Auto'}</option>
                  <option value="en">English</option>
                  <option value="pt">Português</option>
                </select>
              </div>

              <div className="flex-1">
                <div className="text-xs text-muted-foreground">{isPt ? 'Voz' : 'Voice'}</div>
                <select
                  value={selectedVoiceURI ?? ''}
                  onChange={(e) => setSelectedVoiceURI(e.target.value || null)}
                  className="bg-transparent border border-avionics-border text-sm rounded px-2 py-1 w-full"
                >
                  {voices.length === 0 && <option value="">{isPt ? 'Carregando...' : 'Loading...'}</option>}
                  {voices.map(v => (
                    <option key={v.voiceURI || v.name} value={v.voiceURI || v.name}>{`${v.name} (${v.lang})`}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {BUTTONS.map(b => (
                <Button
                  key={b.key}
                  onClick={() => speakText(b.key, b.buildText({ arrivalIcao, temp, lang: shortLang }))}
                  className={`h-12 font-mono text-sm ${playingKey === b.key ? 'ring-2 ring-primary/60 bg-primary/10' : ''}`}
                >
                  {isPt ? b.label.pt : b.label.en}
                </Button>
              ))}
            </div>

            <div className="mt-4 flex items-center justify-between">
              <div className="text-xs text-muted-foreground">{isPt ? 'Usando Web Speech API' : 'Using Web Speech API'}</div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={stopAll} className="text-destructive">
                  <StopCircle className="w-4 h-4 mr-2" /> {isPt ? 'Parar Tudo' : 'Stop All'}
                </Button>
                <Button variant="outline" onClick={() => {
                  // quick test sound
                  speakText('test', isPt ? 'Teste de anúncio de cabine.' : 'This is a cabin announcement test.');
                }}>
                  <VolumeX className="w-4 h-4 mr-2" /> {isPt ? 'Teste' : 'Test'}
                </Button>
                <Button variant="ghost" onClick={resetPreferences} className="text-muted-foreground">
                  <RotateCcw className="w-4 h-4 mr-2" /> {isPt ? 'Resetar Preferências' : 'Reset Preferences'}
                </Button>
              </div>
            </div>
          </Card>
        </SheetContent>
      </Sheet>
  );
}
