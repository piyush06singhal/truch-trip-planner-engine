export interface TripRequest {
  current_location: string;
  pickup_location: string;
  dropoff_location: string;
  cycle_hours_used: number;
}

export interface TripSummary {
  total_distance_miles: number;
  total_duration_hours: number;
  total_driving_hours: number;
  total_rest_stops: number;
  total_fuel_stops: number;
  total_sleep_stops: number;
}

export type StopType = 'ORIGIN' | 'PICKUP' | 'DROPOFF' | 'REST_STOP' | 'FUEL_STOP' | 'SLEEP_STOP';

export interface Stop {
  type: StopType;
  location: string;
  arrival_time: string;
  duration_hours: number;
  miles_traveled: number;
}

export type EldEventStatus = 'OFF_DUTY' | 'SLEEPER' | 'DRIVING' | 'ON_DUTY_ND';

export interface EldEvent {
  status: EldEventStatus;
  start: string; // "HH:MM"
  end: string; // "HH:MM"
  duration_hours: number;
  remarks: string;
  location_name: string;
}

export interface EldSheetSummary {
  driving: number;
  on_duty_nd: number;
  off_duty: number;
  sleeper: number;
}

export interface EldSheet {
  date: string; // "YYYY-MM-DD"
  summary: EldSheetSummary;
  events: EldEvent[];
}

export interface TripResponse {
  trip_id: string;
  summary: TripSummary;
  route_geometry: [number, number][];
  stops: Stop[];
  eld_sheets: EldSheet[];
  start_cycle_used_hours: number;
  current_location_name: string;
  pickup_location_name: string;
  dropoff_location_name: string;
}

export interface RawStop {
  stop_type: string;
  location_name: string;
  arrival_time: string;
  duration_hours: number;
  distance_from_start_miles: number;
}

export interface RawEldEvent {
  status: string;
  start_time: string;
  end_time: string;
  remarks: string;
  location_name: string;
}

export interface RawEldSheet {
  log_date: string;
  driving_hours: number;
  on_duty_hours: number;
  off_duty_hours: number;
  sleeper_berth_hours: number;
  events: RawEldEvent[];
}

export interface RawTrip {
  id: string;
  current_location_name: string;
  current_location_lat: number;
  current_location_lng: number;
  pickup_location_name: string;
  pickup_location_lat: number;
  pickup_location_lng: number;
  dropoff_location_name: string;
  dropoff_location_lat: number;
  dropoff_location_lng: number;
  total_distance_miles: number;
  total_duration_hours: number;
  created_at: string;
  stops: RawStop[];
  eld_sheets: RawEldSheet[];
  route_geometry?: [number, number][];
  start_cycle_used_hours: number;
}
