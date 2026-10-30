import type { Metadata } from 'next';
import { ThemeLab } from '@/components/theme-lab';

export const metadata: Metadata = {
  title: 'Theme lab',
  description: 'Build a BLD8 theme with colour, typography, shape and spacing. Try real components, check contrast and export light and dark CSS.',
};

export default function Page() {
  return <div className="page theme-page">
    <header className="page-intro theme-intro">
      <div><p className="eyebrow">THEME LAB</p><h1>Make it<br /><span>feel like yours.</span></h1></div>
      <div className="theme-intro-copy"><p className="lead">Choose a palette, adjust the controls and take the CSS into your application.</p><p>Real components. Light and dark. Yours to adjust.</p></div>
    </header>
    <ThemeLab />
  </div>;
}
