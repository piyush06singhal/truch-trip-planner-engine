import { TripResponse } from '../types/trip';

// Client-side CSV compiler that aggregates stops checkpoint coordinates into rows and downloads the file
export const exportTripToCSV = (trip: TripResponse): void => {
  const headers = ['Stop Type', 'Location Address', 'Arrival Timestamp', 'Duration (Hours)', 'Distance From Start (Miles)'];
  
  const rows = trip.stops.map(s => [
    s.type,
    `"${s.location.replace(/"/g, '""')}"`, // safe quote-wrapping address formats
    s.arrival_time,
    s.duration_hours.toString(),
    s.miles_traveled.toFixed(2)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `Spotter_Timeline_Itinerary_${trip.trip_id.substring(0, 8)}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up object URL memory references
  URL.revokeObjectURL(url);
};
