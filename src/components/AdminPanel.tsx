import { useState, useEffect } from 'react';
import { Plus, Trash2, Users, Eye, EyeOff, RotateCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import ConfirmDialog from './ConfirmDialog';
import UserCredentialsModal from './UserCredentialsModal';
import ErrorModal from './ErrorModal';

type TabType = 'cities' | 'zones' | 'wards' | 'locations' | 'engineers' | 'executive_engineers' | 'users';

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


interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'employee' | 'customer' | 'engineer' | 'executive_engineer';
  city_id: string | null;
  temp_password: string | null;
  cities?: { name: string };
}

export default function AdminPanel() {
  const [activeTab, setActiveTab] = useState<TabType>('cities');
  const [loading, setLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    type: 'city' | 'zone' | 'ward' | 'location' | 'user' | null;
    id: string | null;
    name: string | null;
  }>({
    isOpen: false,
    type: null,
    id: null,
    name: null,
  });

  // Master data
  const [cities, setCities] = useState<City[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Form states
  const [newCity, setNewCity] = useState('');
  const [newZone, setNewZone] = useState({ name: '', cityId: '' });
  const [newWard, setNewWard] = useState({ name: '', cityId: '', zoneId: '' });
  const [newLocation, setNewLocation] = useState({ name: '', cityId: '', zoneId: '', wardId: '' });
  const [newUser, setNewUser] = useState({
    fullName: '',
    role: 'engineer' as 'engineer' | 'executive_engineer' | 'customer',
    cityId: ''
  });
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set());
  const [credentialsModal, setCredentialsModal] = useState<{
    isOpen: boolean;
    userId: string;
    password: string;
  }>({
    isOpen: false,
    userId: '',
    password: ''
  });
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    message: string;
  }>({
    isOpen: false,
    message: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [citiesRes, zonesRes, wardsRes, locationsRes, usersRes] = await Promise.all([
        supabase.from('cities').select('*').order('name'),
        supabase.from('zones').select('*').order('name'),
        supabase.from('wards').select('*').order('name'),
        supabase.from('locations').select('*').order('name'),
        supabase.from('users').select('*, cities(name)').order('created_at', { ascending: false })
      ]);

      if (citiesRes.data) setCities(citiesRes.data);
      if (zonesRes.data) setZones(zonesRes.data);
      if (wardsRes.data) setWards(wardsRes.data);
      if (locationsRes.data) setLocations(locationsRes.data);
      if (usersRes.data) setUsers(usersRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      setErrorModal({
        isOpen: true,
        message: 'Failed to load data. Please refresh the page.'
      });
    } finally {
      setLoading(false);
    }
  };

  // Generic delete confirmation handlers
  const promptDelete = (type: 'city' | 'zone' | 'ward' | 'location' | 'engineer' | 'user', id: string, name: string) => {
    setDeleteConfirm({ isOpen: true, type, id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm.id || !deleteConfirm.type) return;

    try {
      // Handle user deletion separately via Edge Function
      if (deleteConfirm.type === 'user') {
        // Get the current session to ensure we have a valid token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
          throw new Error('You must be logged in to delete users');
        }

        const { data, error } = await supabase.functions.invoke('delete-user', {
          body: { userId: deleteConfirm.id }
        });

        if (error) {
          console.error('Edge function error details:', error);
          throw new Error(error.message || 'Failed to delete user');
        }

        if (!data?.success) {
          throw new Error(data?.error || 'Failed to delete user account');
        }

        fetchAllData();
        alert('User deleted successfully!');
      } else {
        // Handle other entities (cities, zones, wards, locations)
        let table = `${deleteConfirm.type}s`;
        if (deleteConfirm.type === 'city') table = 'cities';

        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', deleteConfirm.id);

        if (error) throw error;

        fetchAllData();
        alert(`${deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1)} deleted successfully!`);
      }
    } catch (error: any) {
      console.error(`Error deleting ${deleteConfirm.type}:`, error);
      setErrorModal({
        isOpen: true,
        message: error.message || `Failed to delete ${deleteConfirm.type}.`
      });
    } finally {
      setDeleteConfirm({ isOpen: false, type: null, id: null, name: null });
    }
  };

  const handleCancelDelete = () => {
    setDeleteConfirm({ isOpen: false, type: null, id: null, name: null });
  };

  // City operations
  const handleAddCity = async () => {
    if (!newCity.trim()) return;

    try {
      const { error } = await supabase
        .from('cities')
        .insert([{ name: newCity.trim() }]);

      if (error) throw error;

      setNewCity('');
      fetchAllData();
      alert('City added successfully!');
    } catch (error: any) {
      console.error('Error adding city:', error);
      alert(error.message || 'Failed to add city.');
    }
  };

  const handleDeleteCity = (id: string, name: string) => {
    promptDelete('city', id, name);
  };

  // Zone operations
  const handleAddZone = async () => {
    if (!newZone.name.trim() || !newZone.cityId) return;

    try {
      const { error } = await supabase
        .from('zones')
        .insert([{ name: newZone.name.trim(), city_id: newZone.cityId }]);

      if (error) throw error;

      setNewZone({ name: '', cityId: '' });
      fetchAllData();
      alert('Zone added successfully!');
    } catch (error: any) {
      console.error('Error adding zone:', error);
      alert(error.message || 'Failed to add zone.');
    }
  };

  const handleDeleteZone = (id: string, name: string) => {
    promptDelete('zone', id, name);
  };

  // Ward operations
  const handleAddWard = async () => {
    if (!newWard.name.trim() || !newWard.zoneId) return;

    try {
      const { error } = await supabase
        .from('wards')
        .insert([{ name: newWard.name.trim(), zone_id: newWard.zoneId }]);

      if (error) throw error;

      setNewWard({ name: '', cityId: '', zoneId: '' });
      fetchAllData();
      alert('Ward added successfully!');
    } catch (error: any) {
      console.error('Error adding ward:', error);
      alert(error.message || 'Failed to add ward.');
    }
  };

  const handleDeleteWard = (id: string, name: string) => {
    promptDelete('ward', id, name);
  };

  // Location operations
  const handleAddLocation = async () => {
    if (!newLocation.name.trim() || !newLocation.wardId) return;

    try {
      const { error } = await supabase
        .from('locations')
        .insert([{ name: newLocation.name.trim(), ward_id: newLocation.wardId }]);

      if (error) throw error;

      setNewLocation({ name: '', cityId: '', zoneId: '', wardId: '' });
      fetchAllData();
      alert('Location added successfully!');
    } catch (error: any) {
      console.error('Error adding location:', error);
      alert(error.message || 'Failed to add location.');
    }
  };

  const handleDeleteLocation = (id: string, name: string) => {
    promptDelete('location', id, name);
  };


  // User operations
  const handleAddUser = async () => {
    if (!newUser.fullName || !newUser.cityId) {
      setErrorModal({
        isOpen: true,
        message: 'Please fill in all required fields.'
      });
      return;
    }

    setIsCreatingUser(true);
    try {
      // Call the create-user Edge Function
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          fullName: newUser.fullName,
          role: newUser.role,
          cityId: newUser.cityId
        }
      });

      // Handle Edge Function errors - check data first because error details are in the response body
      if (error || !data?.success) {
        console.error('Edge Function error:', error);
        console.error('Edge Function response data:', data);

        // Extract the actual error message from the response data
        let errorMessage = 'Failed to create user. Please try again.';

        if (data?.error) {
          // Error message is in the response body
          errorMessage = data.error;
        } else if (error?.message && !error.message.includes('non-2xx status code')) {
          // Use error.message only if it's not the generic message
          errorMessage = error.message;
        }

        throw new Error(errorMessage);
      }

      // Success - reset form and refresh data
      setNewUser({
        fullName: '',
        role: 'engineer',
        cityId: ''
      });
      await fetchAllData();

      // Show credentials modal
      setCredentialsModal({
        isOpen: true,
        userId: data.email,
        password: data.password
      });
    } catch (error: any) {
      console.error('Error creating user:', error);
      // Show error in modal instead of alert
      setErrorModal({
        isOpen: true,
        message: error.message || 'An unexpected error occurred. Please try again.'
      });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleDeleteUser = (userId: string, userRole: string, userName: string) => {
    if (userRole === 'admin') {
      setErrorModal({
        isOpen: true,
        message: 'Admin accounts cannot be deleted.'
      });
      return;
    }
    promptDelete('user', userId, userName);
  };

  const handleResetPassword = async (userId: string, userName: string) => {
    if (!confirm(`Are you sure you want to reset the password for ${userName}?`)) {
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { userId }
      });

      if (error) {
        throw new Error('Failed to reset password');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Failed to reset password');
      }

      // Refresh user list to get updated password
      await fetchAllData();

      // Get the user's email to display in modal
      const user = users.find(u => u.id === userId);
      const userEmail = user?.email || '';

      // Show credentials modal with new password
      setCredentialsModal({
        isOpen: true,
        userId: userEmail,
        password: data.newPassword
      });
    } catch (error: any) {
      console.error('Error resetting password:', error);
      setErrorModal({
        isOpen: true,
        message: error.message || 'Failed to reset password.'
      });
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setVisiblePasswords(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const getCityName = (cityId: string) => {
    return cities.find(c => c.id === cityId)?.name || 'Unknown';
  };

  const getZoneName = (zoneId: string) => {
    return zones.find(z => z.id === zoneId)?.name || 'Unknown';
  };

  const getWardName = (wardId: string) => {
    return wards.find(w => w.id === wardId)?.name || 'Unknown';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Admin Panel - Master Data Management</h2>

        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('cities')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'cities' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Cities
          </button>
          <button
            onClick={() => setActiveTab('zones')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'zones' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Zones
          </button>
          <button
            onClick={() => setActiveTab('wards')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'wards' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Wards
          </button>
          <button
            onClick={() => setActiveTab('locations')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'locations' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Locations
          </button>
          <button
            onClick={() => setActiveTab('engineers')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'engineers' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Engineers
          </button>
          <button
            onClick={() => setActiveTab('executive_engineers')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
              activeTab === 'executive_engineers' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Executive Engineers
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors flex items-center gap-2 ${
              activeTab === 'users' ? 'bg-orange-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            User Accounts
          </button>
        </div>

        {/* Cities Tab */}
        {activeTab === 'cities' && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newCity}
                onChange={(e) => setNewCity(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddCity()}
                placeholder="Enter city name..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                onClick={handleAddCity}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Add City
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {cities.map(city => (
                <div key={city.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="text-gray-900">{city.name}</span>
                  <button
                    onClick={() => handleDeleteCity(city.id, city.name)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Zones Tab */}
        {activeTab === 'zones' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={newZone.cityId}
                onChange={(e) => setNewZone({ ...newZone, cityId: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newZone.name}
                  onChange={(e) => setNewZone({ ...newZone, name: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddZone()}
                  placeholder="Zone name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddZone}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {cities.map(city => {
                const cityZones = zones.filter(z => z.city_id === city.id);
                if (cityZones.length === 0) return null;

                return (
                  <div key={city.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">{city.name}</h4>
                    <div className="space-y-2">
                      {cityZones.map(zone => (
                        <div key={zone.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <span className="text-gray-700">{zone.name}</span>
                          <button
                            onClick={() => handleDeleteZone(zone.id, zone.name)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Wards Tab */}
        {activeTab === 'wards' && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <select
                value={newWard.cityId}
                onChange={(e) => setNewWard({ ...newWard, cityId: e.target.value, zoneId: '' })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
              <select
                value={newWard.zoneId}
                onChange={(e) => setNewWard({ ...newWard, zoneId: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={!newWard.cityId}
              >
                <option value="">Select Zone</option>
                {zones
                  .filter(zone => !newWard.cityId || zone.city_id === newWard.cityId)
                  .map(zone => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newWard.name}
                  onChange={(e) => setNewWard({ ...newWard, name: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddWard()}
                  placeholder="Ward name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddWard}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="space-y-4">
              {cities.map(city => {
                const cityZones = zones.filter(z => z.city_id === city.id);
                if (cityZones.length === 0) return null;

                return (
                  <div key={city.id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">{city.name}</h4>
                    <div className="space-y-3">
                      {cityZones.map(zone => {
                        const zoneWards = wards.filter(w => w.zone_id === zone.id);
                        if (zoneWards.length === 0) return null;

                        return (
                          <div key={zone.id} className="pl-4 border-l-2 border-gray-300">
                            <h5 className="font-medium text-gray-700 mb-2">{zone.name}</h5>
                            <div className="space-y-2">
                              {zoneWards.map(ward => (
                                <div key={ward.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <span className="text-gray-600">{ward.name}</span>
                                  <button
                                    onClick={() => handleDeleteWard(ward.id, ward.name)}
                                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-2">
              <select
                value={newLocation.cityId}
                onChange={(e) => setNewLocation({ ...newLocation, cityId: e.target.value, zoneId: '', wardId: '' })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Select City</option>
                {cities.map(city => (
                  <option key={city.id} value={city.id}>{city.name}</option>
                ))}
              </select>
              <select
                value={newLocation.zoneId}
                onChange={(e) => setNewLocation({ ...newLocation, zoneId: e.target.value, wardId: '' })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={!newLocation.cityId}
              >
                <option value="">Select Zone</option>
                {zones
                  .filter(zone => !newLocation.cityId || zone.city_id === newLocation.cityId)
                  .map(zone => (
                    <option key={zone.id} value={zone.id}>{zone.name}</option>
                  ))}
              </select>
              <select
                value={newLocation.wardId}
                onChange={(e) => setNewLocation({ ...newLocation, wardId: e.target.value })}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                disabled={!newLocation.zoneId}
              >
                <option value="">Select Ward</option>
                {wards
                  .filter(ward => !newLocation.zoneId || ward.zone_id === newLocation.zoneId)
                  .map(ward => (
                    <option key={ward.id} value={ward.id}>{ward.name}</option>
                  ))}
              </select>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newLocation.name}
                  onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddLocation()}
                  placeholder="Location name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <button
                  onClick={handleAddLocation}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {locations.map(location => (
                <div key={location.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="text-gray-900 font-medium">{location.name}</span>
                    <span className="text-sm text-gray-500 ml-2">({getWardName(location.ward_id)})</span>
                  </div>
                  <button
                    onClick={() => handleDeleteLocation(location.id, location.name)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Engineers Tab */}
        {activeTab === 'engineers' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                Engineers are created through the "User Accounts" tab. This tab displays all users with the Engineer role.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {users.filter(u => u.role === 'engineer').map(engineer => (
                <div key={engineer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <div className="font-medium text-gray-900">{engineer.full_name}</div>
                    <div className="text-sm text-gray-600">{engineer.email}</div>
                    {engineer.cities && (
                      <div className="text-xs text-gray-500 mt-1">📍 {engineer.cities.name}</div>
                    )}
                  </div>
                </div>
              ))}
              {users.filter(u => u.role === 'engineer').length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  No engineers found. Create engineers from the User Accounts tab.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Executive Engineers Tab */}
        {activeTab === 'executive_engineers' && (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                Executive Engineers are created through the "User Accounts" tab. This tab displays all users with the Executive Engineer role.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {users.filter(u => u.role === 'executive_engineer').map(execEngineer => (
                <div key={execEngineer.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div>
                    <div className="font-medium text-gray-900">{execEngineer.full_name}</div>
                    <div className="text-sm text-gray-600">{execEngineer.email}</div>
                    {execEngineer.cities && (
                      <div className="text-xs text-gray-500 mt-1">📍 {execEngineer.cities.name}</div>
                    )}
                  </div>
                </div>
              ))}
              {users.filter(u => u.role === 'executive_engineer').length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  No executive engineers found. Create executive engineers from the User Accounts tab.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New User Account</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="Full name"
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'engineer' | 'executive_engineer' | 'customer' })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="engineer">Engineer</option>
                  <option value="executive_engineer">Executive Engineer</option>
                  <option value="customer">Customer</option>
                </select>
                <select
                  value={newUser.cityId}
                  onChange={(e) => setNewUser({ ...newUser, cityId: e.target.value })}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select City</option>
                  {cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
                <button
                  onClick={handleAddUser}
                  disabled={isCreatingUser}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingUser ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create User
                    </>
                  )}
                </button>
              </div>
              <p className="mt-3 text-sm text-gray-600">
                User ID and password will be automatically generated
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Users</h3>
              <div className="space-y-2">
                {users.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-gray-900 font-medium">{user.full_name}</span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize ${
                          user.role === 'admin' ? 'bg-red-100 text-red-700' :
                          user.role === 'employee' ? 'bg-blue-100 text-blue-700' :
                          user.role === 'engineer' ? 'bg-purple-100 text-purple-700' :
                          user.role === 'executive_engineer' ? 'bg-indigo-100 text-indigo-700' :
                          'bg-green-100 text-green-700'
                        }`}>
                          {user.role === 'executive_engineer' ? 'Executive Engineer' : user.role}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{user.email}</span>
                          {user.temp_password && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                Password:
                                <span className="font-mono ml-1">
                                  {visiblePasswords.has(user.id) ? user.temp_password : '••••••••'}
                                </span>
                                <button
                                  onClick={() => togglePasswordVisibility(user.id)}
                                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                                  title={visiblePasswords.has(user.id) ? 'Hide password' : 'Show password'}
                                >
                                  {visiblePasswords.has(user.id) ? (
                                    <EyeOff className="w-3 h-3" />
                                  ) : (
                                    <Eye className="w-3 h-3" />
                                  )}
                                </button>
                              </span>
                            </>
                          )}
                        </div>
                        <div className="mt-0.5">
                          {user.cities?.name || 'No city assigned'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.role !== 'admin' && user.temp_password && (
                        <button
                          onClick={() => handleResetPassword(user.id, user.full_name)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                          title="Reset password"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                      )}
                      {user.role !== 'admin' && (
                        <button
                          onClick={() => handleDeleteUser(user.id, user.role, user.full_name)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="Delete user"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        title={`Delete ${deleteConfirm.type ? deleteConfirm.type.charAt(0).toUpperCase() + deleteConfirm.type.slice(1) : ''}`}
        message={`Are you sure you want to delete "${deleteConfirm.name}"?${deleteConfirm.type === 'city' ? ' This will also delete all related zones, wards, and locations.' : deleteConfirm.type === 'zone' ? ' This will also delete all related wards and locations.' : deleteConfirm.type === 'ward' ? ' This will also delete all related locations.' : ''} This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <UserCredentialsModal
        isOpen={credentialsModal.isOpen}
        userId={credentialsModal.userId}
        password={credentialsModal.password}
        onClose={() => setCredentialsModal({ isOpen: false, userId: '', password: '' })}
      />

      <ErrorModal
        isOpen={errorModal.isOpen}
        message={errorModal.message}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
      />
    </div>
  );
}
