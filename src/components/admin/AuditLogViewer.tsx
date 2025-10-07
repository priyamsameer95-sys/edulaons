import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Download, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AuditLog {
  id: string;
  action: string;
  performed_by: string;
  target_user_id: string | null;
  target_user_email: string;
  old_values: any;
  new_values: any;
  reason: string | null;
  ip_address: string | null;
  user_agent: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [successFilter, setSuccessFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_management_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch audit logs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string, success: boolean) => {
    if (!success) {
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />{action}</Badge>;
    }
    
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      create: 'default',
      update: 'secondary',
      deactivate: 'destructive',
      reactivate: 'outline',
    };
    
    return (
      <Badge variant={variants[action] || 'default'}>
        <CheckCircle className="h-3 w-3 mr-1" />
        {action}
      </Badge>
    );
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Action', 'Performed By', 'Target Email', 'Success', 'Reason', 'IP Address'];
    const csvContent = [
      headers.join(','),
      ...filteredLogs.map(log => [
        format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
        log.action,
        log.performed_by,
        log.target_user_email,
        log.success ? 'Yes' : 'No',
        log.reason || 'N/A',
        log.ip_address || 'N/A',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: 'Success',
      description: 'Audit logs exported successfully',
    });
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.target_user_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = actionFilter === 'all' || log.action === actionFilter;
    const matchesSuccess = successFilter === 'all' || 
      (successFilter === 'success' && log.success) ||
      (successFilter === 'failed' && !log.success);

    return matchesSearch && matchesAction && matchesSuccess;
  });

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading audit logs...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Audit Logs</span>
            <Button onClick={exportToCSV} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="create">Create</SelectItem>
                <SelectItem value="update">Update</SelectItem>
                <SelectItem value="deactivate">Deactivate</SelectItem>
                <SelectItem value="reactivate">Reactivate</SelectItem>
              </SelectContent>
            </Select>
            <Select value={successFilter} onValueChange={setSuccessFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>No audit logs found</p>
              </div>
            ) : (
              filteredLogs.map((log) => (
                <Card key={log.id} className={!log.success ? 'border-destructive' : ''}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.action, log.success)}
                        <span className="text-sm font-medium">{log.target_user_email}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                      </span>
                    </div>
                    
                    {log.reason && (
                      <p className="text-sm text-muted-foreground mb-2">
                        <strong>Reason:</strong> {log.reason}
                      </p>
                    )}
                    
                    {!log.success && log.error_message && (
                      <p className="text-sm text-destructive mb-2">
                        <strong>Error:</strong> {log.error_message}
                      </p>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground mt-3 pt-3 border-t">
                      <div>
                        <strong>Performed by:</strong> {log.performed_by}
                      </div>
                      <div>
                        <strong>IP:</strong> {log.ip_address || 'N/A'}
                      </div>
                      {log.old_values && (
                        <div className="col-span-2">
                          <strong>Changes:</strong>
                          <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto">
                            {JSON.stringify({ old: log.old_values, new: log.new_values }, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
