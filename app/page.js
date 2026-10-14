import SmoothScroll from '@/components/SmoothScroll';
import Nav from '@/components/Nav';
import Hero from '@/components/Hero';
import Marquee from '@/components/Marquee';
import GraphSection from '@/components/GraphSection';
import Work from '@/components/Work';
import SystemLab from '@/components/SystemLab';
import Experience from '@/components/Experience';
import Stack from '@/components/Stack';
import Contact from '@/components/Contact';

export default function Page() {
  return (
    <SmoothScroll>
      <Nav />
      <main>
        <Hero />
        <GraphSection />
        <Marquee />
        <Work />
        <SystemLab />
        <Experience />
        <Stack />
        <Contact />
      </main>
    </SmoothScroll>
  );
}
