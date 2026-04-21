import React, { Suspense } from 'react';
// Suspense is used to handle loading states for async or client-side components
import SetGoalClient from './SetGoalClient';
// Client component is separate because server components cannot use hooks or browser-only features
export default function SetGoalPage() {

  return (
    <main>

      <h1 className="sr-only">Set Goal</h1>
      {/* Provides context for screen readers without showing visually */}
      <Suspense fallback={<div>Loading goal UI…</div>}>
        <SetGoalClient />
      
      </Suspense>
    </main>
  );
}
