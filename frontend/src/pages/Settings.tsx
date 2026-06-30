import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ShieldCheck, Building } from 'lucide-react';

export const Settings: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader 
        title="Settings & Compliance Config" 
        description="Configure default HOS rulesets, carrier identifiers, and system alerts triggers."
      />

      <div className="grid gap-6 md:grid-cols-2">
        {/* HOS Rule Set Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              FMCSA Rule Set Settings
            </CardTitle>
            <CardDescription>Default driver compliance constraints limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center border-b border-border/30 pb-3">
                <div>
                  <p className="text-sm font-semibold">USA Property 70h / 8-day</p>
                  <p className="text-xs text-muted-foreground">Standard interstate property-carrying driver constraints</p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>

              <div className="flex justify-between items-center border-b border-border/30 pb-3 opacity-60">
                <div>
                  <p className="text-sm font-semibold">USA Passenger 60h / 7-day</p>
                  <p className="text-xs text-muted-foreground">Interstate passenger-carrying motor coach regulations</p>
                </div>
                <Badge variant="outline">Disabled</Badge>
              </div>
            </div>
            
            <div className="pt-2">
              <Button variant="outline" disabled>Change Active Ruleset</Button>
            </div>
          </CardContent>
        </Card>

        {/* Carrier Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5 text-primary" />
              Carrier Profile
            </CardTitle>
            <CardDescription>Company metadata displayed on certified ELD headers.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border/30 pb-2">
              <span className="text-muted-foreground">Carrier Name</span>
              <span className="font-semibold">SpotterAI Logistics Corp</span>
            </div>
            <div className="flex justify-between border-b border-border/30 pb-2">
              <span className="text-muted-foreground">USDOT Number</span>
              <span className="font-semibold">DOT-8472911</span>
            </div>
            <div className="flex justify-between border-b border-border/30 pb-2">
              <span className="text-muted-foreground">Main Office Address</span>
              <span className="font-semibold">New York, NY 10001</span>
            </div>
            
            <div className="pt-2">
              <Button variant="outline" disabled>Edit Carrier Details</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
