import { useState, useEffect } from 'react';
import { X, Trash2, FileSpreadsheet, FileText, Download, ChevronDown } from 'lucide-react';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  entry_number: number;
  entry_code: string;
  media?: {
    id: string;
    media_type: 'photo' | 'video';
    media_url: string;
    file_name: string | null;
    file_size: number | null;
    display_order: number;
    created_at: string;
    updated_at: string;
  }[];
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
  const { user } = useAuth();
  const [entries, setEntries] = useState<WorkEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<WorkEntry | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; entryId: string | null }>({
    isOpen: false,
    entryId: null,
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDownloadMenuId, setOpenDownloadMenuId] = useState<string | null>(null);

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
        .order('entry_number', { ascending: false });

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

  const getMediaString = (entry: WorkEntry) => {
    const photoCount = entry.media
      ? entry.media.filter((media) => media.media_type === 'photo').length
      : (entry.image_url ? 1 : 0);
    const videoCount = entry.media
      ? entry.media.filter((media) => media.media_type === 'video').length
      : (entry.video_url ? 1 : 0);
    if (photoCount === 0 && videoCount === 0) return 'None';
    const parts: string[] = [];
    if (photoCount > 0) parts.push(`${photoCount} photo${photoCount > 1 ? 's' : ''}`);
    if (videoCount > 0) parts.push(`${videoCount} video${videoCount > 1 ? 's' : ''}`);
    return parts.join(' + ');
  };

  const getLogoBuffer = async () => {
    const logoRes = await fetch('/logo.jpeg');
    return logoRes.arrayBuffer();
  };

  const getLogoBase64 = async () => {
    const logoBuffer = await getLogoBuffer();
    const logoUint8 = new Uint8Array(logoBuffer);
    let binary = '';
    for (let i = 0; i < logoUint8.length; i++) binary += String.fromCharCode(logoUint8[i]);
    return btoa(binary);
  };

  const handleDownloadExcel = async () => {
    if (!filteredEntries.length) {
      alert('No data to export.');
      return;
    }

    const today = new Date().toLocaleDateString('en-GB');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Work History');
    const logoBuffer = await getLogoBuffer();
    const imageId = wb.addImage({ buffer: logoBuffer, extension: 'jpeg' });

    ws.columns = [
      { width: 12 },
      { width: 12 },
      { width: 18 },
      { width: 14 },
      { width: 12 },
      { width: 12 },
      { width: 30 },
      { width: 12 },
      { width: 12 },
      { width: 10 },
      { width: 22 },
      { width: 24 },
    ];

    ws.mergeCells('A1:L1');
    ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 120, height: 40 } });
    ws.getCell('B1').value = 'VARMAN HEAVY EQUIPMENTS PRIVATE LIMITED';
    ws.getCell('B1').font = { bold: true, size: 14 };

    ws.mergeCells('A2:L2');
    ws.getCell('A2').value = `Work History Report  ·  Generated: ${today}`;
    ws.getCell('A2').font = { color: { argb: 'FFAAAAAA' }, size: 10 };

    ws.addRow([]);

    const headerRow = ws.addRow(['S.No', 'Ref No', 'City', 'Date', 'Zone', 'Ward', 'Location', 'SHMR', 'CHMR', 'Hours', 'Supervisor', 'Media']);
    headerRow.eachCell(cell => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEA580C' } };
      cell.alignment = { horizontal: 'left', vertical: 'middle' };
    });

    filteredEntries.forEach((entry, index) => {
      ws.addRow([
        index + 1,
        entry.entry_code || '',
        entry.city?.name || '',
        formatDate(entry.work_date),
        entry.zone?.name || '',
        entry.ward?.name || '',
        entry.location?.name || '',
        entry.shmr?.toString() || '0',
        entry.chmr?.toString() || '0',
        (entry.chmr - entry.shmr).toFixed(1),
        entry.supervisor?.full_name || '',
        getMediaString(entry),
      ]);
    });

    ws.addRow([]);

    [
      'CIN: U29113KA2021PTC148527  ·  Reg: 17 Jun 2021',
      'No. 4, 6th Cross, Dhanalakshmi Layout, Vidyanarayanpura, Yelahanka, Bengaluru – 560097, Karnataka',
      'Email: deva@dmvarman.com',
    ].forEach((text) => {
      const rowNumber = ws.rowCount + 1;
      ws.mergeCells(`A${rowNumber}:L${rowNumber}`);
      const cell = ws.getCell(`A${rowNumber}`);
      cell.value = text;
      cell.font = { size: 8, color: { argb: 'FF888888' } };
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `work-history-${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    if (!filteredEntries.length) {
      alert('No data to export.');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    const today = new Date().toLocaleDateString('en-GB');
    const logoBase64 = await getLogoBase64();

    doc.addImage(logoBase64, 'JPEG', 14, 8, 30, 12);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('VARMAN HEAVY EQUIPMENTS PRIVATE LIMITED', 50, 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.text(`Work History Report  ·  Generated: ${today}`, 50, 20);

    const tableRows = filteredEntries.map((entry, index) => [
      index + 1,
      entry.entry_code || '',
      entry.city?.name || '',
      formatDate(entry.work_date),
      entry.zone?.name || '',
      entry.ward?.name || '',
      entry.location?.name || '',
      entry.shmr?.toString() || '0',
      entry.chmr?.toString() || '0',
      (entry.chmr - entry.shmr).toFixed(1),
      entry.supervisor?.full_name || '',
      getMediaString(entry),
    ]);

    autoTable(doc, {
      head: [['S.No', 'Ref No', 'City', 'Date', 'Zone', 'Ward', 'Location', 'SHMR', 'CHMR', 'Hours', 'Supervisor', 'Media']],
      body: tableRows,
      startY: 28,
      styles: { fontSize: 8, cellPadding: 2.5, valign: 'middle' },
      headStyles: {
        fillColor: [234, 88, 12],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'left',
      },
      alternateRowStyles: { fillColor: [249, 250, 251] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 18 },
        2: { cellWidth: 20 },
        3: { cellWidth: 20 },
        4: { cellWidth: 14 },
        5: { cellWidth: 14 },
        6: { cellWidth: 35 },
        7: { cellWidth: 13, halign: 'center' },
        8: { cellWidth: 13, halign: 'center' },
        9: { cellWidth: 13, halign: 'center' },
        10: { cellWidth: 24 },
        11: { cellWidth: 24 },
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data) => {
        const pageHeight = doc.internal.pageSize.getHeight();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setDrawColor(200, 200, 200);
        doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);
        doc.setFontSize(7);
        doc.setTextColor(130, 130, 130);
        doc.setFont('helvetica', 'normal');
        doc.text('CIN: U29113KA2021PTC148527  ·  No. 4, 6th Cross, Dhanalakshmi Layout, Vidyanarayanpura, Yelahanka, Bengaluru – 560097', 14, pageHeight - 13);
        doc.text('Email: deva@dmvarman.com', 14, pageHeight - 8);
        doc.text(`Page ${data.pageNumber}`, pageWidth - 20, pageHeight - 8);
      },
    });

    doc.save(`work-history-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  const handleDownloadSingleExcel = async (entry: WorkEntry) => {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Work Entry');
    const logoBuffer = await getLogoBuffer();
    const imageId = wb.addImage({ buffer: logoBuffer, extension: 'jpeg' });

    ws.columns = [{ width: 18 }, { width: 52 }];
    ws.getRow(1).height = 45;
    ws.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 120, height: 40 } });
    ws.getCell('B1').value = 'VARMAN HEAVY EQUIPMENTS PRIVATE LIMITED';
    ws.getCell('B1').font = { bold: true, size: 14 };

    ws.addRow([]);

    ws.getCell('A3').value = 'Work Entry Report';
    ws.getCell('B3').value = `Ref: ${entry.entry_code}`;
    ws.getCell('B3').font = { color: { argb: 'FF888888' } };
    ws.getCell('B3').alignment = { horizontal: 'right' };

    ws.addRow([]);

    const dataRows: [string, string][] = [
      ['City', entry.city?.name || ''],
      ['Date', formatDate(entry.work_date)],
      ['Zone', entry.zone?.name || ''],
      ['Ward', entry.ward?.name || ''],
      ['Location', entry.location?.name || ''],
      ['SHMR (Start Hour Meter Reading)', entry.shmr?.toString() || '0'],
      ['CHMR (Closing Hour Meter Reading)', entry.chmr?.toString() || '0'],
      ['Hours', (entry.chmr - entry.shmr).toFixed(1)],
      ['Supervisor', entry.supervisor?.full_name || ''],
      ['Media', getMediaString(entry)],
    ];

    dataRows.forEach(([key, value]) => {
      const row = ws.addRow([key, value]);
      row.getCell(1).font = { bold: true };
      row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };
    });

    ws.addRow([]);

    const dividerRow = ws.addRow(['', '']);
    dividerRow.height = 4;
    dividerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEEEEE' } };
    });

    [
      'CIN: U29113KA2021PTC148527  ·  Reg: 17 Jun 2021',
      'No. 4, 6th Cross, Dhanalakshmi Layout, Vidyanarayanpura, Yelahanka, Bengaluru – 560097, Karnataka',
      'Email: deva@dmvarman.com',
    ].forEach((text) => {
      const rowNumber = ws.rowCount + 1;
      ws.mergeCells(`A${rowNumber}:B${rowNumber}`);
      const cell = ws.getCell(`A${rowNumber}`);
      cell.value = text;
      cell.font = { size: 8, color: { argb: 'FF888888' } };
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `work-entry-${entry.entry_code}-${entry.work_date}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadSinglePDF = async (entry: WorkEntry) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const logoBase64 = await getLogoBase64();

    doc.addImage(logoBase64, 'JPEG', 14, 8, 28, 11);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 30, 30);
    doc.text('VARMAN HEAVY EQUIPMENTS PRIVATE LIMITED', 48, 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text('Work Entry Report', 48, 20);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    const refCode = entry.entry_code || '';
    doc.text(`Ref: ${refCode}`, 196, 20, { align: 'right' });
    doc.setDrawColor(220, 220, 220);
    doc.line(14, 24, 196, 24);

    autoTable(doc, {
      body: [
        ['City', entry.city?.name || ''],
        ['Date', formatDate(entry.work_date)],
        ['Zone', entry.zone?.name || ''],
        ['Ward', entry.ward?.name || ''],
        ['Location', entry.location?.name || ''],
        ['SHMR (Start Hour Meter Reading)', entry.shmr?.toString() || '0'],
        ['CHMR (Closing Hour Meter Reading)', entry.chmr?.toString() || '0'],
        ['Hours', (entry.chmr - entry.shmr).toFixed(1)],
        ['Supervisor', entry.supervisor?.full_name || ''],
        ['Media', getMediaString(entry)],
      ],
      startY: 28,
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: {
        0: { cellWidth: 38, fontStyle: 'bold', fillColor: [249, 250, 251], textColor: [80, 80, 80] },
        1: { cellWidth: 145, textColor: [30, 30, 30] },
      },
      margin: { left: 14, right: 14 },
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    const footerY = pageHeight - 28;
    doc.setDrawColor(200, 200, 200);
    doc.line(14, footerY, 196, footerY);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');
    doc.text('VARMAN HEAVY EQUIPMENTS PRIVATE LIMITED', 14, footerY + 6);
    doc.text('CIN: U29113KA2021PTC148527  ·  Reg: 17 Jun 2021', 14, footerY + 11);
    doc.text('No. 4, 6th Cross, Dhanalakshmi Layout, Vidyanarayanpura, Yelahanka, Bengaluru – 560097, Karnataka', 14, footerY + 16);
    doc.text('Email: deva@dmvarman.com', 14, footerY + 21);

    doc.save(`work-entry-${entry.entry_code || entry.work_date}.pdf`);
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
        {user?.role === 'admin' && filteredEntries.length > 0 && (
          <div className="flex items-center justify-end gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50">
            <button
              onClick={handleDownloadExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Download Excel
            </button>
            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Download PDF
            </button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entry #</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ward</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hours</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supervisor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Media</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-gray-500">
                    No entries found. {user?.role === 'employee' ? 'Create your first work entry!' : 'Adjust your filters or check back later.'}
                  </td>
                </tr>
              ) : (
                filteredEntries.map(entry => {
                  const hours = (entry.chmr - entry.shmr).toFixed(1);

                  const photoCount = entry.media
                    ? entry.media.filter((media) => media.media_type === 'photo').length
                    : (entry.image_url ? 1 : 0);

                  const videoCount = entry.media
                    ? entry.media.filter((media) => media.media_type === 'video').length
                    : (entry.video_url ? 1 : 0);

                  const hasMedia = photoCount > 0 || videoCount > 0;

                  return (
                    <tr
                      key={entry.id}
                      onClick={() => setSelectedEntry(entry)}
                      className="hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-orange-600 font-medium">{entry.entry_code || '—'}</td>
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenDownloadMenuId(openDownloadMenuId === entry.id ? null : entry.id);
                              }}
                              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <Download className="w-4 h-4" />
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            {openDownloadMenuId === entry.id && (
                              <div className="absolute right-0 top-7 z-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[150px]">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadSingleExcel(entry);
                                    setOpenDownloadMenuId(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                  Excel (.xlsx)
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDownloadSinglePDF(entry);
                                    setOpenDownloadMenuId(null);
                                  }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                >
                                  <FileText className="w-4 h-4 text-red-600" />
                                  PDF (.pdf)
                                </button>
                              </div>
                            )}
                          </div>
                          {user?.role === 'admin' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteClick(entry.id);
                              }}
                              className="text-red-600 hover:text-red-800 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
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
          isAdmin={user?.role === 'admin'}
          onUpdate={(updated) => {
            setEntries(prev => prev.map(e => e.id === updated.id ? { ...e, shmr: updated.shmr, chmr: updated.chmr } : e));
            setSelectedEntry(updated);
          }}
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

      {openDownloadMenuId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setOpenDownloadMenuId(null)}
        />
      )}
    </div>
  );
}
