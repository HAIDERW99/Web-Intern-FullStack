import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import OwnerLayout from './OwnerLayout';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';

export default function OwnerDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  // ── Real data state ────────────────────────────────────────────────────
  const [hotels, setHotels]             = useState([]);
  const [selectedHotelId, setSelectedHotelId] = useState('all');
  const [rooms, setRooms]               = useState([]);
  const [bookings, setBookings]         = useState([]);
  const [reviews, setReviews]           = useState([]);
  const [dataLoading, setDataLoading]   = useState(true);
  const [updatingBookingId, setUpdatingBookingId] = useState(null);
  const [toastMessage, setToastMessage] = useState('');

  // Modals
  const [showAddRoomModal, setShowAddRoomModal] = useState(false);
  const [showCleaningModal, setShowCleaningModal] = useState(false);
  const [showUploadModal, setShowUploadModal]   = useState(false);

  // Add Room Form State
  const [newRoomHotelId, setNewRoomHotelId] = useState('');
  const [newRoomNum, setNewRoomNum]         = useState('');
  const [newRoomType, setNewRoomType]       = useState('Deluxe Suite');
  const [newRoomRate, setNewRoomRate]       = useState('250');
  const [addingRoom, setAddingRoom]         = useState(false);

  // Cleaning Service Form State
  const [cleaningRoom, setCleaningRoom] = useState('');
  const [cleaningType, setCleaningType] = useState('Checkout');
  const [cleaningUrgency, setCleaningUrgency] = useState('urgent');
  const [cleaningSuccess, setCleaningSuccess] = useState(false);

  // Profile Details Form State
  const [propertyName, setPropertyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [basePrice, setBasePrice]       = useState('100');
  const [profileSaved, setProfileSaved] = useState(false);

  // Gallery State
  const [gallery, setGallery]           = useState([]);
  const [newImgUrl, setNewImgUrl]       = useState('');

  // Reviews State
  const [selectedReview, setSelectedReview] = useState(null);
  const [replyText, setReplyText]       = useState('');

  // Timeline Navigation
  const [weekOffset, setWeekOffset]     = useState(0);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // ── Fetch all owner properties, rooms, bookings, and reviews ─────────────
  async function loadDashboardData() {
    if (!user) return;
    setDataLoading(true);

    try {
      const { data: ownerHotels, error: hErr } = await supabase
        .from('hotels')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (hErr) console.error('Error fetching owner hotels:', hErr);
      const fetchedHotels = ownerHotels || [];
      setHotels(fetchedHotels);

      if (fetchedHotels.length > 0) {
        const hotelIds = fetchedHotels.map((h) => h.id);

        const [roomsRes, bookingsRes, reviewsRes] = await Promise.all([
          supabase
            .from('rooms')
            .select('*, hotels:hotel_id(id, name)')
            .in('hotel_id', hotelIds)
            .order('room_number'),
          supabase
            .from('bookings')
            .select('*, hotels:hotel_id(id, name), rooms:room_id(type, room_number)')
            .in('hotel_id', hotelIds)
            .order('created_at', { ascending: false }),
          supabase
            .from('reviews')
            .select('*, hotels:hotel_id(id, name)')
            .in('hotel_id', hotelIds)
            .order('created_at', { ascending: false }),
        ]);

        const rawBookings = bookingsRes.data || [];
        const rawReviews  = reviewsRes.data || [];

        // Batch fetch customer profiles
        const customerIds = [
          ...new Set([
            ...rawBookings.map((b) => b.customer_id).filter(Boolean),
            ...rawReviews.map((r) => r.customer_id).filter(Boolean),
          ]),
        ];

        let profileMap = {};
        if (customerIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, email, avatar_url')
            .in('id', customerIds);

          if (profilesData) {
            profilesData.forEach((p) => {
              profileMap[p.id] = p;
            });
          }
        }

        const enrichedBookings = rawBookings.map((b) => ({
          ...b,
          profiles: profileMap[b.customer_id] || { full_name: 'Guest' },
        }));

        const enrichedReviews = rawReviews.map((r) => ({
          ...r,
          profiles: profileMap[r.customer_id] || { full_name: 'Guest' },
        }));

        setRooms(roomsRes.data || []);
        setBookings(enrichedBookings);
        setReviews(enrichedReviews);

        if (!newRoomHotelId && fetchedHotels[0]) {
          setNewRoomHotelId(fetchedHotels[0].id);
        }
      } else {
        setRooms([]);
        setBookings([]);
        setReviews([]);
      }
    } catch (err) {
      console.error('Error loading owner dashboard data:', err);
    } finally {
      setDataLoading(false);
    }
  }

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  // ── Real-time Supabase subscriptions ──────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`owner-dashboard-realtime-${user.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
        loadDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {
        loadDashboardData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'hotels' }, () => {
        loadDashboardData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Active Hotel
  const currentHotel = useMemo(() => {
    if (selectedHotelId === 'all') return hotels[0] || null;
    return hotels.find((h) => h.id === selectedHotelId) || hotels[0] || null;
  }, [hotels, selectedHotelId]);

  // Sync profile form when currentHotel changes
  useEffect(() => {
    if (currentHotel) {
      setPropertyName(currentHotel.name || '');
      setContactEmail(currentHotel.contact_email || profile?.email || '');
      setBasePrice(String(currentHotel.price_per_night || '100'));
    } else if (profile) {
      setPropertyName(profile.full_name ? `${profile.full_name}'s Hotel` : 'My Hotel');
    }
  }, [currentHotel, profile]);

  // ── Persistent Gallery Sync with LocalStorage & Supabase ──────────────
  useEffect(() => {
    if (!currentHotel) return;
    const key = `hosthaven_gallery_${currentHotel.id}`;
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        setGallery(JSON.parse(saved));
        return;
      } catch (e) {
        console.error(e);
      }
    }

    const imgs = [];
    if (currentHotel.image_url) imgs.push({ id: 'img-main', alt: 'Main Photo', src: currentHotel.image_url });
    if (currentHotel.cover_image_url && currentHotel.cover_image_url !== currentHotel.image_url) {
      imgs.push({ id: 'img-cover', alt: 'Cover Photo', src: currentHotel.cover_image_url });
    }
    if (imgs.length === 0) {
      imgs.push(
        { id: 1, alt: 'Lobby', src: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80' },
        { id: 2, alt: 'Room',  src: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80' }
      );
    }
    setGallery(imgs);
  }, [currentHotel]);

  const handleAddImage = async (e) => {
    e.preventDefault();
    if (!newImgUrl.trim()) return;
    const url = newImgUrl.trim();

    const newImg = { id: `img-${Date.now()}`, alt: 'Property Photo', src: url };
    const updated = [newImg, ...gallery];
    setGallery(updated);

    if (currentHotel) {
      const key = `hosthaven_gallery_${currentHotel.id}`;
      localStorage.setItem(key, JSON.stringify(updated));

      // Persist to Supabase
      await supabase
        .from('hotels')
        .update({ cover_image_url: url, image_url: currentHotel.image_url || url })
        .eq('id', currentHotel.id);
    }

    setNewImgUrl('');
    setShowUploadModal(false);
    showToast('Photo added and saved permanently! 📸');
  };

  const handleDeleteImage = (id) => {
    const updated = gallery.filter((item) => item.id !== id);
    setGallery(updated);
    if (currentHotel) {
      const key = `hosthaven_gallery_${currentHotel.id}`;
      localStorage.setItem(key, JSON.stringify(updated));
    }
    showToast('Photo removed.');
  };

  // ── Derived filtered data & real-time stats ─────────────────────────────
  const displayRooms = useMemo(() => {
    if (selectedHotelId === 'all') return rooms;
    return rooms.filter((r) => r.hotel_id === selectedHotelId);
  }, [rooms, selectedHotelId]);

  const displayBookings = useMemo(() => {
    if (selectedHotelId === 'all') return bookings;
    return bookings.filter((b) => b.hotel_id === selectedHotelId);
  }, [bookings, selectedHotelId]);

  const totalRevenue = useMemo(() => {
    return displayBookings
      .filter((b) => b.status !== 'cancelled')
      .reduce((s, b) => s + Number(b.total_amount || 0), 0);
  }, [displayBookings]);

  const totalBookingsCount = displayBookings.length;
  const confirmedBookingsCount = displayBookings.filter((b) => b.status === 'confirmed' || b.status === 'checked_in').length;
  const availableRoomsCount = displayRooms.filter((r) => r.status === 'available').length;
  const totalRoomsCount = displayRooms.length;
  const availabilityPct = totalRoomsCount > 0 ? Math.round((availableRoomsCount / totalRoomsCount) * 100) : 0;

  // ── Booking Status Actions (Check-In & Check-Out) ────────────────────────
  const handleUpdateBookingStatus = async (bookingId, nextStatus, msg) => {
    setUpdatingBookingId(bookingId);
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: nextStatus } : b))
    );

    const { error } = await supabase
      .from('bookings')
      .update({ status: nextStatus })
      .eq('id', bookingId);

    if (!error) {
      showToast(msg || `Booking updated to ${nextStatus}!`);
    } else {
      console.error(error);
      loadDashboardData();
    }
    setUpdatingBookingId(null);
  };

  // ── 7-Day Timeline Helpers ──────────────────────────────────────────────
  const getWeekDays = (offset = 0) => {
    const now = new Date();
    const day = now.getDay();
    const diff = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diff + offset * 7);
    monday.setHours(0, 0, 0, 0);

    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const formatDateKey = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const isTodayDate = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const weekDays = getWeekDays(weekOffset);
  const startDay = weekDays[0];
  const endDay = weekDays[6];
  const weekRangeText = `${monthNames[startDay.getMonth()]} ${startDay.getDate()} – ${monthNames[endDay.getMonth()]} ${endDay.getDate()}, ${endDay.getFullYear()}`;

  // Form Handlers
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (currentHotel) {
      await supabase.from('hotels').update({
        name: propertyName,
        contact_email: contactEmail,
        price_per_night: Number(basePrice),
      }).eq('id', currentHotel.id);
      setProfileSaved(true);
      showToast('Property details saved successfully!');
      setTimeout(() => setProfileSaved(false), 3000);
    }
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
    showToast('Reply sent to guest!');
  };

  const handleAddRoomSubmit = async (e) => {
    e.preventDefault();
    const targetHotelId = newRoomHotelId || currentHotel?.id;
    if (!newRoomNum.trim() || !targetHotelId) return;
    setAddingRoom(true);

    const { data, error } = await supabase.from('rooms').insert([{
      hotel_id:    targetHotelId,
      room_number: newRoomNum.trim(),
      type:        newRoomType,
      price:       Number(newRoomRate),
      status:      'available',
    }]).select('*, hotels:hotel_id(id, name)').maybeSingle();

    if (!error && data) {
      setRooms((prev) => [...prev, data]);
      showToast(`Room #${newRoomNum} added to inventory! 🛏️`);
      setShowAddRoomModal(false);
      setNewRoomNum('');
    } else {
      alert(`Error adding room: ${error?.message || 'Unknown error'}`);
    }
    setAddingRoom(false);
  };

  const handleCleaningSubmit = (e) => {
    e.preventDefault();
    setCleaningSuccess(true);
    showToast('Cleaning request submitted!');
    setTimeout(() => {
      setCleaningSuccess(false);
      setShowCleaningModal(false);
    }, 1500);
  };

  return (
    <OwnerLayout onAddRoomClick={() => setShowAddRoomModal(true)}>
      <div className="space-y-6">

        {/* ── Top Header Actions ── */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#191c1e] tracking-tight">Overview</h1>
            <p className="text-xs sm:text-sm text-[#45464d] mt-0.5">
              Welcome back to <span className="font-bold text-[#191c1e]">{selectedHotelId === 'all' ? 'All Properties' : currentHotel?.name || 'Hotel'}</span> operations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Multi-Property Switcher */}
            <select
              value={selectedHotelId}
              onChange={(e) => setSelectedHotelId(e.target.value)}
              className="bg-white border border-[#c6c6cd] text-[#191c1e] text-xs font-bold px-3 py-2.5 rounded-xl shadow-xs outline-none focus:border-[#131b2e] cursor-pointer"
            >
              <option value="all">🏢 All Properties ({hotels.length})</option>
              {hotels.map((h) => (
                <option key={h.id} value={h.id}>🏨 {h.name}</option>
              ))}
            </select>

            <button
              onClick={() => navigate('/owner/register-property')}
              className="bg-[#fea619] text-[#2a1700] px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-[#e59410] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
            >
              <span className="material-symbols-outlined text-base">domain_add</span>
              + Register New Hotel
            </button>

            <button
              onClick={() => setShowCleaningModal(true)}
              className="bg-[#131b2e] text-white px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-[#1e2d47] transition-all flex items-center gap-1.5 shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
            >
              <span className="material-symbols-outlined text-base">cleaning_services</span>
              Request Free Cleaning
            </button>
          </div>
        </header>

        {/* Toast Alert */}
        {toastMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fadeIn">
            <span className="material-symbols-outlined text-base text-emerald-600">check_circle</span>
            {toastMessage}
          </div>
        )}

        {/* ── Stats Bento Grid (Real-Time Synced) ── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Revenue */}
          <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-[#45464d] uppercase tracking-wide">Total Revenue</span>
              <span className="material-symbols-outlined text-[#855300] bg-[#ffddb8]/60 p-2.5 rounded-xl text-xl">payments</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#191c1e] tracking-tight">
                {dataLoading ? '…' : `$${totalRevenue.toLocaleString()}`}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-2">
                <span className="material-symbols-outlined text-base">trending_up</span>
                <span>From {totalBookingsCount} total bookings</span>
              </div>
            </div>
          </div>

          {/* Bookings */}
          <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] flex flex-col justify-between shadow-xs">
            <div className="flex justify-between items-start">
              <span className="text-xs font-bold text-[#45464d] uppercase tracking-wide">Total Bookings</span>
              <span className="material-symbols-outlined text-[#3980f4] bg-[#d8e2ff]/60 p-2.5 rounded-xl text-xl">book_online</span>
            </div>
            <div className="mt-3">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#191c1e] tracking-tight">
                {dataLoading ? '…' : totalBookingsCount}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#45464d] mt-2">
                <span className="text-emerald-600 font-bold">{confirmedBookingsCount} active/confirmed</span>
              </div>
            </div>
          </div>

          {/* Room Availability */}
          <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] flex flex-col justify-between shadow-xs relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <span className="text-xs font-bold text-[#45464d] uppercase tracking-wide">Room Availability</span>
              <span className="material-symbols-outlined text-[#131b2e] bg-[#dae2fd] p-2.5 rounded-xl text-xl">key</span>
            </div>
            <div className="mt-3 relative z-10">
              <div className="text-3xl sm:text-4xl font-extrabold text-[#191c1e] tracking-tight">
                {dataLoading ? '…' : `${availabilityPct}%`}
              </div>
              <div className="flex items-center gap-1 text-xs font-semibold text-[#45464d] mt-2">
                <span>{dataLoading ? '…' : `${availableRoomsCount} of ${totalRoomsCount} rooms available`}</span>
              </div>
            </div>
            <div className="absolute bottom-0 right-0 left-0 h-10 bg-gradient-to-t from-[#dae2fd]/40 to-transparent pointer-events-none" />
          </div>
        </section>

        {/* ── Main 2-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left Column (2/3 width) ── */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Dynamic Reservation Timeline ── */}
            <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden shadow-xs">
              <div className="p-5 border-b border-[#e0e3e5] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-[#f7f9fb]">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-[#191c1e]">Reservation Timeline</h3>
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      weekOffset === 0
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : weekOffset > 0
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {weekOffset === 0 ? '● Current Week' : weekOffset > 0 ? `+${weekOffset} Week${weekOffset > 1 ? 's' : ''}` : `${weekOffset} Week${weekOffset < -1 ? 's' : ''}`}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-[#76777d] mt-0.5">
                    {weekRangeText} &bull; Live occupancy schedule
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-[#c6c6cd] shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setWeekOffset((w) => w - 1)}
                    className="p-1.5 rounded-lg hover:bg-[#f2f4f6] text-[#45464d] hover:text-[#191c1e] transition-colors cursor-pointer flex items-center justify-center"
                    title="Previous Week"
                    aria-label="Previous Week"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_left</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekOffset(0)}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      weekOffset === 0
                        ? 'bg-[#131b2e] text-white shadow-xs'
                        : 'text-[#45464d] hover:bg-[#f2f4f6] hover:text-[#191c1e]'
                    }`}
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setWeekOffset((w) => w + 1)}
                    className="p-1.5 rounded-lg hover:bg-[#f2f4f6] text-[#45464d] hover:text-[#191c1e] transition-colors cursor-pointer flex items-center justify-center"
                    title="Next Week"
                    aria-label="Next Week"
                  >
                    <span className="material-symbols-outlined text-lg">chevron_right</span>
                  </button>
                </div>
              </div>

              {/* 7-Day Timeline Grid */}
              <div className="p-5 overflow-x-auto">
                <div className="min-w-[620px]">
                  <div className="grid grid-cols-7 gap-2.5 mb-3">
                    {weekDays.map((dayDate, i) => {
                      const isToday = isTodayDate(dayDate);
                      const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;
                      const dayName = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dayDate.getDay()];
                      const dateNum = String(dayDate.getDate()).padStart(2, '0');

                      return (
                        <div
                          key={i}
                          className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl transition-all ${
                            isToday
                              ? 'bg-[#131b2e] text-white shadow-md ring-2 ring-[#fea619]'
                              : isWeekend
                              ? 'bg-purple-50/70 border border-purple-200/80 text-purple-950'
                              : 'bg-[#f7f9fb] border border-[#e0e3e5] text-[#45464d]'
                          }`}
                        >
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-amber-300' : isWeekend ? 'text-purple-600' : 'text-[#76777d]'}`}>
                            {dayName}
                          </span>
                          <span className={`text-base font-extrabold ${isToday ? 'text-white' : 'text-[#191c1e]'}`}>
                            {dateNum}
                          </span>
                          {isToday && (
                            <span className="text-[9px] font-bold bg-[#fea619] text-[#2a1700] px-1.5 rounded-full mt-0.5 uppercase tracking-tight">
                              Today
                            </span>
                          )}
                          {isWeekend && !isToday && (
                            <span className="text-[9px] font-semibold text-purple-600">
                              Weekend
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Days Body Cells */}
                  <div className="grid grid-cols-7 gap-2.5">
                    {weekDays.map((dayDate, i) => {
                      const dayKey = formatDateKey(dayDate);
                      const isToday = isTodayDate(dayDate);
                      const isWeekend = dayDate.getDay() === 0 || dayDate.getDay() === 6;

                      // Find bookings on that day
                      const dayBookings = displayBookings.filter((b) => {
                        if (b.status === 'cancelled') return false;
                        const start = b.check_in;
                        const end = b.check_out;
                        return dayKey >= start && dayKey <= end;
                      });

                      return (
                        <div
                          key={i}
                          className={`min-h-[140px] rounded-xl p-2 flex flex-col justify-between border transition-all ${
                            isToday
                              ? 'bg-amber-50/60 border-amber-300 shadow-xs'
                              : 'bg-[#fafafa] border-[#e0e3e5]'
                          }`}
                        >
                          {dayBookings.length > 0 ? (
                            dayBookings.slice(0, 2).map((b) => {
                              const isStart = b.check_in === dayKey;
                              const isEnd = b.check_out === dayKey;
                              const guestName = b.profiles?.full_name || 'Guest';

                              return (
                                <div
                                  key={b.id}
                                  className={`rounded-lg p-2 text-xs font-semibold mb-1 shadow-2xs border ${
                                    isStart
                                      ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                      : isEnd
                                      ? 'bg-amber-50 text-amber-900 border-amber-300'
                                      : 'bg-blue-50 text-blue-900 border-blue-200'
                                  }`}
                                >
                                  <div className="flex items-center justify-between text-[10px] font-bold">
                                    <span className="truncate">{b.rooms?.room_number ? `#${b.rooms.room_number}` : 'Room'}</span>
                                    <span className="text-[9px] uppercase">
                                      {isStart ? 'Check-In' : isEnd ? 'Check-Out' : 'Stay'}
                                    </span>
                                  </div>
                                  <div className="text-[11px] font-bold truncate mt-0.5">{guestName}</div>
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center p-1 opacity-70">
                              <span className="text-[10px] font-semibold text-[#76777d]">
                                {isWeekend ? 'Open Stays' : 'Rooms Ready'}
                              </span>
                              <span className="text-[9px] text-[#9ca3af] mt-0.5">
                                {displayRooms.length > 0 ? `${displayRooms.length} available` : 'Cleaned'}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[#e0e3e5] flex flex-wrap items-center justify-between gap-3 text-xs text-[#76777d]">
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                      Check-in Day
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block"></span>
                      Active In-House
                    </span>
                    <span className="flex items-center gap-1.5 font-medium">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                      Check-out Day
                    </span>
                  </div>

                  <button
                    onClick={() => navigate('/owner/bookings')}
                    className="text-xs font-bold text-[#855300] hover:text-[#2a1700] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    View All Bookings &rarr;
                  </button>
                </div>
              </div>
            </div>

            {/* ── Active Bookings Live Check-In / Check-Out Controls ── */}
            <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-base text-[#191c1e]">Active Stays & Check-In Operations</h3>
                  <p className="text-xs text-[#76777d]">Perform instant Guest Check-In & Check-Out status updates</p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-[#131b2e] text-white rounded-full">
                  {displayBookings.filter(b => b.status === 'confirmed' || b.status === 'checked_in').length} In-House / Upcoming
                </span>
              </div>

              {displayBookings.length === 0 ? (
                <p className="text-xs text-[#76777d] py-6 text-center">No bookings currently recorded for this property selection.</p>
              ) : (
                <div className="divide-y divide-[#f2f4f6]">
                  {displayBookings.slice(0, 5).map((b) => {
                    const isUpdating = updatingBookingId === b.id;
                    const guestName = b.profiles?.full_name || 'Guest';

                    return (
                      <div key={b.id} className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-[#191c1e]">{guestName}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                              b.status === 'checked_in'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-800'
                                : b.status === 'completed'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {b.status?.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-[#76777d] mt-0.5">
                            {b.hotels?.name} &bull; {b.rooms?.type || 'Room'}{b.rooms?.room_number ? ` #${b.rooms.room_number}` : ''} &bull; {b.check_in} to {b.check_out}
                          </p>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-center">
                          {(b.status === 'confirmed' || b.status === 'pending') && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'checked_in', `Guest ${guestName} checked in!`)}
                              disabled={isUpdating}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">key</span>
                              <span>Check In</span>
                            </button>
                          )}

                          {b.status === 'checked_in' && (
                            <button
                              onClick={() => handleUpdateBookingStatus(b.id, 'completed', `Guest ${guestName} checked out!`)}
                              disabled={isUpdating}
                              className="px-3 py-1.5 text-xs font-bold text-white bg-[#004395] hover:bg-[#003170] rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50 flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-sm">logout</span>
                              <span>Check Out</span>
                            </button>
                          )}

                          {b.status === 'completed' && (
                            <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                              Completed ✅
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Property Gallery (Permanent Local & DB Storage) ── */}
            <div className="bg-white rounded-2xl p-6 border border-[#e0e3e5] shadow-xs">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-base text-[#191c1e]">Property Gallery</h3>
                  <p className="text-xs text-[#76777d]">Showcase photos for {currentHotel?.name || 'hotel'}</p>
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
                        className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-sm cursor-pointer"
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
              <h3 className="font-bold text-base text-[#191c1e] mb-1">Profile Details</h3>
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
                    className="w-full p-3 rounded-xl border border-[#c6c6cd] focus:border-[#131b2e] outline-none text-xs bg-white font-medium text-[#191c1e]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase tracking-wide mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#c6c6cd] focus:border-[#131b2e] outline-none text-xs bg-white font-medium text-[#191c1e]"
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
                      className="w-full p-3 pl-8 rounded-xl border border-[#c6c6cd] focus:border-[#131b2e] outline-none text-xs bg-white font-medium text-[#191c1e]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#131b2e] text-white py-3 rounded-xl text-xs font-bold hover:bg-[#1e2d47] transition-colors shadow-xs cursor-pointer mt-2"
                >
                  Save Changes
                </button>
              </form>
            </div>

            {/* Customer Reviews List */}
            <div className="bg-white rounded-2xl border border-[#e0e3e5] shadow-xs flex flex-col">
              <div className="p-5 border-b border-[#e0e3e5]">
                <h3 className="font-bold text-base text-[#191c1e]">Recent Reviews</h3>
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
                        <span className="font-bold text-xs text-[#191c1e]">{authorName}</span>
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

        {/* ── Modal 1: Add Room ── */}
        {showAddRoomModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-4 border-b border-[#e0e3e5] pb-3">
                <h2 className="text-base font-bold text-[#191c1e]">Add Room to Property</h2>
                <button onClick={() => setShowAddRoomModal(false)} className="text-[#76777d] hover:text-[#191c1e]">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleAddRoomSubmit} className="space-y-3.5">
                {hotels.length > 1 && (
                  <div>
                    <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Target Property</label>
                    <select
                      value={newRoomHotelId}
                      onChange={(e) => setNewRoomHotelId(e.target.value)}
                      className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none bg-white font-medium focus:border-[#131b2e]"
                    >
                      {hotels.map((h) => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Room Number / Identifier *</label>
                  <input
                    type="text"
                    placeholder="e.g. 101, 204"
                    value={newRoomNum}
                    onChange={(e) => setNewRoomNum(e.target.value)}
                    required
                    className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#131b2e]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Room Type</label>
                    <select
                      value={newRoomType}
                      onChange={(e) => setNewRoomType(e.target.value)}
                      className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none bg-white font-medium focus:border-[#131b2e]"
                    >
                      <option value="Deluxe Suite">Deluxe Suite</option>
                      <option value="Standard King">Standard King</option>
                      <option value="Executive Suite">Executive Suite</option>
                      <option value="Ocean View Villa">Ocean View Villa</option>
                      <option value="Presidential Penthouse">Presidential Penthouse</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Nightly Rate ($)</label>
                    <input
                      type="number"
                      value={newRoomRate}
                      onChange={(e) => setNewRoomRate(e.target.value)}
                      required
                      className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#131b2e]"
                    />
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3">
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
                    className="flex-1 py-2.5 text-xs font-bold bg-[#131b2e] text-white rounded-xl hover:bg-[#1e2d47] disabled:opacity-50"
                  >
                    {addingRoom ? 'Adding…' : 'Add Room'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal 2: Upload Photo ── */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-4 border-b border-[#e0e3e5] pb-3">
                <h2 className="text-base font-bold text-[#191c1e]">Add Photo to Gallery</h2>
                <button onClick={() => setShowUploadModal(false)} className="text-[#76777d] hover:text-[#191c1e]">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleAddImage} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Image URL (HTTPS link) *</label>
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newImgUrl}
                    onChange={(e) => setNewImgUrl(e.target.value)}
                    required
                    className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#131b2e]"
                  />
                  <p className="text-[11px] text-[#76777d] mt-1">
                    Paste a direct high-resolution image URL. It will stay permanently saved for this property.
                  </p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 py-2.5 text-xs font-semibold border border-[#c6c6cd] rounded-xl hover:bg-[#f2f4f6]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs font-bold bg-[#131b2e] text-white rounded-xl hover:bg-[#1e2d47]"
                  >
                    Save Photo
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal 3: Request Cleaning ── */}
        {showCleaningModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-4 border-b border-[#e0e3e5] pb-3">
                <h2 className="text-base font-bold text-[#191c1e]">Request Free Cleaning Service</h2>
                <button onClick={() => setShowCleaningModal(false)} className="text-[#76777d] hover:text-[#191c1e]">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <form onSubmit={handleCleaningSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Select Room</label>
                  <select
                    value={cleaningRoom}
                    onChange={(e) => setCleaningRoom(e.target.value)}
                    className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none bg-white font-medium focus:border-[#131b2e]"
                  >
                    <option value="">All Rooms / Common Areas</option>
                    {displayRooms.map((r) => (
                      <option key={r.id} value={r.id}>Room {r.room_number || r.id.slice(0, 4)} ({r.type})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#45464d] uppercase mb-1">Service Type</label>
                  <select
                    value={cleaningType}
                    onChange={(e) => setCleaningType(e.target.value)}
                    className="w-full p-2.5 border border-[#c6c6cd] rounded-xl text-xs outline-none bg-white font-medium focus:border-[#131b2e]"
                  >
                    <option value="Checkout">Checkout Deep Clean</option>
                    <option value="Daily">Daily Refresh & Towels</option>
                    <option value="Sanitization">Full Sanitization & Linen</option>
                  </select>
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowCleaningModal(false)}
                    className="flex-1 py-2.5 text-xs font-semibold border border-[#c6c6cd] rounded-xl hover:bg-[#f2f4f6]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs font-bold bg-[#131b2e] text-white rounded-xl hover:bg-[#1e2d47]"
                  >
                    Dispatch Cleaner
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal 4: Reply Review ── */}
        {selectedReview && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
              <div className="flex items-center justify-between mb-4 border-b border-[#e0e3e5] pb-3">
                <h2 className="text-base font-bold text-[#191c1e]">Reply to Guest Review</h2>
                <button onClick={() => setSelectedReview(null)} className="text-[#76777d] hover:text-[#191c1e]">
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>

              <div className="mb-3 p-3 bg-[#f7f9fb] rounded-xl border border-[#e0e3e5] text-xs">
                <p className="font-bold text-[#191c1e] mb-1">{selectedReview.profiles?.full_name || 'Guest'}:</p>
                <p className="text-[#45464d] italic">"{selectedReview.comment}"</p>
              </div>

              <form onSubmit={handleSendReply} className="space-y-3.5">
                <textarea
                  rows={4}
                  placeholder="Write your response to the guest…"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  required
                  className="w-full p-3 border border-[#c6c6cd] rounded-xl text-xs outline-none focus:border-[#131b2e]"
                />

                <div className="flex gap-2.5">
                  <button
                    type="button"
                    onClick={() => setSelectedReview(null)}
                    className="flex-1 py-2.5 text-xs font-semibold border border-[#c6c6cd] rounded-xl hover:bg-[#f2f4f6]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 text-xs font-bold bg-[#131b2e] text-white rounded-xl hover:bg-[#1e2d47]"
                  >
                    Send Reply
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </OwnerLayout>
  );
}
