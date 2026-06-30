import React from 'react';
import PageHeader from '../components/ui/PageHeader';
import { StatCard, Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import { useUI } from '../context/UIContext';
import { 
  Clock, 
  ShieldAlert, 
  Truck, 
  Activity
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { plannedTrip } = useUI();

  // Resolve dynamic values if trip is planned
  const hasPlanned = !!plannedTrip;
  const cycleVal = hasPlanned 
    ? `${plannedTrip.summary.total_driving_hours} / 70h` 
    : "54.5 / 70h";
  const cycleDesc = hasPlanned 
    ? `${(70.0 - plannedTrip.summary.total_driving_hours).toFixed(1)} hours remaining`
    : "15.5 hours remaining in 8-day cycle";
  
  const tripId = hasPlanned
    ? `TRIP-${plannedTrip.trip_id.toString().substring(0, 8).toUpperCase()}`
    : "TRIP-984-NYC-LA";
  const originName = hasPlanned ? plannedTrip.stops[0]?.location : "New York, NY";
  const pickupName = hasPlanned 
    ? plannedTrip.stops.find(s => s.type === 'PICKUP')?.location || 'N/A' 
    : "Chicago, IL";
  const dropoffName = hasPlanned 
    ? plannedTrip.stops[plannedTrip.stops.length - 1]?.location 
    : "Los Angeles, CA";
  const totalDist = hasPlanned 
    ? `${plannedTrip.summary.total_distance_miles.toLocaleString()} miles` 
    : "2,812 miles";

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Compliance Dashboard" 
        description="Monitor active driver cycles, duty status timelines, and hours-of-service compliance in real-time."
      />

      {/* Metric Cards Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 select-none">
        <StatCard
          title="Active Duty Cycle"
          value={cycleVal}
          description={cycleDesc}
          icon={Clock}
          trend={hasPlanned ? { value: `${((plannedTrip.summary.total_driving_hours / 70.0) * 100).toFixed(1)}% used`, isPositive: false } : { value: '77.8% used', isPositive: false }}
        />
        <StatCard
          title="Current Driver Status"
          value={hasPlanned ? "COMPLIANT" : "ON DUTY"}
          description={hasPlanned ? "HOS timeline fully certified" : "Active driving since 08:30 AM"}
          icon={Activity}
          className="border-emerald-500/20"
        />
        <StatCard
          title="Next Required Rest"
          value={hasPlanned ? `${plannedTrip.summary.total_rest_stops} Breaks` : "In 3h 12m"}
          description={hasPlanned ? "Calculated stops on path" : "Mandatory 30-minute rest break"}
          icon={ShieldAlert}
        />
        <StatCard
          title="Active Trip Logs"
          value={hasPlanned ? `${plannedTrip.eld_sheets.length} Sheets` : "4 Historic"}
          description={hasPlanned ? "ELD log sheets generated" : "Avg HOS score 98.4%"}
          icon={Truck}
          trend={{ value: '+20.5%', isPositive: true }}
        />
      </div>

      {/* Bottom Layout Columns */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Compliance Warning Alerts */}
        <Card hoverEffect className="flex flex-col">
          <CardHeader>
            <CardTitle>Compliance Audits & Notifications</CardTitle>
            <CardDescription>System logs monitoring active FMCSA HOS rules violations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <Alert variant="success" title="HOS Compliance Verified">
              All active trip legs are in line with the FMCSA 11-hour driving, 14-hour duty window, and 30-minute rest break rules. No cycle resets needed.
            </Alert>
            {hasPlanned ? (
              <Alert variant="info" title="Layovers Logged">
                Safety rest rest buffers scheduled automatically. Drive shifts capped under the maximum 11h daily threshold.
              </Alert>
            ) : (
              <Alert variant="info" title="HOS Reset Warning">
                Duty cycle hours will run low on the next segment (Dallas → Los Angeles). Ensure a 34-hour restart is scheduled.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Current Dispatch Overview */}
        <Card hoverEffect className="flex flex-col">
          <CardHeader>
            <CardTitle>Active Dispatch Overview</CardTitle>
            <CardDescription>Currently planned route details and milestones.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex-1">
            <div className="flex justify-between items-center border-b border-border/30 pb-3">
              <div>
                <p className="text-xs text-muted-foreground">ROUTE ID</p>
                <p className="text-sm font-semibold">{tripId}</p>
              </div>
              <Badge variant={hasPlanned ? "secondary" : "success"}>
                {hasPlanned ? "PLANNED" : "IN TRANSIT"}
              </Badge>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Origin</span>
                <span className="font-medium truncate max-w-[200px] sm:max-w-none">{originName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Cargo Pickup</span>
                <span className="font-medium truncate max-w-[200px] sm:max-w-none">{pickupName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Destination</span>
                <span className="font-medium truncate max-w-[200px] sm:max-w-none">{dropoffName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">OSRM Distance</span>
                <span className="font-medium">{totalDist}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
