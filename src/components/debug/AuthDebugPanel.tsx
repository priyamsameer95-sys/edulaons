import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, Bug, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useDebugAuth } from '@/hooks/useDebugAuth';
import { useAuth } from '@/hooks/useAuth';

/**
 * Debug panel for troubleshooting authentication and permission issues
 * Should only be shown in development mode or when explicitly enabled
 */
export function AuthDebugPanel() {
  const { debugInfo, isDebugging, runDiagnostics, logAuthState } = useDebugAuth();
  const auth = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  // Only show in development or when needed for debugging
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const getStatusIcon = (status: boolean | undefined) => {
    if (status === true) return <CheckCircle className="w-4 h-4 text-green-500" />;
    if (status === false) return <XCircle className="w-4 h-4 text-red-500" />;
    return <AlertCircle className="w-4 h-4 text-yellow-500" />;
  };

  const getStatusBadge = (status: boolean | undefined, label: string) => {
    const variant = status === true ? 'default' : status === false ? 'destructive' : 'secondary';
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <Card className="w-full max-w-2xl mx-auto mb-4 border-yellow-200 bg-yellow-50">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-2 cursor-pointer hover:bg-yellow-100 transition-colors">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Bug className="w-4 h-4" />
              Auth Debug Panel
              <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </CardTitle>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button 
                onClick={runDiagnostics}
                disabled={isDebugging}
                size="sm"
                variant="outline"
              >
                {isDebugging ? 'Running...' : 'Run Diagnostics'}
              </Button>
              <Button 
                onClick={logAuthState}
                size="sm"
                variant="outline"
              >
                Log Auth State
              </Button>
            </div>

            {debugInfo && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Authentication State</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(debugInfo.authState.hasUser)}
                      Has User: {getStatusBadge(debugInfo.authState.hasUser, debugInfo.authState.hasUser ? 'Yes' : 'No')}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(debugInfo.authState.hasSession)}
                      Has Session: {getStatusBadge(debugInfo.authState.hasSession, debugInfo.authState.hasSession ? 'Yes' : 'No')}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(debugInfo.authState.hasAppUser)}
                      Has App User: {getStatusBadge(debugInfo.authState.hasAppUser, debugInfo.authState.hasAppUser ? 'Yes' : 'No')}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(debugInfo.authState.isActive)}
                      Is Active: {getStatusBadge(debugInfo.authState.isActive, debugInfo.authState.isActive ? 'Yes' : 'No')}
                    </div>
                  </div>
                  
                  {debugInfo.authState.userRole && (
                    <div className="mt-2 text-sm">
                      <strong>Role:</strong> <Badge>{debugInfo.authState.userRole}</Badge>
                      {debugInfo.authState.partnerId && (
                        <span className="ml-2">
                          <strong>Partner ID:</strong> <code className="text-xs bg-gray-100 px-1 rounded">{debugInfo.authState.partnerId}</code>
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Database Connection</h4>
                  <div className="flex items-center gap-2 text-sm">
                    {getStatusIcon(debugInfo.supabaseConnection.canConnect)}
                    Connection: {getStatusBadge(debugInfo.supabaseConnection.canConnect, debugInfo.supabaseConnection.canConnect ? 'OK' : 'Failed')}
                  </div>
                  {debugInfo.supabaseConnection.error && (
                    <div className="text-red-600 text-xs mt-1">
                      Error: {debugInfo.supabaseConnection.error}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Permissions</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(debugInfo.permissions.canInsertStudents)}
                      Insert Students: {getStatusBadge(debugInfo.permissions.canInsertStudents, debugInfo.permissions.canInsertStudents ? 'Allowed' : 'Denied')}
                    </div>
                  </div>
                  {debugInfo.permissions.error && (
                    <div className="text-red-600 text-xs mt-1">
                      Error: {debugInfo.permissions.error}
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  Last updated: {new Date(debugInfo.timestamp).toLocaleString()}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-600 bg-yellow-100 p-2 rounded">
              <strong>Debug Mode:</strong> This panel is only visible in development. 
              Use this to troubleshoot authentication and permission issues when creating applications fails.
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}