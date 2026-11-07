'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Arrow, ChevLeft, ChevRight } from './icons';

const AUTOPLAY_MS = 6000;

export default function HeroSlider({ slides }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener('change', update);
    return () => media.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (slides.length < 2 || paused || reducedMotion) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [slides.length, paused, reducedMotion, index]);

  if (!slides.length) return null;

  const goTo = (next) => {
    const length = slides.length;
    setIndex(((next % length) + length) % length);
  };

  return (
    <section className="hero-slider" aria-roledescription="carousel" aria-label="Featured collections"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false);
      }}>
      <h1 className="sr-only">NOVA</h1>

      {slides.map((slide, i) => {
        const active = i === index;
        const hasButton = Boolean(slide.href && slide.button);
        return (
          <article key={slide.img} className={'hero-slide' + (active ? ' is-on' : '') + (slide.tint ? ' hero-slide--' + slide.tint : '')}
            role="group" aria-roledescription="slide" aria-label={i + 1 + ' of ' + slides.length}
            aria-hidden={!active} inert={!active || undefined}>
            <img className="hero-slide__img" src={'/images/' + slide.img + '.png'} alt=""
              width="1934" height="813" loading={i === 0 ? 'eager' : 'lazy'}
              fetchPriority={i === 0 ? 'high' : 'low'} decoding="async" />
            <span className="hero-slide__scrim" aria-hidden="true" />
            <div className="hero-slide__copy">
              {slide.label ? <p className="hero-slide__label">{slide.label}</p> : null}
              {slide.title ? <h2 className="hero-slide__title">{slide.title}</h2> : null}
              {slide.text ? <p className="hero-slide__lede">{slide.text}</p> : null}
              {hasButton && (
                <Link className="btn btn--light" href={slide.href}>
                  {slide.button} <Arrow size={13} />
                </Link>
              )}
            </div>
            {slide.href && !slide.button && (
              <Link className="hero-slide__link" href={slide.href}
                aria-label={slide.title || slide.label || 'View collection'} />
            )}
          </article>
        );
      })}

      {slides.length > 1 && (
        <>
          <div className="hero-slider__nav" aria-label="Slides">
            <button type="button" className="hero-arrow" onClick={() => goTo(index - 1)} aria-label="Previous slide">
              <ChevLeft />
            </button>
            <button type="button" className="hero-arrow" onClick={() => goTo(index + 1)} aria-label="Next slide">
              <ChevRight />
            </button>
          </div>
          <div className="hero-dots">
            {slides.map((slide, i) => (
              <button key={slide.img} type="button" className={'hero-dot' + (i === index ? ' is-on' : '')}
                onClick={() => goTo(i)} aria-label={'Show slide ' + (i + 1)}
                aria-current={i === index ? 'true' : undefined} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
