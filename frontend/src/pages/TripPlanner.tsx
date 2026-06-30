import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  Play, 
  Clock, 
  Compass, 
  Calendar, 
  Coffee, 
  Moon, 
  Fuel,
  Loader2
} from 'lucide-react';

import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import AutocompleteInput from '../components/ui/AutocompleteInput';
import Alert from '../components/ui/Alert';
import Badge from '../components/ui/Badge';
import Skeleton from '../components/ui/Skeleton';
import { planTrip } from '../api/trips';
import { useUI } from '../context/UIContext';
import { TripRequest } from '../types/trip';

// 1. Zod Validation Schema
const tripFormSchema = z.object({
  current_location: z.string().min(1, 'Origin location address is required.'),
  pickup_location: z.string().min(1, 'Pickup cargo terminal address is required.'),
  dropoff_location: z.string().min(1, 'Dropoff cargo destination address is required.'),
  cycle_hours_used: z.number({
    invalid_type_error: 'Duty cycle hours must be a number.'
  })
  .min(0.0, 'Cycle hours used cannot be negative.')
  .max(70.0, 'FMCSA property duty cycles cannot exceed 70.0 hours.')
}).refine((data) => {
  return data.current_location.trim().toLowerCase() !== data.pickup_location.trim().toLowerCase();
}, {
  message: 'Pickup terminal cannot be identical to the origin location.',
  path: ['pickup_location']
}).refine((data) => {
  return data.pickup_location.trim().toLowerCase() !== data.dropoff_location.trim().toLowerCase();
}, {
  message: 'Dropoff terminal cannot be identical to the pickup location.',
  path: ['dropoff_location']
});

type TripFormData = z.infer<typeof tripFormSchema>;

