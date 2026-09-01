import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { supabase } from '../lib/supabase';

const CATEGORIES = [
  { id: 'all', label: 'All Stays', icon: '✨' },
  { id: 'hotel', label: 'Hotels', icon: '🏨' },
  { id: 'resort', label: 'Resorts', icon: '🌴' },
  { id: 'villa', label: 'Villas', icon: '🏡' },
  { id: 'apartment', label: 'Apartments', icon: '🏢' },
];

const AMENITY_OPTIONS = ['Free WiFi', 'Pool', 'Spa', 'Fitness Center', 'Pet Friendly', 'Beachfront'];
const SORT_OPTIONS    = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Top Rated'];

// Default hotel images by category for listings that have no image yet
const CATEGORY_IMAGES = {
  hotel:     'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  resort:    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80',
  villa:     'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
  apartment: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
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
    <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
      {/* Image Container */}
      <div className="relative overflow-hidden h-52 bg-gray-100 flex-shrink-0">
        <img
          src={imgSrc}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => { e.target.src = CATEGORY_IMAGES.hotel; }}
        />
        
        {/* Dark subtle gradient at bottom of image */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* Rating badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md shadow-sm rounded-lg px-2.5 py-1">
          <StarRating value={hotel.rating} />
        </div>

        {/* Category badge */}
        <div className="absolute bottom-3 left-3 bg-[#131b2e]/85 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize">
          {hotel.category || 'Hotel'}
        </div>

        {/* Wishlist button */}
        <button
          onClick={(e) => { e.preventDefault(); setLiked((v) => !v); }}
          aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full hover:scale-110 hover:bg-white shadow-sm transition-all"
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
      <div className="p-5 flex flex-col flex-1 justify-between">
        <div>
          {/* Title */}
          <h3 className="font-bold text-[#191c1e] text-base leading-snug mb-1 group-hover:text-amber-600 transition-colors line-clamp-1">
            {hotel.name}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1.5 text-xs text-[#76777d] mb-3.5">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate font-medium">{location || 'Prime Location'}</span>
          </div>

          {/* Amenity chips */}
          {amenities.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {amenities.slice(0, 3).map((a) => (
                <span key={a} className="text-[11px] font-medium text-[#45464d] bg-[#f2f4f6] px-2.5 py-0.5 rounded-md">
                  {a}
                </span>
              ))}
              {amenities.length > 3 && (
                <span className="text-[11px] font-medium text-[#76777d] bg-[#f2f4f6] px-2 py-0.5 rounded-md">
                  +{amenities.length - 3}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Price + Action Button */}
        <div className="flex items-center justify-between pt-3.5 border-t border-[#f2f4f6] mt-2">
          <div>
            <span className="text-xl font-bold text-[#191c1e]">${Number(hotel.price_per_night || 0).toFixed(0)}</span>
            <span className="text-xs text-[#76777d] ml-1 font-normal">/night</span>
          </div>
          <Link
            to={`/hotels/${hotel.id}`}
            className="px-4 py-2 text-xs font-bold text-[#2a1700] bg-[#fea619] hover:bg-[#e89600] rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <span>View Details</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Card ────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden animate-pulse flex flex-col h-[340px]">
      <div className="h-52 bg-[#e0e3e5]" />
      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-[#e0e3e5] rounded w-3/4" />
          <div className="h-3 bg-[#e0e3e5] rounded w-1/2" />
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-[#f2f4f6]">
          <div className="h-6 bg-[#e0e3e5] rounded w-16" />
          <div className="h-8 bg-[#e0e3e5] rounded-xl w-24" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function ExplorePage() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [destination, setDestination] = useState('');
  const [sliderValue, setSliderValue] = useState(1000);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy] = useState('Recommended');
  const [visibleCount, setVisibleCount] = useState(9);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch approved hotels from Supabase
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
    setSelectedCategory('all');
    setSliderValue(1000);
    setSelectedAmenities([]);
    setDestination('');
    setSortBy('Recommended');
  };

  // Filter + sort from live data
  const filtered = hotels.filter((h) => {
    const price = Number(h.price_per_night || 0);
    const maxOk = price <= sliderValue;
    const catOk = selectedCategory === 'all' || (h.category && h.category.toLowerCase() === selectedCategory.toLowerCase());
    const amenOk = selectedAmenities.length === 0 ||
      selectedAmenities.every((a) => (h.amenities || []).includes(a));
    const destOk = !destination ||
      h.name?.toLowerCase().includes(destination.toLowerCase()) ||
      h.city?.toLowerCase().includes(destination.toLowerCase()) ||
      h.country?.toLowerCase().includes(destination.toLowerCase());
    return maxOk && catOk && amenOk && destOk;
  }).sort((a, b) => {
    if (sortBy === 'Price: Low to High') return Number(a.price_per_night) - Number(b.price_per_night);
    if (sortBy === 'Price: High to Low') return Number(b.price_per_night) - Number(a.price_per_night);
    if (sortBy === 'Top Rated') return Number(b.rating || 0) - Number(a.rating || 0);
    return 0;
  });

  const visible = filtered.slice(0, visibleCount);

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb]">
      <Navbar />

      {/* ─── Hero Banner & Search ─────────────────────────────────── */}
      <section className="relative bg-[#131b2e] text-white py-14 px-4 sm:px-6 lg:px-10 overflow-hidden">
        {/* Background Overlay */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#fea619_1px,transparent_1px)] [background-size:20px_20px]" />
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-[#fea619]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-4 border border-white/10">
            <span>✨</span> Handpicked Luxury Stays
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-white">
            Find Your Dream Destination
          </h1>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl mx-auto mb-8 leading-relaxed">
            Explore verified hotels, luxury villas, and boutique resorts with transparent pricing and instant booking.
          </p>

          {/* ── Clean Integrated Search Box ── */}
          <div className="bg-white rounded-2xl p-2 sm:p-2.5 shadow-2xl max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-2 text-left">
            <div className="flex-1 flex items-center gap-3 px-3.5 py-2 w-full">
              <svg className="w-5 h-5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <input
                type="text"
                placeholder="Where are you going? (e.g. Lahore, Bali, New York)"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full text-sm text-[#191c1e] placeholder:text-gray-400 outline-none bg-transparent font-medium"
              />
              {destination && (
                <button
                  onClick={() => setDestination('')}
                  className="text-xs text-gray-400 hover:text-gray-600 px-1"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`px-3.5 py-2.5 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 flex-1 sm:flex-initial ${
                  showFilters || selectedAmenities.length > 0 || sliderValue < 1000
                    ? 'bg-amber-50 border-amber-300 text-amber-900'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                Filters {(selectedAmenities.length > 0 || sliderValue < 1000) ? '•' : ''}
              </button>

              <button
                type="button"
                className="px-6 py-2.5 bg-[#fea619] hover:bg-[#e89600] text-[#2a1700] font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 flex-1 sm:flex-initial"
              >
                Search
              </button>
            </div>
          </div>

          {/* ── Expandable Filter Drawer ── */}
          {showFilters && (
            <div className="bg-white rounded-2xl p-5 shadow-xl max-w-3xl mx-auto mt-4 text-left border border-gray-200 text-[#191c1e] animate-fadeIn">
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-100">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Refine Search</span>
                <button onClick={clearFilters} className="text-xs text-amber-600 font-semibold hover:underline">
                  Reset All
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Max Price Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-gray-700">Max Nightly Rate</span>
                    <span className="text-xs font-bold text-amber-600">${sliderValue} / night</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={1000}
                    step={25}
                    value={sliderValue}
                    onChange={(e) => setSliderValue(Number(e.target.value))}
                    className="w-full accent-[#fea619] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>$50</span>
                    <span>$500</span>
                    <span>$1000+</span>
                  </div>
                </div>

                {/* Amenities Selection */}
                <div>
                  <span className="block text-xs font-bold text-gray-700 mb-2">Desired Amenities</span>
                  <div className="flex flex-wrap gap-2">
                    {AMENITY_OPTIONS.map((amenity) => (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                          selectedAmenities.includes(amenity)
                            ? 'bg-amber-100 border-amber-400 text-amber-900 font-semibold'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        {amenity}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─── Category Selection Bar ───────────────────────────────── */}
      <section className="bg-white border-b border-[#e0e3e5] sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedCategory === cat.id
                    ? 'bg-[#131b2e] text-white shadow-sm'
                    : 'bg-[#f7f9fb] text-[#45464d] hover:bg-gray-200'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-[#76777d] font-medium hidden sm:inline">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-semibold bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl px-3 py-2 outline-none focus:border-[#131b2e] cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </section>

      {/* ─── Properties Cards Grid ────────────────────────────────── */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 w-full">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-xl text-[#191c1e]">
              {selectedCategory === 'all' ? 'All Featured Properties' : `${CATEGORIES.find(c => c.id === selectedCategory)?.label || 'Properties'}`}
            </h2>
            <p className="text-xs text-[#76777d] mt-0.5">
              {loading ? 'Searching available stays…' : `Showing ${filtered.length} verified stays available for booking`}
            </p>
          </div>

          {(destination || selectedCategory !== 'all' || selectedAmenities.length > 0 || sliderValue < 1000) && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <SkeletonCard key={i} />)}
          </div>
        )}

        {/* Property Cards Grid */}
        {!loading && visible.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visible.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-[#e0e3e5] p-8 shadow-xs my-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-3xl mb-4">
              🏨
            </div>
            <h3 className="text-base font-bold text-[#191c1e] mb-1">No Properties Found</h3>
            <p className="text-xs text-[#76777d] max-w-sm mx-auto mb-6">
              We couldn't find any stays matching your current search or filters. Try adjusting your filters or clearing search terms.
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 bg-[#131b2e] text-white text-xs font-semibold rounded-xl hover:bg-[#1e2d47] transition-all"
            >
              Clear All Filters
            </button>
          </div>
        )}

        {/* Load More Button */}
        {!loading && visibleCount < filtered.length && (
          <div className="flex justify-center mt-12 mb-6">
            <button
              onClick={() => setVisibleCount((v) => v + 8)}
              className="px-8 py-3 bg-white border border-[#c6c6cd] hover:border-[#131b2e] text-sm font-semibold text-[#191c1e] rounded-xl shadow-xs hover:shadow-md transition-all active:scale-98"
            >
              Load More Properties
            </button>
          </div>
        )}
      </main>

      {/* ─── Clean Modern Footer ──────────────────────────────────── */}
      <Footer />
    </div>
  );
}
