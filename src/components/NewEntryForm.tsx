import { useState, useEffect } from 'react';
import { Camera, Video, X, Loader2 } from 'lucide-react';
import NumericInput from './NumericInput';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { uploadToR2, validateFile, formatFileSize } from '../lib/r2-upload';

interface NewEntryFormProps {
  onSave: () => void;
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
  city_id?: string | null;
}

interface UploadedFile {
  file: File;
  url: string;
  preview: string;
}

export default function NewEntryForm({ onSave }: NewEntryFormProps) {
  const { user, authUser } = useAuth();
  
  const [formData, setFormData] = useState({
    cityId: '',
    date: new Date().toISOString().split('T')[0],
    zoneId: '',
    wardId: '',
    locationId: '',
    shmr: 0,
    chmr: 0,
    hours: 0,
    supervisorId: '',
    remarks: ''
  });

  // Master data from Supabase
  const [cities, setCities] = useState<City[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [supervisors, setSupervisors] = useState<Supervisor[]>([]);

  // Available options based on selections
  const [availableZones, setAvailableZones] = useState<Zone[]>([]);
  const [availableWards, setAvailableWards] = useState<Ward[]>([]);
  const [availableLocations, setAvailableLocations] = useState<Location[]>([]);
  const [availableSupervisors, setAvailableSupervisors] = useState<Supervisor[]>([]);

  const [photos, setPhotos] = useState<UploadedFile[]>([]);
  const [videos, setVideos] = useState<UploadedFile[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadingVideos, setUploadingVideos] = useState(false);
  const [saving, setSaving] = useState(false);

  // Fetch master data on component mount
  useEffect(() => {
    fetchMasterData();
  }, []);

  // Lock city for supervisors
  useEffect(() => {
    if (user && user.role === 'supervisor' && user.city_id) {
      setFormData(prev => ({ ...prev, cityId: user.city_id || '' }));
    }
  }, [user]);

  // Update available zones when city changes
  useEffect(() => {
    if (formData.cityId) {
      const cityZones = zones.filter(z => z.city_id === formData.cityId);
      setAvailableZones(cityZones);
    } else {
      setAvailableZones([]);
    }
  }, [formData.cityId, zones]);

  // Update available wards when zone changes
  useEffect(() => {
    if (formData.zoneId) {
      const zoneWards = wards.filter(w => w.zone_id === formData.zoneId);
      setAvailableWards(zoneWards);
    } else {
      setAvailableWards([]);
    }
  }, [formData.zoneId, wards]);

  // Update available locations when ward changes
  useEffect(() => {
    if (formData.wardId) {
      const wardLocations = locations.filter(l => l.ward_id === formData.wardId);
      setAvailableLocations(wardLocations);
    } else {
      setAvailableLocations([]);
    }
  }, [formData.wardId, locations]);

  // Update available supervisors when city changes
  useEffect(() => {
    if (formData.cityId) {
      const citySupervisors = supervisors.filter(s => s.city_id === formData.cityId);
      setAvailableSupervisors(citySupervisors);
    } else {
      setAvailableSupervisors(supervisors);
    }
  }, [formData.cityId, supervisors]);

  // Auto-calculate hours from CHMR - SHMR
  useEffect(() => {
    const calculatedHours = formData.chmr - formData.shmr;
    const roundedHours = calculatedHours > 0 ? parseFloat(calculatedHours.toFixed(1)) : 0;

    if (roundedHours !== formData.hours) {
      setFormData(prev => ({ ...prev, hours: roundedHours }));
    }
  }, [formData.shmr, formData.chmr]);

  const fetchMasterData = async () => {
    try {
      const [citiesRes, zonesRes, wardsRes, locationsRes, supervisorsRes] = await Promise.all([
        supabase.from('cities').select('*').order('name'),
        supabase.from('zones').select('*').order('name'),
        supabase.from('wards').select('*').order('name'),
        supabase.from('locations').select('*').order('name'),
        supabase.from('users')
          .select('id, full_name, city_id')
          .eq('role', 'supervisor')
          .not('temp_password', 'is', null)  // Only users with login credentials
          .order('full_name')
      ]);

      if (citiesRes.data) setCities(citiesRes.data);
      if (zonesRes.data) setZones(zonesRes.data);
      if (wardsRes.data) setWards(wardsRes.data);
      if (locationsRes.data) setLocations(locationsRes.data);
      if (supervisorsRes.data) {
        // Map to Supervisor interface format with city_id
        setSupervisors(supervisorsRes.data.map(u => ({ id: u.id, name: u.full_name, city_id: u.city_id })));
      }
    } catch (error) {
      console.error('Error fetching master data:', error);
      alert('Failed to load form data. Please refresh the page.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'cityId') {
        updated.zoneId = '';
        updated.wardId = '';
        updated.locationId = '';
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingPhotos(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const validation = validateFile(file, 10, ['image/*']);
        if (!validation.valid) {
          alert(`${file.name}: ${validation.error}`);
          return null;
        }

        const result = await uploadToR2(file, 'images');
        return {
          file,
          url: result.publicUrl,
          preview: result.publicUrl
        };
      });

      const results = await Promise.all(uploadPromises);
      const validResults = results.filter(r => r !== null) as UploadedFile[];
      setPhotos(prev => [...prev, ...validResults]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploadingPhotos(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingVideos(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const validation = validateFile(file, 100, ['video/*']);
        if (!validation.valid) {
          alert(`${file.name}: ${validation.error}`);
          return null;
        }

        const result = await uploadToR2(file, 'videos');
        return {
          file,
          url: result.publicUrl,
          preview: URL.createObjectURL(file)
        };
      });

      const results = await Promise.all(uploadPromises);
      const validResults = results.filter(r => r !== null) as UploadedFile[];
      setVideos(prev => [...prev, ...validResults]);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload videos. Please try again.');
    } finally {
      setUploadingVideos(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const removeVideo = (index: number) => {
    setVideos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cityId || !formData.date || !formData.zoneId || !formData.wardId ||
        !formData.locationId || !formData.shmr || !formData.chmr || !formData.hours || !formData.supervisorId) {
      alert('Please fill in all required fields.');
      return;
    }

    if (formData.shmr <= 0 || formData.chmr <= 0) {
      alert('SHMR and CHMR must be greater than 0.');
      return;
    }

    if (formData.chmr <= formData.shmr) {
      alert('CHMR (Closing Hour Meter Reading) must be greater than SHMR (Start Hour Meter Reading).');
      return;
    }

    setSaving(true);
    try {
      // Step 1: Insert work entry and get the returned ID
      const workEntry = {
        customer_id: null,
        customer_name: '',  // Empty since we removed customer fields
        customer_mobile: '',  // Empty since we removed customer fields
        city_id: formData.cityId,
        zone_id: formData.zoneId,
        ward_id: formData.wardId,
        location_id: formData.locationId,
        work_date: formData.date,
        supervisor_id: formData.supervisorId,
        shmr: formData.shmr,
        chmr: formData.chmr,
        hours: formData.hours,
        remark: formData.remarks || null,
        video_url: videos.length > 0 ? videos[0].url : null,
        image_url: photos.length > 0 ? photos[0].url : null,
        created_by: user?.id || null
      };

      const { data: insertedEntry, error: entryError } = await supabase
        .from('work_entries')
        .insert([workEntry])
        .select()
        .single();

      if (entryError) throw entryError;

      // Step 2: Insert all media items into work_entry_media table
      const mediaItems: Array<{
        work_entry_id: string;
        media_type: 'photo' | 'video';
        media_url: string;
        file_name: string;
        file_size: number;
        display_order: number;
      }> = [];

      // Add all photos
      photos.forEach((photo, index) => {
        mediaItems.push({
          work_entry_id: insertedEntry.id,
          media_type: 'photo',
          media_url: photo.url,
          file_name: photo.file.name,
          file_size: photo.file.size,
          display_order: index
        });
      });

      // Add all videos (start order after photos)
      videos.forEach((video, index) => {
        mediaItems.push({
          work_entry_id: insertedEntry.id,
          media_type: 'video',
          media_url: video.url,
          file_name: video.file.name,
          file_size: video.file.size,
          display_order: photos.length + index
        });
      });

      // Bulk insert media if any exist
      if (mediaItems.length > 0) {
        const { error: mediaError } = await supabase
          .from('work_entry_media')
          .insert(mediaItems);

        if (mediaError) {
          console.error('Error saving media:', mediaError);
          alert('Work entry saved, but some media failed to upload. Please try re-adding media.');
        }
      }

      alert('Work entry saved successfully!');
      handleClear();
      onSave();
    } catch (error: any) {
      console.error('Error saving work entry:', error);
      console.error('Error details:', error?.message, error?.details, error?.hint);
      const errorMessage = error?.message || 'Unknown error occurred';
      alert(`Failed to save work entry: ${errorMessage}`);
    } finally {
      setSaving(false);
    }
  };

  const handleClear = () => {
    // Preserve city lock for supervisors
    const lockedCityId = user?.role === 'supervisor'
      ? user?.city_id || ''
      : '';

    setFormData({
      cityId: lockedCityId,
      date: new Date().toISOString().split('T')[0],
      zoneId: '',
      wardId: '',
      locationId: '',
      shmr: 0,
      chmr: 0,
      hours: 0,
      supervisorId: '',
      remarks: ''
    });
    setPhotos([]);
    setVideos([]);
  };

  // Helper to check if any upload is in progress
  const isUploading = uploadingPhotos || uploadingVideos;
  const isFormDisabled = saving || isUploading;

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative">
        {isUploading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg z-10 flex items-center justify-center">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-orange-600 animate-spin mx-auto mb-2" />
              <p className="text-sm font-medium text-gray-700">
                {uploadingPhotos ? 'Uploading photos...' : 'Uploading videos...'}
              </p>
            </div>
          </div>
        )}
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">New Work Entry</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City <span className="text-red-500">*</span>
              {user && user.role === 'supervisor' && (
                <span className="ml-2 text-xs text-blue-600">(Locked to your assigned city)</span>
              )}
            </label>
            <select
              name="cityId"
              value={formData.cityId}
              onChange={handleChange}
              disabled={user?.role === 'supervisor'}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            >
              <option value="">Select City</option>
              {cities.map(city => (
                <option key={city.id} value={city.id}>{city.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Zone <span className="text-red-500">*</span>
            </label>
            <select
              name="zoneId"
              value={formData.zoneId}
              onChange={handleChange}
              disabled={!formData.cityId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              required
            >
              <option value="">Select Zone</option>
              {availableZones.map(zone => (
                <option key={zone.id} value={zone.id}>{zone.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ward <span className="text-red-500">*</span>
            </label>
            <select
              name="wardId"
              value={formData.wardId}
              onChange={handleChange}
              disabled={!formData.zoneId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              required
            >
              <option value="">Select Ward</option>
              {availableWards.map(ward => (
                <option key={ward.id} value={ward.id}>{ward.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location <span className="text-red-500">*</span>
            </label>
            <select
              name="locationId"
              value={formData.locationId}
              onChange={handleChange}
              disabled={!formData.wardId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              required
            >
              <option value="">Select Location</option>
              {availableLocations.map(location => (
                <option key={location.id} value={location.id}>{location.name}</option>
              ))}
            </select>
          </div>

          <div>
            <NumericInput
              value={formData.shmr}
              onChange={(value) => setFormData(prev => ({ ...prev, shmr: value }))}
              label="SHMR (Start Hour Meter Reading)"
              min={0.1}
              max={10000}
              step={0.1}
              required
            />
          </div>

          <div>
            <NumericInput
              value={formData.chmr}
              onChange={(value) => setFormData(prev => ({ ...prev, chmr: value }))}
              label="CHMR (Closing Hour Meter Reading)"
              min={0.1}
              max={10000}
              step={0.1}
              required
            />
          </div>

          <div>
            <NumericInput
              value={formData.hours}
              onChange={(value) => {}}
              label="No. of Hours (Auto-calculated)"
              min={0.1}
              max={10000}
              step={0.1}
              disabled={true}
              hideButtons={true}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Supervisor <span className="text-red-500">*</span>
            </label>
            <select
              name="supervisorId"
              value={formData.supervisorId}
              onChange={handleChange}
              disabled={!formData.cityId}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500"
              required
            >
              <option value="">Select Supervisor</option>
              {availableSupervisors.map(supervisor => (
                <option key={supervisor.id} value={supervisor.id}>{supervisor.name}</option>
              ))}
            </select>
            {!formData.cityId && (
              <p className="mt-1 text-xs text-gray-500">Please select a city first</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
            <textarea
              name="remarks"
              value={formData.remarks}
              onChange={handleChange}
              placeholder="Jetting done, no blockage observed."
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Photos & Videos</h3>

        <div className="space-y-6">
          <div>
            <label className={`inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg transition-colors ${uploadingPhotos || uploadingVideos ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-700 cursor-pointer'}`}>
              {uploadingPhotos ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Camera className="w-5 h-5 mr-2" />
              )}
              {uploadingPhotos ? 'Uploading...' : 'Add Photos'}
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhotos || uploadingVideos}
              />
            </label>

            {photos.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {photos.map((photo, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={photo.preview}
                      alt={photo.file.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removePhoto(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <p className="mt-1 text-xs text-gray-500 truncate">{photo.file.name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className={`inline-flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg transition-colors ${uploadingPhotos || uploadingVideos ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-700 cursor-pointer'}`}>
              {uploadingVideos ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Video className="w-5 h-5 mr-2" />
              )}
              {uploadingVideos ? 'Uploading...' : 'Add Videos'}
              <input
                type="file"
                accept="video/*"
                multiple
                onChange={handleVideoUpload}
                className="hidden"
                disabled={uploadingPhotos || uploadingVideos}
              />
            </label>

            {videos.length > 0 && (
              <div className="mt-4 space-y-3">
                {videos.map((video, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="relative flex-shrink-0">
                      <div className="w-20 h-20 bg-gray-900 rounded-lg flex items-center justify-center">
                        <Video className="w-8 h-8 text-white" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{video.file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(video.file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVideo(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <p className="mt-3 text-sm text-gray-500">
              Maximum file size: 100MB per video
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={saving || uploadingPhotos || uploadingVideos}
          className="flex-1 px-6 py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? 'Saving...' : 'Save Entry'}
        </button>
        <button
          type="button"
          onClick={handleClear}
          disabled={saving || uploadingPhotos || uploadingVideos}
          className="px-6 py-3 bg-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear Form
        </button>
      </div>
    </form>
  );
}
