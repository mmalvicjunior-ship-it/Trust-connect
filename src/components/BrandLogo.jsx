'use client';

import Link from 'next/link';

export default function BrandLogo({ className = '' }) {
  return (
    <Link href="/" className={`brand-logo ${className}`}>
      <img src="/images/logo.png" alt="Trust Connect" width="30" height="30" />
      <span>Trust Connect</span>
    </Link>
  );
}
