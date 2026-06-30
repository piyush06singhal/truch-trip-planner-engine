import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Copy, 
  Trash2, 
  Download, 
  Table, 
  Grid, 
  Search, 
  SlidersHorizontal, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  AlertCircle,
  X,
  FileDown,
  Printer
} from 'lucide-react';

import PageHeader from '../components/ui/PageHeader';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Skeleton from '../components/ui/Skeleton';
import Alert from '../components/ui/Alert';
import apiClient from '../api/client';
import { useUI } from '../context/UIContext';
import { deleteTrip, duplicateTrip, mapRawTripToTripResponse } from '../api/trips';
import { exportTripToPDF } from '../utils/pdfExport';
import { exportTripToCSV } from '../utils/csvExport';

// Explicit interfaces for raw database entities
interface RawStop {
  stop_type: string;
  location_name: string;
  arrival_time: string;
  duration_hours: number;
  distance_from_start_miles: number;
}

interface RawEldEvent {
  status: string;
  start_time: string;
  end_time: string;
  remarks: string;
  location_name: string;
}

interface RawEldSheet {
  log_date: string;
  driving_hours: number;
  on_duty_hours: number;
  off_duty_hours: number;
  sleeper_berth_hours: number;
  events: RawEldEvent[];
}

interface RawTrip {
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

export const History: React.FC = () => {
  const { setPlannedTrip } = useUI();
  
  // Dashboard states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'compliant' | 'violation'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'distance_desc' | 'distance_asc' | 'duration_desc' | 'duration_asc'>('newest');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(6);
  const [selectedTripToDelete, setSelectedTripToDelete] = useState<RawTrip | null>(null);

  // 1. Query planned trips history from Django API
  const { data: trips = [], isLoading, isError, refetch } = useQuery<RawTrip[]>({
    queryKey: ['trips_history'],
    queryFn: async () => {
      const response = await apiClient.get('/api/trips/');
      return response.data;
    }
  });

  // 2. Mutations
  const deleteMutation = useMutation({
    mutationFn: deleteTrip,
    onSuccess: () => {
      refetch();
      toast.success('Itinerary log sheet deleted successfully.');
      setSelectedTripToDelete(null);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to delete trip record.');
    }
  });

  const duplicateMutation = useMutation({
    mutationFn: duplicateTrip,
    onSuccess: (data) => {
      refetch();
      toast.success(`Trip cloned successfully. Cloned ID: ${data.trip_id.substring(0, 8).toUpperCase()}`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to clone trip planning template.');
    }
  });

  const handleSelectTrip = (trip: RawTrip) => {
    try {
      const mappedTrip = mapRawTripToTripResponse(trip);
      setPlannedTrip(mappedTrip);
      toast.success(`Trip ${trip.id.substring(0, 8).toUpperCase()} loaded into active viewport.`);
    } catch (err) {
      toast.error('Failed to parse active log.');
    }
  };

  const handleJSONExport = (trip: RawTrip) => {
    try {
      const mapped = mapRawTripToTripResponse(trip);
      const jsonStr = JSON.stringify(mapped, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Spotter_Trip_${trip.id.substring(0, 8)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('JSON configuration exported.');
    } catch {
      toast.error('Failed to export JSON.');
    }
  };

  const handlePDFExport = (trip: RawTrip) => {
    try {
      const mapped = mapRawTripToTripResponse(trip);
      exportTripToPDF(mapped);
      toast.success('PDF document compiled successfully.');
    } catch {
      toast.error('Failed to compile PDF.');
    }
  };

  const handleCSVExport = (trip: RawTrip) => {
    try {
      const mapped = mapRawTripToTripResponse(trip);
      exportTripToCSV(mapped);
      toast.success('CSV log sheet downloaded.');
    } catch {
      toast.error('Failed to write CSV.');
    }
  };

  const handlePrint = (trip: RawTrip) => {
    handleSelectTrip(trip);
    window.print();
  };

  // Helper: Checks if raw trip contains any daily HOS violations
  const checkCompliance = (trip: RawTrip): boolean => {
    return !(trip.eld_sheets || []).some(s => s.driving_hours > 11.0);
  };

  // 3. Search, Filter, Sort Logic
  const processedTrips = useMemo(() => {
    let result = [...trips];

    // Filter by text search (matches origin, destination, or ID)
    if (searchTerm.trim() !== '') {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter(
        t =>
          t.id.toLowerCase().includes(q) ||
          t.current_location_name.toLowerCase().includes(q) ||
          t.dropoff_location_name.toLowerCase().includes(q)
      );
    }

    // Filter by HOS Compliance status
    if (statusFilter !== 'all') {
      result = result.filter(t => {
        const isCompliant = checkCompliance(t);
        return statusFilter === 'compliant' ? isCompliant : !isCompliant;
      });
    }

    // Sort entries
    result.sort((a, b) => {
      switch (sortBy) {
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'distance_desc':
          return b.total_distance_miles - a.total_distance_miles;
        case 'distance_asc':
          return a.total_distance_miles - b.total_distance_miles;
        case 'duration_desc':
          return b.total_duration_hours - a.total_duration_hours;
        case 'duration_asc':
          return a.total_duration_hours - b.total_duration_hours;
        case 'newest':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [trips, searchTerm, statusFilter, sortBy]);

  // 4. Pagination math
  const totalItems = processedTrips.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const paginatedTrips = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedTrips.slice(start, start + pageSize);
  }, [processedTrips, currentPage, pageSize]);

  // Adjust current page if bounds change
  if (currentPage > totalPages) {
    setCurrentPage(totalPages);
  }

  const formatDate = (isoStr: string) => {
    try {
      return new Date(isoStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Compliance Trip History" 
        description="Search, filter, audit, duplicate, or export historic compliance logs and routing itineraries."
      />

      {/* Control Toolbar Panel */}
      <div className="flex flex-col gap-4 p-4 rounded-xl border border-border/40 bg-zinc-950/20">
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 select-none">
          {/* Search bar */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search origin, dest, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary/30 border border-border/40 text-xs font-semibold rounded-lg pl-9 pr-3 py-2.5 text-zinc-300 focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Compliance filter */}
          <div className="relative flex items-center">
            <SlidersHorizontal className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'compliant' | 'violation')}
              className="w-full bg-secondary/30 border border-border/40 text-xs font-semibold rounded-lg pl-9 pr-3 py-2.5 text-zinc-300 focus:outline-none focus:border-primary/50 cursor-pointer appearance-none"
            >
              <option value="all">All HOS Statuses</option>
              <option value="compliant">Compliant Logs Only</option>
              <option value="violation">Violations / Alerts</option>
            </select>
          </div>

          {/* Sort order selection */}
          <div className="relative flex items-center">
            <ArrowUpDown className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'distance_desc' | 'distance_asc' | 'duration_desc' | 'duration_asc')}
              className="w-full bg-secondary/30 border border-border/40 text-xs font-semibold rounded-lg pl-9 pr-3 py-2.5 text-zinc-300 focus:outline-none focus:border-primary/50 cursor-pointer appearance-none"
            >
              <option value="newest">Sort: Newest First</option>
              <option value="oldest">Sort: Oldest First</option>
              <option value="distance_desc">Distance: Longest</option>
              <option value="distance_asc">Distance: Shortest</option>
              <option value="duration_desc">Duration: Longest</option>
              <option value="duration_asc">Duration: Shortest</option>
            </select>
          </div>

          {/* Grid/Table view toggles & Page limits */}
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex-1 cursor-pointer"
            >
              <Table className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="flex-1 cursor-pointer"
            >
              <Grid className="h-3.5 w-3.5" />
            </Button>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="bg-secondary/30 border border-border/40 text-xs font-semibold rounded-lg px-2 py-2 text-zinc-300 focus:outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value={4}>Show 4</option>
              <option value={6}>Show 6</option>
              <option value={12}>Show 12</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Results Container */}
      <Card>
        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : isError ? (
            <Alert variant="destructive" title="Database Connection Failure">
              Could not retrieve trip archives. Please verify Django and Supabase statuses.
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  Retry Connection
                </Button>
              </div>
            </Alert>
          ) : paginatedTrips.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground text-sm font-semibold">
              No matching planned routes found. Go to the Trip Planner to create one.
            </div>
          ) : viewMode === 'table' ? (
            /* ───── Table layout ───── */
            <div className="overflow-x-auto select-none">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/80 text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                    <th className="py-3 px-4">Trip ID</th>
                    <th className="py-3 px-4">Origin / Dest</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Distance / Duration</th>
                    <th className="py-3 px-4">Audit Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {paginatedTrips.map((trip) => {
                    const isCompliant = checkCompliance(trip);
                    return (
                      <tr key={trip.id} className="hover:bg-secondary/20 transition-colors">
                        <td className="py-3 px-4 font-bold text-primary">
                          {trip.id.substring(0, 8).toUpperCase()}
                        </td>
                        <td className="py-3 px-4 font-semibold max-w-[200px] truncate">
                          <p className="text-zinc-200">{trip.current_location_name.split(',')[0]}</p>
                          <p className="text-[10px] text-muted-foreground font-normal">→ {trip.dropoff_location_name.split(',')[0]}</p>
                        </td>
                        <td className="py-3 px-4 text-zinc-400 font-medium">{formatDate(trip.created_at)}</td>
                        <td className="py-3 px-4 text-zinc-300 font-medium">
                          <p>{trip.total_distance_miles.toFixed(0)} mi</p>
                          <p className="text-[10px] text-muted-foreground font-normal">{trip.total_duration_hours.toFixed(1)}h</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={isCompliant ? 'success' : 'destructive'}>
                            {isCompliant ? 'Compliant' : 'Audit Warning'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1.5 whitespace-nowrap">
                          <Button variant="outline" size="sm" onClick={() => handleSelectTrip(trip)} title="Open logs details">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => duplicateMutation.mutate(trip.id)} title="Clone/Duplicate trip" disabled={duplicateMutation.isPending}>
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handlePrint(trip)} title="Print Trip">
                            <Printer className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handlePDFExport(trip)} title="Export PDF">
                            <FileDown className="h-3.5 w-3.5 text-blue-500" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleCSVExport(trip)} title="Export CSV">
                            <Download className="h-3.5 w-3.5 text-emerald-500" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleJSONExport(trip)} title="Export JSON">
                            <Download className="h-3.5 w-3.5 text-amber-500" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => setSelectedTripToDelete(trip)} title="Delete itinerary log" className="hover:bg-rose-500/10 hover:border-rose-500/25 text-rose-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* ───── Grid Card layout ───── */
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 select-none">
              {paginatedTrips.map((trip) => {
                const isCompliant = checkCompliance(trip);
                return (
                  <Card key={trip.id} hoverEffect className="flex flex-col justify-between border-border/40">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-center gap-2">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                          ID: {trip.id.substring(0, 8).toUpperCase()}
                        </span>
                        <Badge variant={isCompliant ? 'success' : 'destructive'}>
                          {isCompliant ? 'Compliant' : 'Audit Warning'}
                        </Badge>
                      </div>
                      <CardTitle className="text-sm mt-1 text-zinc-100 truncate">
                        {trip.current_location_name.split(',')[0]} → {trip.dropoff_location_name.split(',')[0]}
                      </CardTitle>
                      <CardDescription>{formatDate(trip.created_at)}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 pt-0 text-xs">
                      <div className="grid grid-cols-2 gap-2 border-t border-b border-border/30 py-2 text-zinc-300">
                        <div>
                          <p className="text-[10px] text-muted-foreground">Distance</p>
                          <p className="font-bold">{trip.total_distance_miles.toFixed(0)} mi</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-muted-foreground">Duration</p>
                          <p className="font-bold">{trip.total_duration_hours.toFixed(1)}h</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 justify-end">
                        <Button variant="outline" size="sm" onClick={() => handleSelectTrip(trip)} title="Open">
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => duplicateMutation.mutate(trip.id)} title="Clone" disabled={duplicateMutation.isPending}>
                          <Copy className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handlePrint(trip)} title="Print">
                          <Printer className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handlePDFExport(trip)} title="PDF">
                          <FileDown className="h-3.5 w-3.5 text-blue-500" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleJSONExport(trip)} title="JSON">
                          <Download className="h-3.5 w-3.5 text-amber-500" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSelectedTripToDelete(trip)} className="hover:bg-rose-500/10 text-rose-500" title="Delete">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Pagination Footer Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/30 select-none">
              <span className="text-[11px] text-muted-foreground font-semibold">
                Showing {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
              </span>
              <div className="flex items-center gap-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="cursor-pointer"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                    className="w-8 h-8 p-0 cursor-pointer text-xs"
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="cursor-pointer"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ───── Delete Confirmation Dialog Modal ───── */}
      {selectedTripToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm rounded-xl border border-border/40 bg-zinc-950 p-5 shadow-2xl space-y-4"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 text-rose-500">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <h4 className="font-bold text-sm text-foreground">Confirm Delete Log Sheet</h4>
              </div>
              <button onClick={() => setSelectedTripToDelete(null)} className="text-zinc-500 hover:text-zinc-300">
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <p className="text-xs text-muted-foreground leading-normal">
              Are you sure you want to permanently delete this itinerary audit log from Supabase? 
              This action cascades and deletes all Stops, ELD Log sheets, and events records linked to it.
            </p>
            
            <div className="p-3 rounded-lg bg-secondary/20 border border-border/30 text-[11px] font-semibold text-zinc-300">
              <p>ID: {selectedTripToDelete.id.substring(0, 8).toUpperCase()}</p>
              <p className="truncate mt-0.5">{selectedTripToDelete.current_location_name.split(',')[0]} → {selectedTripToDelete.dropoff_location_name.split(',')[0]}</p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => setSelectedTripToDelete(null)}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => deleteMutation.mutate(selectedTripToDelete.id)}
                disabled={deleteMutation.isPending}
                className="bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Permanently Delete'}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default History;
