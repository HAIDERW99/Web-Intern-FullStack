import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerLayout from './OwnerLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function OwnerDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // ── Real data state ────────────────────────────────────────────────────
  const [hotel, setHotel]               = useState(null);
  const [rooms, setRooms]               = useState([]);
  const [bookings, setBookings]         = useState([]);
  const [reviews, setReviews]           = useState([]);
  const [dataLoading, setDataLoading]   = useState(true);

  // ── Derived real stats ─────────────────────────────────────────────────
  const totalRevenue = bookings
    .filter((b) => b.status !== 'cancelled')
    .reduce((s, b) => s + Number(b.total_amount || 0), 0);
  const totalBookings    = bookings.length;
  const availableRooms   = rooms.filter((r) => r.status === 'available').length;
  const availabilityPct  = rooms.length > 0 ? Math.round((availableRooms / rooms.length) * 100) : 0;

  useEffect(() => {
    if (!user) return;
    async function loadData() {
      setDataLoading(true);
      // Fetch owner's first hotel
      const { data: hotelData } = await supabase
        .from('hotels')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setHotel(hotelData);

      if (hotelData) {
        const [roomsRes, bookingsRes, reviewsRes] = await Promise.all([
          supabase.from('rooms').select('*').eq('hotel_id', hotelData.id),
          supabase.from('bookings').select('*, profiles:customer_id(full_name)').eq('hotel_id', hotelData.id).order('created_at', { ascending: false }),
          supabase.from('reviews').select('*, profiles:customer_id(full_name)').eq('hotel_id', hotelData.id).order('created_at', { ascending: false }),
        ]);
        setRooms(roomsRes.data || []);
        setBookings(bookingsRes.data || []);
        setReviews(reviewsRes.data || []);
      }
      setDataLoading(false);
    }
    loadData();
  }, [user]);

  // Profile Details Form State
  const [propertyName, setPropertyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [basePrice, setBasePrice]       = useState('100');
  const [profileSaved, setProfileSaved] = useState(false);

  // Sync form with loaded hotel data
  useEffect(() => {
    if (hotel) {
      setPropertyName(hotel.name || '');
      setContactEmail(hotel.contact_email || profile?.full_name || '');
      setBasePrice(String(hotel.price_per_night || '100'));
    } else if (profile) {
      setPropertyName(profile.full_name ? `${profile.full_name}'s Hotel` : 'My Hotel');
    }
  }, [hotel, profile]);

  // Gallery State (from hotel images)
  const [gallery, setGallery]           = useState([]);
  const [newImgUrl, setNewImgUrl]       = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Sync gallery with hotel data
  useEffect(() => {
    if (hotel) {
      const imgs = [];
      if (hotel.image_url) imgs.push({ id: 'cover', alt: 'Cover', src: hotel.image_url });
      if (hotel.cover_image_url && hotel.cover_image_url !== hotel.image_url)
        imgs.push({ id: 'cover2', alt: 'Cover 2', src: hotel.cover_image_url });
      // fallback if no images
      if (imgs.length === 0) imgs.push(
        { id: 1, alt: 'Lobby', src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80' },
        { id: 2, alt: 'Room',  src: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80' }
      );
      setGallery(imgs);
    }
  }, [hotel]);

  // Reviews State
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText]       = useState('');

  // Modals
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showCleaningModal, setShowCleaningModal] = useState(false);

  // Add Room Form State
  const [newRoomNum, setNewRoomNum]     = useState('');
  const [newRoomType, setNewRoomType]   = useState('Deluxe Suite');
  const [newRoomRate, setNewRoomRate]   = useState('250');
  const [addingRoom, setAddingRoom]     = useState(false);

  // Cleaning Service Form State
  const [cleaningRoom, setCleaningRoom] = useState('');
  const [cleaningType, setCleaningType] = useState('Checkout');
  const [cleaningUrgency, setCleaningUrgency] = useState('urgent');
  const [cleaningSuccess, setCleaningSuccess] = useState(false);

  // Calendar Timeline Week Offset
  const [weekOffset, setWeekOffset]     = useState(0);

  // Handlers
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (hotel) {
      await supabase.from('hotels').update({
        name: propertyName,
        contact_email: contactEmail,
        price_per_night: Number(basePrice),
      }).eq('id', hotel.id);
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleAddImage = (e) => {
    e.preventDefault();
    if (!newImgUrl.trim()) return;
    setGallery([
      ...gallery,
      { id: Date.now(), alt: 'Property Photo', src: newImgUrl.trim() },
    ]);
    setNewImgUrl('');
    setShowUploadModal(false);
  };

  const handleDeleteImage = (id) => {
    setGallery(gallery.filter((item) => item.id !== id));
  };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedReview) return;
    await supabase.from('reviews').update({ reply: replyText.trim() }).eq('id', selectedReview.id);
    setReviews(
      reviews.map((r) =>
        r.id === selectedReview.id ? { ...r, reply: replyText.trim() } : r
      )
    );
    setSelectedReview(null);
    setReplyText('');
  };

  const handleAddRoomSubmit = async (e) => {
    e.preventDefault();
    if (!newRoomNum.trim() || !hotel) return;
    setAddingRoom(true);
    const { data, error } = await supabase.from('rooms').insert([{
      hotel_id:    hotel.id,
      room_number: newRoomNum.trim(),
      type:        newRoomType,
      price:       Number(newRoomRate),
      status:      'available',
    }]).select().maybeSingle();
    if (!error && data) {
      setRooms((prev) => [...prev, data]);
    }
    setAddingRoom(false);
    setShowAddRoomModal(false);
    setNewRoomNum('');
  };

  const handleCleaningSubmit = (e) => {
    e.preventDefault();
    setCleaningSuccess(true);
    setTimeout(() => {
      setCleaningSuccess(false);
      setShowCleaningModal(false);
    }, 2000);
  };

  return (
    <OwnerLayout onAddRoomClick={() => setShowAddRoomModal(true)}>
      <div className="space-y-6">

        {/* ── Header Actions ── */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-[#191c1e] tracking-tight">Overview</h1>
            <p className="text-sm text-[#45464d] mt-0.5">
              Welcome back to <span className="font-semibold text-[#191c1e]">{propertyName}</span> operations.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {hotel && (hotel.status === 'changes_requested' || hotel.status === 'rejected') && (
              <button
                onClick={() => navigate(`/owner/register-property?edit=${hotel.id}`)}
                className="bg-amber-600 text-white px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-amber-700 transition-all flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap animate-pulse"
              >
                <span className="material-symbols-outlined text-base">edit_note</span>
                Edit & Resubmit Property
              </button>
            )}
            <button
              onClick={() => navigate('/owner/register-property')}
              className="bg-[#fea619] text-[#2a1700] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#e59410] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-base">domain_add</span>
              + Register New Hotel
            </button>
            <button
              onClick={() => setShowCleaningModal(true)}
              className="bg-[#131b2e] text-white px-5 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#1e2d47] transition-all flex items-center gap-2 shadow-sm cursor-pointer whitespace-nowrap"
            >
              <span className="material-symbols-outlined text-lg">cleaning_services</span>
              Request Free Cleaning Service
            </button>
          </div>
        </header>

        {/* ── Admin Feedback Alert Banner ── */}
        {hotel && (hotel.status === 'changes_requested' || hotel.status === 'rejected') && (
          <div className="p-5 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3.5">
              <span className="material-symbols-outlined text-2xl text-amber-700 mt-0.5">notification_important</span>
              <div>
                <h3 className="font-bold text-sm text-amber-900">
                  {hotel.status === 'changes_requested' ? 'Admin Requires Additional Information / Documents' : 'Property Registration Needs Revision'}
                </h3>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  <strong>Admin Feedback:</strong> {hotel.admin_notes || hotel.rejection_reason || 'Please update property details and resubmit for approval.'}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/owner/register-property?edit=${hotel.id}`)}
              className="bg-amber-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold hover:bg-amber-900 transition-colors whitespace-nowrap cursor-pointer flex-shrink-0"
            >
              Edit & Resubmit Application ➔
            </button>
          </div>
        )}

        {/* ── Stats Bento Grid ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Revenue */}
          <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-[#45464d] uppercase tracking-wide">Total Revenue</span>
              <span className="material-symbols-outlined text-[#855300] bg-[#ffddb8]/60 p-2.5 rounded-xl text-xl">payments</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-bold text-[#191c1e] tracking-tight">
                {dataLoading ? '…' : `$${totalRevenue.toLocaleString()}`}
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 mt-2">
                <span className="material-symbols-outlined text-base">trending_up</span>
                <span>From {totalBookings} total bookings</span>
              </div>
            </div>
          </div>

          {/* Bookings */}
          <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-[#45464d] uppercase tracking-wide">Total Bookings</span>
              <span className="material-symbols-outlined text-[#3980f4] bg-[#d8e2ff]/60 p-2.5 rounded-xl text-xl">book_online</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-bold text-[#191c1e] tracking-tight">
                {dataLoading ? '…' : totalBookings}
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-[#45464d] mt-2">
                <span>{bookings.filter(b => b.status === 'confirmed').length} confirmed</span>
              </div>
            </div>
          </div>

          {/* Availability */}
          <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] flex flex-col justify-between shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <span className="text-xs font-semibold text-[#45464d] uppercase tracking-wide">Room Availability</span>
              <span className="material-symbols-outlined text-[#131b2e] bg-[#dae2fd] p-2.5 rounded-xl text-xl">key</span>
            </div>
            <div className="mt-3 relative z-10">
              <div className="text-3xl sm:text-4xl font-bold text-[#191c1e] tracking-tight">
                {dataLoading ? '…' : `${availabilityPct}%`}
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-[#45464d] mt-2">
                <span>{dataLoading ? '…' : `${availableRooms} of ${rooms.length} rooms available`}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 left-0 h-10 bg-gradient-to-t from-[#dae2fd]/40 to-transparent pointer-events-none" />
          </div>
        </section>

        {/* ── Main 2-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column (2/3 width) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Reservation Timeline Mockup */}
            <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden shadow-xs">
              <div className="p-5 border-b border-[#e0e3e5] flex justify-between items-center bg-[#f7f9fb]">
                <div>
                  <h3 className="font-semibold text-base text-[#191c1e]">Reservation Timeline</h3>
                  <p className="text-xs text-[#76777d]">Live occupancy view for current week</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setWeekOffset((w) => w - 1)}
                    className="p-2 border border-[#c6c6cd] rounded-xl hover:bg-white transition-colors cursor-pointer text-[#45464d]"
                    title="Previous Week"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button
                    onClick={() => setWeekOffset(0)}
                    className="px-3 py-1.5 border border-[#c6c6cd] text-xs font-semibold rounded-xl hover:bg-white transition-colors cursor-pointer text-[#45464d]"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setWeekOffset((w) => w + 1)}
                    className="p-2 border border-[#c6c6cd] rounded-xl hover:bg-white transition-colors cursor-pointer text-[#45464d]"
                    title="Next Week"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
              </div>

              <div className="p-5">
                {/* Days Grid Header */}
                <div className="grid grid-cols-7 gap-2 mb-3 text-center text-xs font-semibold text-[#45464d]">
                  <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
                </div>

                {/* Days Cells */}
                <div className="grid grid-cols-7 gap-2">
                  {/* Mon */}
                  <div className="h-28 bg-[#f2f4f6] rounded-xl p-2 text-xs relative opacity-60">
                    <span className="text-[10px] font-semibold text-[#76777d]">Cleaned</span>
                  </div>

                  {/* Tue */}
                  <div className="h-28 bg-[#f2f4f6] rounded-xl p-2 text-xs relative">
                    <div className="absolute inset-x-1.5 top-1.5 h-7 bg-[#d8e2ff] text-[#004395] rounded-lg px-2 flex items-center justify-between font-semibold text-[11px] truncate shadow-2xs">
                      <span>Smith - 201</span>
                    </div>
                  </div>

                  {/* Wed */}
                  <div className="h-28 bg-[#f2f4f6] rounded-xl p-2 text-xs relative">
                    <div className="absolute inset-x-1.5 top-1.5 h-7 bg-[#d8e2ff] text-[#004395] rounded-lg px-2 flex items-center justify-between font-semibold text-[11px] truncate shadow-2xs">
                      <span>Smith - 201</span>
                    </div>
                    <div className="absolute inset-x-1.5 top-10 h-7 bg-[#ffddb8] text-[#653e00] rounded-lg px-2 flex items-center justify-between font-semibold text-[11px] truncate shadow-2xs">
                      <span>Doe - 305</span>
                    </div>
                  </div>

                  {/* Thu */}
                  <div className="h-28 bg-[#f2f4f6] rounded-xl p-2 text-xs relative">
                    <div className="absolute inset-x-1.5 top-10 h-7 bg-[#ffddb8] text-[#653e00] rounded-lg px-2 flex items-center justify-between font-semibold text-[11px] truncate shadow-2xs">
                      <span>Doe - 305</span>
                    </div>
                  </div>

                  {/* Fri */}
                  <div className="h-28 bg-[#f2f4f6] rounded-xl p-2 text-xs relative">
                    <div className="absolute inset-x-1.5 top-1.5 h-7 bg-emerald-100 text-emerald-800 rounded-lg px-2 flex items-center justify-between font-semibold text-[11px] truncate shadow-2xs">
                      <span>Khan - 104</span>
                    </div>
                  </div>

                  {/* Sat (Weekend) */}
                  <div className="h-28 bg-[#dae2fd]/30 border border-[#dae2fd] rounded-xl p-2 text-xs relative">
                    <div className="absolute inset-x-1.5 top-1.5 h-7 bg-purple-100 text-purple-800 rounded-lg px-2 flex items-center justify-between font-semibold text-[11px] truncate shadow-2xs">
                      <span>VIP - Suite 1</span>
                    </div>
                    <span className="absolute bottom-1.5 right-2 text-[10px] font-bold text-[#3980f4]">Weekend</span>
                  </div>

                  {/* Sun (Weekend) */}
                  <div className="h-28 bg-[#dae2fd]/30 border border-[#dae2fd] rounded-xl p-2 text-xs relative">
                    <div className="absolute inset-x-1.5 top-1.5 h-7 bg-purple-100 text-purple-800 rounded-lg px-2 flex items-center justify-between font-semibold text-[11px] truncate shadow-2xs">
                      <span>VIP - Suite 1</span>
                    </div>
                    <span className="absolute bottom-1.5 right-2 text-[10px] font-bold text-[#3980f4]">Weekend</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Property Gallery */}
            <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-semibold text-base text-[#191c1e]">Property Gallery</h3>
                  <p className="text-xs text-[#76777d]">Showcase your hotel rooms & facilities</p>
                </div>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="text-xs font-bold text-[#fea619] hover:underline cursor-pointer"
                >
                  + Add Photos
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gallery.map((img) => (
                  <div
                    key={img.id}
                    className="aspect-square rounded-xl overflow-hidden border border-[#e0e3e5] relative group shadow-2xs"
                  >
                    <img src={img.src} alt={img.alt} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDeleteImage(img.id)}
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-sm"
                        title="Delete photo"
                      >
                        <span className="material-symbols-outlined text-base">delete</span>
                      </button>
                    </div>
                  </div>
                ))}

                {/* Upload Box */}
                <div
                  onClick={() => setShowUploadModal(true)}
                  className="aspect-square rounded-xl border-2 border-dashed border-[#c6c6cd] flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#fea619] hover:bg-[#fffbf2] transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl text-[#76777d]">upload_file</span>
                  <span className="text-xs font-semibold text-[#45464d]">Upload New</span>
                </div>
              </div>
            </div>

          </div>

          {/* ── Right Column (1/3 width) ── */}
          <div className="space-y-6">

            {/* Profile Editor */}
            <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] shadow-xs">
              <h3 className="font-semibold text-base text-[#191c1e] mb-1">Profile Details</h3>
              <p className="text-xs text-[#76777d] mb-4">Manage property information & pricing.</p>

              {profileSaved && (
                <div className="mb-4 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">check_circle</span>
                  Changes saved successfully!
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wide mb-1.5">Property Name</label>
                  <input
                    type="text"
                    value={propertyName}
                    onChange={(e) => setPropertyName(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#c6c6cd] focus:border-[#131b2e] focus:ring-2 focus:ring-[#131b2e]/10 outline-none text-xs bg-white font-medium text-[#191c1e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wide mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#c6c6cd] focus:border-[#131b2e] focus:ring-2 focus:ring-[#131b2e]/10 outline-none text-xs bg-white font-medium text-[#191c1e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wide mb-1.5">Base Price / Night</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#76777d]">$</span>
                    <input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(e.target.value)}
                      className="w-full p-3 pl-8 rounded-xl border border-[#c6c6cd] focus:border-[#131b2e] focus:ring-2 focus:ring-[#131b2e]/10 outline-none text-xs bg-white font-medium text-[#191c1e]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#131b2e] text-white py-3 rounded-xl text-xs font-semibold hover:bg-[#1e2d47] transition-colors shadow-xs cursor-pointer mt-2"
                >
                  Save Changes
                </button>
              </form>
            </div>

            {/* Customer Reviews List */}
            <div className="bg-white rounded-2xl border border-[#e0e3e5] shadow-xs flex flex-col">
              <div className="p-5 border-b border-[#e0e3e5]">
                <h3 className="font-semibold text-base text-[#191c1e]">Recent Reviews</h3>
                <p className="text-xs text-[#76777d]">Customer feedback & ratings</p>
              </div>

              <div className="divide-y divide-[#e0e3e5] max-h-[420px] overflow-y-auto">
                {reviews.length === 0 && !dataLoading && (
                  <p className="text-xs text-[#76777d] text-center py-8">No reviews yet for your property.</p>
                )}
                {reviews.map((rev) => {
                  const authorName = rev.profiles?.full_name || 'Guest';
                  return (
                  <div key={rev.id} className="p-4 hover:bg-[#f7f9fb] transition-colors space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-xs text-[#191c1e]">{authorName}</span>
                      <div className="flex text-[#fea619]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <span
                            key={i}
                            className={`material-symbols-outlined text-sm ${i < rev.rating ? 'fill' : ''}`}
                          >
                            star
                          </span>
                        ))}
                      </div>
                    </div>

                    <p className="text-xs text-[#45464d] leading-relaxed italic">{rev.comment}</p>

                    {rev.reply && (
                      <div className="bg-[#f2f4f6] p-2.5 rounded-xl border border-[#e0e3e5] text-xs text-[#191c1e]">
                        <span className="font-bold text-[11px] text-[#855300] block mb-0.5">Your Reply:</span>
                        {rev.reply}
                      </div>
                    )}

                    {!rev.reply && (
                      <button
                        onClick={() => setSelectedReview(rev)}
                        className="text-xs font-semibold text-[#855300] border border-[#ffddb8] bg-[#fffbf2] hover:bg-[#ffddb8]/40 px-3 py-1 rounded-full flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-sm">reply</span>
                        Reply
                      </button>
                    )}
                  </div>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ── MODAL 1: Add New Room ── */}
      {showAddRoomModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#e0e3e5] pb-3">
              <h3 className="font-semibold text-base text-[#191c1e]">Add New Room</h3>
              <button onClick={() => setShowAddRoomModal(false)} className="text-[#76777d] hover:text-[#191c1e]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddRoomSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Room Number / Name</label>
                <input
                  type="text"
                  placeholder="e.g. Room 502"
                  value={newRoomNum}
                  onChange={(e) => setNewRoomNum(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs focus:border-[#131b2e] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Category / Type</label>
                <select
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value)}
                  className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs focus:border-[#131b2e] outline-none bg-white"
                >
                  <option value="Standard King">Standard King</option>
                  <option value="Deluxe Suite">Deluxe Suite</option>
                  <option value="Ocean View Double">Ocean View Double</option>
                  <option value="Penthouse Suite">Penthouse Suite</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Price per Night ($)</label>
                <input
                  type="number"
                  value={newRoomRate}
                  onChange={(e) => setNewRoomRate(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs focus:border-[#131b2e] outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRoomModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold border border-[#c6c6cd] rounded-xl hover:bg-[#f2f4f6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingRoom}
                  className="flex-1 py-2.5 text-xs font-semibold bg-[#fea619] text-[#2a1700] rounded-xl hover:bg-[#e59410] disabled:opacity-50"
                >
                  {addingRoom ? 'Adding…' : 'Add Room'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2: Request Free Cleaning Service ── */}
      {showCleaningModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#e0e3e5] pb-3">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#fea619]">cleaning_services</span>
                <h3 className="font-semibold text-base text-[#191c1e]">Request Free Cleaning</h3>
              </div>
              <button onClick={() => setShowCleaningModal(false)} className="text-[#76777d] hover:text-[#191c1e]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {cleaningSuccess ? (
              <div className="py-8 text-center space-y-2">
                <span className="material-symbols-outlined text-4xl text-emerald-500">task_alt</span>
                <h4 className="font-semibold text-base text-[#191c1e]">Cleaning Request Sent!</h4>
                <p className="text-xs text-[#76777d]">Cleaning team has been notified and dispatched.</p>
              </div>
            ) : (
              <form onSubmit={handleCleaningSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Target Room</label>
                  <select
                    value={cleaningRoom}
                    onChange={(e) => setCleaningRoom(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs outline-none bg-white"
                  >
                    <option value="Room 402">Room 402</option>
                    <option value="Room 105">Room 105</option>
                    <option value="Room 213">Room 213</option>
                    <option value="Room 318">Room 318</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Cleaning Type</label>
                  <select
                    value={cleaningType}
                    onChange={(e) => setCleaningType(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs outline-none bg-white"
                  >
                    <option value="Checkout">Checkout Clean (Full Turnaround)</option>
                    <option value="Standard">Standard Daily Refresh</option>
                    <option value="Deep Clean">Deep Sanitize & Linen Change</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Urgency Level</label>
                  <select
                    value={cleaningUrgency}
                    onChange={(e) => setCleaningUrgency(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs outline-none bg-white"
                  >
                    <option value="urgent">🔴 Urgent (Immediate Dispatch)</option>
                    <option value="scheduled">🟡 Scheduled (Next 2 Hours)</option>
                    <option value="normal">🟢 Normal Priority</option>
                  </select>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCleaningModal(false)}
                    className="flex-1 py-2.5 text-xs font-semibold border border-[#c6c6cd] rounded-xl hover:bg-[#f2f4f6]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs font-semibold bg-[#131b2e] text-white rounded-xl hover:bg-[#1e2d47]"
                  >
                    Confirm Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL 3: Upload Image ── */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#e0e3e5] pb-3">
              <h3 className="font-semibold text-base text-[#191c1e]">Add Photo to Gallery</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-[#76777d] hover:text-[#191c1e]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleAddImage} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={newImgUrl}
                  onChange={(e) => setNewImgUrl(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs outline-none focus:border-[#131b2e]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="flex-1 py-2.5 text-xs font-semibold border border-[#c6c6cd] rounded-xl hover:bg-[#f2f4f6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-semibold bg-[#fea619] text-[#2a1700] rounded-xl hover:bg-[#e59410]"
                >
                  Add Image
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 4: Reply to Review ── */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex justify-between items-center border-b border-[#e0e3e5] pb-3">
              <h3 className="font-semibold text-base text-[#191c1e]">Reply to {selectedReview.profiles?.full_name || 'Guest'}</h3>
              <button onClick={() => setSelectedReview(null)} className="text-[#76777d] hover:text-[#191c1e]">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <p className="text-xs text-[#76777d] italic bg-[#f7f9fb] p-3 rounded-xl border border-[#e0e3e5]">
              {selectedReview.comment || '(no comment)'}
            </p>
            <form onSubmit={handleSendReply} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Your Response</label>
                <textarea
                  rows={3}
                  placeholder="Thank you for staying with us..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-[#c6c6cd] text-xs outline-none focus:border-[#131b2e]"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedReview(null)}
                  className="flex-1 py-2.5 text-xs font-semibold border border-[#c6c6cd] rounded-xl hover:bg-[#f2f4f6]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 text-xs font-semibold bg-[#131b2e] text-white rounded-xl hover:bg-[#1e2d47]"
                >
                  Post Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </OwnerLayout>
  );
}