export const TripPlanner: React.FC = () => {
  const { plannedTrip, setPlannedTrip } = useUI();

  // 2. React Hook Form Setup
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<TripFormData>({
    resolver: zodResolver(tripFormSchema),
    defaultValues: {
      current_location: '',
      pickup_location: '',
      dropoff_location: '',
      cycle_hours_used: 10.0
    }
  });

  // 3. TanStack Query Mutation
  const mutation = useMutation({
    mutationFn: async (formData: TripFormData) => {
      const payload: TripRequest = {
        current_location: formData.current_location,
        pickup_location: formData.pickup_location,
        dropoff_location: formData.dropoff_location,
        cycle_hours_used: formData.cycle_hours_used
      };
      return await planTrip(payload);
    },
    onSuccess: (data) => {
      setPlannedTrip(data);
      toast.success('HOS Compliance route plan calculated successfully!');
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message || 'Failed to calculate compliance route. Please check location names.');
    }
  });

  const onSubmit = (data: TripFormData) => {
    mutation.mutate(data);
  };

  const handleClear = () => {
    reset({
      current_location: '',
      pickup_location: '',
      dropoff_location: '',
      cycle_hours_used: 0
    });
    setPlannedTrip(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Trip Planner" 
        description="Calculate FMCSA-compliant commercial routes, rest layovers, and fuel stops automatically."
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Columns: Inputs Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Route Parameters</CardTitle>
              <CardDescription>Specify origin terminal, pickup docks, and destination coordinates.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="current_location"
                    control={control}
                    render={({ field }) => (
                      <AutocompleteInput
                        label="Current Location (Origin)"
                        placeholder="Type to search origin address..."
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.current_location?.message}
                        disabled={mutation.isPending}
                      />
                    )}
                  />

                  <Controller
                    name="pickup_location"
                    control={control}
                    render={({ field }) => (
                      <AutocompleteInput
                        label="Cargo Pickup Location"
                        placeholder="Type to search pickup address..."
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.pickup_location?.message}
                        disabled={mutation.isPending}
                      />
                    )}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Controller
                    name="dropoff_location"
                    control={control}
                    render={({ field }) => (
                      <AutocompleteInput
                        label="Cargo Dropoff Location"
                        placeholder="Type to search destination address..."
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.dropoff_location?.message}
                        disabled={mutation.isPending}
                      />
                    )}
                  />

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-muted-foreground uppercase" htmlFor="cycle_hours_used">
                      Starting HOS Cycle Used (Hours)
                    </label>
                    <Controller
                      name="cycle_hours_used"
                      control={control}
                      render={({ field }) => (
                        <input
                          id="cycle_hours_used"
                          type="number"
                          step="0.1"
                          placeholder="e.g. 10.0"
                          disabled={mutation.isPending}
                          value={field.value === undefined ? '' : field.value}
                          onChange={(e) => field.onChange(e.target.value === '' ? '' : Number(e.target.value))}
                          className={`flex h-10 w-full rounded-lg border bg-background/50 px-3 py-2 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 transition-all ${
                            errors.cycle_hours_used ? 'border-destructive focus:ring-destructive/50' : 'border-input focus:border-transparent'
                          }`}
                        />
                      )}
                    />
                    {errors.cycle_hours_used && (
                      <p className="text-xs text-destructive font-medium mt-1">
                        {errors.cycle_hours_used.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <Button 
                    type="submit" 
                    disabled={mutation.isPending} 
                    className="flex items-center gap-2 px-5"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Calculating compliant path...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4" />
                        Generate Compliance Route
                      </>
                    )}
                  </Button>
                  
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleClear}
                    disabled={mutation.isPending}
                  >
                    Clear Results
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* 4. Loader Skeletons while calculation query is pending */}
          {mutation.isPending && (
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">Running OSRM geocoding and HOS log scheduling...</span>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            </Card>
          )}

          {/* 5. Display Calculation Outcomes */}
          {plannedTrip && !mutation.isPending && (
            <Card hoverEffect className="border-primary/20">
              <CardHeader className="border-b border-border/30 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Calculated Trip Summary</CardTitle>
                    <CardDescription>Regulatory checks compiled sequentially.</CardDescription>
                  </div>
                  <Badge variant="success">COMPLIANT ROUTE</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* Visual Stats Metrics Grid */}
                <div className="grid gap-4 grid-cols-2 sm:grid-cols-4 select-none">
                  <div className="border border-border/50 bg-secondary/10 p-3 rounded-lg text-center">
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Distance</p>
                    <p className="text-base sm:text-lg font-bold text-foreground mt-1 flex items-center justify-center gap-1">
                      <Compass className="h-4 w-4 text-primary shrink-0" />
                      {plannedTrip.summary.total_distance_miles.toLocaleString()} mi
                    </p>
                  </div>
                  <div className="border border-border/50 bg-secondary/10 p-3 rounded-lg text-center">
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Duration</p>
                    <p className="text-base sm:text-lg font-bold text-foreground mt-1 flex items-center justify-center gap-1">
                      <Clock className="h-4 w-4 text-primary shrink-0" />
                      {plannedTrip.summary.total_duration_hours}h
                    </p>
                  </div>
                  <div className="border border-border/50 bg-secondary/10 p-3 rounded-lg text-center">
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Rest Stops</p>
                    <p className="text-base sm:text-lg font-bold text-foreground mt-1 flex items-center justify-center gap-1">
                      <Coffee className="h-4 w-4 text-amber-500 shrink-0" />
                      {plannedTrip.summary.total_rest_stops} Breaks
                    </p>
                  </div>
                  <div className="border border-border/50 bg-secondary/10 p-3 rounded-lg text-center">
                    <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Sleep Berth</p>
                    <p className="text-base sm:text-lg font-bold text-foreground mt-1 flex items-center justify-center gap-1">
                      <Moon className="h-4 w-4 text-emerald-500 shrink-0" />
                      {plannedTrip.summary.total_sleep_stops} Layovers
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 select-none pt-2">
                  <div className="border border-border/50 bg-secondary/10 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Fuel Stops Planned</p>
                      <p className="text-base font-bold text-foreground mt-0.5">{plannedTrip.summary.total_fuel_stops} stops</p>
                    </div>
                    <Fuel className="h-6 w-6 text-purple-500 shrink-0" />
                  </div>
                  
                  <div className="border border-border/50 bg-secondary/10 p-4 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-wider">Compliance Days</p>
                      <p className="text-base font-bold text-foreground mt-0.5">{plannedTrip.eld_sheets.length} daily logs</p>
                    </div>
                    <Calendar className="h-6 w-6 text-blue-500 shrink-0" />
                  </div>
                </div>

                {/* Resolved Checkpoints Info */}
                <div className="space-y-3.5 border-t border-border/30 pt-5">
                  <h4 className="font-semibold text-sm">Resolved Checkpoint Coordinates</h4>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Origin</span>
                      <span className="font-medium truncate max-w-[250px] sm:max-w-none">{plannedTrip.stops[0]?.location || 'Origin Point'}</span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Pickup Dock</span>
                      <span className="font-medium truncate max-w-[250px] sm:max-w-none">
                        {plannedTrip.stops.find(s => s.type === 'PICKUP')?.location || 'Cargo Terminal'}
                      </span>
                    </div>
                    <div className="flex justify-between border-b border-border/20 pb-2">
                      <span className="text-muted-foreground">Destination</span>
                      <span className="font-medium truncate max-w-[250px] sm:max-w-none">
                        {plannedTrip.stops[plannedTrip.stops.length - 1]?.location || 'Dropoff Point'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Instructions Sidebar */}
        <div>
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Compliance Engine Rules</CardTitle>
              <CardDescription>FMCSA truck routing constraints.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="info" title="HOS Auditing Enforced">
                Calculations verify origin-to-destination paths to automatically insert layovers and breaks, protecting safety cycle margins.
              </Alert>

              <div className="text-xs text-muted-foreground space-y-2.5 leading-relaxed select-none">
                <p>🚛 **11-Hour limit**: Rest is planned when driving inside a shift reaches 11.0 hours.</p>
                <p>🚛 **14-Hour window**: Layovers are planned when total duty window reaches 14.0 hours.</p>
                <p>🚛 **30-Min rest**: Break is scheduled after 8.0 hours of driving.</p>
                <p>🚛 **70-Hour cycle**: 34-hour restart is inserted when the cycle is exhausted.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TripPlanner;
