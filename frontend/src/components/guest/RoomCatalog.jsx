import React, { useState } from 'react';
import { Users, Maximize2, Bed, Check, Sparkles, ArrowRight } from 'lucide-react';

export const RoomCatalog = ({ rooms, categories, onSelectRoom, checkIn, checkOut, nights }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredCategories = selectedCategory === 'all'
    ? categories
    : categories.filter(c => c.name === selectedCategory);

  return (
    <section className="py-16 bg-hotel-cream" id="suites">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="text-xs font-bold tracking-[0.25em] text-hotel-gold-600 uppercase block mb-2">
            Palace Accommodations & Heritage Suites
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-hotel-navy-950">
            Royal Grandeur & Lakeview Tranquility
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Every suite is handcrafted with authentic Rajasthani architecture, Italian marble bathrooms,
            panoramic lake views, and state-of-the-art smart amenities.
          </p>

          {/* Category Filter Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                selectedCategory === 'all'
                  ? 'bg-hotel-navy-950 text-hotel-gold-400 shadow-md'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              All Suites ({categories.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                  selectedCategory === cat.name
                    ? 'bg-hotel-navy-950 text-hotel-gold-400 shadow-md'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>

        {/* Suites Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredCategories.map((cat) => {
            const sampleRoom = rooms.find(r => r.type === cat.name) || {};
            const heroImage = (cat.images && cat.images[0]) || sampleRoom.images?.[0] || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80';

            return (
              <div
                key={cat.name}
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/80 flex flex-col group"
              >
                {/* Image Container with Luxury Badging */}
                <div className="relative h-72 w-full overflow-hidden bg-slate-100">
                  <img
                    src={heroImage}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4 bg-hotel-navy-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-semibold text-hotel-gold-400 border border-hotel-gold-500/30">
                    {cat.name}
                  </div>

                  {/* Pricing Badge (in ₹ INR) */}
                  <div className="absolute bottom-4 right-4 bg-hotel-navy-950/90 backdrop-blur-md px-3.5 py-1.5 rounded-lg border border-hotel-gold-500/20 text-right">
                    <span className="text-xs text-slate-300 block">From</span>
                    <span className="text-xl font-serif font-bold text-hotel-gold-400">
                      ₹{Number(cat.base_price || 3999).toLocaleString('en-IN')}
                    </span>
                    <span className="text-[11px] text-slate-400 font-light"> / night + GST</span>
                  </div>
                </div>

                {/* Suite Details Body */}
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-hotel-navy-950 group-hover:text-hotel-gold-700 transition">
                      {cat.name}
                    </h3>

                    <p className="mt-2 text-xs sm:text-sm text-slate-600 line-clamp-2">
                      {cat.description}
                    </p>

                    {/* Specifications Icons */}
                    <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-3 gap-2 text-xs text-slate-700">
                      <div className="flex items-center space-x-1.5">
                        <Users className="w-3.5 h-3.5 text-hotel-navy-800" />
                        <span>Up to {cat.capacity} Guests</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Bed className="w-3.5 h-3.5 text-hotel-navy-800" />
                        <span>{cat.bed_type}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-hotel-navy-800" />
                        <span>{cat.size_sqft} sq.ft</span>
                      </div>
                    </div>

                    {/* Featured Amenities Pills */}
                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {cat.amenities?.slice(0, 4).map((amenity, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md"
                        >
                          <Check className="w-3 h-3 text-emerald-600 mr-1" />
                          {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Reserve Button */}
                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-slate-500">
                        Stay: <strong className="text-slate-800">{nights} {nights === 1 ? 'night' : 'nights'}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => onSelectRoom(cat)}
                      className="px-5 py-2.5 rounded-lg bg-hotel-navy-950 hover:bg-hotel-navy-800 text-hotel-gold-400 font-semibold text-xs sm:text-sm transition flex items-center space-x-2 shadow-md hover:shadow-lg border border-hotel-gold-500/20"
                    >
                      <span>Reserve Suite</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
