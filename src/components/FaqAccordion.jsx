'use client';

import Link from 'next/link';
import { useId, useState } from 'react';

export default function FaqAccordion({ items = [], allowMultiple = false, className = '' }) {
  const [openIndex, setOpenIndex] = useState(null);
  const baseId = useId().replace(/[^a-zA-Z0-9]/g, '') || 'faq';

  const isOpen = (index) =>
    allowMultiple
      ? Array.isArray(openIndex) && openIndex.includes(index)
      : openIndex === index;

  const toggle = (index) => {
    const willOpen = !isOpen(index);
    if (allowMultiple) {
      const current = Array.isArray(openIndex) ? openIndex : [];
      const next = willOpen
        ? Array.from(new Set([...current, index]))
        : current.filter((i) => i !== index);
      setOpenIndex(next.length ? next : null);
    } else {
      setOpenIndex(willOpen ? index : null);
    }
  };

  const handleKeyDown = (event, index) => {
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const count = items.length;
    let nextIndex = index;
    if (event.key === 'ArrowDown') nextIndex = index + 1 < count ? index + 1 : index;
    else if (event.key === 'ArrowUp') nextIndex = index - 1 >= 0 ? index - 1 : index;
    else if (event.key === 'Home') nextIndex = 0;
    else if (event.key === 'End') nextIndex = count - 1;
    const el = document.getElementById(`${baseId}-trigger-${nextIndex}`);
    if (el) el.focus();
  };

  return (
    <div className={`faq ${className}`.trim()}>
      {items.map((item, index) => {
        const open = isOpen(index);
        const triggerId = `${baseId}-trigger-${index}`;
        const panelId = `${baseId}-panel-${index}`;
        return (
          <div key={index} className={`faq-item${open ? ' open' : ''}`}>
            <button
              type="button"
              id={triggerId}
              className="faq-q"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => toggle(index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
            >
              <span>{item.q}</span>
              <span className="faq-icon" aria-hidden="true">
                <i className="fa-solid fa-plus"></i>
              </span>
            </button>
            <div
              id={panelId}
              className={`faq-a-wrap${open ? ' open' : ''}`}
              role="region"
              aria-labelledby={triggerId}
            >
              <div className="faq-a-inner">
                <div className="faq-a">
                  <p id={item.id}>{item.a}</p>
                  {item.links && item.links.length ? (
                    <div className="faq-links">
                      {item.links.map((link) => (
                        <Link key={link.href} href={link.href} className="faq-link">
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
