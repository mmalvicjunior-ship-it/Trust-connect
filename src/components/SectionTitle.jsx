'use client';

const sealPath = (color = '#003cff') => (
  <svg className="seal" viewBox="0 0 24 24" fill="none">
    <path d="M12 3l5 2.2v4.6c0 4-2.6 6.7-5 8.2-2.4-1.5-5-4.2-5-8.2V5.2L12 3z" stroke={color} strokeWidth="1.6" />
    <path d="M9.3 12l1.8 1.8 3.6-3.8" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function SectionTitle({ eyebrow, title, subtitle, className = '', dataAos }) {
  return (
    <div className={`section-head ${className}`} data-aos={dataAos || 'fade-up'}>
      {eyebrow && <div className="eyebrow">{sealPath()}</div>}
      <h2>{title}</h2>
      {subtitle && <p>{subtitle}</p>}
    </div>
  );
}
