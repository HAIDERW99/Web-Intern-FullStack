import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function RegisterPropertyPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editHotelId = searchParams.get('edit');

  const { user, profile } = useAuth();

  const [step, setStep] = useState(1);
  const totalSteps = 4;

  // Existing hotel data if in edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [existingAdminNotes, setExistingAdminNotes] = useState('');
  const [existingRejectionReason, setExistingRejectionReason] = useState('');

  // Step 1: Basic Info
  const [hotelName, setHotelName]       = useState('');
  const [businessName, setBusinessName] = useState('');
  const [contactName, setContactName]   = useState(profile?.full_name || '');
  const [contactPhone, setContactPhone] = useState(profile?.phone || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');

  // Step 2: Location
  const [address, setAddress]           = useState('');
  const [city, setCity]                 = useState('');
  const [country, setCountry]           = useState('US');
  const [mapsLink, setMapsLink]         = useState('');

  // Step 3: Details & Category
  const [category, setCategory]         = useState('hotel');
  const [roomCount, setRoomCount]       = useState('20');

  // Step 4: Verification Assets (Optional)
  const [files, setFiles] = useState({
    license: null,
    ownerId: null,
    logo: null,
    cover: null,
  });

  // Hidden file input refs
  const licenseInputRef = useRef(null);
  const ownerIdInputRef = useRef(null);
  const logoInputRef    = useRef(null);
  const coverInputRef   = useRef(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState('');

  // Load existing data if edit mode
  useEffect(() => {
    if (!editHotelId) return;
    async function loadHotelForEdit() {
      const { data, error } = await supabase
        .from('hotels')
        .select('*')
        .eq('id', editHotelId)
        .maybeSingle();

      if (data) {
        setIsEditing(true);
        setHotelName(data.name || '');
        setBusinessName(data.business_name || '');
        setContactName(data.contact_name || '');
        setContactPhone(data.contact_phone || '');
        setContactEmail(data.contact_email || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setCountry(data.country || 'US');
        setMapsLink(data.maps_link || '');
        setCategory(data.category || 'hotel');
        setRoomCount(String(data.room_count || '20'));
        setExistingAdminNotes(data.admin_notes || '');
        setExistingRejectionReason(data.rejection_reason || '');
        setFiles({
          license: data.license_doc_name || null,
          ownerId: data.owner_id_doc_name || null,
          logo: data.image_url ? 'Existing Logo' : null,
          cover: data.cover_image_url ? 'Existing Cover' : null,
        });
      }
    }
    loadHotelForEdit();
  }, [editHotelId]);

  const handleFileChange = (key, e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFiles((prev) => ({ ...prev, [key]: file.name }));
    }
  };

  const handleRemoveFile = (key, e) => {
    e.stopPropagation();
    setFiles((prev) => ({ ...prev, [key]: null }));
  };

  const handleNext = () => {
    setError('');
    if (step === 1) {
      if (!hotelName.trim() || !businessName.trim() || !contactName.trim() || !contactEmail.trim()) {
        setError('Please fill in all required fields in Basic Info.');
        return;
      }
    } else if (step === 2) {
      if (!address.trim() || !city.trim() || !country) {
        setError('Please complete the property address details.');
        return;
      }
    } else if (step === 3) {
      if (!roomCount || Number(roomCount) < 1) {
        setError('Please enter a valid room count (at least 1).');
        return;
      }
    } else if (step === 4) {
      handleSubmitRegistration();
      return;
    }
    setStep((s) => Math.min(s + 1, totalSteps));
  };

  const handleBack = () => {
    setError('');
    setStep((s) => Math.max(s - 1, 1));
  };

  const handleSubmitRegistration = async () => {
    setLoading(true);
    setError('');
    try {
      const CATEGORY_DEFAULT_IMAGES = {
        hotel:     'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
        resort:    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80',
        villa:     'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
        apartment: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
      };

      const propertyData = {
        name: hotelName.trim(),
        business_name: businessName.trim(),
        contact_name: contactName.trim(),
        contact_phone: contactPhone.trim(),
        contact_email: contactEmail.trim(),
        address: address.trim(),
        city: city.trim(),
        country,
        maps_link: mapsLink.trim() || null,
        category,
        room_count: Number(roomCount),
        price_per_night: 150,
        owner_id: user?.id,
        status: 'pending', // Re-submitted application is set back to pending for Admin review
        image_url: CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES.hotel,
        cover_image_url: CATEGORY_DEFAULT_IMAGES[category] || CATEGORY_DEFAULT_IMAGES.hotel,
        license_doc_name: files.license || null,
        owner_id_doc_name: files.ownerId || null,
        rejection_reason: null, // clear previous rejection notes on resubmission
        admin_notes: null,
        updated_at: new Date().toISOString(),
      };

      if (isEditing && editHotelId) {
        // Update existing hotel record
        const { error: updateErr } = await supabase
          .from('hotels')
          .update(propertyData)
          .eq('id', editHotelId);

        if (updateErr) {
          console.error('Update error:', updateErr);
          setError(updateErr.message);
          return;
        }
      } else {
        // Insert new hotel record
        const { data: insertedHotel, error: insertErr } = await supabase
          .from('hotels')
          .insert([propertyData])
          .select()
          .maybeSingle();

        if (insertErr) {
          console.error('Insert error:', insertErr);
          setError(insertErr.message);
          return;
        }

        // Auto-generate starter rooms for this hotel
        if (insertedHotel) {
          const initialRooms = Array.from({ length: Math.min(Number(roomCount) || 5, 8) }).map((_, idx) => ({
            hotel_id: insertedHotel.id,
            room_number: `${101 + idx}`,
            type: idx % 2 === 0 ? 'Deluxe Suite' : 'Standard King',
            price: idx % 2 === 0 ? 180 : 130,
            status: 'available',
            beds: idx % 2 === 0 ? '1 King Bed' : '2 Queen Beds',
          }));
          await supabase.from('rooms').insert(initialRooms);
        }
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to submit registration');
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (step / totalSteps) * 100;

  // ── Success View ──
  if (success) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex flex-col justify-between antialiased">
        <header className="w-full h-16 flex items-center justify-between px-6 border-b border-[#e0e3e5] bg-white">
          <Link to="/" className="font-bold text-xl text-[#131b2e] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fea619] text-2xl">hotel_class</span>
            HostHaven
          </Link>
        </header>

        <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-lg bg-white rounded-2xl border border-[#e0e3e5] shadow-sm p-8 text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-500">
              <span className="material-symbols-outlined text-4xl">verified</span>
            </div>
            <h2 className="text-2xl font-bold text-[#191c1e]">
              {isEditing ? 'Application Resubmitted!' : 'Property Submitted for Review!'}
            </h2>
            <p className="text-sm text-[#45464d] leading-relaxed">
              Thank you for {isEditing ? 'updating' : 'registering'} <strong className="text-[#191c1e]">{hotelName}</strong>. Our admin team will review your application within 24–48 hours.
            </p>
            <div className="bg-[#f7f9fb] p-4 rounded-xl border border-[#e0e3e5] text-xs text-[#76777d] text-left space-y-1">
              <p><strong className="text-[#191c1e]">Status:</strong> <span className="text-amber-600 font-bold">Pending Admin Review</span></p>
              <p><strong className="text-[#191c1e]">Category:</strong> {category.toUpperCase()}</p>
              <p><strong className="text-[#191c1e]">Location:</strong> {city}, {country}</p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/owner/dashboard')}
                className="flex-1 bg-[#131b2e] text-white py-3 rounded-xl text-xs font-semibold hover:bg-[#1e2d47] transition-colors cursor-pointer"
              >
                Go to Owner Dashboard
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] text-[#191c1e] font-sans flex flex-col antialiased">
      {/* Header */}
      <header className="w-full h-16 flex items-center justify-between px-6 border-b border-[#e0e3e5] bg-white sticky top-0 z-30 shadow-2xs">
        <Link to="/" className="font-bold text-xl text-[#131b2e] flex items-center gap-2">
          <span className="material-symbols-outlined text-[#fea619] text-2xl">hotel_class</span>
          HostHaven
        </Link>
        <Link to="/owner/dashboard" className="text-xs font-semibold text-[#45464d] hover:text-[#191c1e] flex items-center gap-1">
          <span className="material-symbols-outlined text-base">close</span>
          Exit
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-10">
        <div className="w-full max-w-2xl bg-white rounded-2xl border border-[#e0e3e5] shadow-xs overflow-hidden flex flex-col">

          {/* Progress Header */}
          <div className="p-6 sm:p-8 border-b border-[#e0e3e5] bg-[#f7f9fb]">
            <h2 className="text-2xl font-bold text-[#191c1e] text-center mb-2">
              {isEditing ? 'Edit & Resubmit Property' : 'Register Your Property'}
            </h2>
            <p className="text-xs text-[#76777d] text-center mb-6">
              {isEditing ? 'Update your property details and documents for admin review' : 'Provide property details to list your hotel on HostHaven'}
            </p>

            {/* Progress Bar */}
            <div className="relative">
              <div className="overflow-hidden h-2 mb-4 flex rounded-full bg-[#e0e3e5]">
                <div
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-[#131b2e] transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>

              <div className="flex justify-between text-xs text-[#76777d]">
                <span className={step === 1 ? 'text-[#131b2e] font-bold' : step > 1 ? 'text-[#131b2e]' : ''}>Basic Info</span>
                <span className={step === 2 ? 'text-[#131b2e] font-bold' : step > 2 ? 'text-[#131b2e]' : ''}>Location</span>
                <span className={step === 3 ? 'text-[#131b2e] font-bold' : step > 3 ? 'text-[#131b2e]' : ''}>Details</span>
                <span className={step === 4 ? 'text-[#131b2e] font-bold' : ''}>Verification (Optional)</span>
              </div>
            </div>
          </div>

          {/* Admin Feedback Notice if in Edit Mode */}
          {(existingAdminNotes || existingRejectionReason) && (
            <div className="mx-6 mt-6 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="material-symbols-outlined text-base text-amber-600">info</span>
                Admin Feedback / Requirements:
              </div>
              <p className="pl-6 text-amber-900">{existingAdminNotes || existingRejectionReason}</p>
            </div>
          )}

          {/* Error Notice */}
          {error && (
            <div className="mx-6 mt-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          {/* Form Content Area */}
          <div className="p-6 sm:p-8 flex-1">

            {/* ── STEP 1: Basic Info ── */}
            {step === 1 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-[#191c1e] mb-4">Let's start with the basics</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1.5">Hotel / Property Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Grand Plaza Hotel"
                    value={hotelName}
                    onChange={(e) => setHotelName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs focus:border-[#131b2e] outline-none bg-white font-medium text-[#191c1e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1.5">Legal Business Name *</label>
                  <input
                    type="text"
                    placeholder="e.g. Grand Plaza Hospitality LLC"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs focus:border-[#131b2e] outline-none bg-white font-medium text-[#191c1e]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1.5">Primary Contact Name *</label>
                    <input
                      type="text"
                      placeholder="Jane Doe"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs focus:border-[#131b2e] outline-none bg-white font-medium text-[#191c1e]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1.5">Contact Phone</label>
                    <input
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs focus:border-[#131b2e] outline-none bg-white font-medium text-[#191c1e]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1.5">Contact Email *</label>
                  <input
                    type="email"
                    placeholder="jane@grandplaza.com"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs focus:border-[#131b2e] outline-none bg-white font-medium text-[#191c1e]"
                  />
                </div>
              </div>
            )}

            {/* ── STEP 2: Location ── */}
            {step === 2 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-[#191c1e] mb-4">Where is your property located?</h3>
                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1.5">Street Address *</label>
                  <input
                    type="text"
                    placeholder="123 Main St"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs focus:border-[#131b2e] outline-none bg-white font-medium text-[#191c1e]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1.5">City *</label>
                    <input
                      type="text"
                      placeholder="New York"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs focus:border-[#131b2e] outline-none bg-white font-medium text-[#191c1e]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1.5">Country *</label>
                    <select
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs focus:border-[#131b2e] outline-none bg-white font-medium text-[#191c1e]"
                    >
                      <option value="US">United States</option>
                      <option value="UK">United Kingdom</option>
                      <option value="CA">Canada</option>
                      <option value="PK">Pakistan</option>
                      <option value="AE">United Arab Emirates</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1.5">Google Maps Link (Optional)</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#76777d] text-base">link</span>
                    <input
                      type="url"
                      placeholder="https://maps.google.com/..."
                      value={mapsLink}
                      onChange={(e) => setMapsLink(e.target.value)}
                      className="w-full p-3 pl-10 rounded-xl border border-[#c6c6cd] text-xs focus:border-[#131b2e] outline-none bg-white font-medium text-[#191c1e]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: Details & Category ── */}
            {step === 3 && (
              <div className="space-y-4">
                <h3 className="text-base font-semibold text-[#191c1e] mb-4">Tell us about your property</h3>

                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-2">Property Category</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { key: 'hotel', label: 'Hotel', icon: 'hotel' },
                      { key: 'resort', label: 'Resort', icon: 'pool' },
                      { key: 'villa', label: 'Villa', icon: 'holiday_village' },
                      { key: 'apartment', label: 'Apartment', icon: 'apartment' },
                    ].map((item) => (
                      <label
                        key={item.key}
                        onClick={() => setCategory(item.key)}
                        className={`flex items-center p-4 border rounded-xl cursor-pointer transition-all ${
                          category === item.key
                            ? 'border-[#131b2e] bg-[#f7f9fb] ring-2 ring-[#131b2e]/10'
                            : 'border-[#e0e3e5] hover:bg-[#f7f9fb]'
                        }`}
                      >
                        <input
                          type="radio"
                          name="category"
                          value={item.key}
                          checked={category === item.key}
                          onChange={() => setCategory(item.key)}
                          className="w-4 h-4 text-[#131b2e]"
                        />
                        <span className="ml-3 text-xs font-semibold text-[#191c1e]">{item.label}</span>
                        <span className="material-symbols-outlined ml-auto text-[#76777d]">{item.icon}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1.5">Total Room Count</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={roomCount}
                    onChange={(e) => setRoomCount(e.target.value)}
                    className="w-full sm:w-1/2 p-3 rounded-xl border border-[#c6c6cd] text-xs focus:border-[#131b2e] outline-none bg-white font-medium text-[#191c1e]"
                  />
                </div>
              </div>
            )}

            {/* ── STEP 4: Verification & Assets (Optional) ── */}
            {step === 4 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-[#191c1e]">Verification & Branding</h3>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                    Optional
                  </span>
                </div>
                <p className="text-xs text-[#76777d] mb-4">
                  You can attach documents now or upload them later. Your registration will still be submitted for review.
                </p>

                {/* Hidden File Inputs */}
                <input
                  type="file"
                  ref={licenseInputRef}
                  onChange={(e) => handleFileChange('license', e)}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={ownerIdInputRef}
                  onChange={(e) => handleFileChange('ownerId', e)}
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={logoInputRef}
                  onChange={(e) => handleFileChange('logo', e)}
                  accept=".png,.jpg,.jpeg,.svg"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={coverInputRef}
                  onChange={(e) => handleFileChange('cover', e)}
                  accept=".jpg,.jpeg,.png,.webp"
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Business License */}
                  <div
                    onClick={() => licenseInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative group ${
                      files.license ? 'border-emerald-500 bg-emerald-50/40' : 'border-[#c6c6cd] hover:bg-[#f7f9fb]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl text-[#131b2e] mb-1">description</span>
                    <span className="text-xs font-bold text-[#191c1e] mb-0.5">Business License</span>
                    <span className="text-[10px] text-[#76777d] truncate max-w-[200px]">
                      {files.license ? `Attached: ${files.license}` : 'Click to select PDF/JPG (Optional)'}
                    </span>
                    {files.license && (
                      <button
                        onClick={(e) => handleRemoveFile('license', e)}
                        className="mt-2 text-[10px] font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Owner ID / CNIC */}
                  <div
                    onClick={() => ownerIdInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative group ${
                      files.ownerId ? 'border-emerald-500 bg-emerald-50/40' : 'border-[#c6c6cd] hover:bg-[#f7f9fb]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl text-[#131b2e] mb-1">badge</span>
                    <span className="text-xs font-bold text-[#191c1e] mb-0.5">Owner ID / CNIC</span>
                    <span className="text-[10px] text-[#76777d] truncate max-w-[200px]">
                      {files.ownerId ? `Attached: ${files.ownerId}` : 'Click to select PDF/JPG (Optional)'}
                    </span>
                    {files.ownerId && (
                      <button
                        onClick={(e) => handleRemoveFile('ownerId', e)}
                        className="mt-2 text-[10px] font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Property Logo */}
                  <div
                    onClick={() => logoInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative group ${
                      files.logo ? 'border-emerald-500 bg-emerald-50/40' : 'border-[#c6c6cd] hover:bg-[#f7f9fb]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl text-[#131b2e] mb-1">image</span>
                    <span className="text-xs font-bold text-[#191c1e] mb-0.5">Property Logo</span>
                    <span className="text-[10px] text-[#76777d] truncate max-w-[200px]">
                      {files.logo ? `Attached: ${files.logo}` : 'Click to select PNG/JPG (Optional)'}
                    </span>
                    {files.logo && (
                      <button
                        onClick={(e) => handleRemoveFile('logo', e)}
                        className="mt-2 text-[10px] font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Cover Image */}
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-colors relative group ${
                      files.cover ? 'border-emerald-500 bg-emerald-50/40' : 'border-[#c6c6cd] hover:bg-[#f7f9fb]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-3xl text-[#131b2e] mb-1">wallpaper</span>
                    <span className="text-xs font-bold text-[#191c1e] mb-0.5">Cover Image</span>
                    <span className="text-[10px] text-[#76777d] truncate max-w-[200px]">
                      {files.cover ? `Attached: ${files.cover}` : 'Click to select JPG (Optional)'}
                    </span>
                    {files.cover && (
                      <button
                        onClick={(e) => handleRemoveFile('cover', e)}
                        className="mt-2 text-[10px] font-semibold text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Footer Actions */}
          <div className="p-6 border-t border-[#e0e3e5] bg-[#f7f9fb] flex justify-between items-center">
            {step > 1 ? (
              <button
                onClick={handleBack}
                disabled={loading}
                className="px-6 py-2.5 border border-[#c6c6cd] rounded-xl text-xs font-semibold text-[#45464d] hover:bg-white transition-colors cursor-pointer"
              >
                Back
              </button>
            ) : <div />}

            <button
              onClick={handleNext}
              disabled={loading}
              className={`px-6 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs ${
                step === totalSteps
                  ? 'bg-[#fea619] text-[#2a1700] hover:bg-[#e59410] font-bold'
                  : 'bg-[#131b2e] text-white hover:bg-[#1e2d47]'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm animate-spin">autorenew</span>
                  Submitting...
                </span>
              ) : step === totalSteps ? (isEditing ? 'Resubmit Application' : 'Submit Registration') : 'Continue'}
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}
