import { X, Download, Save } from 'lucide-react';
import { useState } from 'react';
import MediaGallery from './MediaGallery';
import { supabase } from '../lib/supabase';

interface EntryDetailModalProps {
  entry: any;
  onClose: () => void;
  isAdmin?: boolean;
  onUpdate?: (updated: any) => void;
}

export default function EntryDetailModal({ entry, onClose, isAdmin, onUpdate }: EntryDetailModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [shmr, setShmr] = useState<string>(String(entry.shmr));
  const [chmr, setChmr] = useState<string>(String(entry.chmr));
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB');
  };

  const parsedShmr = parseFloat(shmr) || 0;
  const parsedChmr = parseFloat(chmr) || 0;
  const totalHours = parsedChmr > parsedShmr ? (parsedChmr - parsedShmr).toFixed(1) : '—';

  const hasChanges = isAdmin && (
    parseFloat(shmr) !== entry.shmr || parseFloat(chmr) !== entry.chmr
  );

  const handleSave = async () => {
    const s = parseFloat(shmr);
    const c = parseFloat(chmr);
    if (isNaN(s) || s <= 0) { setSaveError('SHMR must be a positive number'); return; }
    if (isNaN(c) || c <= 0) { setSaveError('CHMR must be a positive number'); return; }
    if (c <= s) { setSaveError('CHMR must be greater than SHMR'); return; }
    setIsSaving(true);
    setSaveError(null);
    const { error } = await supabase
      .from('work_entries')
      .update({ shmr: s, chmr: c })
      .eq('id', entry.id);
    setIsSaving(false);
    if (error) { setSaveError('Failed to save. Please try again.'); return; }
    onUpdate?.({ ...entry, shmr: s, chmr: c });
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Work Entry Details</h2>
              {entry.entry_code && (
                <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-mono font-semibold rounded">
                  {entry.entry_code}
                </span>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Customer Name</label>
                  <p className="text-gray-900">{entry.customer_name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Customer Mobile</label>
                  <p className="text-gray-900">{entry.customer_mobile}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
                  <p className="text-gray-900">{formatDate(entry.work_date)}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">City</label>
                  <p className="text-gray-900">{entry.city.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Zone</label>
                  <p className="text-gray-900">{entry.zone.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Ward</label>
                  <p className="text-gray-900">{entry.ward.name}</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
                  <p className="text-gray-900">{entry.location.name}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">SHMR (Start)</label>
                  {isAdmin ? (
                    <input
                      type="number"
                      value={shmr}
                      onChange={(e) => { setShmr(e.target.value); setSaveError(null); }}
                      step="0.1"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                    />
                  ) : (
                    <p className="text-gray-900">{entry.shmr}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">CHMR (Close)</label>
                  {isAdmin ? (
                    <input
                      type="number"
                      value={chmr}
                      onChange={(e) => { setChmr(e.target.value); setSaveError(null); }}
                      step="0.1"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900"
                    />
                  ) : (
                    <p className="text-gray-900">{entry.chmr}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Total Hours</label>
                  <p className="text-gray-900 font-semibold">{totalHours}h</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Supervisor</label>
                  <p className="text-gray-900">{entry.supervisor.full_name}</p>
                </div>

                {entry.remark && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Remarks</label>
                    <p className="text-gray-900">{entry.remark}</p>
                  </div>
                )}
              </div>

              {isAdmin && (
                <div className="flex items-center gap-3">
                  {saveError && (
                    <p className="text-sm text-red-600 flex-1">{saveError}</p>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={!hasChanges || isSaving}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                  >
                    <Save className="w-4 h-4" />
                    {isSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              )}

              {entry.media && entry.media.some((m: any) => m.media_type === 'photo') && (
                <div>
                  <MediaGallery
                    media={entry.media}
                    type="photo"
                    title="Photos"
                  />
                </div>
              )}

              {entry.media && entry.media.some((m: any) => m.media_type === 'video') && (
                <div>
                  <MediaGallery
                    media={entry.media}
                    type="video"
                    title="Videos"
                  />
                </div>
              )}

              {(!entry.media || entry.media.length === 0) && (
                <>
                  {entry.image_url && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">Photo</h3>
                      <img
                        src={entry.image_url}
                        alt="Work site"
                        onClick={() => setSelectedPhoto(entry.image_url)}
                        className="w-full max-w-md h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      />
                    </div>
                  )}

                  {entry.video_url && (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">Video</h3>
                        <a
                          href={entry.video_url}
                          download
                          className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </a>
                      </div>
                      <video
                        controls
                        className="w-full max-w-2xl rounded-lg border border-gray-200"
                        preload="metadata"
                      >
                        <source src={entry.video_url} type="video/mp4" />
                        Your browser does not support the video player.
                      </video>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedPhoto && (
        <>
          <div className="fixed inset-0 bg-black bg-opacity-90 z-[60]" onClick={() => setSelectedPhoto(null)} />
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedPhoto}
              alt="Enlarged view"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        </>
      )}
    </>
  );
}
