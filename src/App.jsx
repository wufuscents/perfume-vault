import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [perfumes, setPerfumes] = useState([]);
  const [dailySpotlight, setDailySpotlight] = useState([]);
  const [user, setUser] = useState(null);
  
  // Login Form
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState('');
  const [minScent, setMinScent] = useState(0);
  const [minPerformance, setMinPerformance] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [minPresentation, setMinPresentation] = useState(0);
  const [minOverall, setMinOverall] = useState(0);

  // Fetch Data & Auth State
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    fetchPerfumes();
    return () => authListener.subscription.unsubscribe();
  }, []);

  async function fetchPerfumes() {
    const { data, error } = await supabase.from('perfumes').select('*').order('created_at', { ascending: false });
    if (error) console.error('Error fetching perfumes:', error);
    else {
      setPerfumes(data || []);
      
      // Deterministic Daily 10 Selection based on current date
      if (data && data.length > 0) {
        const todayStr = new Date().toISOString().slice(0, 10);
        let seed = 0;
        for (let i = 0; i < todayStr.length; i++) seed += todayStr.charCodeAt(i);
        const shuffled = [...data].sort((a, b) => ((a.id.charCodeAt(0) * seed) % 10) - ((b.id.charCodeAt(0) * seed) % 10));
        setDailySpotlight(shuffled.slice(0, 10));
      }
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else {
      setShowLoginModal(false);
      setEmail('');
      setPassword('');
    }
  };

  const handleLogout = () => supabase.auth.signOut();

  // Filter Logic
  const filteredPerfumes = perfumes.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                          p.brand.toLowerCase().includes(search.toLowerCase());
    const allNotes = [...(p.notes?.top || []), ...(p.notes?.middle || []), ...(p.notes?.base || [])];
    const matchesNote = selectedNote ? allNotes.some(n => n.toLowerCase().includes(selectedNote.toLowerCase())) : true;

    return matchesSearch && matchesNote &&
           (p.rating_scent >= minScent) &&
           (p.rating_performance >= minPerformance) &&
           (p.rating_price >= minPrice) &&
           (p.rating_presentation >= minPresentation) &&
           (p.rating_overall >= minOverall);
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      {/* Header */}
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-8 pb-4 border-b border-slate-800">
        <h1 className="text-3xl font-extrabold tracking-tight text-amber-400">Perfume Vault</h1>
        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-400">Admin Mode Active</span>
              <button onClick={handleLogout} className="bg-slate-800 hover:bg-slate-700 text-sm px-3 py-1.5 rounded-lg">Logout</button>
            </div>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-semibold px-4 py-2 rounded-lg">
              Admin Login
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-10">
        {/* Daily 10 Spotlight */}
        {dailySpotlight.length > 0 && (
          <section>
            <h2 className="text-lg font-bold mb-4 text-amber-300 flex items-center gap-2">
              ✨ Daily 10 Spotlight <span className="text-xs font-normal text-slate-400">(Rotates daily)</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {dailySpotlight.map(p => (
                <div key={p.id} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800 flex flex-col justify-between">
                  <img src={p.bottle_image_url} alt={p.name} className="h-28 object-contain w-full mb-2" />
                  <div>
                    <h3 className="font-bold text-xs truncate">{p.name}</h3>
                    <p className="text-[10px] text-slate-400">{p.brand}</p>
                  </div>
                  <div className="mt-2 text-xs text-amber-400 font-semibold">★ {p.rating_overall}</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Filter Bar */}
        <section className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Search perfume or brand..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
            <input 
              type="text" 
              placeholder="Filter by note (e.g. Vanilla, Oud)..." 
              value={selectedNote} 
              onChange={e => setSelectedNote(e.target.value)} 
              className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-slate-800 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Min Scent: {minScent}★</label>
              <input type="range" min="0" max="5" step="0.5" value={minScent} onChange={e => setMinScent(parseFloat(e.target.value))} className="w-full accent-amber-400" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Min Performance: {minPerformance}★</label>
              <input type="range" min="0" max="5" step="0.5" value={minPerformance} onChange={e => setMinPerformance(parseFloat(e.target.value))} className="w-full accent-amber-400" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Min Price: {minPrice}★</label>
              <input type="range" min="0" max="5" step="0.5" value={minPrice} onChange={e => setMinPrice(parseFloat(e.target.value))} className="w-full accent-amber-400" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Min Presentation: {minPresentation}★</label>
              <input type="range" min="0" max="5" step="0.5" value={minPresentation} onChange={e => setMinPresentation(parseFloat(e.target.value))} className="w-full accent-amber-400" />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Min Overall: {minOverall}★</label>
              <input type="range" min="0" max="5" step="0.5" value={minOverall} onChange={e => setMinOverall(parseFloat(e.target.value))} className="w-full accent-amber-400" />
            </div>
          </div>
        </section>

        {/* Collection Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPerfumes.map(p => (
            <PerfumeCard key={p.id} perfume={p} isAdmin={!!user} onUpdate={fetchPerfumes} />
          ))}
        </section>
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4">
          <form onSubmit={handleLogin} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 w-full max-w-sm space-y-4">
            <h3 className="text-lg font-bold text-amber-400">Admin Sign In</h3>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-sm" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-sm" />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowLoginModal(false)} className="px-3 py-1.5 rounded text-sm text-slate-400">Cancel</button>
              <button type="submit" className="bg-amber-500 text-slate-950 font-semibold px-4 py-1.5 rounded-lg text-sm">Login</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function PerfumeCard({ perfume, isAdmin, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [shopee, setShopee] = useState(perfume.link_shopee || '');
  const [tokopedia, setTokopedia] = useState(perfume.link_tokopedia || '');
  const [tiktokShop, setTiktokShop] = useState(perfume.link_tiktok_shop || '');
  const [yt, setYt] = useState(perfume.video_youtube || '');
  const [tt, setTt] = useState(perfume.video_tiktok || '');

  const saveChanges = async () => {
    const { error } = await supabase.from('perfumes').update({
      link_shopee: shopee,
      link_tokopedia: tokopedia,
      link_tiktok_shop: tiktokShop,
      video_youtube: yt,
      video_tiktok: tt
    }).eq('id', perfume.id);

    if (error) alert(error.message);
    else {
      setIsEditing(false);
      onUpdate();
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between relative shadow-xl">
      {isAdmin && (
        <button onClick={() => setIsEditing(!isEditing)} className="absolute top-4 right-4 text-xs bg-amber-500/20 text-amber-400 border border-amber-500/40 px-2 py-1 rounded-lg">
          {isEditing ? 'Cancel' : '✏️ Edit Links'}
        </button>
      )}

      <div>
        <div className="flex gap-2 h-44 bg-slate-950 p-2 rounded-xl mb-4 justify-center items-center">
          <img src={perfume.bottle_image_url} alt={perfume.name} className="h-full object-contain max-w-[50%]" />
          {perfume.box_image_url && <img src={perfume.box_image_url} alt="Box" className="h-full object-contain max-w-[50%]" />}
        </div>

        <h3 className="font-bold text-lg">{perfume.name}</h3>
        <p className="text-xs text-slate-400 mb-2">{perfume.brand} • Released {perfume.release_year}</p>

        {perfume.is_dupe && (
          <div className="bg-amber-950/50 border border-amber-800/50 text-amber-300 text-xs px-2.5 py-1 rounded-md mb-3 inline-block">
            🔍 Dupe of: <span className="font-semibold">{perfume.dupe_of}</span>
          </div>
        )}

        <div className="space-y-1 text-xs bg-slate-950/60 p-3 rounded-xl mb-4 border border-slate-800">
          <p><span className="text-amber-400 font-medium">Top:</span> {perfume.notes?.top?.join(', ')}</p>
          <p><span className="text-amber-400 font-medium">Middle:</span> {perfume.notes?.middle?.join(', ')}</p>
          <p><span className="text-amber-400 font-medium">Base:</span> {perfume.notes?.base?.join(', ')}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mb-3">
          <div className="bg-slate-950 p-2 rounded-lg">Scent: <span className="font-bold text-amber-400">{perfume.rating_scent}★</span></div>
          <div className="bg-slate-950 p-2 rounded-lg">Performance: <span className="font-bold text-amber-400">{perfume.rating_performance}★</span></div>
          <div className="bg-slate-950 p-2 rounded-lg">Price: <span className="font-bold text-amber-400">{perfume.rating_price}★</span></div>
          <div className="bg-slate-950 p-2 rounded-lg">Presentation: <span className="font-bold text-amber-400">{perfume.rating_presentation}★</span></div>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 p-2 rounded-lg text-center font-bold text-amber-400 text-sm mb-4">
          Overall: {perfume.rating_overall} / 5.0 ★
        </div>
      </div>

      {isEditing ? (
        <div className="bg-slate-950 p-3 rounded-xl space-y-2 text-xs border border-amber-500/40">
          <input type="text" placeholder="Shopee URL" value={shopee} onChange={e => setShopee(e.target.value)} className="w-full bg-slate-900 p-1.5 rounded border border-slate-800" />
          <input type="text" placeholder="Tokopedia URL" value={tokopedia} onChange={e => setTokopedia(e.target.value)} className="w-full bg-slate-900 p-1.5 rounded border border-slate-800" />
          <input type="text" placeholder="TikTok Shop URL" value={tiktokShop} onChange={e => setTiktokShop(e.target.value)} className="w-full bg-slate-900 p-1.5 rounded border border-slate-800" />
          <input type="text" placeholder="YouTube Review URL" value={yt} onChange={e => setYt(e.target.value)} className="w-full bg-slate-900 p-1.5 rounded border border-slate-800" />
          <input type="text" placeholder="TikTok Review URL" value={tt} onChange={e => setTt(e.target.value)} className="w-full bg-slate-900 p-1.5 rounded border border-slate-800" />
          <button onClick={saveChanges} className="w-full bg-amber-500 text-slate-950 font-bold py-1.5 rounded mt-2">Save to Supabase</button>
        </div>
      ) : (
        <div className="space-y-2 pt-2 border-t border-slate-800 text-xs">
          <div className="flex flex-wrap gap-1.5">
            {perfume.link_shopee && <a href={perfume.link_shopee} target="_blank" rel="noreferrer" className="bg-orange-600/80 text-white px-2.5 py-1 rounded-md text-[11px]">Shopee</a>}
            {perfume.link_tokopedia && <a href={perfume.link_tokopedia} target="_blank" rel="noreferrer" className="bg-emerald-600/80 text-white px-2.5 py-1 rounded-md text-[11px]">Tokopedia</a>}
            {perfume.link_tiktok_shop && <a href={perfume.link_tiktok_shop} target="_blank" rel="noreferrer" className="bg-slate-800 text-white px-2.5 py-1 rounded-md text-[11px]">TikTok Shop</a>}
            {perfume.link_fragrantica && <a href={perfume.link_fragrantica} target="_blank" rel="noreferrer" className="bg-blue-900/60 text-blue-300 border border-blue-800 px-2.5 py-1 rounded-md text-[11px]">Fragrantica</a>}
          </div>
          <div className="flex gap-3 text-[11px] pt-1">
            {perfume.video_youtube && <a href={perfume.video_youtube} target="_blank" rel="noreferrer" className="text-red-400 hover:underline">▶ YouTube Review</a>}
            {perfume.video_tiktok && <a href={perfume.video_tiktok} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">🎵 TikTok Review</a>}
          </div>
        </div>
      )}
    </div>
  );
}
