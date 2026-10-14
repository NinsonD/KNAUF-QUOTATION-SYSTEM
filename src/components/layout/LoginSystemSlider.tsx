'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import systemImages from '@/data/system-images.json';

const slides = [
  { title: 'Ceiling systems', description: 'Suspended frameworks and acoustic ceiling solutions.', image: systemImages.KC_B001.base.images[0] },
  { title: 'Partition systems', description: 'Drywall partitions for dividing interior spaces.', image: systemImages.KW111.base.images[0] },
  { title: 'Shaft wall systems', description: 'Specialist wall assemblies for service shafts.', image: systemImages.KSW120.base.images[0] },
  { title: 'Wall lining systems', description: 'Board and framing solutions for lining existing walls.', image: systemImages.KW625.base.images[0] },
];

export default function LoginSystemSlider() {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [interacting, setInteracting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedMotion(preference.matches);
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    if (!playing || interacting || reducedMotion) return;
    const timer = window.setInterval(() => {
      if (!document.hidden) setIndex(current => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [playing, interacting, reducedMotion]);
  const select = (next: number) => { setIndex((next + slides.length) % slides.length); setPlaying(false); };
  const slide = slides[index];
  return <section className="login-system-slider" aria-label="Knauf system categories" aria-roledescription="carousel"
    onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
    onFocusCapture={() => setInteracting(true)} onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setInteracting(false); }}>
    <div className="login-system-slide" aria-roledescription="slide" aria-label={`${index + 1} of ${slides.length}`}>
      <div className="login-system-image"><Image src={slide.image.src} alt={`${slide.title}: official Knauf framework illustration`} width={slide.image.width} height={slide.image.height} sizes="(max-width: 760px) 320px, 440px" priority={index === 0}/></div>
      <div className="login-system-caption" aria-live={playing && !reducedMotion ? 'off' : 'polite'}><h3>{slide.title}</h3><p>{slide.description}</p><span>Official Knauf illustration · {slide.image.sourceName}</span></div>
    </div>
    <div className="login-slider-controls">
      <button type="button" onClick={() => select(index - 1)} aria-label="Previous system category"><ChevronLeft size={17}/></button>
      <div className="login-slider-dots">{slides.map((item, position) => <button type="button" key={item.title} aria-label={`Show ${item.title.toLowerCase()}`} aria-current={index === position ? 'true' : undefined} onClick={() => select(position)}><span/></button>)}</div>
      {!reducedMotion && <button type="button" onClick={() => setPlaying(current => !current)} aria-label={playing ? 'Pause slideshow' : 'Start slideshow'}>{playing ? <Pause size={15}/> : <Play size={15}/>}</button>}
      <button type="button" onClick={() => select(index + 1)} aria-label="Next system category"><ChevronRight size={17}/></button>
    </div>
  </section>;
}
