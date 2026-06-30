import apiClient from './client';
import { TripRequest, TripResponse, RawTrip } from '../types/trip';

// Refactored helper to map Django backend serialized response to frontend DTO
export const mapRawTripToTripResponse = (raw: RawTrip): TripResponse => {
  // Compute stops counters dynamically
  let total_rest_stops = 0;
  let total_fuel_stops = 0;
  let total_sleep_stops = 0;
  
  const mappedStops = (raw.stops || []).map((s: {
    stop_type: string;
    location_name: string;
    arrival_time: string;
    duration_hours: number;
    distance_from_start_miles: number;
  }) => {
    if (s.stop_type === 'REST_STOP') total_rest_stops++;
    if (s.stop_type === 'FUEL_STOP') total_fuel_stops++;
    if (s.stop_type === 'SLEEP_STOP') total_sleep_stops++;
    
    return {
      type: s.stop_type as 'ORIGIN' | 'PICKUP' | 'DROPOFF' | 'REST_STOP' | 'FUEL_STOP' | 'SLEEP_STOP',
      location: s.location_name,
      arrival_time: s.arrival_time,
      duration_hours: s.duration_hours,
      miles_traveled: s.distance_from_start_miles
    };
  });
  
  const mappedEldSheets = (raw.eld_sheets || []).map((sheet: {
    log_date: string;
    driving_hours: number;
    on_duty_hours: number;
    off_duty_hours: number;
    sleeper_berth_hours: number;
    events: {
      status: string;
      start_time: string;
      end_time: string;
      remarks: string;
      location_name: string;
    }[];
  }) => {
    return {
      date: sheet.log_date,
      summary: {
        driving: sheet.driving_hours,
        on_duty_nd: sheet.on_duty_hours,
        off_duty: sheet.off_duty_hours,
        sleeper: sheet.sleeper_berth_hours
      },
      events: (sheet.events || []).map((e: {
        status: string;
        start_time: string;
        end_time: string;
        remarks: string;
        location_name: string;
      }) => {
        // Safe time formatter extracting HH:MM
        const formatTime = (isoStr: string) => {
          try {
            const dateObj = new Date(isoStr);
            return dateObj.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit', 
              hour12: false 
            });
          } catch (err) {
            return "00:00";
          }
        };
        
        const duration_hours = (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / (1000 * 60 * 60);
        return {
          status: e.status as 'OFF_DUTY' | 'SLEEPER' | 'DRIVING' | 'ON_DUTY_ND',
          start: formatTime(e.start_time),
          end: formatTime(e.end_time),
          duration_hours: Number(duration_hours.toFixed(2)),
          remarks: e.remarks,
          location_name: e.location_name || 'En Route',
        };
      })
    };
  });

  const totalDriving = (raw.eld_sheets || []).reduce(
    (acc: number, sheet: { driving_hours: number }) => acc + (sheet.driving_hours || 0), 
    0
  );

  return {
    trip_id: raw.id,
    summary: {
      total_distance_miles: raw.total_distance_miles || 0.0,
      total_duration_hours: raw.total_duration_hours || 0.0,
      total_driving_hours: Number(totalDriving.toFixed(2)),
      total_rest_stops,
      total_fuel_stops,
      total_sleep_stops
    },
    route_geometry: raw.route_geometry || [
      [raw.current_location_lat, raw.current_location_lng],
      [raw.pickup_location_lat, raw.pickup_location_lng],
      [raw.dropoff_location_lat, raw.dropoff_location_lng]
    ],
    stops: mappedStops,
    eld_sheets: mappedEldSheets,
    start_cycle_used_hours: raw.start_cycle_used_hours || 0.0,
    current_location_name: raw.current_location_name || '',
    pickup_location_name: raw.pickup_location_name || '',
    dropoff_location_name: raw.dropoff_location_name || '',
  };
};

export const planTrip = async (data: TripRequest): Promise<TripResponse> => {
  const response = await apiClient.post('/api/trips/plan/', data);
  return mapRawTripToTripResponse(response.data);
};

export const deleteTrip = async (tripId: string): Promise<void> => {
  await apiClient.delete(`/api/trips/${tripId}/`);
};

export const duplicateTrip = async (tripId: string): Promise<TripResponse> => {
  const response = await apiClient.post(`/api/trips/${tripId}/`);
  return mapRawTripToTripResponse(response.data);
};
