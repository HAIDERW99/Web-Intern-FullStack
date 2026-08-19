import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { supabase } from '../lib/supabase';

const AMENITY_OPTIONS = ['Free WiFi', 'Pool', 'Spa', 'Fitness Center', 'Pet Friendly', 'Beachfront'];
const SORT_OPTIONS    = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Top Rated'];

// Default hotel images by category for listings that have no image yet
const CATEGORY_IMAGES = {
  hotel:     'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=75',
  resort:    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=600&q=75',
  villa:     'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=600&q=75',
  apartment: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=600&q=75',
};

// ─── Star Rating ──────────────────────────────────────────────────────────
function StarRating({ value }) {
  return (
    <span className="flex items-center gap-1 text-xs font-semibold text-[#191c1e]">
      <svg className="w-3.5 h-3.5 text-[#fea619] fill-[#fea619]" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      {value > 0 ? Number(value).toFixed(1) : 'New'}
    </span>
  );
}

// ─── Hotel Card ───────────────────────────────────────────────────────────
function HotelCard({ hotel }) {
  const [liked, setLiked] = useState(false);
  const imgSrc = hotel.image_url || hotel.cover_image_url || CATEGORY_IMAGES[hotel.category] || CATEGORY_IMAGES.hotel;
  const location = [hotel.city, hotel.country].filter(Boolean).join(', ');
  const amenities = Array.isArray(hotel.amenities) ? hotel.amenities : [];

  return (
    <div className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden hover:shadow-float transition-shadow duration-200 group">
      {/* Image */}
      <div className="relative overflow-hidden h-44">
        <img
          src={imgSrc}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => { e.target.src = CATEGORY_IMAGES.hotel; }}
        />
        {/* Rating badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-sm rounded-lg px-2 py-1">
          <StarRating value={hotel.rating} />
        </div>
        {/* Category badge */}
        <div className="absolute bottom-3 left-3 bg-[#131b2e]/80 text-white text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize">
          {hotel.category}
        </div>
        {/* Wishlist */}
        <button
          onClick={() => setLiked((v) => !v)}
          aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/95 backdrop-blur-sm rounded-full hover:scale-110 transition-transform"
        >
          <svg
            className={`w-4 h-4 transition-colors ${liked ? 'text-red-500 fill-red-500' : 'text-[#45464d]'}`}
            viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} fill="none"
          >
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-[#191c1e] text-sm leading-snug mb-1 truncate">{hotel.name}</h3>

        <div className="flex items-center gap-1 text-xs text-[#76777d] mb-3">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{location || 'Location N/A'}</span>
        </div>

        {/* Amenity chips */}
        {amenities.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {amenities.slice(0, 3).map((a) => (
              <span key={a} className="text-[11px] font-medium text-[#45464d] bg-[#f2f4f6] px-2 py-0.5 rounded-full">
                {a}
              </span>
            ))}
            {amenities.length > 3 && (
              <span className="text-[11px] font-medium text-[#76777d] bg-[#f2f4f6] px-2 py-0.5 rounded-full">
                +{amenities.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Price + CTA */}
        <div className="flex items-center justify-between pt-2 border-t border-[#f2f4f6]">
          <div>
            <span className="text-lg font-bold text-[#191c1e]">${Number(hotel.price_per_night).toFixed(0)}</span>
            <span className="text-xs text-[#76777d] ml-1">/night</span>
          </div>
          <Link
            to={`/hotels/${hotel.id}`}
            className="px-3 py-1.5 text-xs font-semibold text-[#855300] border border-[#fea619] rounded-lg hover:bg-[#fea619] hover:text-[#2a1700] transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-[#e0e3e5] overflow-hidden animate-pulse">
      <div className="h-44 bg-[#e0e3e5]" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-[#e0e3e5] rounded w-3/4" />
        <div className="h-3 bg-[#e0e3e5] rounded w-1/2" />
        <div className="flex gap-2">
          <div className="h-5 bg-[#e0e3e5] rounded-full w-16" />
          <div className="h-5 bg-[#e0e3e5] rounded-full w-16" />
        </div>
        <div className="flex justify-between pt-2 border-t border-[#f2f4f6]">
          <div className="h-6 bg-[#e0e3e5] rounded w-16" />
          <div className="h-7 bg-[#e0e3e5] rounded-lg w-24" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const [hotels, setHotels]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  const [destination, setDestination]       = useState('');
  const [priceMin, setPriceMin]             = useState('');
  const [priceMax, setPriceMax]             = useState('');
  const [sliderValue, setSliderValue]       = useState(1000);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy]                 = useState('Recommended');
  const [visibleCount, setVisibleCount]     = useState(9);

  // Fetch approved hotels from Supabase on mount
  useEffect(() => {
    async function fetchHotels() {
      setLoading(true);
      setError('');
      const { data, error: err } = await supabase
        .from('hotels')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (err) {
        console.error('Error fetching hotels:', err.message);
        setError('Failed to load properties. Please try again.');
      } else {
        setHotels(data || []);
      }
      setLoading(false);
    }
    fetchHotels();
  }, []);

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const clearFilters = () => {
    setPriceMin('');
    setPriceMax('');
    setSliderValue(1000);
    setSelectedAmenities([]);
    setDestination('');
  };

  // Filter + sort from real data
  const filtered = hotels.filter((h) => {
    const price = Number(h.price_per_night);
    const maxOk = price <= sliderValue;
    const minOk = priceMin ? price >= Number(priceMin) : true;
    const amenOk = selectedAmenities.length === 0 ||
      selectedAmenities.every((a) => (h.amenities || []).includes(a));
    const destOk = !destination ||
      h.name?.toLowerCase().includes(destination.toLowerCase()) ||
      h.city?.toLowerCase().includes(destination.toLowerCase()) ||
      h.country?.toLowerCase().includes(destination.toLowerCase());
    return maxOk && minOk && amenOk && destOk;
  }).sort((a, b) => {
    if (sortBy === 'Price: Low to High') return Number(a.price_per_night) - Number(b.price_per_night);
    if (sortBy === 'Price: High to Low') return Number(b.price_per_night) - Number(a.price_per_night);
    if (sortBy === 'Top Rated') return Number(b.rating) - Number(a.rating);
    return 0;
  });

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <Navbar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative h-[420px] overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=1600&q=80"
          alt="Luxury resort"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/30 to-black/50" />

        <div className="relative z-10 flex flex-col items-center justify-center h-full px-4 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-8 drop-shadow-lg">
            Find Your Perfect Stay
          </h1>

          {/* ── Search Bar ── */}
          <div className="bg-white rounded-2xl shadow-float p-2 w-full max-w-2xl flex flex-col sm:flex-row gap-0">
            {/* Destination */}
            <div className="flex-1 flex flex-col px-3 py-2 border-b sm:border-b-0 sm:border-r border-[#e0e3e5]">
              <label className="text-[10px] font-semibold text-[#76777d] uppercase tracking-wider mb-0.5">Destination</label>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-[#76777d] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="City, Country, or Hotel Name"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="flex-1 text-sm text-[#191c1e] placeholder:text-[#76777d] outline-none bg-transparent"
                />
              </div>
            </div>

            {/* Search Button */}
            <button className="m-1 px-5 py-2.5 bg-[#fea619] text-[#2a1700] font-semibold text-sm rounded-xl hover:bg-[#e89600] transition-colors flex items-center gap-2 flex-shrink-0">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </div>
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8">
        <div className="flex gap-6">

          {/* ── Filters Sidebar ── */}
          <aside className="hidden lg:block w-52 flex-shrink-0">
            <div className="bg-white rounded-xl border border-[#e0e3e5] p-4 sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-[#191c1e] text-sm">Filters</h2>
                <button
                  onClick={clearFilters}
                  className="text-xs font-medium text-[#fea619] hover:text-[#e89600] transition-colors"
                >
                  Clear all
                </button>
              </div>

              {/* Price Range */}
              <div className="mb-5">
                <p className="text-xs font-semibold text-[#45464d] mb-3">Price Range (per night)</p>
                <div className="flex gap-2 mb-3">
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-[#c6c6cd] rounded-lg outline-none focus:border-[#131b2e]"
                  />
                  <span className="flex items-center text-[#76777d] text-xs">–</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-full px-2 py-1.5 text-xs border border-[#c6c6cd] rounded-lg outline-none focus:border-[#131b2e]"
                  />
                </div>
                <input
                  type="range"
                  min={50}
                  max={2000}
                  value={sliderValue}
                  onChange={(e) => setSliderValue(Number(e.target.value))}
                  className="w-full accent-[#fea619] cursor-pointer"
                />
                <p className="text-[10px] text-[#76777d] mt-1">Up to ${sliderValue}/night</p>
              </div>

              {/* Amenities */}
              <div>
                <p className="text-xs font-semibold text-[#45464d] mb-3">Amenities</p>
                <div className="space-y-2">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <label key={amenity} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(amenity)}
                        onChange={() => toggleAmenity(amenity)}
                        className="w-3.5 h-3.5 rounded border-[#c6c6cd] accent-[#3980f4] cursor-pointer"
                      />
                      <span className="text-xs text-[#45464d] group-hover:text-[#191c1e] transition-colors">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* ── Results ── */}
          <div className="flex-1 min-w-0">
            {/* Header row */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-[#191c1e] text-base">
                {loading ? 'Loading…' : `${filtered.length} Properties Found`}
              </h2>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="appearance-none text-sm text-[#191c1e] font-medium bg-white border border-[#e0e3e5] rounded-lg px-3 py-2 pr-8 outline-none focus:border-[#131b2e] cursor-pointer"
                >
                  {SORT_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
                <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#45464d] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                {error}
              </div>
            )}

            {/* Skeleton Loading */}
            {loading && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => <SkeletonCard key={i} />)}
              </div>
            )}

            {/* Cards Grid */}
            {!loading && visible.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {visible.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            )}

            {/* Empty State */}
            {!loading && filtered.length === 0 && !error && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="w-12 h-12 text-[#c6c6cd] mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <p className="text-sm font-semibold text-[#191c1e]">No approved properties yet</p>
                <p className="text-xs text-[#76777d] mt-1">Check back soon — new hotels are being approved!</p>
                <button onClick={clearFilters} className="mt-3 text-sm text-[#fea619] hover:underline">Clear filters</button>
              </div>
            )}

            {/* Load More */}
            {!loading && visibleCount < filtered.length && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={() => setVisibleCount((v) => v + 6)}
                  className="px-6 py-2.5 border border-[#c6c6cd] text-sm font-medium text-[#191c1e] rounded-lg bg-white hover:bg-[#f2f4f6] transition-colors"
                >
                  Load More Properties
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
