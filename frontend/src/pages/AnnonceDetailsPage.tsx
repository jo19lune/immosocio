import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AppLayout from '../components/layout/AppLayout';
import PublicNavbar from '../components/layout/PublicNavbar';
import Lightbox from '../components/Lightbox';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import homeLineSvg from '../assets/home_1_line.svg';
import messengerLineSvg from '../assets/messenger_line.svg';
import shareForwardLineSvg from '../assets/share_forward_line.svg';
import thumbUpLineSvg from '../assets/thumb_up_line.svg';
import './AnnoncesPage.css';

export default function AnnonceDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [annonce, setAnnonce] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeImg, setActiveImg] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  useEffect(() => {
    fetchAnnonce();
  }, [id]);

  const fetchAnnonce = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/annonces/${id}`);
      setAnnonce(data);
    } catch {
      navigate('/annonces');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    alert("Lien de l'annonce copié !");
  };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
      <div className="spinner" />
    </div>
  );

  const Layout = user ? AppLayout : ({ children }: any) => (
    <div className="public-page">
      <PublicNavbar />
      <div style={{ padding: '24px' }}>{children}</div>
    </div>
  );

  const photos = annonce.photos || [];

  return (
    <Layout>
      <div className="annonce-details-container" style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <div className="annonce-details-grid" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
          
          {/* Galerie Images */}
          <div className="annonce-gallery">
            <div 
              className="active-photo-wrapper card" 
              onClick={() => photos.length > 0 && setShowLightbox(true)}
              style={{ position: 'relative', aspectRatio: '16/10', overflow: 'hidden', marginBottom: '12px', cursor: 'zoom-in' }}
            >
              {photos.length > 0 ? (
                <img src={photos[activeImg]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div className="annonce-img-placeholder" style={{ height: '100%' }}>
                   <img src={homeLineSvg} alt="" width={64} style={{ opacity: 0.2 }} />
                </div>
              )}
            </div>
            <div className="photo-thumbnails" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
              {photos.map((p: string, i: number) => (
                <div 
                  key={i} 
                  className={`thumbnail card ${i === activeImg ? 'active' : ''}`} 
                  onClick={() => setActiveImg(i)}
                  style={{ aspectRatio: '1/1', cursor: 'pointer', overflow: 'hidden', border: i === activeImg ? '2px solid var(--secondary)' : 'none' }}
                >
                  <img src={p} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Info Side */}
          <div className="annonce-info-side">
            <div className="card" style={{ padding: '24px' }}>
              <span className="badge badge-primary" style={{ marginBottom: '12px' }}>{annonce.typeLogement}</span>
              <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>{annonce.titre}</h1>
              <p style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: '20px' }}>
                <img src={homeLineSvg} alt="" width={16} style={{ opacity: 0.5 }} />
                {annonce.ville}, {annonce.pays}
              </p>

              <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--primary)', marginBottom: '24px' }}>
                {Number(annonce.prix).toLocaleString('fr-FR')} <small style={{ fontSize: '14px', opacity: 0.6 }}>Ar</small>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                 <div className="card" style={{ padding: '12px', textAlign: 'center', background: 'var(--bg)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Surface</div>
                    <div style={{ fontWeight: 700 }}>{annonce.superficie} m²</div>
                 </div>
                 <div className="card" style={{ padding: '12px', textAlign: 'center', background: 'var(--bg)' }}>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pièces</div>
                    <div style={{ fontWeight: 700 }}>{annonce.nombrePieces}</div>
                 </div>
              </div>

              <div className="actions-stack" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => navigate(`/reservations/nouvelle?annonceId=${annonce.id}`)}>
                  Réserver maintenant
                </button>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button className="btn btn-ghost" style={{ flex: 1, justifyContent: 'center' }} onClick={handleShare}>
                    <img src={shareForwardLineSvg} alt="" width={18} /> Partager
                  </button>
                  <Link to={`/messages/${annonce.proprietaire.id}`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
                    <img src={messengerLineSvg} alt="" width={18} style={{ filter: 'brightness(0) invert(1)' }} /> Contacter
                  </Link>
                </div>
              </div>
            </div>

            {/* Propriétaire */}
            <div className="card" style={{ marginTop: '20px', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
               <img 
                 src={annonce.proprietaire.photo || `https://ui-avatars.com/api/?name=${annonce.proprietaire.prenom}+${annonce.proprietaire.nom}&background=09244B&color=fff`} 
                 alt="" className="avatar" width={48} height={48} 
               />
               <div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Propriétaire</div>
                  <div style={{ fontWeight: 700 }}>{annonce.proprietaire.prenom} {annonce.proprietaire.nom}</div>
               </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="card" style={{ marginTop: '32px', padding: '32px' }}>
           <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '16px' }}>Description</h2>
           <p style={{ lineHeight: 1.7, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
             {annonce.description}
           </p>
        </div>
      </div>
      
      {showLightbox && (
        <Lightbox 
          images={photos}
          currentIndex={activeImg}
          onClose={() => setShowLightbox(false)}
          onNext={() => setActiveImg((prev) => (prev + 1) % photos.length)}
          onPrev={() => setActiveImg((prev) => (prev - 1 + photos.length) % photos.length)}
        />
      )}

      <style>{`
        @media (max-width: 800px) {
          .annonce-details-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </Layout>
  );
}
