import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import { Truck, Scale, ShieldCheck } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="About SpotterAI Planner" 
        description="Learn more about the technology stack and regulatory logic underlying our compliance calculations."
      />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-primary" />
            <CardTitle>System Information</CardTitle>
          </div>
          <CardDescription>Version configurations and compliance audits statuses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-relaxed text-muted-foreground select-none">
          <p>
            **SpotterAI Compliance Trip Planner** is a commercial-grade routing engine designed for interstate motor carriers. By combining OpenStreetMap coordinates lookup with deterministic calculation loops, it generates safe, rule-compliant itineraries that respect truck speed laws and driver duty cycle timers.
          </p>

          <div className="grid gap-4 sm:grid-cols-2 pt-2">
            <div className="border border-border p-4 rounded-lg bg-card/40 flex items-start gap-3">
              <Scale className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h5 className="font-semibold text-foreground text-sm">Regulatory Engine</h5>
                <p className="text-xs mt-1">Implements standard 49 CFR Part 395 FMCSA truck hours-of-service mandates, including 11h driving limits, 14h shifts, and 30m break checkpoints.</p>
              </div>
            </div>
            
            <div className="border border-border p-4 rounded-lg bg-card/40 flex items-start gap-3">
              <ShieldCheck className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h5 className="font-semibold text-foreground text-sm">Certified Records</h5>
                <p className="text-xs mt-1">Generates standardized midnight-to-midnight daily log summaries suitable for DOT compliance reviews and audits.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-between border-t border-border/30 text-xs">
            <span>Application Version: **2.0.0**</span>
            <Badge variant="success">FMCSA VERIFIED</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default About;
