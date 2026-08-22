import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [perfumes, setPerfumes] = useState([]);
  const [dailySpotlight, setDailySpotlight] = useState([]);
  const [user, setUser] = useState(null);
  const [selectedPerfume, setSelectedPerfume] = useState(null);
  
  // Login & Add Perfume Modals
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // New Perfume Form State
  const [newName, setNewName] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newReleaseYear, setNewReleaseYear] = useState('');
  const [newIsDupe, setNewIsDupe] = useState(false);
  const [newDupeOf, setNewDupeOf] = useState('');
  const [newTopNotes, setNewTopNotes] = useState('');
  const [newMiddleNotes, setNewMiddleNotes] = useState('');
  const [newBaseNotes, setNewBaseNotes] = useState('');
  const [newScent, setNewScent] = useState('4.0');
  const [newPerf, setNewPerf] = useState('4.0');
  const [newPrice, setNewPrice] = useState('4.0');
  const [newPres, setNewPres] = useState('4.0');
  const [newOverall, setNewOverall] = useState('4.0');
  const [bottleFile, setBottleFile] = useState(null);
  const [boxFile, setBoxFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [selectedNote, setSelectedNote] = useState('');
  const [minScent, setMinScent] = useState(0);
  const [minPerformance, setMinPerformance] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [minPresentation, setMinPresentation] = useState(0);
  const [minOverall, setMinOverall] = useState(0);

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

  const uploadImageToSupabase = async (file) => {
    if (!file) return '';
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage.from('perfume-media').upload(filePath, file);
    if (uploadError) {
      alert(uploadError.message);
      return '';
    }

    const { data } = supabase.storage.from('perfume-media').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleCreatePerfume = async (e) => {
    e.preventDefault();
    setUploading(true);

    const bottleUrl = await uploadImageToSupabase(bottleFile);
    const boxUrl = await uploadImageToSupabase(boxFile);

    const topArray = newTopNotes.split(',').map(n => n.trim()).filter(Boolean);
    const middleArray = newMiddleNotes.split(',').map(n => n.trim()).filter(Boolean);
    const baseArray = newBaseNotes.split(',').map(n => n.trim()).filter(Boolean);

    const { error } = await supabase.from('perfumes').insert([{
      name: newName,
      brand: newBrand,
      release_year: parseInt(newReleaseYear) || null,
      is_dupe: newIsDupe,
      dupe_of: newDupeOf,
      bottle_image_url: bottleUrl,
      box_image_url: boxUrl,
      notes: { top: topArray, middle: middleArray, base: baseArray },
      rating_scent: parseFloat(newScent),
      rating_performance: parseFloat(newPerf),
      rating_price: parseFloat(newPrice),
      rating_presentation: parseFloat(newPres),
      rating_overall: parseFloat(newOverall)
    }]);

    setUploading(false);
    if (error) {
      alert(error.message);
    } else {
      setShowAddModal(false);
      setNewName(''); setNewBrand(''); setNewReleaseYear(''); setNewIsDupe(false); setNewDupeOf('');
      setNewTopNotes(''); setNewMiddleNotes(''); setNewBaseNotes('');
      setBottleFile(null); setBoxFile(null);
      fetchPerfumes();
    }
  };

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
    <div className="min-h-screen bg-[#0A0A0A] text-zinc-100 p-6 md:p-10 font-sans">
      <header className="max-w-7xl mx-auto flex justify-between items-center mb-12 pb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center font-bold text-black text-sm">PV</div>
          <h1 className="text-2xl font-serif tracking-widest text-white uppercase">Perfume<span className="text-amber-400 font-sans font-bold">Vault</span></h1>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <button onClick={() => setShowAddModal(true)} className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full transition shadow-lg shadow-amber-400/10">
                + Add Perfume
              </button>
              <span className="text-xs text-amber-400 border border-amber-400/30 px-3 py-1 rounded-full bg-amber-400/5 hidden sm:inline-block">Admin Active</span>
              <button onClick={handleLogout} className="bg-zinc-900 hover:bg-zinc-800 text-xs px-4 py-2 rounded-full border border-white/10 transition">Logout</button>
            </div>
          ) : (
            <button onClick={() => setShowLoginModal(true)} className="bg-amber-400 hover:bg-amber-300 text-black text-xs font-bold uppercase tracking-wider px-6 py-2.5 rounded-full transition shadow-lg shadow-amber-400/10">
              Admin Login
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-12">
        <section className="py-6 border-b border-white/5">
          <p className="text-amber-400 text-xs tracking-widest uppercase mb-2 font-medium">Curated Fragrance Collection</p>
          <h2 className="text-4xl md:text-5xl font-serif text-white max-w-2xl leading-tight">
            Sculpting Scents in a Bottle. The Art of Perfumery.
          </h2>
        </section>

        {dailySpotlight.length > 0 && (
          <section>
            <div className="flex justify-between items-end mb-6">
              <div>
                <h3 className="text-2xl font-serif text-white">Daily Spotlight</h3>
                <p className="text-xs text-zinc-500">Curated selections rotated every 24 hours</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {dailySpotlight.map(p => (
                <div key={p.id} onClick={() => setSelectedPerfume(p)} className="bg-[#121212] p-4 rounded-2xl border border-white/5 flex flex-col justify-between hover:border-amber-400/30 transition cursor-pointer group">
                  <div className="h-32 bg-[#1A1A1A] rounded-xl p-2 mb-3 flex items-center justify-center">
                    <img src={p.bottle_image_url} alt={p.name} className="h-full object-contain group-hover:scale-105 transition duration-300" />
                  </div>
                  <div>
                    <h4 className="font-medium text-xs text-white truncate">{p.name}</h4>
                    <p className="text-[10px] text-zinc-500">{p.brand}</p>
                  </div>
                  <div className="mt-3 flex justify-between items-center text-xs pt-2 border-t border-white/5">
                    <span className="text-amber-400 font-bold">★ {p.rating_overall}</span>
                    <span className="text-[10px] bg-amber-400/10 text-amber-400 px-2 py-0.5 rounded-full">Spotlight</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-[#121212] p-6 rounded-2xl border border-white/5 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Search by perfume name or brand..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-400 transition"
            />
            <input 
              type="text" 
              placeholder="Filter by note (e.g. Amber, Vanilla, Bergamot)..." 
              value={selectedNote} 
              onChange={e => setSelectedNote(e.target.value)} 
              className="bg-[#1A1A1A] border border-white/10 rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-amber-400 transition"
            />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-4 border-t border-white/5 text-xs">
            <div>
              <label className="text-zinc-400 block mb-1">Min Scent: <span className="text-amber-400 font-bold">{minScent}★</span></label>
              <input type="range" min="0" max="5" step="0.5" value={minScent} onChange={e => setMinScent(parseFloat(e.target.value))} className="w-full accent-amber-400" />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Min Performance: <span className="text-amber-400 font-bold">{minPerformance}★</span></label>
              <input type="range" min="0" max="5" step="0.5" value={minPerformance} onChange={e => setMinPerformance(parseFloat(e.target.value))} className="w-full accent-amber-400" />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Min Price: <span className="text-amber-400 font-bold">{minPrice}★</span></label>
              <input type="range" min="0" max="5" step="0.5" value={minPrice} onChange={e => setMinPrice(parseFloat(e.target.value))} className="w-full accent-amber-400" />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Min Presentation: <span className="text-amber-400 font-bold">{minPresentation}★</span></label>
              <input type="range" min="0" max="5" step="0.5" value={minPresentation} onChange={e => setMinPresentation(parseFloat(e.target.value))} className="w-full accent-amber-400" />
            </div>
            <div>
              <label className="text-zinc-400 block mb-1">Min Overall: <span className="text-amber-400 font-bold">{minOverall}★</span></label>
              <input type="range" min="0" max="5" step="0.5" value={minOverall} onChange={e => setMinOverall(parseFloat(e.target.value))} className="w-full accent-amber-400" />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredPerfumes.map(p => (
            <PerfumeCard key={p.id} perfume={p} isAdmin={!!user} onUpdate={fetchPerfumes} onSelect={() => setSelectedPerfume(p)} />
          ))}
        </section>
      </main>

      {/* INDIVIDUAL PERFUME DETAIL MODAL */}
      {selectedPerfume && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#121212] border border-amber-400/30 rounded-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 relative my-8 shadow-2xl">
            <button onClick={() => setSelectedPerfume(null)} className="absolute top-4 right-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 w-8 h-8 rounded-full flex items-center justify-center text-sm transition">✕</button>

            <div className="grid grid-cols-2 gap-4 h-64 bg-[#1A1A1A] p-4 rounded-xl border border-white/5 items-center justify-center">
              {selectedPerfume.bottle_image_url && <img src={selectedPerfume.bottle_image_url} alt={selectedPerfume.name} className="h-full object-contain mx-auto" />}
              {selectedPerfume.box_image_url && <img src={selectedPerfume.box_image_url} alt="Box" className="h-full object-contain mx-auto" />}
            </div>

            <div>
              <h2 className="text-3xl font-serif text-white">{selectedPerfume.name}</h2>
              <p className="text-xs text-zinc-400 mt-1">{selectedPerfume.brand} • Released {selectedPerfume.release_year}</p>
            </div>

            {selectedPerfume.is_dupe && (
              <div className="bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs px-4 py-2 rounded-xl">
                🔍 <strong>Dupe of:</strong> {selectedPerfume.dupe_of}
              </div>
            )}

            <div className="bg-[#1A1A1A] p-4 rounded-xl border border-white/5 space-y-2 text-xs">
              <p><span className="text-amber-400 font-bold">Top Notes:</span> {selectedPerfume.notes?.top?.join(', ') || 'N/A'}</p>
              <p><span className="text-amber-400 font-bold">Middle Notes:</span> {selectedPerfume.notes?.middle?.join(', ') || 'N/A'}</p>
              <p><span className="text-amber-400 font-bold">Base Notes:</span> {selectedPerfume.notes?.base?.join(', ') || 'N/A'}</p>
            </div>

            <div className="grid grid-cols-4 gap-2 text-xs text-center">
              <div className="bg-[#1A1A1A] p-2.5 rounded-xl border border-white/5"><div className="text-zinc-500">Scent</div><div className="font-bold text-amber-400">{selectedPerfume.rating_scent}★</div></div>
              <div className="bg-[#1A1A1A] p-2.5 rounded-xl border border-white/5"><div className="text-zinc-500">Perf</div><div className="font-bold text-amber-400">{selectedPerfume.rating_performance}★</div></div>
              <div className="bg-[#1A1A1A] p-2.5 rounded-xl border border-white/5"><div className="text-zinc-500">Price</div><div className="font-bold text-amber-400">{selectedPerfume.rating_price}★</div></div>
              <div className="bg-[#1A1A1A] p-2.5 rounded-xl border border-white/5"><div className="text-zinc-500">Pres</div><div className="font-bold text-amber-400">{selectedPerfume.rating_presentation}★</div></div>
            </div>

            <div className="bg-amber-400/10 border border-amber-400/30 p-3 rounded-xl text-center font-bold text-amber-400 text-base">
              Overall Rating: {selectedPerfume.rating_overall} / 5.0 ★
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              {selectedPerfume.link_shopee && <a href={selectedPerfume.link_shopee} target="_blank" rel="noreferrer" className="bg-amber-400 text-black font-bold px-5 py-2 rounded-full text-xs hover:bg-amber-300 transition">Shopee</a>}
              {selectedPerfume.link_tokopedia && <a href={selectedPerfume.link_tokopedia} target="_blank" rel="noreferrer" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-5 py-2 rounded-full text-xs">Tokopedia</a>}
              {selectedPerfume.link_tiktok_shop && <a href={selectedPerfume.link_tiktok_shop} target="_blank" rel="noreferrer" className="bg-zinc-800 text-zinc-200 px-5 py-2 rounded-full text-xs">TikTok Shop</a>}
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleLogin} className="bg-[#121212] p-8 rounded-2xl border border-white/10 w-full max-w-sm space-y-5">
            <h3 className="text-xl font-serif text-white">Admin Access</h3>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full bg-[#1A1A1A] p-3 rounded-xl border border-white/10 text-xs text-white" />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full bg-[#1A1A1A] p-3 rounded-xl border border-white/10 text-xs text-white" />
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowLoginModal(false)} className="px-4 py-2 rounded-full text-xs text-zinc-400">Cancel</button>
              <button type="submit" className="bg-amber-400 text-black font-bold px-6 py-2 rounded-full text-xs uppercase tracking-wider">Login</button>
            </div>
          </form>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto">
          <form onSubmit={handleCreatePerfume} className="bg-[#121212] p-8 rounded-2xl border border-white/10 w-full max-w-xl space-y-4 my-8">
            <h3 className="text-xl font-serif text-amber-400">Add New Perfume</h3>
            
            <div className="grid grid-cols-2 gap-3">
              <input type="text" placeholder="Perfume Name" value={newName} onChange={e => setNewName(e.target.value)} required className="bg-[#1A1A1A] p-3 rounded-xl border border-white/10 text-xs text-white" />
              <input type="text" placeholder="Brand" value={newBrand} onChange={e => setNewBrand(e.target.value)} required className="bg-[#1A1A1A] p-3 rounded-xl border border-white/10 text-xs text-white" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Release Year (e.g. 2023)" value={newReleaseYear} onChange={e => setNewReleaseYear(e.target.value)} className="bg-[#1A1A1A] p-3 rounded-xl border border-white/10 text-xs text-white" />
              <div className="flex items-center gap-3 bg-[#1A1A1A] px-3 rounded-xl border border-white/10">
                <input type="checkbox" id="dupeCheck" checked={newIsDupe} onChange={e => setNewIsDupe(e.target.checked)} className="accent-amber-400" />
                <label htmlFor="dupeCheck" className="text-xs text-zinc-300">Is this a Dupe?</label>
              </div>
            </div>

            {newIsDupe && (
              <input type="text" placeholder="Dupe of (e.g. Creed Aventus)" value={newDupeOf} onChange={e => setNewDupeOf(e.target.value)} className="w-full bg-[#1A1A1A] p-3 rounded-xl border border-white/10 text-xs text-white" />
            )}

            <div className="space-y-2 text-xs">
              <label className="text-zinc-400">Fragrance Notes (comma separated)</label>
              <input type="text" placeholder="Top Notes (e.g. Lemon, Bergamot)" value={newTopNotes} onChange={e => setNewTopNotes(e.target.value)} className="w-full bg-[#1A1A1A] p-2.5 rounded-xl border border-white/10 text-white" />
              <input type="text" placeholder="Middle Notes (e.g. Jasmine, Rose)" value={newMiddleNotes} onChange={e => setNewMiddleNotes(e.target.value)} className="w-full bg-[#1A1A1A] p-2.5 rounded-xl border border-white/10 text-white" />
              <input type="text" placeholder="Base Notes (e.g. Amber, Musk, Vanilla)" value={newBaseNotes} onChange={e => setNewBaseNotes(e.target.value)} className="w-full bg-[#1A1A1A] p-2.5 rounded-xl border border-white/10 text-white" />
            </div>

            <div className="grid grid-cols-5 gap-2 text-xs">
              <div>
                <label className="text-zinc-400 block mb-1">Scent</label>
                <input type="number" step="0.5" min="0" max="5" value={newScent} onChange={e => setNewScent(e.target.value)} className="w-full bg-[#1A1A1A] p-2 rounded-xl border border-white/10 text-white text-center" />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Perf</label>
                <input type="number" step="0.5" min="0" max="5" value={newPerf} onChange={e => setNewPerf(e.target.value)} className="w-full bg-[#1A1A1A] p-2 rounded-xl border border-white/10 text-white text-center" />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Price</label>
                <input type="number" step="0.5" min="0" max="5" value={newPrice} onChange={e => setNewPrice(e.target.value)} className="w-full bg-[#1A1A1A] p-2 rounded-xl border border-white/10 text-white text-center" />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Pres</label>
                <input type="number" step="0.5" min="0" max="5" value={newPres} onChange={e => setNewPres(e.target.value)} className="w-full bg-[#1A1A1A] p-2 rounded-xl border border-white/10 text-white text-center" />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Overall</label>
                <input type="number" step="0.5" min="0" max="5" value={newOverall} onChange={e => setNewOverall(e.target.value)} className="w-full bg-[#1A1A1A] p-2 rounded-xl border border-white/10 text-white text-center" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div>
                <label className="text-zinc-400 block mb-1">Bottle Image File</label>
                <input type="file" accept="image/*" onChange={e => setBottleFile(e.target.files[0])} className="w-full text-zinc-400 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-400 file:text-black hover:file:bg-amber-300" />
              </div>
              <div>
                <label className="text-zinc-400 block mb-1">Box Image File (Optional)</label>
                <input type="file" accept="image/*" onChange={e => setBoxFile(e.target.files[0])} className="w-full text-zinc-400 file:mr-2 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-zinc-800 file:text-zinc-200 hover:file:bg-zinc-700" />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-full text-xs text-zinc-400">Cancel</button>
              <button type="submit" disabled={uploading} className="bg-amber-400 text-black font-bold px-6 py-2 rounded-full text-xs uppercase tracking-wider disabled:opacity-50">
                {uploading ? 'Uploading & Saving...' : 'Save Perfume'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function PerfumeCard({ perfume, isAdmin, onUpdate, onSelect }) {
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
    <div className="bg-[#121212] border border-white/5 rounded-2xl p-6 flex flex-col justify-between relative shadow-2xl hover:border-amber-400/20 transition group">
      {isAdmin && (
        <button onClick={(e) => { e.stopPropagation(); setIsEditing(!isEditing); }} className="absolute top-4 right-4 text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/30 px-3 py-1 rounded-full z-10">
          {isEditing ? 'Cancel' : '✏️ Edit Links'}
        </button>
      )}

      <div onClick={onSelect} className="cursor-pointer">
        <div className="flex gap-3 h-52 bg-[#1A1A1A] p-4 rounded-xl mb-5 justify-center items-center relative overflow-hidden">
          <img src={perfume.bottle_image_url} alt={perfume.name} className="h-full object-contain max-w-[50%] group-hover:scale-105 transition duration-500" />
          {perfume.box_image_url && <img src={perfume.box_image_url} alt="Box" className="h-full object-contain max-w-[50%] group-hover:scale-105 transition duration-500" />}
        </div>

        <h3 className="font-serif text-xl text-white mb-1 group-hover:text-amber-400 transition">{perfume.name}</h3>
        <p className="text-xs text-zinc-500 mb-3">{perfume.brand} • Released {perfume.release_year}</p>

        {perfume.is_dupe && (
          <div className="bg-amber-400/10 border border-amber-400/20 text-amber-300 text-[11px] px-3 py-1 rounded-full mb-4 inline-block">
            🔍 Dupe of: <span className="font-semibold">{perfume.dupe_of}</span>
          </div>
        )}

        <div className="space-y-1.5 text-xs bg-[#1A1A1A] p-4 rounded-xl mb-5 border border-white/5 text-zinc-300">
          <p><span className="text-amber-400 font-semibold">Top:</span> {perfume.notes?.top?.join(', ')}</p>
          <p><span className="text-amber-400 font-semibold">Middle:</span> {perfume.notes?.middle?.join(', ')}</p>
          <p><span className="text-amber-400 font-semibold">Base:</span> {perfume.notes?.base?.join(', ')}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs mb-3 text-zinc-300">
          <div className="bg-[#1A1A1A] p-2.5 rounded-lg border border-white/5">Scent: <span className="font-bold text-amber-400">{perfume.rating_scent}★</span></div>
          <div className="bg-[#1A1A1A] p-2.5 rounded-lg border border-white/5">Perf: <span className="font-bold text-amber-400">{perfume.rating_performance}★</span></div>
          <div className="bg-[#1A1A1A] p-2.5 rounded-lg border border-white/5">Price: <span className="font-bold text-amber-400">{perfume.rating_price}★</span></div>
          <div className="bg-[#1A1A1A] p-2.5 rounded-lg border border-white/5">Pres: <span className="font-bold text-amber-400">{perfume.rating_presentation}★</span></div>
        </div>
        <div className="bg-amber-400/10 border border-amber-400/30 p-2.5 rounded-xl text-center font-bold text-amber-400 text-sm mb-5">
          Overall: {perfume.rating_overall} / 5.0 ★
        </div>
      </div>

      {isEditing ? (
        <div className="bg-[#1A1A1A] p-4 rounded-xl space-y-2 text-xs border border-amber-400/30">
          <input type="text" placeholder="Shopee URL" value={shopee} onChange={e => setShopee(e.target.value)} className="w-full bg-[#121212] p-2 rounded-lg border border-white/10 text-white" />
          <input type="text" placeholder="Tokopedia URL" value={tokopedia} onChange={e => setTokopedia(e.target.value)} className="w-full bg-[#121212] p-2 rounded-lg border border-white/10 text-white" />
          <input type="text" placeholder="TikTok Shop URL" value={tiktokShop} onChange={e => setTiktokShop(e.target.value)} className="w-full bg-[#121212] p-2 rounded-lg border border-white/10 text-white" />
          <input type="text" placeholder="YouTube Review URL" value={yt} onChange={e => setYt(e.target.value)} className="w-full bg-[#121212] p-2 rounded-lg border border-white/10 text-white" />
          <input type="text" placeholder="TikTok Review URL" value={tt} onChange={e => setTt(e.target.value)} className="w-full bg-[#121212] p-2 rounded-lg border border-white/10 text-white" />
          <button onClick={saveChanges} className="w-full bg-amber-400 text-black font-bold py-2 rounded-lg mt-2 uppercase tracking-wider text-[11px]">Save Changes</button>
        </div>
      ) : (
        <div className="space-y-3 pt-3 border-t border-white/5 text-xs">
          <div className="flex flex-wrap gap-2">
            {perfume.link_shopee && <a href={perfume.link_shopee} target="_blank" rel="noreferrer" className="bg-amber-400 text-black font-bold px-3 py-1 rounded-full text-[11px] hover:bg-amber-300 transition">Shopee</a>}
            {perfume.link_tokopedia && <a href={perfume.link_tokopedia} target="_blank" rel="noreferrer" className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full text-[11px]">Tokopedia</a>}
            {perfume.link_tiktok_shop && <a href={perfume.link_tiktok_shop} target="_blank" rel="noreferrer" className="bg-zinc-800 text-zinc-200 px-3 py-1 rounded-full text-[11px]">TikTok Shop</a>}
            {perfume.link_fragrantica && <a href={perfume.link_fragrantica} target="_blank" rel="noreferrer" className="bg-zinc-900 text-zinc-400 border border-white/10 px-3 py-1 rounded-full text-[11px]">Fragrantica</a>}
          </div>
          <div className="flex gap-4 text-[11px] pt-1">
            {perfume.video_youtube && <a href={perfume.video_youtube} target="_blank" rel="noreferrer" className="text-red-400 hover:underline">▶ YouTube Review</a>}
            {perfume.video_tiktok && <a href={perfume.video_tiktok} target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">🎵 TikTok Review</a>}
          </div>
        </div>
      )}
    </div>
  );
}
