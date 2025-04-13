'use client';

import { Suspense } from 'react';
import SubmitEvaluation from './SubmitEvaluation';

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SubmitEvaluation />
    </Suspense>
  );
}