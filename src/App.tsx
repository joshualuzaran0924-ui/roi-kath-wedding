import { useEffect, useMemo, useState } from "react";
import { supabase, hasSupabase, loadContent, saveContent, defaultContent, WeddingContent } from "./lib";
import { Heart, MapPin, CalendarDays, Music2, VolumeX, Volume2, LockKeyhole, ImagePlus, Save, LogOut, Settings, ChevronDown, ExternalLink, CheckCircle2, Menu, X } from "lucide-react";

const weddingDate = new Date("2027-02-26T16:00:00+08:00");
const mapUrl = (address: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

function App() {
  const [content, setContent] = useState<WeddingContent>(defaultContent);
  const [loaded, setLoaded] = useState(false);
  const [opened, setOpened] = useState(false);
  const [admin, setAdmin] = useState(window.location.pathname.startsWith("/admin"));
  const [menuOpen, setMenuOpen] = useState(false);
  const [rsvpSent, setRsvpSent] = useState(false);
  const [rsvpError, setRsvpError] = useState("");
  const [guest, setGuest] = useState({ full_name: "", contact: "", attending: "yes", guest_count: "1", message: "" });
  const [session, setSession] = useState<any>(null);
  const [login, setLogin] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState("");
  const [rsvps, setRsvps] = useState<any[]>([]);
  const [saved, setSaved] = useState(false);
  const [tick, setTick] = useState(Date.now());
  const [musicOn, setMusicOn] = useState(false);

  useEffect(() => {
    loadContent().then(setContent).finally(() => setLoaded(true));
    if (supabase) {
      supabase.auth.getSession().then(({ data }) => setSession(data.session));
      const { data: listener } = supabase.auth.onAuthStateChange((_event, current) => setSession(current));
      return () => listener.subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    const onPop = () => setAdmin(window.location.pathname.startsWith("/admin"));
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  useEffect(() => {
    if (admin && session && supabase) {
      supabase.from("rsvps").select("*").order("created_at", { ascending: false }).then(({ data }) => setRsvps(data || []));
    }
  }, [admin, session]);

  const countdown = useMemo(() => {
    const diff = Math.max(0, weddingDate.getTime() - tick);
    return {
      days: Math.floor(diff / 86400000),
      hours: Math.floor((diff / 3600000) % 24),
      minutes: Math.floor((diff / 60000) % 60),
      seconds: Math.floor((diff / 1000) % 60)
    };
  }, [tick]);

  const update = (key: keyof WeddingContent, value: string | string[]) => setContent(current => ({ ...current, [key]: value }));

  function navigateAdmin() {
    window.history.pushState({}, "", "/admin");
    setAdmin(true);
    window.scrollTo(0, 0);
  }
  function navigateHome() {
    window.history.pushState({}, "", "/");
    setAdmin(false);
    window.scrollTo(0, 0);
  }

  async function submitRsvp(e: React.FormEvent) {
    e.preventDefault();
    setRsvpError("");
    if (!guest.full_name.trim()) { setRsvpError("Please enter your name."); return; }
    if (supabase) {
      const { error } = await supabase.from("rsvps").insert({
        full_name: guest.full_name.trim(),
        contact: guest.contact.trim() || null,
        attending: guest.attending === "yes",
        guest_count: guest.attending === "yes" ? Number(guest.guest_count) : 1,
        message: guest.message.trim() || null
      });
      if (error) { setRsvpError("We couldn't submit your RSVP. Please try again."); return; }
    } else {
      const current = JSON.parse(localStorage.getItem("rk-demo-rsvps") || "[]");
      current.push({ ...guest, created_at: new Date().toISOString() });
      localStorage.setItem("rk-demo-rsvps", JSON.stringify(current));
    }
    setRsvpSent(true);
  }

  async function signIn(e: React.FormEvent) {
    e.preventDefault(); setLoginError("");
    if (!supabase) { setLoginError("Connect Supabase first. Follow SETUP.md to enable administrator login."); return; }
    const { error } = await supabase.auth.signInWithPassword(login);
    if (error) setLoginError(error.message);
  }

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
  }

  async function saveChanges() {
    try {
      await saveContent(content);
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch {
      alert("Couldn't save changes. Check your Supabase connection and admin permissions.");
    }
  }

  async function uploadPhotos(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    if (supabase && session) {
      const urls: string[] = [];
      for (const file of selected) {
        const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "-")}`;
        const { error } = await supabase.storage.from("wedding-photos").upload(path, file, { upsert: true });
        if (!error) {
          const { data } = supabase.storage.from("wedding-photos").getPublicUrl(path);
          urls.push(data.publicUrl);
        }
      }
      update("gallery", [...content.gallery, ...urls]);
    } else {
      const urls = await Promise.all(selected.map(file => new Promise<string>((resolve) => {
        const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.readAsDataURL(file);
      })));
      update("gallery", [...content.gallery, ...urls]);
    }
    e.target.value = "";
  }

  async function exportCsv() {
    const rows = supabase ? rsvps : JSON.parse(localStorage.getItem("rk-demo-rsvps") || "[]");
    const header = ["Name", "Contact", "Attending", "Guests", "Message", "Submitted"];
    const values = rows.map((r: any) => [r.full_name, r.contact || "", r.attending === true || r.attending === "yes" ? "Yes" : "No", r.guest_count, r.message || "", r.created_at || ""]);
    const csv = [header, ...values].map(row => row.map((v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = "roi-kathlyn-rsvps.csv"; a.click(); URL.revokeObjectURL(a.href);
  }

  if (!loaded) return <div className="loading">Preparing your invitation…</div>;

  if (admin) {
    return <main className="admin-shell">
      <header className="admin-top"><button className="wordmark" onClick={navigateHome}>R <span>&</span> K</button><span>Wedding website editor</span><button className="text-btn" onClick={navigateHome}>View invitation ↗</button></header>
      {!session ? <section className="login-card">
        <div className="mini-flower">✿</div><p className="eyebrow">PRIVATE AREA</p><h1>Welcome back</h1><p className="muted">Sign in to edit your wedding invitation.</p>
        <form onSubmit={signIn} className="stack">
          <label>Email<input type="email" required value={login.email} onChange={e => setLogin({ ...login, email: e.target.value })} /></label>
          <label>Password<input type="password" required value={login.password} onChange={e => setLogin({ ...login, password: e.target.value })} /></label>
          {loginError && <p className="error">{loginError}</p>}
          <button className="primary-btn">Sign in <LockKeyhole size={16}/></button>
        </form>
        {!hasSupabase && <p className="small-note">Demo mode: the admin login becomes available after completing the Supabase setup.</p>}
      </section> : <div className="dashboard">
        <div className="dashboard-heading"><div><p className="eyebrow">ROI & KATHLYN · FEBRUARY 26, 2027</p><h1>Website editor</h1><p className="muted">Changes are saved to your live invitation.</p></div><button className="outline-btn" onClick={signOut}><LogOut size={16}/> Sign out</button></div>
        <div className="editor-grid">
          <section className="editor-panel">
            <h2><Settings size={18}/> Invitation content</h2>
            <label>Welcome message<textarea value={content.welcome} onChange={e => update("welcome", e.target.value)} rows={3}/></label>
            <label>Our love story<textarea value={content.story} onChange={e => update("story", e.target.value)} rows={4}/></label>
            <h2>Wedding ceremony</h2>
            <label>Venue name<input value={content.ceremonyName} onChange={e => update("ceremonyName", e.target.value)}/></label>
            <label>Venue address<input value={content.ceremonyAddress} onChange={e => update("ceremonyAddress", e.target.value)}/></label>
            <label>Time<input value={content.ceremonyTime} onChange={e => update("ceremonyTime", e.target.value)}/></label>
            <h2>Wedding reception</h2>
            <label>Venue name<input value={content.receptionName} onChange={e => update("receptionName", e.target.value)}/></label>
            <label>Venue address<input value={content.receptionAddress} onChange={e => update("receptionAddress", e.target.value)}/></label>
            <label>Time<input value={content.receptionTime} onChange={e => update("receptionTime", e.target.value)}/></label>
            <h2>More details</h2>
            <label>Dress code<textarea value={content.dressCode} onChange={e => update("dressCode", e.target.value)} rows={3}/></label>
            <label>Entourage details<textarea value={content.entourage} onChange={e => update("entourage", e.target.value)} rows={4}/></label>
            <label>Background music URL (optional)<input value={content.musicUrl} onChange={e => update("musicUrl", e.target.value)} placeholder="Paste a direct MP3 URL"/></label>
            <label>Accent color<input type="color" value={content.accent} onChange={e => update("accent", e.target.value)}/></label>
            <h2><ImagePlus size={18}/> Photo gallery</h2>
            <label className="upload-box"><ImagePlus/> Upload photos (JPG, PNG, WebP)<input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={uploadPhotos}/></label>
            <div className="admin-gallery">{content.gallery.map((src, i) => <div key={src+i}><img src={src} alt={`Gallery ${i+1}`}/><button type="button" onClick={() => update("gallery", content.gallery.filter((_, index) => index !== i))}>Remove</button></div>)}</div>
            <button className="primary-btn save-btn" onClick={saveChanges}><Save size={17}/> {saved ? "Saved!" : "Save and publish changes"}</button>
            {saved && <p className="success"><CheckCircle2 size={16}/> Your invitation has been updated.</p>}
          </section>
          <section className="editor-panel rsvp-panel">
            <div className="panel-heading"><h2>Guest responses</h2><button className="outline-btn" onClick={exportCsv}>Export CSV</button></div>
            <div className="stats"><div><strong>{rsvps.length}</strong><span>Total responses</span></div><div><strong>{rsvps.filter(r => r.attending === true || r.attending === "yes").length}</strong><span>Attending</span></div><div><strong>{rsvps.filter(r => r.attending === false || r.attending === "no").length}</strong><span>Declined</span></div></div>
            {!hasSupabase && <p className="small-note">Local demo responses only appear in this browser. Connect Supabase for shared guest responses.</p>}
            <div className="response-list">{rsvps.length ? rsvps.map((r, i) => <article key={r.id || i}><strong>{r.full_name}</strong><span>{r.attending === true || r.attending === "yes" ? "Attending" : "Declined"} · {r.guest_count} guest(s)</span><small>{r.message}</small></article>) : <p className="muted">No RSVP responses yet.</p>}</div>
          </section>
        </div>
      </div>}
    </main>;
  }

  return <div className="site" style={{ "--accent": content.accent } as React.CSSProperties}>
    {!opened && <div className="intro-screen">
      <div className="intro-glow"></div><div className="intro-copy"><p className="eyebrow">A CELEBRATION OF LOVE</p><h1>Roi <i>&</i> Kathlyn</h1><p>FEBRUARY 26, 2027</p></div>
      <button className="envelope-button" onClick={() => setOpened(true)} aria-label="Open wedding invitation">
        <div className="envelope"><div className="envelope-back"></div><div className="letter"><span>R <i>&</i> K</span><small>You are invited</small></div><div className="flap"></div><div className="envelope-front"></div><div className="seal">R<span>&</span>K</div></div>
      </button>
      <p className="open-hint">TAP THE ENVELOPE TO OPEN YOUR INVITATION</p>
      <div className="intro-bottom">WITH LOVE, ROI & KATHLYN</div>
    </div>}
    {opened && <>
      <header className="site-header"><button className="brand" onClick={() => window.scrollTo({top:0,behavior:"smooth"})}>R <i>&</i> K</button><button className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X/> : <Menu/>}</button><nav className={menuOpen ? "nav open" : "nav"}>{[["Our Story","#story"],["The Day","#details"],["Gallery","#gallery"],["Entourage","#entourage"],["RSVP","#rsvp"]].map(([label, href]) => <a key={href} href={href} onClick={() => setMenuOpen(false)}>{label}</a>)}</nav></header>
      <section className="hero">
        <div className="hero-flower flower-one">✿</div><div className="hero-flower flower-two">❀</div>
        <p className="eyebrow">TOGETHER WITH OUR FAMILIES</p><h1>Roi <i>&</i><br/>Kathlyn</h1><div className="thin-line"></div><p className="hero-date">FRIDAY · FEBRUARY 26 · 2027</p><p className="hero-message">{content.welcome}</p><a className="scroll-link" href="#details">DISCOVER OUR DAY <ChevronDown size={15}/></a>
      </section>
      <section className="countdown-section"><p className="eyebrow">COUNTING DOWN TO FOREVER</p><div className="countdown">{Object.entries(countdown).map(([label, value]) => <div key={label}><strong>{String(value).padStart(2,"0")}</strong><span>{label}</span></div>)}</div></section>
      <section className="story-section section" id="story"><div className="section-kicker">A LITTLE ABOUT US</div><h2>Our love story</h2><div className="ornament">✧　❀　✧</div><p className="story-text">{content.story}</p><p className="signature">With love, Roi & Kathlyn</p></section>
      <section className="details-section section" id="details"><div className="section-kicker">SAVE THE DATE</div><h2>The wedding day</h2><div className="details-grid"><article className="detail-card"><CalendarDays/><p className="eyebrow">THE CEREMONY</p><h3>{content.ceremonyName}</h3><p>{content.ceremonyTime}</p><p className="address"><MapPin size={15}/>{content.ceremonyAddress}</p><a href={mapUrl(content.ceremonyAddress)} target="_blank" rel="noreferrer">GET DIRECTIONS <ExternalLink size={13}/></a></article><article className="detail-card"><Heart/><p className="eyebrow">THE RECEPTION</p><h3>{content.receptionName}</h3><p>{content.receptionTime}</p><p className="address"><MapPin size={15}/>{content.receptionAddress}</p><a href={mapUrl(content.receptionAddress)} target="_blank" rel="noreferrer">GET DIRECTIONS <ExternalLink size={13}/></a></article></div></section>
      <section className="gallery-section section" id="gallery"><div className="section-kicker">MOMENTS TO TREASURE</div><h2>Our memories</h2><p className="muted">A few snapshots from our journey together.</p><div className="gallery-grid">{content.gallery.length ? content.gallery.map((src,i) => <img src={src} key={src+i} alt={`Roi and Kathlyn memory ${i+1}`}/>) : <div className="gallery-placeholder"><Heart/><span>Your favorite photos will appear here.</span><small>Upload photos in your admin dashboard.</small></div>}</div></section>
      <section className="entourage-section section" id="entourage"><div className="section-kicker">SURROUNDED BY LOVE</div><h2>Our entourage</h2><p className="entourage-copy">{content.entourage}</p></section>
      <section className="dress-section section"><div className="section-kicker">A NOTE ON ATTIRE</div><h2>Dress code</h2><div className="swatches"><i style={{background:"#c5dce4"}}/><i style={{background:"#e6eff0"}}/><i style={{background:"#e4d6c3"}}/><i style={{background:"#faf8f2"}}/><i style={{background:"#c9b17a"}}/></div><p>{content.dressCode}</p></section>
      <section className="rsvp-section section" id="rsvp"><div className="section-kicker">KINDLY REPLY</div><h2>Will you join us?</h2><p>We would be honored to celebrate this special day with you.</p>
        {rsvpSent ? <div className="rsvp-success"><CheckCircle2/><h3>Thank you!</h3><p>Your response has been received. We can't wait to celebrate with you.</p></div> : <form className="rsvp-form" onSubmit={submitRsvp}>
          <label>Full name *<input required value={guest.full_name} onChange={e => setGuest({...guest,full_name:e.target.value})} placeholder="Your full name"/></label>
          <label>Contact number or email (optional)<input value={guest.contact} onChange={e => setGuest({...guest,contact:e.target.value})} placeholder="How can we reach you?"/></label>
          <label>Will you attend?<select value={guest.attending} onChange={e => setGuest({...guest,attending:e.target.value})}><option value="yes">Accept with pleasure</option><option value="no">Regretfully decline</option></select></label>
          {guest.attending === "yes" && <label>Number of guests (including you)<select value={guest.guest_count} onChange={e => setGuest({...guest,guest_count:e.target.value})}>{[1,2,3,4,5,6,7,8,9,10].map(n=><option key={n}>{n}</option>)}</select></label>}
          <label>Message for the couple (optional)<textarea rows={3} value={guest.message} onChange={e => setGuest({...guest,message:e.target.value})} placeholder="Leave us a little note…"/></label>
          {rsvpError && <p className="error">{rsvpError}</p>}<button className="primary-btn">Send RSVP <Heart size={16}/></button>
        </form>}
      </section>
      <footer className="site-footer"><div className="footer-flower">❀</div><h2>Roi <i>&</i> Kathlyn</h2><p>FEBRUARY 26, 2027</p><span>MADE WITH LOVE</span><button className="admin-link" onClick={navigateAdmin}><LockKeyhole size={12}/> Administrator</button></footer>
      {content.musicUrl && <div className="music-control"><button onClick={() => setMusicOn(!musicOn)} aria-label="Toggle music">{musicOn ? <Volume2/> : <VolumeX/>}</button>{musicOn && <audio src={content.musicUrl} autoPlay loop controls/>}</div>}
    </>}
  </div>;
}
export default App;
