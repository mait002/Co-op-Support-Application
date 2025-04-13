'use client';

import { Suspense } from 'react';
import AdminEvaluations from './AdminEvaluations';

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdminEvaluations />
    </Suspense>
  );
}