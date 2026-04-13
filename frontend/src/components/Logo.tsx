interface LogoProps {
  size?: number;
  showText?: boolean;
  textClass?: string;
}

export default function Logo({ size = 34, showText = true, textClass }: LogoProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ flexShrink: 0 }}
      >
        {/* Fond arrondi */}
        <rect width="40" height="40" rx="11" fill="#3B6CF8" />

        {/* Toit / Triangle maison */}
        <path d="M20 8L33 20H7L20 8Z" fill="white" />

        {/* Corps de la maison */}
        <rect x="11" y="20" width="18" height="13" rx="1.5" fill="white" />

        {/* Porte */}
        <rect x="17" y="25" width="6" height="8" rx="1.2" fill="#3B6CF8" />

        {/* Point social orange — connexion */}
        <circle cx="31" cy="12" r="5" fill="#FF6B35" />
        <circle cx="31" cy="12" r="2.5" fill="white" />

        {/* Petite ligne de connexion */}
        <line x1="26" y1="12" x2="33" y2="20" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
      </svg>

      {showText && (
        <span className={textClass || 'logo-text'}>ImmoSocial</span>
      )}
    </span>
  );
}
