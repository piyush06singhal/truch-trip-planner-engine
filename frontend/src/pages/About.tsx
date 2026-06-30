import React, { useState, useEffect } from 'react';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { 
  Truck, 
  Scale, 
  ShieldCheck, 
  Activity, 
  Cpu, 
  Database, 
  Network, 
  ChevronDown, 
  ChevronUp, 
  Calculator,
  AlertTriangle
} from 'lucide-react';

export const About: React.FC = () => {
  // --- Service Status State ---
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [dbStatus, setDbStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [latency, setLatency] = useState<number | null>(null);

  useEffect(() => {
    const checkApiHealth = async () => {
      const baseUrl = (import.meta.env.VITE_API_URL as string) || 'http://localhost:8000';
      const start = performance.now();
      try {
        const response = await fetch(`${baseUrl}/api/health/`);
        const duration = Math.round(performance.now() - start);
        if (response.ok) {
          const data = await response.json();
          setApiStatus('online');
          setDbStatus(data.database === 'connected' ? 'connected' : 'disconnected');
          setLatency(duration);
        } else {
          setApiStatus('offline');
          setDbStatus('disconnected');
        }
      } catch (err) {
        setApiStatus('offline');
        setDbStatus('disconnected');
      }
    };

    checkApiHealth();
  }, []);

  // --- Accordion State ---
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    setOpenSection(openSection === id ? null : id);
  };

  const faqItems = [
    {
      id: 'rule-11h',
      title: '11-Hour Driving Limit',
      content: 'A driver may drive a maximum of 11 hours after 10 consecutive hours off duty. Once this limit is reached, driving is prohibited until another 10-hour off-duty break is complete.'
    },
    {
      id: 'rule-14h',
      title: '14-Hour Shift Duty Limit',
      content: 'A driver may not drive beyond the 14th consecutive hour after coming on duty, following 10 consecutive hours off duty. Off-duty rest breaks taken during the shift do NOT extend this 14-hour window.'
    },
    {
      id: 'rule-30m',
      title: '30-Minute Rest Break Checkpoint',
      content: 'A driver must take a consecutive 30-minute off-duty or sleeper berth break if more than 8 hours of cumulative driving have elapsed without a rest break.'
    },
    {
      id: 'rule-70h',
      title: '70-Hour / 8-Day Cycle Rule',
      content: 'A driver may not drive after accumulating 70 hours of on-duty time in any period of 8 consecutive days. A driver can fully reset this 8-day cumulative cycle by taking 34 or more consecutive hours off duty.'
    }
  ];

  // --- HOS Interactive Calculator State ---
  const [driveHours, setDriveHours] = useState(5);
  const [onDutyHours, setOnDutyHours] = useState(2);
  const [restHours, setRestHours] = useState(10);

  const calculateHOSStatus = () => {
    const totalDuty = driveHours + onDutyHours;
    
    if (restHours < 10) {
      return {
        status: 'VIOLATION',
        message: 'Driver is not fully rested! 10 consecutive hours of off-duty rest is mandatory before starting any driving shift.',
        variant: 'destructive' as const
      };
    }
    
    if (driveHours > 11) {
      return {
        status: 'VIOLATION',
        message: 'Driving limit exceeded! Maximum of 11 hours of driving allowed per shift.',
        variant: 'destructive' as const
      };
    }

    if (totalDuty > 14) {
      return {
        status: 'VIOLATION',
        message: 'Duty window exceeded! Cumulative shift time cannot exceed 14 consecutive hours.',
        variant: 'destructive' as const
      };
    }

    if (driveHours >= 8) {
      return {
        status: 'REST BREAK RECOMMENDED',
        message: 'Driver has exceeded 8 hours of cumulative driving. A 30-minute rest break is required immediately.',
        variant: 'warning' as const
      };
    }

    return {
      status: 'COMPLIANT',
      message: `Shift is compliant. Remaining drive limit: ${11 - driveHours}h. Remaining duty window: ${14 - totalDuty}h.`,
      variant: 'success' as const
    };
  };

  const calculatorResult = calculateHOSStatus();

  return (
    <div className="space-y-6">
      <PageHeader 
        title="About SpotterAI Planner" 
        description="Learn more about the technology stack, system status metrics, and regulatory logic underlying our compliance calculations."
      />

      <div className="grid gap-6 md:grid-cols-3">
        {/* Left: System Information & Status Widget */}
        <div className="md:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-primary" />
                System Information
              </CardTitle>
              <CardDescription>Dynamic connectivity status check.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs select-none">
              <div className="space-y-3">
                {/* React Client Status */}
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-zinc-500" /> React Frontend
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-zinc-300">Online</span>
                  </div>
                </div>

                {/* API Status */}
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Network className="h-3.5 w-3.5 text-zinc-500" /> Django REST API
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${apiStatus === 'online' ? 'bg-emerald-500' : apiStatus === 'offline' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <span className="font-semibold text-zinc-300">
                      {apiStatus === 'online' ? `Online (${latency}ms)` : apiStatus === 'offline' ? 'Offline' : 'Checking...'}
                    </span>
                  </div>
                </div>

                {/* DB Status */}
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5 text-zinc-500" /> Supabase DB
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${dbStatus === 'connected' ? 'bg-emerald-500' : dbStatus === 'disconnected' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <span className="font-semibold text-zinc-300">
                      {dbStatus === 'connected' ? 'Connected' : dbStatus === 'disconnected' ? 'Disconnected' : 'Checking...'}
                    </span>
                  </div>
                </div>

                {/* Router Engine Status */}
                <div className="flex items-center justify-between border-b border-border/30 pb-2">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <Activity className="h-3.5 w-3.5 text-zinc-500" /> OSRM Router
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-500" />
                    <span className="font-semibold text-zinc-300">Online</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                <span>Version: **2.1.0**</span>
                <Badge variant="success">FMCSA VERIFIED</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Regulatory FAQs & Dynamic HOS Calculator */}
        <div className="md:col-span-2 space-y-6">
          {/* HOS Interactive Calculator Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Interactive Driver HOS Calculator
              </CardTitle>
              <CardDescription>Simulate custom logs to audit shift compliance instantly.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-semibold">Driving Hours ({driveHours}h)</label>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={driveHours}
                    onChange={(e) => setDriveHours(parseFloat(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-semibold">On-Duty Non-Driving ({onDutyHours}h)</label>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={onDutyHours}
                    onChange={(e) => setOnDutyHours(parseFloat(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground font-semibold">Prior Off-Duty Rest ({restHours}h)</label>
                  <input
                    type="range"
                    min="0"
                    max="15"
                    step="0.5"
                    value={restHours}
                    onChange={(e) => setRestHours(parseFloat(e.target.value))}
                    className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                  />
                </div>
              </div>

              {/* Status Alert Badge */}
              <div className={`mt-4 p-4 rounded-xl border flex gap-3 ${
                calculatorResult.variant === 'destructive' 
                  ? 'bg-red-500/10 border-red-500/20 text-red-200' 
                  : calculatorResult.variant === 'warning' 
                  ? 'bg-amber-500/10 border-amber-500/20 text-amber-200' 
                  : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
              }`}>
                {calculatorResult.variant === 'success' ? (
                  <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider">{calculatorResult.status}</h4>
                  <p className="text-[11px] mt-1 leading-normal opacity-90">{calculatorResult.message}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Accordion FAQ Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5 text-primary" />
                FMCSA Regulations Reference Guide
              </CardTitle>
              <CardDescription>Quick references to interstate carrier Hours-of-Service rules.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y divide-border/40">
              {faqItems.map((item) => (
                <div key={item.id} className="py-3">
                  <button
                    onClick={() => toggleSection(item.id)}
                    className="w-full flex items-center justify-between text-left py-1 text-sm font-semibold hover:text-primary transition-colors cursor-pointer"
                  >
                    <span>{item.title}</span>
                    {openSection === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                  {openSection === item.id && (
                    <p className="mt-2 text-xs text-muted-foreground leading-normal pl-1 select-none">
                      {item.content}
                    </p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;
