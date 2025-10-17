import { useState } from 'react';
import { SqlCleanupStep } from './cleanup/SqlCleanupStep';
import { AuthUsersCleanupStep } from './cleanup/AuthUsersCleanupStep';
import { StorageCleanupStep } from './cleanup/StorageCleanupStep';

export function DatabaseCleanupPanel() {
  const [sqlExecuted, setSqlExecuted] = useState(false);

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Database Cleanup</h1>
        <p className="text-muted-foreground">Execute the complete database cleanup process</p>
      </div>

      <SqlCleanupStep 
        sqlExecuted={sqlExecuted} 
        onMarkExecuted={() => setSqlExecuted(true)} 
      />
      
      <AuthUsersCleanupStep sqlExecuted={sqlExecuted} />
      
      <StorageCleanupStep />
    </div>
  );
}
