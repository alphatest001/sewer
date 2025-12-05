import { WorkEntry, MasterData } from './types';

export const masterData: MasterData = {
  cities: [
    'Madurai City Corporation',
    'Pune Municipal Corporation',
    'Chennai Corporation',
    'Coimbatore Corporation'
  ],
  zones: [
    { city: 'Madurai City Corporation', zones: ['1', '2', '3', '4', '5', '6', '7', '8'] },
    { city: 'Pune Municipal Corporation', zones: ['1', '2', '3', '4', '5'] },
    { city: 'Chennai Corporation', zones: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'] },
    { city: 'Coimbatore Corporation', zones: ['1', '2', '3', '4', '5', '6'] }
  ],
  wards: [
    { city: 'Madurai City Corporation', zone: '5', wards: ['81', '82', '83', '84', '85'] },
    { city: 'Pune Municipal Corporation', zone: '3', wards: ['41', '42', '43', '44', '45'] },
    { city: 'Chennai Corporation', zone: '7', wards: ['101', '102', '103', '104', '105'] },
  ],
  locations: [
    '1ST CROSS STREET',
    'MG ROAD',
    'ANNA NAGAR WEST',
    'POWER HOSE',
    'MAIN ROAD',
    'PARK STREET',
    'LAKE VIEW ROAD'
  ],
  engineers: ['BHARATHI', 'ABIMANINU', 'KUMAR', 'SHANKAR', 'VIJAY'],
  executiveEngineers: ['INDHRA', 'RAJESH', 'VENKAT', 'PRIYA', 'SURESH']
};

export const dummyEntries: WorkEntry[] = [
  {
    id: '1',
    city: 'Madurai City Corporation',
    date: '2025-11-07',
    zone: '5',
    ward: '81',
    location: '1ST CROSS STREET',
    landMark: 'AG SUBBURAM',
    landMarkLat: 9.9252,
    landMarkLng: 78.1198,
    shmr: 353.4,
    chmr: 361.8,
    noOfHrs: 8.4,
    assistantEngineer: 'BHARATHI',
    assistantExecutiveEngineer: 'INDHRA',
    remarks: 'Jetting done, no blockage observed.',
    photos: [
      { id: 'p1', name: 'work-site-1.jpg', url: 'https://images.pexels.com/photos/1128408/pexels-photo-1128408.jpeg?auto=compress&cs=tinysrgb&w=400', caption: 'Work site overview' },
      { id: 'p2', name: 'equipment-1.jpg', url: 'https://images.pexels.com/photos/1173777/pexels-photo-1173777.jpeg?auto=compress&cs=tinysrgb&w=400', caption: 'Equipment in operation' }
    ],
    videos: [
      { id: 'v1', name: 'jetting-operation.mp4', url: '#', size: '24.5 MB', duration: '2:34' }
    ]
  },
  {
    id: '2',
    city: 'Pune Municipal Corporation',
    date: '2025-11-08',
    zone: '3',
    ward: '45',
    location: 'MG ROAD',
    landMark: 'NEAR CITY MALL',
    landMarkLat: 18.5204,
    landMarkLng: 73.8567,
    shmr: 361.8,
    chmr: 370.2,
    noOfHrs: 8.4,
    assistantEngineer: 'ABIMANINU',
    assistantExecutiveEngineer: 'RAJESH',
    remarks: 'Excavation completed, area cleared.',
    photos: [
      { id: 'p3', name: 'excavation-1.jpg', url: 'https://images.pexels.com/photos/1108101/pexels-photo-1108101.jpeg?auto=compress&cs=tinysrgb&w=400', caption: 'Excavation site' },
      { id: 'p4', name: 'excavation-2.jpg', url: 'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg?auto=compress&cs=tinysrgb&w=400', caption: 'Depth measurement' },
      { id: 'p5', name: 'excavation-3.jpg', url: 'https://images.pexels.com/photos/162539/architecture-building-construction-work-162539.jpeg?auto=compress&cs=tinysrgb&w=400', caption: 'Final clearance' }
    ],
    videos: [
      { id: 'v2', name: 'excavation-process.mp4', url: '#', size: '18.2 MB', duration: '1:45' }
    ]
  },
  {
    id: '3',
    city: 'Chennai Corporation',
    date: '2025-11-09',
    zone: '7',
    ward: '102',
    location: 'ANNA NAGAR WEST',
    landMark: 'THIRD AVENUE',
    landMarkLat: 13.0827,
    landMarkLng: 80.2707,
    shmr: 370.2,
    chmr: 377.8,
    noOfHrs: 7.6,
    assistantEngineer: 'BHARATHI',
    assistantExecutiveEngineer: 'INDHRA',
    remarks: 'Sewer line cleaning completed successfully.',
    photos: [
      { id: 'p6', name: 'sewer-before.jpg', url: 'https://images.pexels.com/photos/459653/pexels-photo-459653.jpeg?auto=compress&cs=tinysrgb&w=400', caption: 'Before cleaning' }
    ],
    videos: [
      { id: 'v3', name: 'sewer-cleaning.mp4', url: '#', size: '31.8 MB', duration: '3:12' },
      { id: 'v4', name: 'final-inspection.mp4', url: '#', size: '15.4 MB', duration: '1:28' }
    ]
  },
  {
    id: '4',
    city: 'Madurai City Corporation',
    date: '2025-11-10',
    zone: '5',
    ward: '83',
    location: 'POWER HOSE',
    landMark: 'SOLAIALAGUPURAM',
    landMarkLat: 9.9195,
    landMarkLng: 78.1380,
    shmr: 344.7,
    chmr: 353.4,
    noOfHrs: 8.7,
    assistantEngineer: 'ABIMANINU',
    assistantExecutiveEngineer: 'RAJESH',
    remarks: 'High pressure jetting, drain flow restored.',
    photos: [
      { id: 'p7', name: 'drain-work.jpg', url: 'https://images.pexels.com/photos/585419/pexels-photo-585419.jpeg?auto=compress&cs=tinysrgb&w=400', caption: 'Drain maintenance' },
      { id: 'p8', name: 'equipment-setup.jpg', url: 'https://images.pexels.com/photos/1117452/pexels-photo-1117452.jpeg?auto=compress&cs=tinysrgb&w=400', caption: 'Equipment setup' }
    ],
    videos: []
  }
];
