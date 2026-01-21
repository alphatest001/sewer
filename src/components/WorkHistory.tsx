import { useState, useEffect } from 'react';
import { Search, X, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import EntryDetailModal from './EntryDetailModal';
import ConfirmDialog from './ConfirmDialog';

interface WorkEntry {
  id: string;
  customer_name: string;
  customer_mobile: string;
  work_date: string;
  shmr: number;
  chmr: number;
  remark: string | null;
  video_url: string | null;
  image_url: string | null;
  supervisor_id: string;
  city: { name: string };
  zone: { name: string };
  ward: { name: string };
  location: { name: string };
  supervisor: { full_name: string };
}

interface City {
  id: string;
  name: string;
}

interface Zone {
  id: string;
  name: string;
  city_id: string;
}

interface Ward {
  id: string;
  name: string;
  zone_id: string;
}

interface Location {
  id: string;
  name: string;
  ward_id: string;
}

interface Supervisor {
  id: string;
  name: string;
  city_id: string | null;
}

export default function WorkHistory() {
  const { user, authUser } = useAuth();
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; entryId: string | null }>({
    isOpen: false,
    entryId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Master data for filters
  const [cities, setCities] = useState<City[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);

  // Supervisor data
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);

  // Available options based on filter selections
  const [availableZones, setAvailableZones] = useState<Zone[]>([]);
  const [availableWards, setAvailableWards] = useState<Ward[]>([]);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [availableSupervisors, setAvailableSupervisors] = useState<Supervisor[]>([]);

  const [filters, setFilters] = useState({
    cityId: '',
    dateFrom: '',
    dateTo: '',
    zoneId: '',
    wardId: '',
    locationId: '',
    supervisorId: ''
  });

  useEffect(() => {
    fetchEntries();
    fetchMasterData();
  }, [user]);

  // Auto-select city for non-admin users
  useEffect(() => {
    if (user && user.role !== 'admin' && user.city_id) {
      setFilters(prev => ({ ...prev, cityId: user.city_id || '' }));
    }
  }, [user]);

  // Cascade: City → Zones
  useEffect(() => {
    if (filters.cityId) {
      const cityZones = zones.filter(z => z.city_id === filters.cityId);
      setAvailableZones(cityZones);
    } else {
      setAvailableZones(zones);
    }
  }, [filters.cityId, zones]);

  // Cascade: Zone → Wards
  useEffect(() => {
    if (filters.zoneId) {
      const zoneWards = wards.filter(w => w.zone_id === filters.zoneId);
      setAvailableWards(zoneWards);
    } else if (filters.cityId) {
      const cityZoneIds = zones.filter(z => z.city_id === filters.cityId).map(z => z.id);
      const relevantWards = wards.filter(w => cityZoneIds.includes(w.zone_id));
      setAvailableWards(relevantWards);
    } else {
      setAvailableWards(wards);
    }
  }, [filters.cityId, filters.zoneId, zones, wards]);

  // Cascade: Ward → Locations
  useEffect(() => {
    if (filters.wardId) {
      const wardLocations = locations.filter(l => l.ward_id === filters.wardId);
      setAvailableLocations(wardLocations);
    } else if (filters.zoneId) {
      const zoneWardIds = wards.filter(w => w.zone_id === filters.zoneId).map(w => w.id);
      const relevantLocations = locations.filter(l => zoneWardIds.includes(l.ward_id));
      setAvailableLocations(relevantLocations);
    } else if (filters.cityId) {
      const cityZoneIds = zones.filter(z => z.city_id === filters.cityId).map(z => z.id);
      const relevantWardIds = wards.filter(w => cityZoneIds.includes(w.zone_id)).map(w => w.id);
      const relevantLocations = locations.filter(l => relevantWardIds.includes(l.ward_id));
      setAvailableLocations(relevantLocations);
    } else {
      setAvailableLocations(locations);
    }
  }, [filters.cityId, filters.zoneId, filters.wardId, zones, wards, locations]);

  // Cascade: City → Supervisors
  useEffect(() => {
    if (filters.cityId) {
      const citySupervisors = supervisors.filter(s => s.city_id === filters.cityId);
      setAvailableSupervisors(citySupervisors);
    } else {
      setAvailableSupervisors(supervisors);
    }
  }, [filters.cityId, supervisors]);

  const fetchMasterData = async () => {
    try {
      const [citiesRes, zonesRes, wardsRes, locationsRes, supervisorsRes] = await Promise.all([
        supabase.from('cities').select('*').order('name'),
        supabase.from('zones').select('*').order('name'),
        supabase.from('wards').select('*').order('name'),
        supabase.from('locations').select('*').order('name'),
        supabase.from('users').select('id, full_name, city_id').eq('role', 'supervisor').order('full_name')
      ]);

      if (citiesRes.data) setCities(citiesRes.data);
      if (zonesRes.data) setZones(zonesRes.data);
      if (wardsRes.data) setWards(wardsRes.data);
      if (locationsRes.data) setLocations(locationsRes.data);
      if (supervisorsRes.data) {
        setSupervisors(supervisorsRes.data.map(u => ({ id: u.id, name: u.full_name, city_id: u.city_id })));
      }
    } catch (error) {
      console.error('Error fetching master data:', error);
    }
  };

  const fetchEntries = async () => {
    // ✅ user is now always available from auth metadata
    if (!user) return;

    setLoading(true);
    try {
      let query = supabase
        .from('work_entries')
        .select(`
          *,
          city:cities(name),
          zone:zones(name),
          ward:wards(name),
          location:locations(name),
          supervisor:users!work_entries_supervisor_id_fkey(full_name),
          media:work_entry_media(*)
        `)
        .order('work_date', { ascending: false });

      // Role-based filtering
      if (user.role === 'employee' || user.role === 'customer' || user.role === 'supervisor') {
        // Filter by user's city
        if (user.city_id) {
          query = query.eq('city_id', user.city_id);
        }
      }
      // Admin sees all entries (no filter)

      const { data, error } = await query;

      if (error) throw error;
      setEntries(data || []);
    } catch (error) {
      console.error('Error fetching work entries:', error);
      alert('Failed to load work entries. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (entryId: string) => {
    if (user?.role !== 'admin') {
      alert('Only administrators can delete entries.');
      return;
    }
    setDeleteConfirm({ isOpen: true, entryId });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.entryId) return;

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('work_entries')
        .delete()
        .eq('id', deleteConfirm.entryId);

      if (error) throw error;

      alert('Work entry deleted successfully.');
      fetchEntries();
    } catch (error) {
      console.error('Error deleting work entry:', error);
      alert('Failed to delete work entry. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteConfirm({ isOpen: false, entryId: null });
    }
  };

  const handleDeleteCancel = () => {
    if (!isDeleting) {
      setDeleteConfirm({ isOpen: false, entryId: null });
    }
  };

  const filteredEntries = entries.filter(entry => {
    if (filters.cityId && entry.city.name !== cities.find(c => c.id === filters.cityId)?.name) {
      return false;
    }
    if (filters.zoneId && entry.zone.name !== zones.find(z => z.id === filters.zoneId)?.name) {
      return false;
    }
    if (filters.wardId && entry.ward.name !== wards.find(w => w.id === filters.wardId)?.name) {
      return false;
    }
    if (filters.locationId && entry.location.name !== locations.find(l => l.id === filters.locationId)?.name) {
      return false;
    }
    if (filters.dateFrom && entry.work_date < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && entry.work_date > filters.dateTo) {
      return false;
    }
    // Supervisor filter
    if (filters.supervisorId && entry.supervisor_id !== filters.supervisorId) {
      return false;
    }
    return true;
  });

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => {
      const updated = { ...prev, [name]: value };

      // Reset downstream filters when upstream changes
      if (name === 'cityId') {
        updated.zoneId = '';
        updated.wardId = '';
        updated.locationId = '';
        updated.supervisorId = '';
      }
      if (name === 'zoneId') {
        updated.wardId = '';
        updated.locationId = '';
      }
      if (name === 'wardId') {
        updated.locationId = '';
      }

      return updated;
    });
  };

  const totalHours = filteredEntries.reduce((sum, entry) => {
    const hours = entry.chmr - entry.shmr;
    return sum + hours;
  }, 0);
  
  const avgHours = filteredEntries.length > 0 ? totalHours / filteredEntries.length : 0;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Work History</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City
              {user && user.role !== 'admin' && user.city_id && (
                <span className="ml-2 text-xs text-blue-600">(Auto-selected)</span>
              )}
            </label>
            <select
              value={filters.cityId}
              onChange={(e) => handleFilterChange('cityId', e.target.value)}
              disabled={user?.role !== 'admin' && !!user?.city_id}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zone</label>
            <select
              value={filters.zoneId}
              onChange={(e) => handleFilterChange('zoneId', e.target.value)}
              disabled={!filters.cityId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">All Zones</option>
              {availableZones.map(zone => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ward</label>
            <select
              value={filters.wardId}
              onChange={(e) => handleFilterChange('wardId', e.target.value)}
              disabled={!filters.zoneId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">All Wards</option>
              {availableWards.map(ward => (
                <option key={ward.id} value={ward.id}>{ward.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <select
              value={filters.locationId}
              onChange={(e) => handleFilterChange('locationId', e.target.value)}
              disabled={!filters.wardId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">All Locations</option>
              {availableLocations.map(location => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Supervisor</label>
            <select
              value={filters.supervisorId}
              onChange={(e) => handleFilterChange('supervisorId', e.target.value)}
              disabled={!filters.cityId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
            >
              <option value="">All Supervisors</option>
              {availableSupervisors.map(supervisor => (
                <option key={supervisor.id} value={supervisor.id}>{supervisor.name}</option>
              ))}
            </select>
            {!filters.cityId && (
              <p className="mt-1 text-xs text-gray-500">Select a city first</p>
            )}
          </div>
        </div>

        {(filters.cityId || filters.dateFrom || filters.dateTo || filters.zoneId || filters.wardId || filters.locationId || filters.supervisorId) && (
          <button
            onClick={() => {
              const cityId = (user?.role !== 'admin' && user?.city_id) ? user.city_id : '';
              setFilters({
                cityId,
                dateFrom: '',
                dateTo: '',
                zoneId: '',
                wardId: '',
                locationId: '',
                supervisorId: ''
              });
            }}
            className="mt-4 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
          >
            <X className="w-4 h-4" />
            Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Total Entries</p>
          <p className="text-3xl font-bold text-gray-900">{filteredEntries.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Total Hours Logged</p>
          <p className="text-3xl font-bold text-gray-900">{totalHours.toFixed(1)}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600 mb-1">Average Hours / Entry</p>
          <p className="text-3xl font-bold text-gray-900">{avgHours.toFixed(1)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ward</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media</th>
                {user?.role === 'admin' && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={user?.role === 'admin' ? 9 : 8} className="px-6 py-12 text-center text-gray-500">
                    No entries found. {user?.role === 'employee' ? 'Create your first work entry!' : 'Adjust your filters or check back later.'}
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => {
                  const hours = (entry.chmr - entry.shmr).toFixed(1);

                  // Count media from new table, fallback to old columns
                  const entryWithMedia = entry as any;
                  const photoCount = entryWithMedia.media
                    ? entryWithMedia.media.filter((m: any) => m.media_type === 'photo').length
                    : (entry.image_url ? 1 : 0);

                  const videoCount = entryWithMedia.media
                    ? entryWithMedia.media.filter((m: any) => m.media_type === 'video').length
                    : (entry.video_url ? 1 : 0);

                  const hasMedia = photoCount > 0 || videoCount > 0;

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.city.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(entry.work_date)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.zone.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{entry.ward.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{entry.location.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{hours}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">{entry.supervisor.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {hasMedia ? (
                          <span>
                            {photoCount > 0 && `${photoCount} photo${photoCount > 1 ? 's' : ''}`}
                            {photoCount > 0 && videoCount > 0 && ' + '}
                            {videoCount > 0 && `${videoCount} video${videoCount > 1 ? 's' : ''}`}
                          </span>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </td>
                      {user?.role === 'admin' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(entry.id);
                            }}
                            className="text-red-600 hover:text-red-800 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedEntry && (
        <EntryDetailModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
        />
      )}

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title="Delete Work Entry"
        message="Are you sure you want to delete this work entry? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
