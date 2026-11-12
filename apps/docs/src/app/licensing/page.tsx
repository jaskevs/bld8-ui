import { permanentRedirect } from 'next/navigation';

/** Keep the portable package documentation link stable. */
export default function Page() {
  permanentRedirect('/plans');
}
