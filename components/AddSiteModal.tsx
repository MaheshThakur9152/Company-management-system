
import React, { useState, useEffect, useRef } from 'react';
import { X, Save, MapPin, Navigation, Building, Mail, Phone, FileText, Lock, User, Search } from 'lucide-react';
import { Site } from '../types';
import { loadScript } from '../utils/scriptLoader';

interface AddSiteModalProps {
  isOpen: boolean;
  site: Site | null;
  onClose: () => void;
  onSave: (site: Site) => void;
}

const AddSiteModal: React.FC<AddSiteModalProps> = ({ isOpen, site, onClose, onSave }) => {
  const [formData, setFormData] = useState<Partial<Site>>({
    geofenceRadius: 200,
    activeWorkers: 0
  });
  
  const mapRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const googleMapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    const initMap = async () => {
        if (!(window as any).google) {
            await loadScript(`https://maps.googleapis.com/maps/api/js?key=AIzaSyD72J2BF3vQOAzxB7k610zhLUI18kDj-AE&libraries=places`);
        }
        setMapLoaded(true);
    };
    if (isOpen) {
        initMap();
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && mapLoaded && mapRef.current && !googleMapRef.current) {
        const google = (window as any).google;
        const defaultLocation = { 
            lat: site?.latitude || 19.0760, 
            lng: site?.longitude || 72.8777 
        };

        const map = new google.maps.Map(mapRef.current, {
            center: defaultLocation,
            zoom: 17,
            mapTypeControl: false,
            streetViewControl: false,
        });
        googleMapRef.current = map;

        const marker = new google.maps.Marker({
            position: defaultLocation,
            map: map,
            draggable: true,
            animation: google.maps.Animation.DROP
        });
        markerRef.current = marker;

        // Marker Drag Event
        marker.addListener('dragend', (event: any) => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            handleChange('latitude', lat);
            handleChange('longitude', lng);
        });

        // Map Click Event
        map.addListener('click', (event: any) => {
            const lat = event.latLng.lat();
            const lng = event.latLng.lng();
            marker.setPosition(event.latLng);
            handleChange('latitude', lat);
            handleChange('longitude', lng);
        });

        // Autocomplete
        if (searchInputRef.current) {
            const autocomplete = new google.maps.places.Autocomplete(searchInputRef.current, {
                fields: ['geometry', 'name', 'formatted_address'],
            });
            autocomplete.bindTo('bounds', map);

            autocomplete.addListener('place_changed', () => {
                const place = autocomplete.getPlace();
                
                if (!place.geometry || !place.geometry.location) {
                    return;
                }

                // Always center and zoom in close
                map.setCenter(place.geometry.location);
                map.setZoom(18);
                marker.setPosition(place.geometry.location);

                handleChange('latitude', place.geometry.location.lat());
                handleChange('longitude', place.geometry.location.lng());
                handleChange('location', place.formatted_address || place.name);
            });
        }
    } else if (isOpen && googleMapRef.current && site) {
        // Update map if site changes while open (unlikely but good practice) or re-opening
        const location = { lat: site.latitude, lng: site.longitude };
        googleMapRef.current.setCenter(location);
        googleMapRef.current.setZoom(17);
        markerRef.current.setPosition(location);
    }
  }, [isOpen, mapLoaded, site]);

  // Reset map ref when closed to allow re-initialization
  useEffect(() => {
      if (!isOpen) {
          googleMapRef.current = null;
          markerRef.current = null;
      }
  }, [isOpen]);

  useEffect(() => {
    if (site) {
      setFormData(site);
    } else {
      setFormData({
        id: Date.now().toString(),
        name: '',
        location: '',
        activeWorkers: 0,
        latitude: 19.0760, // Default Mumbai
        longitude: 72.8777,
        geofenceRadius: 200,
        clientName: '',
        clientGstin: '',
        clientEmail: '',
        clientContact: '',
        username: '', // Will be auto-generated if empty
        password: 'ambe123'
      });
    }
  }, [site, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Site, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLinkPaste = (e: React.ChangeEvent<HTMLInputElement>) => {
      const link = e.target.value;
      // Regex to find lat,lng
      // Support:
      // maps.google.com/?q=lat,lng
      // google.com/maps?q=lat,lng
      // google.com/maps/place/lat,lng (sometimes)
      // @lat,lng
      
      let lat = 0;
      let lng = 0;
      
      // Try q=lat,lng
      const qMatch = link.match(/q=(-?\d+\.\d+),(-?\d+\.\d+)/);
      if (qMatch) {
          lat = parseFloat(qMatch[1]);
          lng = parseFloat(qMatch[2]);
      } else {
          // Try @lat,lng
          const atMatch = link.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
          if (atMatch) {
              lat = parseFloat(atMatch[1]);
              lng = parseFloat(atMatch[2]);
          }
      }

      if (lat && lng) {
          handleChange('latitude', lat);
          handleChange('longitude', lng);
          // Update map center
          if (googleMapRef.current && markerRef.current) {
              const pos = { lat, lng };
              googleMapRef.current.setCenter(pos);
              markerRef.current.setPosition(pos);
              googleMapRef.current.setZoom(17);
          }
      }
  };

  const handleSave = () => {
    if (!formData.name || !formData.clientName) {
        alert("Client Name and Project Name are required.");
        return;
    }
    if (!formData.latitude || !formData.longitude) {
        alert("Please select a location on the map.");
        return;
    }
    onSave(formData as Site);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-primary px-6 py-4 flex justify-between items-center flex-shrink-0">
          <h2 className="text-white font-bold text-lg flex items-center gap-2">
            <Building size={20} /> {site ? 'Edit Site Details' : 'Add New Site'}
          </h2>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          
          {/* Supervisor Credentials Section */}
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 space-y-3">
             <h3 className="text-xs font-bold text-purple-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Lock size={14} /> Supervisor Credentials
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Username</label>
                    <div className="relative">
                        <User size={14} className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            value={formData.username || ''}
                            onChange={(e) => handleChange('username', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
                            placeholder="Auto-generated"
                        />
                    </div>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Password</label>
                    <div className="relative">
                        <Lock size={14} className="absolute left-3 top-3 text-gray-400" />
                        <input 
                            value={formData.password || ''}
                            onChange={(e) => handleChange('password', e.target.value)}
                            className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 focus:ring-2 focus:ring-primary outline-none font-mono text-sm"
                            placeholder="ambe123"
                        />
                    </div>
                 </div>
             </div>
             <p className="text-[10px] text-gray-500 italic">
                * Share these credentials with the site supervisor for app login.
             </p>
          </div>

          {/* Client Info Section */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 space-y-3">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Client Information</h3>
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Client Name (M/S) *</label>
                <input 
                    value={formData.clientName || ''}
                    onChange={(e) => handleChange('clientName', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none font-medium"
                    placeholder="M/S. AJMERA REALTY & INFRA INDIA LTD"
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Project Name *</label>
                <input 
                    value={formData.name || ''}
                    onChange={(e) => handleChange('name', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ajmera Manhattan"
                />
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Address / Location *</label>
                <textarea 
                    value={formData.location || ''}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none h-16 resize-none"
                    placeholder="Bhakti Park wadala Mumbai-40037"
                />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Contact No</label>
                    <input 
                        value={formData.clientContact || ''}
                        onChange={(e) => handleChange('clientContact', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                        placeholder="+91 99875 23683"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">GSTIN</label>
                    <input 
                        value={formData.clientGstin || ''}
                        onChange={(e) => handleChange('clientGstin', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none uppercase font-mono text-sm"
                        placeholder="27AAACS7866F1Z2"
                    />
                 </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email</label>
                <input 
                    value={formData.clientEmail || ''}
                    onChange={(e) => handleChange('clientEmail', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="akash@ajmera.com"
                />
             </div>
          </div>

          {/* Work Order & Billing Section */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 space-y-3">
             <h3 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2 flex items-center gap-1">
                <FileText size={14} /> Work Order & Billing
             </h3>
             
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Company Name</label>
                <select 
                    value={formData.companyName || 'AMBE SERVICE'}
                    onChange={(e) => handleChange('companyName', e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none bg-white"
                >
                    <option value="AMBE SERVICE">AMBE SERVICE</option>
                    <option value="AMBE SERVICE FACILITIES PRIVATE LIMITED">AMBE SERVICE FACILITIES PRIVATE LIMITED</option>
                </select>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Work Order No</label>
                    <input 
                        value={formData.workOrderNo || ''}
                        onChange={(e) => handleChange('workOrderNo', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                        placeholder="WO/2024-25/001"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Billing Rate (₹)</label>
                    <input 
                        type="number"
                        value={formData.billingRate || ''}
                        onChange={(e) => handleChange('billingRate', parseFloat(e.target.value))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                        placeholder="0.00"
                    />
                 </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">WO Start Date</label>
                    <input 
                        type="date"
                        value={formData.workOrderDate || ''}
                        onChange={(e) => handleChange('workOrderDate', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">WO Expiry Date</label>
                    <input 
                        type="date"
                        value={formData.workOrderEndDate || ''}
                        onChange={(e) => handleChange('workOrderEndDate', e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                    />
                 </div>
             </div>
          </div>

          {/* Geofencing Section */}
          <div className="border-t pt-4 space-y-3">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                <MapPin size={14} /> Geofencing & Coordinates
             </h3>

             {/* Search Box */}
             <div className="relative mb-2 space-y-2">
                <div className="relative flex gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                        <input 
                            ref={searchInputRef}
                            type="text"
                            className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-2 focus:ring-2 focus:ring-primary outline-none"
                            placeholder="Search for a location..."
                        />
                    </div>
                    <button
                        onClick={() => {
                            if (navigator.geolocation) {
                                navigator.geolocation.getCurrentPosition((position) => {
                                    const pos = {
                                        lat: position.coords.latitude,
                                        lng: position.coords.longitude,
                                    };
                                    if (googleMapRef.current && markerRef.current) {
                                        googleMapRef.current.setCenter(pos);
                                        googleMapRef.current.setZoom(18);
                                        markerRef.current.setPosition(pos);
                                        handleChange('latitude', pos.lat);
                                        handleChange('longitude', pos.lng);
                                    }
                                }, () => {
                                    alert("Error: The Geolocation service failed.");
                                });
                            } else {
                                alert("Error: Your browser doesn't support geolocation.");
                            }
                        }}
                        className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 hover:text-primary transition-colors"
                        title="Use Current Location"
                    >
                        <Navigation size={20} />
                    </button>
                </div>
                <input 
                    type="text"
                    placeholder="Or paste Google Maps Link (e.g. https://maps.google.com/?q=...)"
                    onChange={handleLinkPaste}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary outline-none"
                />
             </div>

             {/* Map Container */}
             <div 
                ref={mapRef} 
                className="w-full h-64 rounded-lg border border-gray-300 overflow-hidden bg-gray-100"
             >
                {!mapLoaded && <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">Loading Map...</div>}
             </div>
             <p className="text-[10px] text-gray-500 italic text-center">
                * Drag the marker or click on the map to set the exact location.
             </p>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 hidden">
                 <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Latitude</label>
                    <input 
                        type="number"
                        value={formData.latitude}
                        readOnly
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm bg-gray-50"
                    />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Longitude</label>
                    <input 
                        type="number"
                        value={formData.longitude}
                        readOnly
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 font-mono text-sm bg-gray-50"
                    />
                 </div>
             </div>
             <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Geofence Radius (Meters)</label>
                <input 
                    type="number"
                    value={formData.geofenceRadius}
                    onChange={(e) => handleChange('geofenceRadius', parseFloat(e.target.value))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
             </div>
          </div>

        </div>

        <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3 border-t border-gray-100 flex-shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-gray-100"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-teal-600 flex items-center gap-2 shadow-sm"
          >
            <Save size={18} /> Save Site
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddSiteModal;
