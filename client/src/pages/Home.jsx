import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import SearchBar from '../components/SearchBar';
import CarCard, { CarCardSkeleton } from '../components/CarCard';
import Icon from '../components/Icon';
import axiosInstance from '../api/axiosInstance';

const BODY_SHORTCUTS = [
  ['suv', 'SUVs'], ['sedan', 'Sedans'], ['pickup', 'Pickups'],
  ['hatchback', 'Hatchbacks'], ['van', 'Vans'], ['coupe', 'Coupes'],
];

export default function Home() {
  const [boosted, setBoosted] = useState([]);
  const [latest, setLatest] = useState([]);
  const [loadingB, setLoadingB] = useState(true);
  const [loadingL, setLoadingL] = useState(true);

  useEffect(() => {
    axiosInstance.get('/listings?isBoosted=true&limit=8')
      .then((r) => setBoosted(r.data.listings))
      .catch(() => {})
      .finally(() => setLoadingB(false));
    axiosInstance.get('/listings?limit=12')
      .then((r) => setLatest(r.data.listings))
      .catch(() => {})
      .finally(() => setLoadingL(false));
  }, []);

  return (
    <div className="page">
      <Navbar />

      <section className="hero">
        <div className="container fade-up">
          <div className="eyebrow">Ghana's car marketplace</div>
          <h1 className="mt-4">Find your next car from <em>dealers you can trust.</em></h1>
          <p className="hero-lead">
            Browse verified listings across all sixteen regions, compare prices, and reach the dealer directly by phone, WhatsApp or enquiry.
          </p>
          <SearchBar />
          <div className="hero-trust">
            <span><Icon name="shield" /> Dealers reviewed before listing</span>
            <span><Icon name="pin" /> All 16 regions</span>
            <span><Icon name="message" /> Contact dealers directly</span>
          </div>
        </div>
      </section>

      <main id="main" className="page-main">
        <section className="container section-sm">
          <nav aria-label="Browse by body type" className="row wrap gap-2">
            {BODY_SHORTCUTS.map(([value, label]) => (
              <Link key={value} to={`/listings?bodyType=${value}`} className="btn btn-secondary btn-sm">
                <Icon name="car" /> {label}
              </Link>
            ))}
          </nav>
        </section>

        {(loadingB || boosted.length > 0) && (
          <section className="container section-sm" aria-labelledby="featured-h">
            <div className="section-head">
              <div>
                <div className="eyebrow">Featured</div>
                <h2 id="featured-h" className="mt-2">Featured listings</h2>
              </div>
            </div>
            <div className="grid-cards">
              {loadingB
                ? Array.from({ length: 4 }, (_, i) => <CarCardSkeleton key={i} />)
                : boosted.map((l) => <CarCard key={l._id} listing={l} />)}
            </div>
          </section>
        )}

        <section className="container section" aria-labelledby="latest-h">
          <div className="section-head">
            <div>
              <div className="eyebrow">Just listed</div>
              <h2 id="latest-h" className="mt-2">Latest listings</h2>
            </div>
            <Link to="/listings" className="more">View all <Icon name="arrowRight" /></Link>
          </div>
          <div className="grid-cards">
            {loadingL
              ? Array.from({ length: 8 }, (_, i) => <CarCardSkeleton key={i} />)
              : latest.length === 0
                ? (
                  <div className="card empty" style={{ gridColumn: '1 / -1' }}>
                    <Icon name="car" />
                    <h3>No cars listed yet</h3>
                    <p>Dealers are being onboarded now. If you sell cars, you can be one of the first.</p>
                    <Link to="/register/dealer" className="btn btn-primary">Become a dealer</Link>
                  </div>
                )
                : latest.map((l) => <CarCard key={l._id} listing={l} />)}
          </div>
          {!loadingL && latest.length > 0 && (
            <div className="center mt-8">
              <Link to="/listings" className="btn btn-secondary btn-lg">Browse all cars <Icon name="arrowRight" /></Link>
            </div>
          )}
        </section>

        <section className="container section-sm" style={{ paddingBottom: 'var(--sp-16)' }}>
          <div className="card card-pad row wrap between gap-6" style={{
            background: 'radial-gradient(600px 240px at 100% 0%, rgba(196,30,42,.22), transparent 70%), var(--color-surface)',
            borderColor: 'var(--red-line)',
          }}>
            <div style={{ maxWidth: 560 }}>
              <div className="eyebrow">For dealers</div>
              <h2 className="mt-2">Put your stock in front of buyers across Ghana</h2>
              <p className="mt-2">List your vehicles, receive enquiries by email, and feature your best cars at the top of search.</p>
            </div>
            <Link to="/register/dealer" className="btn btn-primary btn-lg">List your cars <Icon name="arrowRight" /></Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
