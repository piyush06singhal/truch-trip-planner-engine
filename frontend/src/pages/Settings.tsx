import React, { useState } from 'react';
import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ShieldCheck, Building, BellRing, AlertOctagon } from 'lucide-react';
import { useUI } from '../context/UIContext';

export const Settings: React.FC = () => {
  const { 
    carrierProfile, 
    setCarrierProfile, 
    activeRuleset, 
    setActiveRuleset, 
    addNotification 
  } = useUI();

  // Local state for Carrier Profile editing
  const [editMode, setEditMode] = useState(false);
  const [tempProfile, setTempProfile] = useState({ ...carrierProfile });

  // Toggles for notifications
  const [autoSchedule, setAutoSchedule] = useState(true);
  const [strictAudit, setStrictAudit] = useState(true);
  const [fatigueAlerts, setFatigueAlerts] = useState(false);

  const handleRulesetToggle = () => {
    const nextRuleset = activeRuleset === 'property-70h' ? 'passenger-60h' : 'property-70h';
    setActiveRuleset(nextRuleset);
    
    const rulesetLabel = nextRuleset === 'property-70h' 
      ? 'USA Property 70h / 8-day' 
      : 'USA Passenger 60h / 7-day';

    addNotification(
      'HOS Ruleset Updated',
      `Active regulatory ruleset changed to ${rulesetLabel}. All future routing checks will use this mandate.`,
      'info'
    );
  };

  const handleEditStart = () => {
    setTempProfile({ ...carrierProfile });
    setEditMode(true);
  };

  const handleEditSave = () => {
    if (!tempProfile.name.trim() || !tempProfile.dotNumber.trim() || !tempProfile.address.trim()) {
      addNotification('Profile Update Failed', 'Carrier profile fields cannot be empty.', 'error');
      return;
    }
    setCarrierProfile(tempProfile);
    setEditMode(false);
    addNotification(
      'Carrier Profile Saved',
      `Carrier profile updated to ${tempProfile.name}. ELD sheets headers synced.`,
      'success'
    );
  };

  const handleEditCancel = () => {
    setEditMode(false);
  };

  const triggerSimulatedAlert = () => {
    addNotification(
      'HOS Shift Limit Warning',
      `Driver Piyush Kumar is within 1 hour of exceeding the 14-hour shift duty window! Safe rest area routing recommended.`,
      'warning'
    );
  };

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
              <div className={`flex justify-between items-center border-b border-border/30 pb-3 transition-opacity ${activeRuleset === 'property-70h' ? 'opacity-100' : 'opacity-50'}`}>
                <div>
                  <p className="text-sm font-semibold">USA Property 70h / 8-day</p>
                  <p className="text-xs text-muted-foreground">Standard interstate property-carrying driver constraints</p>
                </div>
                <Badge variant={activeRuleset === 'property-70h' ? 'success' : 'outline'}>
                  {activeRuleset === 'property-70h' ? 'Active' : 'Disabled'}
                </Badge>
              </div>

              <div className={`flex justify-between items-center border-b border-border/30 pb-3 transition-opacity ${activeRuleset === 'passenger-60h' ? 'opacity-100' : 'opacity-50'}`}>
                <div>
                  <p className="text-sm font-semibold">USA Passenger 60h / 7-day</p>
                  <p className="text-xs text-muted-foreground">Interstate passenger-carrying motor coach regulations</p>
                </div>
                <Badge variant={activeRuleset === 'passenger-60h' ? 'success' : 'outline'}>
                  {activeRuleset === 'passenger-60h' ? 'Active' : 'Disabled'}
                </Badge>
              </div>
            </div>
            
            <div className="pt-2">
              <Button variant="outline" onClick={handleRulesetToggle} className="cursor-pointer">
                Switch Active Ruleset
              </Button>
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
          <CardContent className="space-y-4 text-sm">
            {editMode ? (
              <div className="space-y-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground font-semibold">Carrier Name</label>
                  <input
                    type="text"
                    value={tempProfile.name}
                    onChange={(e) => setTempProfile({ ...tempProfile, name: e.target.value })}
                    className="bg-secondary/40 border border-border text-sm rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-primary text-zinc-200"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground font-semibold">USDOT Number</label>
                  <input
                    type="text"
                    value={tempProfile.dotNumber}
                    onChange={(e) => setTempProfile({ ...tempProfile, dotNumber: e.target.value })}
                    className="bg-secondary/40 border border-border text-sm rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-primary text-zinc-200"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted-foreground font-semibold">Main Office Address</label>
                  <input
                    type="text"
                    value={tempProfile.address}
                    onChange={(e) => setTempProfile({ ...tempProfile, address: e.target.value })}
                    className="bg-secondary/40 border border-border text-sm rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-1 focus:ring-primary text-zinc-200"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <Button variant="primary" size="sm" onClick={handleEditSave} className="cursor-pointer">
                    Save Profile
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleEditCancel} className="cursor-pointer">
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between border-b border-border/30 pb-2">
                  <span className="text-muted-foreground">Carrier Name</span>
                  <span className="font-semibold text-zinc-200">{carrierProfile.name}</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-2">
                  <span className="text-muted-foreground">USDOT Number</span>
                  <span className="font-semibold text-zinc-200">{carrierProfile.dotNumber}</span>
                </div>
                <div className="flex justify-between border-b border-border/30 pb-2">
                  <span className="text-muted-foreground">Main Office Address</span>
                  <span className="font-semibold text-zinc-200">{carrierProfile.address}</span>
                </div>
                
                <div className="pt-2">
                  <Button variant="outline" onClick={handleEditStart} className="cursor-pointer">
                    Edit Carrier Details
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts & Testing Panel */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="h-5 w-5 text-primary" />
              Compliance Alerts & Simulator Controls
            </CardTitle>
            <CardDescription>Custom thresholds and simulation tools for real-time HOS auditing.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 select-none">
                <div>
                  <p className="text-xs font-semibold">Auto-Schedule Breaks</p>
                  <p className="text-[10px] text-muted-foreground">Insert 30-min break at 8 hours</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoSchedule}
                  onChange={(e) => {
                    setAutoSchedule(e.target.checked);
                    addNotification('Breaks Config Changed', `Auto-scheduling breaks is now ${e.target.checked ? 'enabled' : 'disabled'}.`, 'info');
                  }}
                  className="rounded border-border bg-secondary text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 select-none">
                <div>
                  <p className="text-xs font-semibold">Strict HOS Auditing</p>
                  <p className="text-[10px] text-muted-foreground">Reject route legs with violation</p>
                </div>
                <input
                  type="checkbox"
                  checked={strictAudit}
                  onChange={(e) => {
                    setStrictAudit(e.target.checked);
                    addNotification('Auditing Sensitivity Updated', `Strict HOS checks are now ${e.target.checked ? 'active' : 'inactive'}.`, 'info');
                  }}
                  className="rounded border-border bg-secondary text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20 select-none">
                <div>
                  <p className="text-xs font-semibold">Mock Driver Fatigue Alerts</p>
                  <p className="text-[10px] text-muted-foreground">Log warning if driving is excessive</p>
                </div>
                <input
                  type="checkbox"
                  checked={fatigueAlerts}
                  onChange={(e) => {
                    setFatigueAlerts(e.target.checked);
                    addNotification('Simulation Settings Changed', `Drowsiness mock triggers ${e.target.checked ? 'active' : 'deactivated'}.`, 'info');
                  }}
                  className="rounded border-border bg-secondary text-primary focus:ring-primary h-4 w-4 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-border flex flex-col sm:flex-row items-center gap-3">
              <Button variant="destructive" onClick={triggerSimulatedAlert} className="flex items-center gap-2 cursor-pointer">
                <AlertOctagon className="h-4 w-4" /> Trigger Simulated HOS Alert
              </Button>
              <span className="text-xs text-muted-foreground">
                Simulate a real-time Hours-of-Service warning threshold to inspect notification list alerts.
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
