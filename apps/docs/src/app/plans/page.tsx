import Link from 'next/link';
import { Accordion } from '@bld8/ui';
import { CollectionPlans } from '@/components/collection-plans';

export const metadata = {
  title: 'Licence and usage',
  description: 'Free MIT-licensed BLD8 source for personal and commercial projects, with copyright and third-party notices included.',
};

export default function Page() {
  return <div className="page">
    <header className="page-intro library-intro">
      <p className="eyebrow">MIT LICENCE / FREE SOURCE</p>
      <h1>Use it.<br /><span>Make it your own.</span></h1>
      <p className="lead">Components, blocks and templates for personal and commercial projects. No account, payment or licence key. Preserve the included copyright and licence notices when sharing source.</p>
    </header>
    <CollectionPlans />
    <section className="detail-section">
      <h2>The same licence, at every level.</h2>
      <p>Focused and Complete describe the scope of examples. Both are free under MIT. Dependencies, adapted code, icons and fonts retain their own notices, which are included with applicable downloads.</p>
      <div className="actions"><a className="plain-link" href="https://github.com/jaskevs/bld8-ui/blob/main/LICENSE">Read the MIT licence</a><a className="plain-link" href="https://github.com/jaskevs/bld8-ui/blob/main/packages/ui/THIRD_PARTY_NOTICES.md">Third-party notices</a></div>
    </section>
    <section className="detail-section">
      <h2>Help improve the next version.</h2>
      <p>Report a reproducible issue, test a starter in your application or contribute a focused improvement. Community support stays separate from source access.</p>
      <Link href="/community" className="plain-link">Contribute to BLD8 UI</Link>
    </section>
    <section className="library-faq">
      <div><p className="eyebrow">USAGE / ATTRIBUTION</p><h2>What can I do with it?</h2><p>The original BLD8 source uses MIT. Keep the applicable notices with redistributed source.</p></div>
      <Accordion items={[
        { value: 'commercial', title: 'Can I use it in a commercial project?', content: 'Yes. MIT permits use, modification and redistribution, including commercial projects. Preserve the copyright and permission notices in copies or substantial portions. Dependencies retain their own licences.' },
        { value: 'branding', title: 'Do I need a visible BLD8 credit in my app?', content: <>No. MIT does not require a visible BLD8 badge or footer credit. Keep the included notices with distributed source. If you publish a modified library, make clear that it is your version and do not imply official endorsement. See the <a href="https://github.com/jaskevs/bld8-ui/blob/main/BRAND.md">brand usage policy</a>.</> },
        { value: 'download', title: 'Do I need an account or an npm package?', content: <>No account is needed. Install source through the registry, or download a starter with local BLD8 workspace packages. BLD8 packages are not published to npm. The <Link href="/getting-started">installation guide</Link> explains both routes.</> },
        { value: 'backend', title: 'Are the templates complete products?', content: 'They are working frontend examples and runnable interface starters. Sample data and local behaviour are labelled. Connect your own authentication, backend and storage, and test your application before release.' },
      ]} />
    </section>
  </div>;
}
