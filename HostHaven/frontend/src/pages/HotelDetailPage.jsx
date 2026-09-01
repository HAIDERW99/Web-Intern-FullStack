import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

const AMENITY_ICONS = {
  'Pool': '🏊', 'Spa': '💆', 'Free WiFi': '📶', 'Fitness Center': '🏋️',
  'Restaurant': '🍽️', 'Bar': '🍸', 'Room Service': '🛎️', 'Concierge': '🎩',
  'Valet Parking': '🚗', 'Beach Access': '🏖️', 'Business Center': '💼',
  'Nature Trails': '🌲', 'Pet Friendly': '🐾', 'Beachfront': '🌊', 'Private Pool': '🏊',
  'Parking': '🅿️', 'Airport Shuttle': '🚌', 'Kids Club': '🎠',
};

const CATEGORY_IMAGE = {
  hotel:     'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=900&q=80',
  resort:    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=900&q=80',
  villa:     'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=900&q=80',
  apartment: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=900&q=80',
};

function StarRow({ rating, size = 'sm' }) {
  const sz = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} className={`${sz} ${i <= Math.round(rating) ? 'text-[#fea619] fill-[#fea619]' : 'text-[#e0e3e5] fill-[#e0e3e5]'}`} viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </span>
  );
}

export default function HotelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [hotel, setHotel]       = useState(null);
  const [rooms, setRooms]       = useState([]);
  const [reviews, setReviews]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  const [activeImg, setActiveImg]         = useState(0);
  const [checkIn, setCheckIn]             = useState('');
  const [checkOut, setCheckOut]           = useState('');
  const [guests, setGuests]               = useState(1);
  const [selectedRoom, setSelectedRoom]   = useState(null);
  const [liked, setLiked]                 = useState(false);

  // Booking state
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError]     = useState('');

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      setError('');

      const [hotelRes, roomsRes, reviewsRes] = await Promise.all([
        supabase.from('hotels').select('*').eq('id', id).eq('status', 'approved').maybeSingle(),
        supabase.from('rooms').select('*').eq('hotel_id', id).eq('status', 'available').order('price'),
        supabase.from('reviews').select('*, profiles:customer_id(full_name)').eq('hotel_id', id).order('created_at', { ascending: false }),
      ]);

      if (hotelRes.error || !hotelRes.data) {
        setError('Property not found or unavailable.');
      } else {
        setHotel(hotelRes.data);
        setRooms(roomsRes.data || []);
        setReviews(reviewsRes.data || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [id]);

  const nights = checkIn && checkOut
    ? Math.max(0, Math.round((new Date(checkOut) - new Date(checkIn)) / 86400000))
    : 0;
  const roomPrice  = selectedRoom ? Number(selectedRoom.price) : (hotel ? Number(hotel.price_per_night) : 0);
  const serviceFee = nights > 0 ? Math.round(roomPrice * nights * 0.12) : 0;
  const totalPrice = nights > 0 ? roomPrice * nights + serviceFee : 0;

  const handleBooking = async () => {
    if (!user) { navigate('/login'); return; }
    if (!checkIn || !checkOut || nights <= 0) {
      setBookingError('Please select valid check-in and check-out dates.');
      return;
    }
    setBookingLoading(true);
    setBookingError('');
    try {
      const { error: err } = await supabase.from('bookings').insert([{
        customer_id:  user.id,
        hotel_id:     hotel.id,
        room_id:      selectedRoom?.id || null,
        check_in:     checkIn,
        check_out:    checkOut,
        guests,
        total_amount: totalPrice,
        service_fee:  serviceFee,
        status:       'confirmed',
      }]);
      if (err) throw err;

      // Mark room as occupied
      if (selectedRoom) {
        await supabase.from('rooms').update({ status: 'occupied' }).eq('id', selectedRoom.id);
      }
      setBookingSuccess(true);
    } catch (err) {
      console.error(err);
      setBookingError(err.message || 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f9fb]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-10 animate-pulse">
          <div className="h-80 bg-[#e0e3e5] rounded-2xl mb-6" />
          <div className="flex gap-6">
            <div className="flex-1 space-y-4">
              <div className="h-40 bg-[#e0e3e5] rounded-xl" />
              <div className="h-32 bg-[#e0e3e5] rounded-xl" />
            </div>
            <div className="w-80 h-64 bg-[#e0e3e5] rounded-xl hidden lg:block" />
          </div>
        </div>
      </div>
    );
  }

  // ── Not Found ────────────────────────────────────────────────────────────
  if (error || !hotel) {
    return (
      <div className="min-h-screen bg-[#f7f9fb]">
        <Navbar />
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <p className="text-5xl mb-4">🏨</p>
          <h1 className="text-xl font-semibold text-[#191c1e] mb-2">Property not found</h1>
          <p className="text-sm text-[#76777d] mb-5">{error || 'This listing may have been removed or is unavailable.'}</p>
          <Link to="/" className="px-5 py-2.5 bg-[#131b2e] text-white text-sm font-semibold rounded-lg hover:bg-[#1e2d47] transition-colors">
            Browse Properties
          </Link>
        </div>
      </div>
    );
  }

  const mainImage = hotel.image_url || hotel.cover_image_url || CATEGORY_IMAGE[hotel.category] || CATEGORY_IMAGE.hotel;
  const amenities = Array.isArray(hotel.amenities) ? hotel.amenities : [];
  const location  = [hotel.city, hotel.country].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6">

        {/* ── Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-xs text-[#76777d] mb-4">
          <Link to="/" className="hover:text-[#191c1e] transition-colors">Explore</Link>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          <span className="text-[#191c1e] font-medium truncate">{hotel.name}</span>
        </nav>

        {/* ── Image Gallery ── */}
        <div className="relative rounded-2xl overflow-hidden h-72 sm:h-80 lg:h-96 mb-6">
          <img
            src={mainImage}
            alt={hotel.name}
            className="w-full h-full object-cover"
            onError={(e) => { e.target.src = CATEGORY_IMAGE.hotel; }}
          />
          <div className="absolute top-3 right-3 bg-[#131b2e]/80 text-white text-xs font-semibold px-3 py-1 rounded-lg capitalize">
            {hotel.category}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Title + Rating */}
            <div className="bg-white rounded-xl border border-[#e0e3e5] p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-bold text-[#191c1e] leading-tight">{hotel.name}</h1>
                  <div className="flex items-center gap-1.5 mt-1.5 text-sm text-[#76777d]">
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {location || 'Location not specified'}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <StarRow rating={hotel.rating || 0} />
                    <span className="text-sm font-semibold text-[#191c1e]">{Number(hotel.rating || 0).toFixed(1)}</span>
                    <span className="text-sm text-[#76777d]">({hotel.review_count || 0} reviews)</span>
                  </div>
                </div>
                <button onClick={() => setLiked(v => !v)}
                  className="w-10 h-10 flex items-center justify-center border border-[#e0e3e5] rounded-full hover:bg-[#f2f4f6] transition-colors flex-shrink-0">
                  <svg className={`w-5 h-5 transition-colors ${liked ? 'text-red-500 fill-red-500' : 'text-[#45464d]'}`}
                    viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
              {hotel.description && (
                <p className="text-sm text-[#45464d] leading-relaxed mt-4">{hotel.description}</p>
              )}
              {!hotel.description && (
                <p className="text-sm text-[#76777d] italic mt-4">
                  {hotel.category?.charAt(0).toUpperCase()}{hotel.category?.slice(1)} located in {location}.
                  {hotel.room_count ? ` ${hotel.room_count} rooms available.` : ''}
                </p>
              )}
            </div>

            {/* Amenities */}
            {amenities.length > 0 && (
              <div className="bg-white rounded-xl border border-[#e0e3e5] p-5">
                <h2 className="font-semibold text-[#191c1e] mb-4">Amenities</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {amenities.map((a) => (
                    <div key={a} className="flex items-center gap-2.5 bg-[#f7f9fb] rounded-lg px-3 py-2.5">
                      <span className="text-base flex-shrink-0">{AMENITY_ICONS[a] ?? '✓'}</span>
                      <span className="text-xs font-medium text-[#45464d]">{a}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Room Selection */}
            <div className="bg-white rounded-xl border border-[#e0e3e5] p-5">
              <h2 className="font-semibold text-[#191c1e] mb-4">Available Rooms</h2>
              {rooms.length === 0 ? (
                <div className="text-center py-8 text-[#76777d]">
                  <p className="text-2xl mb-2">🛏️</p>
                  <p className="text-sm">No rooms available right now. Check back soon!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {rooms.map((room) => (
                    <div key={room.id}
                      onClick={() => setSelectedRoom(selectedRoom?.id === room.id ? null : room)}
                      className={`flex gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all duration-150
                        ${selectedRoom?.id === room.id
                          ? 'border-[#fea619] bg-[#fffbf2]'
                          : 'border-[#e0e3e5] hover:border-[#c6c6cd] bg-white'}`}>
                      {room.image_url && (
                        <div className="w-20 h-16 rounded-lg overflow-hidden flex-shrink-0">
                          <img src={room.image_url} alt={room.type} className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-[#191c1e]">{room.type || 'Standard Room'}</p>
                            <p className="text-xs text-[#76777d] mt-0.5">
                              {room.beds || '1 Bed'}{room.size_sqm ? ` · ${room.size_sqm} m²` : ''}
                              {room.room_number ? ` · Room ${room.room_number}` : ''}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-bold text-[#191c1e]">${Number(room.price).toFixed(0)}</p>
                            <p className="text-[10px] text-[#76777d]">/night</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            Available
                          </span>
                          {selectedRoom?.id === room.id && (
                            <span className="text-[10px] font-semibold text-[#fea619] flex items-center gap-1">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              Selected
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-xl border border-[#e0e3e5] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#191c1e]">Guest Reviews</h2>
                <div className="flex items-center gap-2">
                  <StarRow rating={hotel.rating || 0} />
                  <span className="text-sm font-bold text-[#191c1e]">{Number(hotel.rating || 0).toFixed(1)}</span>
                  <span className="text-xs text-[#76777d]">({hotel.review_count || 0})</span>
                </div>
              </div>
              {reviews.length === 0 ? (
                <p className="text-sm text-[#76777d] text-center py-6">No reviews yet. Be the first to review!</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map((r, i) => {
                    const authorName = r.profiles?.full_name || 'Guest';
                    return (
                      <div key={r.id} className={`pb-4 ${i < reviews.length - 1 ? 'border-b border-[#f2f4f6]' : ''}`}>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-8 h-8 rounded-full bg-[#131b2e] text-white text-xs font-bold flex items-center justify-center flex-shrink-0 uppercase">
                            {authorName[0]}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-[#191c1e]">{authorName}</p>
                            <p className="text-[10px] text-[#76777d]">
                              {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                          <div className="ml-auto">
                            <StarRow rating={r.rating} size="sm" />
                          </div>
                        </div>
                        <p className="text-xs text-[#45464d] leading-relaxed">{r.comment}</p>
                        {r.reply && (
                          <div className="mt-2 ml-4 pl-3 border-l-2 border-[#fea619]">
                            <p className="text-[10px] font-semibold text-[#131b2e] mb-0.5">Owner's Reply</p>
                            <p className="text-xs text-[#45464d]">{r.reply}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Booking Card (sticky) ── */}
          <div className="lg:w-80 flex-shrink-0">
            <div className="bg-white rounded-xl border border-[#e0e3e5] p-5 sticky top-24">

              {bookingSuccess ? (
                <div className="text-center py-4 space-y-3">
                  <div className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mx-auto">
                    <svg className="w-7 h-7 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="font-bold text-[#191c1e] text-sm">Booking Confirmed! 🎉</p>
                  <p className="text-xs text-[#76777d]">Check your reservations for details.</p>
                  <Link to="/reservations" className="block w-full py-2.5 bg-[#131b2e] text-white text-xs font-semibold rounded-lg hover:bg-[#1e2d47] transition-colors text-center">
                    View My Reservations
                  </Link>
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-2xl font-bold text-[#191c1e]">${roomPrice}</span>
                    <span className="text-sm text-[#76777d]">/night</span>
                  </div>
                  {selectedRoom && (
                    <p className="text-xs text-[#76777d] mb-3">{selectedRoom.type}</p>
                  )}
                  <StarRow rating={hotel.rating || 0} />
                  <span className="text-xs text-[#76777d] ml-1.5">{hotel.review_count || 0} reviews</span>

                  <div className="mt-4 border border-[#e0e3e5] rounded-xl overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-[#e0e3e5]">
                      <div className="p-3">
                        <label className="block text-[10px] font-semibold text-[#45464d] uppercase tracking-wide mb-1">Check-in</label>
                        <input type="date" value={checkIn}
                          onChange={(e) => setCheckIn(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full text-xs text-[#191c1e] outline-none bg-transparent cursor-pointer" />
                      </div>
                      <div className="p-3">
                        <label className="block text-[10px] font-semibold text-[#45464d] uppercase tracking-wide mb-1">Check-out</label>
                        <input type="date" value={checkOut}
                          onChange={(e) => setCheckOut(e.target.value)}
                          min={checkIn || new Date().toISOString().split('T')[0]}
                          className="w-full text-xs text-[#191c1e] outline-none bg-transparent cursor-pointer" />
                      </div>
                    </div>
                    <div className="border-t border-[#e0e3e5] p-3">
                      <label className="block text-[10px] font-semibold text-[#45464d] uppercase tracking-wide mb-1">Guests</label>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-[#191c1e]">{guests} Guest{guests > 1 ? 's' : ''}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => setGuests(g => Math.max(1, g - 1))}
                            className="w-7 h-7 rounded-full border border-[#c6c6cd] flex items-center justify-center text-[#45464d] hover:bg-[#f2f4f6] transition-colors text-sm font-bold">−</button>
                          <span className="text-sm font-semibold text-[#191c1e] w-4 text-center">{guests}</span>
                          <button onClick={() => setGuests(g => Math.min(10, g + 1))}
                            className="w-7 h-7 rounded-full border border-[#c6c6cd] flex items-center justify-center text-[#45464d] hover:bg-[#f2f4f6] transition-colors text-sm font-bold">+</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {nights > 0 && (
                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between text-[#45464d]">
                        <span>${roomPrice} × {nights} night{nights > 1 ? 's' : ''}</span>
                        <span>${(roomPrice * nights).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[#45464d]">
                        <span>Service fee</span>
                        <span>${serviceFee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between font-bold text-[#191c1e] pt-2 border-t border-[#f2f4f6]">
                        <span>Total</span>
                        <span>${totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  {bookingError && (
                    <p className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">{bookingError}</p>
                  )}

                  <button
                    onClick={handleBooking}
                    disabled={bookingLoading || !checkIn || !checkOut || nights <= 0}
                    className="mt-4 w-full py-3 bg-[#fea619] text-[#2a1700] font-semibold text-sm rounded-lg hover:bg-[#e89600] transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {bookingLoading ? 'Confirming…' : !checkIn || !checkOut ? 'Select Dates to Book' : nights <= 0 ? 'Invalid dates' : user ? 'Reserve Now' : 'Login to Book'}
                  </button>
                  <p className="text-center text-[11px] text-[#76777d] mt-2">You won't be charged yet</p>
                </>
              )}
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </div>
  );
}
