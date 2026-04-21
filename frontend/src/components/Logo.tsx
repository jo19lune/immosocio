import logoPng from '../assets/logo.png';

interface LogoProps {
  size?: number;
  showText?: boolean;
  textClass?: string;
}

export default function Logo({ size = 34, showText = true, textClass }: LogoProps) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 9 }}>
      <img
        src={logoPng}
        alt="Logo"
        width={size}
        height={size}
        style={{ objectFit: 'contain', flexShrink: 0 }}
      />

      {showText && (
        <span className={textClass || 'logo-text'}>ImmoSocial</span>
      )}
    </span>
  );
}
