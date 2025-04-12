'use client';

export default function TestDynamicRoute({ params }) {
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Dynamic Route Test</h1>
      <p>Report ID: {params.id}</p>
      <p>If you see the report ID above, the dynamic routing is working correctly.</p>
    </div>
  );
} 