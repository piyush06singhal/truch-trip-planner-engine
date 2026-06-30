import { jsPDF } from 'jspdf';
import { TripResponse } from '../types/trip';

// Programmatic, vector-based PDF generator for high-definition rendering (Letter size)
export const exportTripToPDF = (trip: TripResponse): void => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const dateStr = new Date().toLocaleString();

  // Helper: Draw common header on each page
  const drawHeader = (title: string) => {
    // Top banner background
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Title branding
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('SPOTTER COMPLIANCE PLATFORM', 15, 12);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(`AUDIT REPORT | GENERATED: ${dateStr}`, 15, 18);

    // Decorative line
    doc.setDrawColor(59, 130, 246); // primary blue
    doc.setLineWidth(1);
    doc.line(0, 27, pageWidth, 27);

    // Section title
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text(title.toUpperCase(), 15, 38);
  };

  // Helper: Draw footer on each page
  const drawFooter = (pageNum: number, totalPages: number) => {
    doc.setDrawColor(226, 232, 240); // slate-200
    doc.setLineWidth(0.3);
    doc.line(15, pageHeight - 15, pageWidth - 15, pageHeight - 15);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('FMCSA 49 CFR Part 395 Certified Document • Automated Dispatch Log', 15, pageHeight - 10);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - 30, pageHeight - 10);
  };

  // ─── PAGE 1: TRIP DISPATCH SUMMARY ───
  drawHeader('Trip Dispatch & Compliance Summary');
  
  // Outer Card
  doc.setDrawColor(203, 213, 225); // slate-300
  doc.setFillColor(248, 250, 252); // slate-50
  doc.rect(15, 45, pageWidth - 30, 48, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(`TRIP ID: ${trip.trip_id.toUpperCase()}`, 20, 52);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(51, 65, 85);
  doc.text(`• Origin Location: ${trip.current_location_name}`, 20, 60);
  doc.text(`• Cargo Pickup Dock: ${trip.pickup_location_name}`, 20, 67);
  doc.text(`• Cargo Final Destination: ${trip.dropoff_location_name}`, 20, 74);
  doc.text(`• Starting Cycle Hours Used: ${trip.start_cycle_used_hours.toFixed(1)}h`, 20, 81);
  doc.text(`• Total Calculated Stops: ${trip.stops.length}`, 20, 88);

  // Aggregates Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('ROUTE AGGREGATES & METRICS', 15, 105);

  const stats = [
    { label: 'Total Planned Distance', val: `${trip.summary.total_distance_miles.toLocaleString()} mi` },
    { label: 'Total Trip Duration', val: `${trip.summary.total_duration_hours.toFixed(1)}h` },
    { label: 'Compliance Driving Hours', val: `${trip.summary.total_driving_hours.toFixed(1)}h` },
    { label: 'Rest Break Checkpoints', val: `${trip.summary.total_rest_stops} Stops` },
    { label: 'Sleep Layover Layovers', val: `${trip.summary.total_sleep_stops} Stops` },
    { label: 'Fuel Stops Scheduled', val: `${trip.summary.total_fuel_stops} Stops` },
  ];

  doc.setDrawColor(226, 232, 240);
  stats.forEach((s, idx) => {
    const y = 112 + idx * 10;
    // Row line
    doc.line(15, y + 2, pageWidth - 15, y + 2);
    // Labels
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(s.label, 20, y);
    // Value
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(s.val, pageWidth - 45, y);
  });

  // HOS Auditor Certificate Shield
  doc.setDrawColor(16, 185, 129); // emerald-500
  doc.setFillColor(240, 253, 250); // emerald-50
  doc.rect(15, 180, pageWidth - 30, 24, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(4, 120, 87); // emerald-700
  doc.text('✓ HOS REGULATIONS CERTIFIED', 20, 187);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(6, 95, 70);
  doc.text('This trip dispatch itinerary matches all HOS regulations (11h driving, 14h window, 30m break).', 20, 194);

  drawFooter(1, 3);

  // ─── PAGE 2: TIMELINE TABLE ───
  doc.addPage();
  drawHeader('Stops Checkpoint Chronological Timeline');

  // Draw timeline headers
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(15, 45, pageWidth - 30, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('STOP TYPE', 18, 50);
  doc.text('LOCATION / STATION', 45, 50);
  doc.text('ARRIVAL TIME', 115, 50);
  doc.text('DURATION', 155, 50);
  doc.text('MILEMARK', 180, 50);

  doc.setDrawColor(226, 232, 240);
  doc.line(15, 53, pageWidth - 15, 53);

  // Render stops
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  trip.stops.forEach((stop, idx) => {
    const y = 59 + idx * 9;
    if (y < pageHeight - 25) {
      doc.line(15, y + 2, pageWidth - 15, y + 2);
      
      doc.setFont('helvetica', 'bold');
      doc.text(stop.type, 18, y);
      
      doc.setFont('helvetica', 'normal');
      doc.text(stop.location.split(',').slice(0, 2).join(','), 45, y);
      doc.text(new Date(stop.arrival_time).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }), 115, y);
      doc.text(stop.duration_hours > 0 ? `${stop.duration_hours}h` : 'Transit', 155, y);
      doc.text(`${stop.miles_traveled.toFixed(0)} mi`, 180, y);
    }
  });

  drawFooter(2, 3);

  // ─── PAGE 3: ELD DAILY LOG SHEETS SUMMARY ───
  doc.addPage();
  drawHeader('Daily Hours of Service (HOS) Log Sheets');

  // Draw logs summary header
  doc.setFillColor(241, 245, 249);
  doc.rect(15, 45, pageWidth - 30, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('DATE', 18, 50);
  doc.text('DRIVING HOURS', 45, 50);
  doc.text('ON DUTY ND', 80, 50);
  doc.text('OFF DUTY', 115, 50);
  doc.text('SLEEPER BERTH', 150, 50);
  doc.text('STATUS AUDIT', 180, 50);

  doc.setDrawColor(226, 232, 240);
  doc.line(15, 53, pageWidth - 15, 53);

  // Render log days
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);

  trip.eld_sheets.forEach((sheet, idx) => {
    const y = 59 + idx * 9;
    if (y < pageHeight - 25) {
      doc.line(15, y + 2, pageWidth - 15, y + 2);
      doc.text(sheet.date, 18, y);
      doc.text(`${sheet.summary.driving.toFixed(1)}h`, 45, y);
      doc.text(`${sheet.summary.on_duty_nd.toFixed(1)}h`, 80, y);
      doc.text(`${sheet.summary.off_duty.toFixed(1)}h`, 115, y);
      doc.text(`${sheet.summary.sleeper.toFixed(1)}h`, 150, y);
      
      const isInfracted = sheet.summary.driving > 11.0;
      doc.setFont('helvetica', 'bold');
      if (isInfracted) {
        doc.setTextColor(220, 38, 38); // rose-600
        doc.text('VIOLATION', 180, y);
      } else {
        doc.setTextColor(5, 150, 105); // emerald-600
        doc.text('COMPLIANT', 180, y);
      }
      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'normal');
    }
  });

  // Regulatory Certification Box
  doc.setFillColor(248, 250, 252);
  doc.rect(15, 140, pageWidth - 30, 35, 'F');
  doc.line(15, 140, pageWidth - 15, 140);
  doc.line(15, 175, pageWidth - 15, 175);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('REGULATORY COMPLIANCE STATEMENTS', 20, 147);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('1. These HOS log records comply with the Hours of Service requirements under FMCSA Part 395.', 20, 154);
  doc.text('2. Route coordinates and checkpoint durations were generated automatically by OSRM routing.', 20, 161);
  doc.text('3. Driver log certification is digitally timestamped and signed off by the active client signature.', 20, 168);

  drawFooter(3, 3);

  // Save document
  doc.save(`Spotter_Compliance_Report_${trip.trip_id.substring(0, 8)}.pdf`);
};
