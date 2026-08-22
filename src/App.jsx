import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function App() {
  const [perfumes, setPerfumes] = useState([]);
  const [selectedPerfume, setSelectedPerfume] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [noteFilter, setNoteFilter] = useState('');
  const [minScent, setMinScent] = useState(0);
  const [minPerf, setMinPerf] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [minPres, setMinPres] = useState(0);
  const [minOverall, setMinOverall] = useState(0);

  // Admin Auth States
  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form States
  const [name, setName] = useState('');
  const [house, setHouse] = useState('');
  const [releaseYear, setReleaseYear] = useState('');
  const [isDupe, setIsDupe] = useState(false);
  const [dupeNotes, setDupeNotes] = useState('');
  const [topNotes, setTopNotes] = useState('');
  const [middleNotes, setMiddleNotes] = useState('');
  const [baseNotes, setBaseNotes] = useState('');
  const [scent, setScent] = useState(5);
  const [performance, setPerformance] = useState(5);
  const [price, setPrice] = useState(5);
  const [presentation, setPresentation] = useState(5);
  const [overall, setOverall] = useState(5);
  const [shopeeLink, setShopeeLink] = useState('');
  const [tokopediaLink, setTokopediaLink] = useState('');
  const [bottleFile, setBottleFile] = useState(null);
  const [boxFile, setBoxFile] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPerfumes();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchPerfumes = async () => {
    const { data, error } = await supabase.from('perfumes').select('*').order('created_at', { ascending: false });
    if (!error && data) setPerfumes(data);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    else setShowLoginModal(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const uploadImageToSupabase = async (file) => {
    if (!file) return '';
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from('perfume-media').upload(fileName, file);
    if (uploadError) {
      alert(uploadError.message);
      return '';
    }
    const { data } = supabase.storage.from('perfume-media').getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleAddPerfume = async (e) => {
    e.preventDefault();
    setLoading(true);
    const bottleUrl = await uploadImageToSupabase(bottleFile);
    const boxUrl = await uploadImageToSupabase(boxFile);

    const { error } = await supabase.from('perfumes').insert([{
      name, house, release_year: releaseYear, is_dupe: isDupe, dupe_notes: dupeNotes,
      top_notes: topNotes, middle_notes: middleNotes, base_notes: baseNotes,
      scent_rating: scent, perf_rating: performance, price_rating: price,
      pres_rating: presentation, overall_rating: overall, shopee_link: shopeeLink,
      tokopedia_link: tokopediaLink, bottle_url: bottleUrl, box_url: boxUrl
    }]);

    setLoading(false);
    if (error) alert(error.message);
    else {
      setShowAddModal(false);
      fetchPerfumes();
    }
  };

  const filteredPerfumes = perfumes.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.house.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesNote = !noteFilter || `${p.top_notes} ${p.middle_notes} ${p.base_notes}`.toLowerCase().includes(noteFilter.toLowerCase());
    return matchesSearch && matchesNote &&
      p.scent_rating >= minScent && p.perf_rating >= minPerf &&
      p.price_rating >= minPrice && p.pres_rating >= minPres &&
      p.overall_rating >= minOverall;
  });

  return (
    <div style={{ backgroundColor: '#0c0c0c', color: '#f5f5f5', minHeight: '100vh', fontFamily: 'sans-serif', padding: '20px' }}>
      
      {/* HEADER */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid #222', paddingBottom: '15px' }}>
        <h1 style={{ fontFamily: 'serif', color: '#d4af37', margin: 0, letterSpacing: '2px', cursor: 'pointer' }} onClick={() => setSelectedPerfume(null)}>
          PERFUME<span style={{ color: '#fff' }}>VAULT</span>
        </h1>
        <div>
          {user ? (
            <>
              <button onClick={() => setShowAddModal(true)} style={styles.goldBtn}>+ ADD PERFUME</button>
              <button onClick={handleLogout} style={styles.darkBtn}>Logout</button>
            </>
          ) : (
            <button onClick={() => setShowLoginModal(true)} style={styles.darkBtn}>Admin Login</button>
          )}
        </div>
      </header>

      {/* DETAILED VIEW (SINGLE PAGE) */}
      {selectedPerfume ? (
        <div style={{ maxWidth: '900px', margin: '0 auto', backgroundColor: '#141414', borderRadius: '12px', padding: '30px', border: '1px solid #282828' }}>
          <button onClick={() => setSelectedPerfume(null)} style={{ ...styles.darkBtn, marginBottom: '20px' }}>← Back to Vault</button>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
            {selectedPerfume.bottle_url && <img src={selectedPerfume.bottle_url} alt={selectedPerfume.name} style={{ width: '100%', borderRadius: '8px', border: '1px solid #333' }} />}
            {selectedPerfume.box_url && <img src={selectedPerfume.box_url} alt="Box" style={{ width: '100%', borderRadius: '8px', border: '1px solid #333' }} />}
          </div>

          <h2 style={{ fontFamily: 'serif', color: '#fff', fontSize: '2rem', margin: '0 0 5px 0' }}>{selectedPerfume.name}</h2>
          <p style={{ color: '#888', margin: '0 0 15px 0' }}>{selectedPerfume.house} • Released {selectedPerfume.release_year}</p>

          {selectedPerfume.is_dupe && (
            <div style={{ backgroundColor: '#222', color: '#d4af37', padding: '10px 15px', borderRadius: '6px', marginBottom: '20px', border: '1px solid #d4af37' }}>
              🔍 <strong>Dupe Note:</strong> {selectedPerfume.dupe_notes}
            </div>
          )}

          <div style={{ backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
            <h3 style={{ color: '#d4af37', marginTop: 0 }}>Fragrance Breakdown</h3>
            <p><strong>Top Notes:</strong> {selectedPerfume.top_notes}</p>
            <p><strong>Middle Notes:</strong> {selectedPerfume.middle_notes}</p>
            <p><strong>Base Notes:</strong> {selectedPerfume.base_notes}</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat( auto-fit, minmax(120px, 1fr) )', gap: '10px', marginBottom: '30px' }}>
            <div style={styles.scoreBox}>Scent: <strong>{selectedPerfume.scent_rating}★</strong></div>
            <div style={styles.scoreBox}>Perf: <strong>{selectedPerfume.perf_rating}★</strong></div>
            <div style={styles.scoreBox}>Price: <strong>{selectedPerfume.price_rating}★</strong></div>
            <div style={styles.scoreBox}>Pres: <strong>{selectedPerfume.pres_rating}★</strong></div>
            <div style={{ ...styles.scoreBox, border: '1px solid #d4af37', color: '#d4af37' }}>Overall: <strong>{selectedPerfume.overall_rating}★</strong></div>
          </div>

          <div style={{ display: 'flex', gap: '15px' }}>
            {selectedPerfume.shopee_link && <a href={selectedPerfume.shopee_link} target="_blank" rel="noreferrer" style={styles.buyBtn}>Buy on Shopee</a>}
            {selectedPerfume.tokopedia_link && <a href={selectedPerfume.tokopedia_link} target="_blank" rel="noreferrer" style={{ ...styles.buyBtn, backgroundColor: '#03ac0e' }}>Buy on Tokopedia</a>}
          </div>
        </div>
      ) : (
        /* VAULT GRID VIEW */
        <>
          {/* SEARCH & FILTERS */}
          <div style={{ backgroundColor: '#141414', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
            <input type="text" placeholder="Search perfume name or house..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={styles.input} />
            <input type="text" placeholder="Filter by note (e.g. Vanilla, Amber)..." value={noteFilter} onChange={e => setNoteFilter(e.target.value)} style={{ ...styles.input, marginTop: '10px' }} />
          </div>

          {/* GRID */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' }}>
            {filteredPerfumes.map(p => (
              <div 
                key={p.id} 
                onClick={() => setSelectedPerfume(p)}
                style={{ backgroundColor: '#141414', border: '1px solid #222', borderRadius: '12px', padding: '20px', cursor: 'pointer', transition: '0.2s' }}
              >
                <div style={{ display: 'flex', gap: '10px', height: '200px', marginBottom: '15px' }}>
                  {p.bottle_url && <img src={p.bottle_url} alt={p.name} style={{ width: '50%', objectFit: 'cover', borderRadius: '6px' }} />}
                  {p.box_url && <img src={p.box_url} alt="Box" style={{ width: '50%', objectFit: 'cover', borderRadius: '6px' }} />}
                </div>

                <h3 style={{ fontFamily: 'serif', color: '#fff', margin: '0 0 5px 0' }}>{p.name}</h3>
                <p style={{ color: '#888', margin: '0 0 10px 0', fontSize: '0.9rem' }}>{p.house} • {p.release_year}</p>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', color: '#d4af37', fontWeight: 'bold' }}>
                  <span>Overall Rating</span>
                  <span>{p.overall_rating} / 5.0 ★</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* LOGIN MODAL */}
      {showLoginModal && (
        <div style={styles.modalOverlay}>
          <form onSubmit={handleLogin} style={styles.modal}>
            <h2 style={{ marginTop: 0, color: '#d4af37' }}>Admin Access</h2>
            <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required style={styles.input} />
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required style={{ ...styles.input, marginTop: '10px' }} />
            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button type="submit" style={styles.goldBtn}>LOGIN</button>
              <button type="button" onClick={() => setShowLoginModal(false)} style={styles.darkBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ADD PERFUME MODAL */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <form onSubmit={handleAddPerfume} style={{ ...styles.modal, maxWidth: '600px' }}>
            <h2 style={{ marginTop: 0, color: '#d4af37' }}>Add New Perfume</h2>
            <input type="text" placeholder="Perfume Name" value={name} onChange={e => setName(e.target.value)} required style={styles.input} />
            <input type="text" placeholder="Brand / House" value={house} onChange={e => setHouse(e.target.value)} required style={{ ...styles.input, marginTop: '10px' }} />
            <input type="number" placeholder="Release Year" value={releaseYear} onChange={e => setReleaseYear(e.target.value)} style={{ ...styles.input, marginTop: '10px' }} />
            
            <label style={{ display: 'block', margin: '15px 0 5px 0' }}>Top Notes:</label>
            <input type="text" placeholder="e.g. Bergamot, Coconut" value={topNotes} onChange={e => setTopNotes(e.target.value)} style={styles.input} />
            <label style={{ display: 'block', margin: '10px 0 5px 0' }}>Middle Notes:</label>
            <input type="text" placeholder="e.g. Jasmine, Ylang-Ylang" value={middleNotes} onChange={e => setMiddleNotes(e.target.value)} style={styles.input} />
            <label style={{ display: 'block', margin: '10px 0 5px 0' }}>Base Notes:</label>
            <input type="text" placeholder="e.g. Vanilla, Amber" value={baseNotes} onChange={e => setBaseNotes(e.target.value)} style={styles.input} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
              <div><label>Bottle Image:</label><input type="file" onChange={e => setBottleFile(e.target.files[0])} style={{ marginTop: '5px' }} /></div>
              <div><label>Box Image:</label><input type="file" onChange={e => setBoxFile(e.target.files[0])} style={{ marginTop: '5px' }} /></div>
            </div>

            <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
              <button type="submit" disabled={loading} style={styles.goldBtn}>{loading ? 'Uploading...' : 'Save Perfume'}</button>
              <button type="button" onClick={() => setShowAddModal(false)} style={styles.darkBtn}>Cancel</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}

const styles = {
  goldBtn: { backgroundColor: '#d4af37', color: '#000', border: 'none', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' },
  darkBtn: { backgroundColor: '#222', color: '#fff', border: '1px solid #444', padding: '10px 20px', borderRadius: '6px', cursor: 'pointer', marginLeft: '10px' },
  buyBtn: { backgroundColor: '#ee4d2d', color: '#fff', padding: '12px 25px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' },
  input: { width: '100%', padding: '10px', backgroundColor: '#1e1e1e', border: '1px solid #333', color: '#fff', borderRadius: '6px', boxSizing: 'border-box' },
  scoreBox: { backgroundColor: '#1e1e1e', padding: '10px', borderRadius: '6px', textAlign: 'center' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
  modal: { backgroundColor: '#141414', border: '1px solid #333', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', maxHeight: '90vh', overflowY: 'auto' }
};
