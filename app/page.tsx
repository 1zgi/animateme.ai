'use client';

import { useRouter } from 'next/navigation';
import LandingPage from './components/ui/LandingPage';

export default function HomePage() {
  const router = useRouter();

  const handleContinue = () => {
    router.push('/home');
  };

  return <LandingPage onContinue={handleContinue} />;
}
