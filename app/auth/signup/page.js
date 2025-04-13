'use client';

import { Suspense } from 'react';
import Signup from './SignUp';

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Signup />
    </Suspense>
  );
}