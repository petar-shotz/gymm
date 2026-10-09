'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  ShoppingBag,
  CheckCircle2,
  Sparkles,
  Info,
  MapPin,
  Flame,
  ShieldCheck,
  Check,
  Plus,
  Phone,
  Truck,
  Star,
} from 'lucide-react';
import { MACEDONIAN_SUPPLEMENTS, type SupplementItem } from '@/lib/macedonian-supplements';

export { MACEDONIAN_SUPPLEMENTS, type SupplementItem };

export interface MacedoniaSupplementsProps {
  onLogSupplement?: (item: SupplementItem) => void;
  favoriteIds?: string[];
  onToggleFavorite?: (id: string) => void;
}

export const MACEDONIAN_RETAILERS = [
  {
    name: 'No Limit MK',
    domain: 'nolimit.mk',
    locations: 'Скопје & Online www.nolimit.mk',
    phone: '+389 78 888 777',
    delivery: 'Брза достава низ цела Македонија за 24 часа со карго',
    highlight: 'Позната македонска специјализирана продавница за суплементи: Optimum Nutrition Opti-Men/Opti-Women, Ghost, CBUM Thavage, Mutant Mass, Dymatize.',
  },
  {
    name: 'HardCore Shop MK',
    domain: 'hardcoreshop.mk',
    locations: 'ГТЦ Скопје (Приземје) & Аеродром (кај ТЦ Бисер)',
    phone: '+389 78 222 333',
    delivery: '24-48 часа карго низ цела Македонија (Бесплатна над 2,500 ден)',
    highlight: 'Официјален увозник за Optimum Nutrition, Universal/Animal, BioTechUSA, Dymatize, Scitec, CreGAAtine.',
  },
  {
    name: 'Polleo Sport Македонија',
    domain: 'polleosport.mk',
    locations: 'Skopje City Mall, East Gate Mall & Diamond Mall Скопје',
    phone: '+389 71 300 400',
    delivery: 'Брза достава до врата низ сите градови (Скопје, Битола, Охрид, Тетово)',
    highlight: 'Најголем регионален фитнес ланец со брендови Optimum Nutrition, Scitec, Cellucor, Nutrend.',
  },
  {
    name: 'Proteini.si Македонија',
    domain: 'proteini.si/mk',
    locations: 'ГТЦ Скопје, East Gate Mall & Широк Сокак Битола',
    phone: '+389 70 888 999',
    delivery: 'Експресна достава со плаќање при преземање',
    highlight: 'Ексклузивен дистрибутер за Applied Nutrition, Battery Nutrition, Olimp Sport Nutrition, The Nutrition.',
  },
  {
    name: 'Herkules Скопје',
    domain: 'herkules.com.mk',
    locations: 'Карпош 4 (кај Сити Мол) & Центар Скопје',
    phone: '+389 75 111 222',
    delivery: 'Испорака преку брза пошта истиот ден',
    highlight: 'Докажана специјализирана продавница со традиција над 15 години: BioTech, Scitec, Kevin Levrone.',
  },
  {
    name: 'Зегин / Еурофарм Аптеки',
    domain: 'zegin.com.mk / eurofarm.com.mk',
    locations: 'Над 250 аптеки низ цела Македонија',
    phone: 'Локална аптека',
    delivery: 'Достапно веднаш во најблиската аптека',
    highlight: 'Фармацевтски квалитет: Alkaloid Магнезиум 400 direkt, C-1000, D3, Solgar, Now Foods, CreGAAtine.',
  },
];

