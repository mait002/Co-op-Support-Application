// app/admin/applications/page.js
'use client';

import { Suspense } from 'react';
import AdminApplications from './AdminApplications';

export default function ApplicationsPage() {
  return (
    <Suspense fallback={<div>Loading applications...</div>}>
      <AdminApplications />
    </Suspense>
  );
}
