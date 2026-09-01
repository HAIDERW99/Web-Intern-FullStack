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

const AMENITY_OPTIONS = ['Free WiFi', 'Pool', 'Spa', 'Fitness Center', 'Pet Friendly', 'Beachfront', 'Room Service', 'Restaurant'];
const SORT_OPTIONS    = ['Recommended', 'Price: Low to High', 'Price: High to Low', 'Top Rated'];

const CATEGORY_IMAGES = {
  hotel:     'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  resort:    'https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800&q=80',
  villa:     'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80',
  apartment: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&q=80',
};

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

function PropertyCard({ hotel }) {
  const [liked, setLiked] = useState(false);
  const imgSrc = hotel.image_url || hotel.cover_image_url || CATEGORY_IMAGES[hotel.category] || CATEGORY_IMAGES.hotel;
  const location = [hotel.city, hotel.country].filter(Boolean).join(', ');
  const amenities = Array.isArray(hotel.amenities) ? hotel.amenities : [];

  return (
    <div className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
      {/* Image */}
      <div className="relative overflow-hidden h-52 bg-gray-100 flex-shrink-0">
        <img
          src={imgSrc}
          alt={hotel.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => { e.target.src = CATEGORY_IMAGES.hotel; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60 pointer-events-none" />

        {/* Rating */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md shadow-sm rounded-lg px-2.5 py-1">
          <StarRating value={hotel.rating} />
        </div>

        {/* Category */}
        <div className="absolute bottom-3 left-3 bg-[#131b2e]/85 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full capitalize">
          {hotel.category || 'Hotel'}
        </div>

        {/* Wishlist */}
        <button
          onClick={(e) => { e.preventDefault(); setLiked((v) => !v); }}
          aria-label={liked ? 'Remove from wishlist' : 'Add to wishlist'}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center bg-white/90 backdrop-blur-md rounded-full hover:scale-110 hover:bg-white shadow-sm transition-all cursor-pointer"
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
          <h3 className="font-bold text-[#191c1e] text-base leading-snug mb-1 group-hover:text-amber-600 transition-colors line-clamp-1">
            {hotel.name}
          </h3>

          <div className="flex items-center gap-1.5 text-xs text-[#76777d] mb-3">
            <svg className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate font-medium">{location || 'Prime Location'}</span>
          </div>

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

        {/* Price & Action */}
        <div className="flex items-center justify-between pt-3.5 border-t border-[#f2f4f6] mt-2">
          <div>
            <span className="text-xl font-bold text-[#191c1e]">${Number(hotel.price_per_night || 0).toFixed(0)}</span>
            <span className="text-xs text-[#76777d] ml-1 font-normal">/night</span>
          </div>
          <Link
            to={`/hotels/${hotel.id}`}
            className="px-4 py-2 text-xs font-bold text-[#2a1700] bg-[#fea619] hover:bg-[#e89600] rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <span>Book Stay</span>
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PropertiesPage() {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sliderValue, setSliderValue] = useState(1000);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy] = useState('Recommended');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchAllApprovedHotels() {
      setLoading(true);
      setError('');
      const { data, error: err } = await supabase
        .from('hotels')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (err) {
        console.error(err);
        setError('Unable to load properties catalog.');
      } else {
        setHotels(data || []);
      }
      setLoading(false);
    }
    fetchAllApprovedHotels();
  }, []);

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('all');
    setSliderValue(1000);
    setSelectedAmenities([]);
    setSortBy('Recommended');
  };

  const filtered = hotels.filter((h) => {
    const price = Number(h.price_per_night || 0);
    const priceOk = price <= sliderValue;
    const catOk = selectedCategory === 'all' || (h.category && h.category.toLowerCase() === selectedCategory.toLowerCase());
    const amenOk = selectedAmenities.length === 0 ||
      selectedAmenities.every((a) => (h.amenities || []).includes(a));
    const searchOk = !search ||
      h.name?.toLowerCase().includes(search.toLowerCase()) ||
      h.city?.toLowerCase().includes(search.toLowerCase()) ||
      h.country?.toLowerCase().includes(search.toLowerCase()) ||
      h.description?.toLowerCase().includes(search.toLowerCase());

    return priceOk && catOk && amenOk && searchOk;
  }).sort((a, b) => {
    if (sortBy === 'Price: Low to High') return Number(a.price_per_night) - Number(b.price_per_night);
    if (sortBy === 'Price: High to Low') return Number(b.price_per_night) - Number(a.price_per_night);
    if (sortBy === 'Top Rated') return Number(b.rating || 0) - Number(a.rating || 0);
    return 0;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#f7f9fb]">
      <Navbar />

      {/* ── Page Header & Search ── */}
      <div className="bg-[#131b2e] text-white py-12 px-4 sm:px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>🏨</span> Stays & Resorts Catalog
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                Explore All Properties
              </h1>
              <p className="text-gray-300 text-xs sm:text-sm mt-1 max-w-xl">
                Browse verified boutique hotels, beachfront resorts, and luxury villas with guaranteed best rates.
              </p>
            </div>

            {/* Quick Search Input */}
            <div className="w-full md:w-80 bg-white rounded-xl p-1.5 shadow-lg flex items-center gap-2">
              <svg className="w-4 h-4 text-amber-500 ml-2.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by city, name, resort…"
                className="w-full text-xs text-[#191c1e] placeholder:text-gray-400 outline-none pr-2 font-medium"
              />
              {search && (
                <button onClick={() => setSearch('')} className="text-xs text-gray-400 hover:text-gray-600 px-1">
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Category & Filter Bar ── */}
      <div className="bg-white border-b border-[#e0e3e5] sticky top-16 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center justify-between gap-4 overflow-x-auto no-scrollbar">
          {/* Category tabs */}
          <div className="flex items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
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

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all flex items-center gap-1.5 cursor-pointer ${
                showFilters || selectedAmenities.length > 0 || sliderValue < 1000
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              <span>Filters {(selectedAmenities.length > 0 || sliderValue < 1000) ? '•' : ''}</span>
            </button>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-xs font-semibold bg-[#f7f9fb] border border-[#e0e3e5] rounded-xl px-3 py-2 outline-none focus:border-[#131b2e] cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="bg-[#f7f9fb] border-t border-[#e0e3e5] px-4 sm:px-6 lg:px-10 py-5 animate-fadeIn">
            <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Max Rate */}
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
              </div>

              {/* Amenities */}
              <div className="sm:col-span-2">
                <span className="block text-xs font-bold text-gray-700 mb-2">Filter by Amenities</span>
                <div className="flex flex-wrap gap-2">
                  {AMENITY_OPTIONS.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`text-xs px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                        selectedAmenities.includes(amenity)
                          ? 'bg-amber-100 border-amber-400 text-amber-900 font-semibold'
                          : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
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

      {/* ── Main Properties Grid ── */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 w-full">
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-bold text-lg text-[#191c1e]">
              {selectedCategory === 'all' ? 'All Verified Properties' : CATEGORIES.find(c => c.id === selectedCategory)?.label}
            </h2>
            <p className="text-xs text-[#76777d] mt-0.5">
              {loading ? 'Loading properties…' : `Showing ${filtered.length} available stays`}
            </p>
          </div>

          {(search || selectedCategory !== 'all' || selectedAmenities.length > 0 || sliderValue < 1000) && (
            <button
              onClick={clearFilters}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            {error}
          </div>
        )}

        {/* Skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-[#e0e3e5] overflow-hidden animate-pulse h-[340px]">
                <div className="h-52 bg-[#e0e3e5]" />
                <div className="p-5 space-y-3">
                  <div className="h-4 bg-[#e0e3e5] rounded w-3/4" />
                  <div className="h-3 bg-[#e0e3e5] rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Cards Grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((hotel) => (
              <PropertyCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && filtered.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-2xl border border-[#e0e3e5] p-8 my-4">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center text-3xl mb-4">
              🏝️
            </div>
            <h3 className="text-base font-bold text-[#191c1e] mb-1">No Matching Properties</h3>
            <p className="text-xs text-[#76777d] max-w-sm mx-auto mb-6">
              We couldn't find any stays matching your selected criteria. Try searching for a different city or clearing some filters.
            </p>
            <button
              onClick={clearFilters}
              className="px-5 py-2.5 bg-[#131b2e] text-white text-xs font-semibold rounded-xl hover:bg-[#1e2d47] transition-all cursor-pointer"
            >
              Clear All Filters
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