export function MacedoniaSupplements({
  onLogSupplement,
  favoriteIds: externalFavorites,
  onToggleFavorite: externalToggleFavorite,
}: MacedoniaSupplementsProps) {
  const [internalFavorites, setInternalFavorites] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('trainforge_favorite_supplements');
        return saved ? JSON.parse(saved) : ['on-gold-standard-whey', 'cregaatine-60-packs', 'alkaloid-magnezium-400-b-complex'];
      } catch {
        return ['on-gold-standard-whey', 'cregaatine-60-packs', 'alkaloid-magnezium-400-b-complex'];
      }
    }
    return ['on-gold-standard-whey', 'cregaatine-60-packs', 'alkaloid-magnezium-400-b-complex'];
  });

  const favorites = externalFavorites ?? internalFavorites;

  const toggleFavorite = (id: string) => {
    if (externalToggleFavorite) {
      externalToggleFavorite(id);
    } else {
      setInternalFavorites((prev) => {
        const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
        try {
          localStorage.setItem('trainforge_favorite_supplements', JSON.stringify(next));
        } catch {}
        return next;
      });
    }
  };

  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedRetailer, setSelectedRetailer] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');
  const [loggedId, setLoggedId] = useState<string | null>(null);
  const [showStoreInfo, setShowStoreInfo] = useState<boolean>(false);

  const categories = [
    { label: 'Сите суплементи', value: 'All', count: MACEDONIAN_SUPPLEMENTS.length },
    { label: '⭐ Мои Суплементи (Омилени)', value: 'Favorites', count: favorites.length },
    { label: 'Proteins (Протеини)', value: 'Proteins', count: MACEDONIAN_SUPPLEMENTS.filter((s) => s.category === 'Proteins').length },
    { label: 'Creatine (Креатин)', value: 'Creatine', count: MACEDONIAN_SUPPLEMENTS.filter((s) => s.category === 'Creatine').length },
    { label: 'Pre-Workout (Пре-Тренинг)', value: 'Pre-Workout', count: MACEDONIAN_SUPPLEMENTS.filter((s) => s.category === 'Pre-Workout').length },
    { label: 'Amino Acids (Аминокиселини)', value: 'Amino Acids', count: MACEDONIAN_SUPPLEMENTS.filter((s) => s.category === 'Amino Acids').length },
    { label: 'Mass Gainers (Гејнери)', value: 'Mass Gainers', count: MACEDONIAN_SUPPLEMENTS.filter((s) => s.category === 'Mass Gainers').length },
    { label: 'Vitamins & Minerals (Витамини)', value: 'Vitamins & Minerals', count: MACEDONIAN_SUPPLEMENTS.filter((s) => s.category === 'Vitamins & Minerals').length },
    { label: 'Omega & Fats (Омега-3)', value: 'Omega & Healthy Fats', count: MACEDONIAN_SUPPLEMENTS.filter((s) => s.category === 'Omega & Healthy Fats').length },
    { label: 'Joints & Health (Зглобови)', value: 'Joints & Health', count: MACEDONIAN_SUPPLEMENTS.filter((s) => s.category === 'Joints & Health').length },
    { label: 'Fat Burners (Согорувачи)', value: 'Fat Burners', count: MACEDONIAN_SUPPLEMENTS.filter((s) => s.category === 'Fat Burners').length },
  ];

  const retailers = [
    'All',
    'No Limit MK',
    'HardCore Shop MK',
    'Polleo Sport',
    'Proteini.si',
    'Herkules Скопје',
    'Zegin / Аптеки',
  ];

  const filteredItems = useMemo(() => {
    let list = MACEDONIAN_SUPPLEMENTS.filter((item) => {
      // Favorites filter
      if (selectedCategory === 'Favorites') {
        if (!favorites.includes(item.id)) return false;
      } else if (selectedCategory !== 'All' && item.category !== selectedCategory) {
        return false;
      }

      // Retailer filter
      if (selectedRetailer !== 'All') {
        const matchesRetailer =
          selectedRetailer === 'Herkules Скопје'
            ? item.retailers.includes('Herkules Skopje')
            : selectedRetailer === 'Zegin / Аптеки'
              ? item.retailers.includes('Zegin Pharmacies') || item.retailers.includes('Eurofarm')
              : item.retailers.includes(selectedRetailer as SupplementItem['retailers'][number]);
        if (!matchesRetailer) return false;
      }

      // Search query
      if (search.trim()) {
        const q = search.toLowerCase().trim();
        const combined = `${item.name} ${item.nameMk} ${item.brand} ${item.category} ${item.dosage} ${item.retailers.join(' ')}`.toLowerCase();
        return combined.includes(q);
      }
      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      if (sortBy === 'price-asc') return a.priceMkd - b.priceMkd;
      if (sortBy === 'price-desc') return b.priceMkd - a.priceMkd;
      if (sortBy === 'rating') return b.rating - a.rating;
      // Default: featured first, then rating
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      return b.rating - a.rating;
    });

    return list;
  }, [selectedCategory, selectedRetailer, search, sortBy, favorites]);

  const handleLog = (item: SupplementItem) => {
    if (onLogSupplement) {
      onLogSupplement(item);
    }
    setLoggedId(item.id);
    setTimeout(() => {
      setLoggedId(null);
    }, 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '1200px', margin: '0 auto' }}>
      {/* SECTION BANNER & INTRO */}
      <section
        style={{
          background: 'linear-gradient(135deg, #24221c 0%, #191b16 100%)',
          border: '1px solid #4a3e2a',
          borderRadius: '16px',
          padding: '24px 26px',
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ maxWidth: '820px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: '#3a2b16',
                  color: '#ffa566',
                  fontSize: '11px',
                  fontWeight: 700,
                  letterSpacing: '0.8px',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  textTransform: 'uppercase',
                }}
              >
                <Flame size={13} /> North Macedonia Fitness Directory
              </span>
              <span
                style={{
                  background: '#243422',
                  color: '#86efac',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: '6px',
                }}
              >
                ✓ 100% Оригинални &amp; Достапни во Македонија
              </span>
              <span
                style={{
                  background: '#362818',
                  color: '#fbbf24',
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Star size={12} fill="#fbbf24" /> {favorites.length} Во твојот стек
              </span>
            </div>

            <h1 style={{ fontSize: '26px', fontWeight: 800, color: '#f8fafc', margin: '0 0 10px 0', letterSpacing: '-0.3px' }}>
              Суплементи во Македонија (Додатоци во исхраната)
            </h1>

            <p style={{ fontSize: '14px', color: '#b9c1b2', lineHeight: '1.6', margin: 0 }}>
              Комплетен каталог на спортска исхрана и фармацевтски додатоци достапни на македонскиот пазар преку овластени дистрибутери: <b>HardCore Shop MK</b>, <b>Polleo Sport</b>, <b>Proteini.si</b>, <b>Herkules Скопје</b> и <b>ЗЕГИН / Еурофарм</b>. Сите цени се изразени во македонски денари (МКД / ден) со детали за дозирање, бенефити и начин на употреба. Кликнете на ѕвездичката (⭐) за да ги зачувате суплементите што веќе ги имате во вашиот стек!
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setSelectedCategory('Favorites')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                background: selectedCategory === 'Favorites' ? '#fbbf24' : '#2d2618',
                color: selectedCategory === 'Favorites' ? '#18181b' : '#fbbf24',
                border: '1px solid #785219',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Star size={15} fill={selectedCategory === 'Favorites' ? '#18181b' : '#fbbf24'} />
              Мои Суплементи ({favorites.length})
            </button>

            <button
              type="button"
              onClick={() => setShowStoreInfo((v) => !v)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '9px 16px',
                background: showStoreInfo ? '#ff792f' : '#2d3326',
                color: '#ffffff',
                border: '1px solid',
                borderColor: showStoreInfo ? '#ff792f' : '#45503b',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <MapPin size={15} /> {showStoreInfo ? 'Скриј продавници' : 'Продавници во Македонија'}
            </button>
          </div>
        </div>

        {/* Quick Stats Pill Row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            marginTop: '20px',
            paddingTop: '16px',
            borderTop: '1px solid #343a2b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
            <ShieldCheck size={16} color="#4ade80" />
            <span>Вкупно производи: <b>{MACEDONIAN_SUPPLEMENTS.length} проверени артикли</b></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
            <ShoppingBag size={16} color="#fb923c" />
            <span>Овластени продавници: <b>HardCore, Polleo, Proteini.si, Herkules, Zegin</b></span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#cbd5e1' }}>
            <Truck size={16} color="#38bdf8" />
            <span>Испорака: <b>24-48h карго низ цела Македонија</b></span>
          </div>
        </div>
      </section>

      {/* MACEDONIAN STORE DIRECTORY ACCORDION */}
      {showStoreInfo && (
        <section
          style={{
            background: '#191c17',
            border: '1px solid #384230',
            borderRadius: '14px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <MapPin size={18} color="#ff792f" />
            <h3 style={{ margin: 0, fontSize: '17px', color: '#f3f6ee', fontWeight: 700 }}>
              Водечки дистрибутери и локации во Скопје и Македонија
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '14px' }}>
            {MACEDONIAN_RETAILERS.map((ret) => (
              <div
                key={ret.name}
                style={{
                  background: '#22261e',
                  border: '1px solid #343c2d',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <strong style={{ fontSize: '15px', color: '#ffffff' }}>{ret.name}</strong>
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>{ret.domain}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#cbd5e1', display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <MapPin size={14} color="#ffa566" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <span>{ret.locations}</span>
                </div>
                <div style={{ fontSize: '12px', color: '#86efac', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={13} style={{ flexShrink: 0 }} />
                  <span>{ret.phone}</span>
                </div>
                <p style={{ margin: 0, fontSize: '11px', color: '#97a28e', lineHeight: '1.4' }}>
                  {ret.highlight}
                </p>
                <div style={{ fontSize: '11px', color: '#7dd3fc', background: '#1c262a', padding: '4px 8px', borderRadius: '5px' }}>
                  🚚 {ret.delivery}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* FILTER & SEARCH CONTROL BAR */}
      <section
        style={{
          background: '#191b17',
          border: '1px solid #363e2e',
          borderRadius: '14px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {/* Search input and Sort dropdown */}
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
            <input
              type="text"
              placeholder="Пребарајте суплемент (Whey, Креатин, CreGAAtine, C4, Магнезиум 400, Animal Pak, Scitec, BioTech, Gold Standard)…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                paddingLeft: '36px',
                paddingRight: search ? '32px' : '12px',
                height: '42px',
                background: '#121410',
                border: '1px solid #424c38',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '13px',
              }}
            />
            <Search
              size={17}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#8b9583',
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#8b9583',
                  cursor: 'pointer',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Store Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#97a28e', whiteSpace: 'nowrap' }}>Продавница:</span>
            <select
              value={selectedRetailer}
              onChange={(e) => setSelectedRetailer(e.target.value)}
              style={{
                height: '42px',
                background: '#121410',
                border: '1px solid #424c38',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '12px',
                padding: '0 10px',
                fontWeight: 600,
              }}
            >
              {retailers.map((r) => (
                <option key={r} value={r}>
                  {r === 'All' ? 'Сите продавници' : r}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: '#97a28e', whiteSpace: 'nowrap' }}>Подреди:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              style={{
                height: '42px',
                background: '#121410',
                border: '1px solid #424c38',
                borderRadius: '8px',
                color: '#ffffff',
                fontSize: '12px',
                padding: '0 10px',
                fontWeight: 600,
              }}
            >
              <option value="featured">Препорачани (Featured)</option>
              <option value="price-asc">Цена: Најниска прво</option>
              <option value="price-desc">Цена: Највисока прво</option>
              <option value="rating">Оцена (5.0 ★)</option>
            </select>
          </div>
        </div>

        {/* Category Filter Chips */}
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.6px', color: '#889280', marginBottom: '8px', textTransform: 'uppercase' }}>
            Категории на суплементи ({categories.length} категории)
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {categories.map((cat) => {
              const active = selectedCategory === cat.value;
              const isFavCat = cat.value === 'Favorites';
              return (
                <button
                  type="button"
                  key={cat.value}
                  onClick={() => setSelectedCategory(cat.value)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    fontSize: '12px',
                    fontWeight: active ? 700 : 500,
                    background: active ? (isFavCat ? '#fbbf24' : '#ff792f') : (isFavCat ? '#2e2617' : '#232720'),
                    color: active ? (isFavCat ? '#18181b' : '#ffffff') : (isFavCat ? '#fbbf24' : '#b2baa8'),
                    border: '1px solid',
                    borderColor: active ? (isFavCat ? '#fbbf24' : '#ff792f') : (isFavCat ? '#634a1d' : '#384030'),
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{cat.label}</span>
                  <span
                    style={{
                      fontSize: '10px',
                      background: active ? 'rgba(0,0,0,0.25)' : '#333a2d',
                      color: active ? '#ffffff' : '#94a18a',
                      padding: '1px 5px',
                      borderRadius: '10px',
                      fontWeight: 700,
                    }}
                  >
                    {cat.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* RESULTS COUNT & STATUS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px', flexWrap: 'wrap', gap: '8px' }}>
        <span style={{ fontSize: '13px', color: '#97a28e' }}>
          Прикажани се <b>{filteredItems.length}</b> суплементи достапни во Македонија
          {selectedCategory === 'Favorites' ? ' (⭐ Вашите омилени суплементи)' : selectedCategory !== 'All' ? ` во категоријата "${selectedCategory}"` : ''}
          {search ? ` за термин "${search}"` : ''}
        </span>
        {(selectedCategory !== 'All' || selectedRetailer !== 'All' || search) && (
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('All');
              setSelectedRetailer('All');
              setSearch('');
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#ff985d',
              fontSize: '12px',
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            Ресетирај филтри
          </button>
        )}
      </div>

      {/* SUCCESS LOG NOTIFICATION BANNER */}
      {loggedId && (
        <div
          style={{
            background: '#19331e',
            border: '1px solid #3d7a46',
            color: '#86efac',
            borderRadius: '10px',
            padding: '12px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={18} />
          <span>Суплементот е успешно евидентиран во вашата дневна исхрана и витамински профил за денес!</span>
        </div>
      )}

      {/* SUPPLEMENT PRODUCTS GRID */}
      {filteredItems.length === 0 ? (
        <div
          style={{
            background: '#1b1d19',
            border: '1px solid #363d2e',
            borderRadius: '14px',
            padding: '48px 24px',
            textAlign: 'center',
            color: '#9ba492',
          }}
        >
          <Info size={36} color="#ffa566" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ margin: '0 0 6px 0', color: '#f3f6ee', fontSize: '17px' }}>
            {selectedCategory === 'Favorites'
              ? 'Сеуште немате омилени суплементи во вашиот стек'
              : 'Нема пронајдено суплементи за вашето пребарување'}
          </h3>
          <p style={{ margin: '0 0 16px 0', fontSize: '13px', maxWidth: '520px', marginLeft: 'auto', marginRight: 'auto' }}>
            {selectedCategory === 'Favorites'
              ? 'Кликнете на ѕвездичката (⭐) на било кој суплемент во каталогот за да го зачувате во вашите омилени за брз 1-клик пристап!'
              : 'Обидете се со друг термин, како на пример "Whey", "Creatine", "C4", "Animal", "Magnezium" или изберете "All".'}
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedCategory('All');
              setSelectedRetailer('All');
            }}
            style={{
              padding: '8px 18px',
              background: '#ff792f',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Прикажи ги сите суплементи
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '18px',
          }}
        >
          {filteredItems.map((item) => {
            const isLogged = loggedId === item.id;
            const isFav = favorites.includes(item.id);

            return (
              <article
                key={item.id}
                style={{
                  background: '#1c1f19',
                  border: isFav ? '1px solid #855e1c' : item.featured ? '1px solid #664d27' : '1px solid #343b2d',
                  borderRadius: '14px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: isFav
                    ? '0 6px 24px rgba(245, 158, 11, 0.12)'
                    : item.featured
                      ? '0 4px 20px rgba(255, 121, 47, 0.08)'
                      : '0 2px 10px rgba(0,0,0,0.2)',
                  position: 'relative',
                  transition: 'transform 0.15s ease, border-color 0.15s ease',
                }}
              >
                {/* Header Tag / Category Badges */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#ff985d',
                          background: '#34251a',
                          padding: '2px 8px',
                          borderRadius: '4px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.6px',
                        }}
                      >
                        {item.brand}
                      </span>
                      {isFav && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#fbbf24',
                            background: '#3d2e14',
                            border: '1px solid #785219',
                            padding: '1px 6px',
                            borderRadius: '4px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Star size={10} fill="#fbbf24" /> ТВОЈ СТЕК
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(item.id);
                        }}
                        title={isFav ? 'Отстрани од омилени' : 'Зачувај во Омилени / Мој Стек'}
                        style={{
                          background: isFav ? '#423115' : 'rgba(255,255,255,0.05)',
                          border: isFav ? '1px solid #b47f1c' : '1px solid #3c4434',
                          borderRadius: '6px',
                          padding: '3px 8px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          color: isFav ? '#fbbf24' : '#8fa08c',
                          fontSize: '11px',
                          fontWeight: 600,
                        }}
                      >
                        <Star size={13} fill={isFav ? '#fbbf24' : 'none'} color={isFav ? '#fbbf24' : '#8fa08c'} />
                        <span>{isFav ? 'Омилен' : 'Омилен'}</span>
                      </button>

                      {item.featured && (
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            color: '#ffd166',
                            background: '#3b2f15',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Sparkles size={11} /> TOP
                        </span>
                      )}
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#fbbf24',
                          fontWeight: 700,
                        }}
                      >
                        ★ {item.rating}
                      </span>
                    </div>
                  </div>

                  <h3 style={{ fontSize: '17px', color: '#f3f6ee', fontWeight: 700, margin: '0 0 6px 0', lineHeight: '1.3' }}>
                    {item.nameMk}
                  </h3>

                  <div style={{ fontSize: '11px', color: '#97a28e', marginBottom: '12px' }}>
                    {item.name}
                  </div>

                  {/* Dosage & Size Card */}
                  <div
                    style={{
                      background: '#161813',
                      border: '1px solid #2e3626',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      marginBottom: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#889380' }}>Пакување:</span>
                      <strong style={{ color: '#ffffff' }}>{item.size} ({item.servings})</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                      <span style={{ color: '#889380' }}>Дозирање:</span>
                      <strong style={{ color: '#ffb373', textAlign: 'right' }}>{item.dosage}</strong>
                    </div>
                  </div>

                  <p style={{ fontSize: '12px', color: '#b2baa8', lineHeight: '1.5', margin: '0 0 12px 0' }}>
                    {item.descriptionMk}
                  </p>

                  {/* Key Benefits Tags */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px' }}>
                    {item.keyBenefits.map((b) => (
                      <span
                        key={b}
                        style={{
                          fontSize: '10px',
                          background: '#242a20',
                          border: '1px solid #374230',
                          color: '#a3b497',
                          padding: '2px 7px',
                          borderRadius: '4px',
                        }}
                      >
                        ✓ {b}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Bottom Section: Stores & Price & Log Button */}
                <div style={{ borderTop: '1px solid #2d3326', paddingTop: '14px', marginTop: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#7a8572', marginBottom: '6px' }}>
                    Достапно во Македонија преку:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                    {item.retailers.map((r) => (
                      <span
                        key={r}
                        style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          color: '#60a5fa',
                          background: '#1a2636',
                          border: '1px solid #233b59',
                          padding: '2px 6px',
                          borderRadius: '4px',
                        }}
                      >
                        {r}
                      </span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Price in MKD */}
                    <div>
                      <div style={{ fontSize: '11px', color: '#8a9482', fontWeight: 600 }}>ПРОСЕЧНА ЦЕНА ВО МКД</div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                        <span style={{ fontSize: '20px', fontWeight: 800, color: '#f8fafc' }}>
                          {item.priceMkd.toLocaleString()}
                        </span>
                        <span style={{ fontSize: '13px', color: '#ff9a5e', fontWeight: 700 }}>ден</span>
                        {item.originalPriceMkd && (
                          <span style={{ fontSize: '12px', color: '#7e8775', textDecoration: 'line-through' }}>
                            {item.originalPriceMkd.toLocaleString()} ден
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Log Action */}
                    <button
                      type="button"
                      disabled={isLogged}
                      onClick={() => handleLog(item)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '8px 14px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 700,
                        background: isLogged ? '#244428' : '#ff792f',
                        color: '#ffffff',
                        border: 'none',
                        cursor: isLogged ? 'default' : 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      {isLogged ? (
                        <>
                          <Check size={14} /> Логирано!
                        </>
                      ) : (
                        <>
                          <Plus size={14} /> Запиши денес
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* EDUCATIONAL GUIDE FOOTER FOR MACEDONIAN ATHLETES */}
      <section
        style={{
          background: '#191b16',
          border: '1px solid #343c2c',
          borderRadius: '14px',
          padding: '20px 24px',
          fontSize: '13px',
          color: '#a8b29f',
          lineHeight: '1.6',
        }}
      >
        <h4 style={{ margin: '0 0 8px 0', color: '#f3f6ee', fontSize: '15px', fontWeight: 700 }}>
          💡 Препораки од спортски научници за користење на суплементи во Македонија:
        </h4>
        <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <li>
            <b>Основа на исхраната:</b> Суплементите се додатоци во исхраната, а не замена за разновидна, балансирана исхрана и квалитетен сон.
          </li>
          <li>
            <b>Креатин и хидратација:</b> Кога користите креатин (монохидрат или CreGAAtine), зголемете го внесот на вода за дополнителни 500–750 ml дневно. Можете директно да го следите ова во делот <b>Hydration</b>.
          </li>
          <li>
            <b>Протеин по тренинг:</b> Сурутка протеинот (Whey) се препорачува во првите 1–2 часа по вежбање за максимална стимулација на протеинската синтеза (Muscle Protein Synthesis).
          </li>
          <li>
            <b>Проверка на оригиналност:</b> Секогаш купувајте од официјални македонски увозници (HardCore Shop, Polleo Sport, Proteini.si, Herkules, Зегин/Еурофарм) со фискална сметка и декларација на македонски јазик.
          </li>
        </ul>
      </section>
    </div>
  );
}
