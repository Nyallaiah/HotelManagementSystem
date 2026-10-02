import React from 'react';
import { Waves, Sparkles, Utensils, Wifi, Car, Dumbbell, ShieldCheck, Coffee } from 'lucide-react';

export const Amenities = () => {
  const amenityList = [
    {
      title: "Royal Lakeview Infinity Pool & Diwans",
      desc: "Temperature-controlled infinity pool overlooking Lake Pichola and Aravali hills with private royal cabanas and sunset mocktails.",
      icon: Waves,
      image: "https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Ayurvedic Heritage Spa & Wellness",
      desc: "Rejuvenating Shirodhara, Abhyanga botanical herbal massages, steam chambers, and private Vedic yoga sessions.",
      icon: Sparkles,
      image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "Royal Thali & Gastronomic Dining",
      desc: "Authentic royal culinary heritage curated by Executive Chef Ranveer Brar, featuring candlelit lakeside dining under the stars.",
      icon: Utensils,
      image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80"
    },
    {
      title: "24/7 Wellness Fitness Center",
      desc: "Modern fitness studio equipped with cardiovascular systems, strength training machines, and morning pranayama sessions.",
      icon: Dumbbell,
      image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=800&q=80"
    }
  ];

  return (
    <section className="py-20 bg-white" id="amenities">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold tracking-[0.25em] text-hotel-gold-600 uppercase block mb-2">
            The Royal Experience
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-bold text-hotel-navy-950">
            Curated Palace Amenities
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base">
            Every moment at Grand Azure Palace is thoughtfully curated to offer serenity, royal wellness, and timeless Indian hospitality.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {amenityList.map((a, i) => {
            const Icon = a.icon;
            return (
              <div 
                key={i} 
                className="rounded-2xl overflow-hidden bg-slate-50 border border-slate-200/80 shadow-xs hover:shadow-lg transition-all group flex flex-col justify-between"
              >
                <div className="relative h-48 overflow-hidden">
                  <img 
                    src={a.image} 
                    alt={a.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute top-3 right-3 w-9 h-9 rounded-full bg-hotel-navy-950/80 backdrop-blur-md flex items-center justify-center text-hotel-gold-400">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-serif font-bold text-hotel-navy-950 group-hover:text-hotel-gold-700 transition">
                      {a.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-2 line-clamp-3">
                      {a.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-200 text-[11px] text-hotel-gold-700 font-semibold">
                    Included with All Palace Bookings →
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
