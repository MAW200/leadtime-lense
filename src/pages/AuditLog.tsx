import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TopHeader } from '@/components/TopHeader';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClipboardList, Download, Eye } from 'lucide-react';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { AuditLog as AuditLogType } from '@/lib/supabase';

const ACTION_OPTIONS = [
  { value: 'all', label: 'All Actions' },
  { value: 'PO_CREATED', label: 'PO Created' },
  { value: 'PO_STATUS_CHANGED', label: 'PO Status Changed' },
  { value: 'PO_QA_COMPLETED', label: 'PO QA Completed' },
  { value: 'REQUEST_CREATED', label: 'Request Created' },
  { value: 'REQUEST_STATUS_CHANGED', label: 'Request Status Changed' },
  { value: 'claim_initiated', label: 'Claim Initiated' },
  { value: 'emergency_claim_initiated', label: 'Emergency Claim Initiated' },
  { value: 'claim_approved', label: 'Claim Approved' },
  { value: 'claim_partially_approved', label: 'Claim Partially Approved' },
  { value: 'claim_denied', label: 'Claim Denied' },
  { value: 'return_submitted', label: 'Return Submitted' },
  { value: 'return_approved', label: 'Return Approved' },
  { value: 'stock_adjustment_recorded', label: 'Stock Adjustment' },
] as const;

const AuditLog = () => {
  const [actionTypeFilter, setActionTypeFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLogType | null>(null);

  const { data: logs, isLoading } = useAuditLogs({
    actionType: actionTypeFilter,
    userName: userFilter || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
  });

  const getRoleBadge = (role: string) => {
    const roleConfig: Record<string, { label: string; className: string }> = {
      ceo_admin: { label: 'CEO/Admin', className: 'bg-indigo-500 text-white' },
      warehouse_admin: { label: 'Warehouse Admin', className: 'bg-blue-600 text-white' },
      onsite_team: { label: 'Onsite Team', className: 'bg-orange-500 text-white' },
      system: { label: 'System', className: 'bg-gray-500 text-white' },
    };

    const config = roleConfig[role] || roleConfig.system;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const getActionTypeBadge = (actionType: string) => {
    const actionConfig: Record<string, { label: string; className: string }> = {
      PO_CREATED: { label: 'PO Created', className: 'bg-green-100 text-green-800' },
      PO_STATUS_CHANGED: { label: 'PO Status Changed', className: 'bg-blue-100 text-blue-800' },
      PO_QA_COMPLETED: { label: 'PO QA Completed', className: 'bg-purple-100 text-purple-800' },
      REQUEST_CREATED: { label: 'Request Created', className: 'bg-green-100 text-green-800' },
      REQUEST_STATUS_CHANGED: { label: 'Request Status Changed', className: 'bg-blue-100 text-blue-800' },
      claim_initiated: { label: 'Claim Initiated', className: 'bg-amber-100 text-amber-700' },
      emergency_claim_initiated: { label: 'Emergency Claim', className: 'bg-red-100 text-red-700' },
      claim_approved: { label: 'Claim Approved', className: 'bg-emerald-100 text-emerald-700' },
      claim_partially_approved: { label: 'Claim Partial Approval', className: 'bg-sky-100 text-sky-700' },
      claim_denied: { label: 'Claim Denied', className: 'bg-rose-100 text-rose-700' },
      return_submitted: { label: 'Return Submitted', className: 'bg-purple-100 text-purple-700' },
      return_approved: { label: 'Return Approved', className: 'bg-lime-100 text-lime-700' },
      stock_adjustment_recorded: { label: 'Stock Adjustment', className: 'bg-slate-100 text-slate-700' },
    };

    const config = actionConfig[actionType] || { label: actionType, className: 'bg-gray-100 text-gray-800' };
    return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
  };

  const exportToCSV = () => {
    if (!logs || logs.length === 0) return;

    const headers = ['Timestamp', 'User', 'Role', 'Action Type', 'Description'];
    const rows = logs.map(log => [
      format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss'),
      log.user_name,
      log.user_role,
      log.action_type,
      log.action_description,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="h-full flex flex-col">
      <TopHeader
        title="Audit Log"
        description="Complete audit trail of all system activities"
        actions={
          <Button variant="outline" onClick={exportToCSV} disabled={!logs || logs.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        }
      />

      <div className="flex-1 overflow-y-auto px-8 py-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-[240px_240px_220px_220px] gap-4">
            <div className="space-y-2">
              <Label htmlFor="actionType" className="text-xs">Filter by Action Type</Label>
              <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                <SelectTrigger id="actionType">
                  <SelectValue placeholder="Select action" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {ACTION_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="userFilter" className="text-xs">User</Label>
              <Input
                id="userFilter"
                placeholder="Search by user name"
                value={userFilter}
                onChange={(event) => setUserFilter(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startDate" className="text-xs">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate" className="text-xs">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="rounded-lg border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="font-semibold">Timestamp</TableHead>
                    <TableHead className="font-semibold">User</TableHead>
                    <TableHead className="font-semibold">Role</TableHead>
                    <TableHead className="font-semibold">Action</TableHead>
                    <TableHead className="font-semibold">Description</TableHead>
                    <TableHead className="font-semibold w-20">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <TableCell className="text-sm font-mono">
                        {format(new Date(log.timestamp), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell className="font-medium">{log.user_name}</TableCell>
                      <TableCell>{getRoleBadge(log.user_role)}</TableCell>
                      <TableCell>{getActionTypeBadge(log.action_type)}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {log.action_description}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedLog(log)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 border rounded-lg bg-card">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No audit logs found</h3>
              <p className="text-sm text-muted-foreground">
                {actionTypeFilter === 'all'
                  ? 'Audit logs will appear here as actions are performed'
                  : `No ${actionTypeFilter.toLowerCase().replace(/_/g, ' ')} actions recorded`}
              </p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Audit Log Details</DialogTitle>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Timestamp</div>
                  <div className="font-mono text-sm">
                    {format(new Date(selectedLog.timestamp), 'MMM d, yyyy h:mm:ss a')}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">User</div>
                  <div className="font-medium">{selectedLog.user_name}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Role</div>
                  <div>{getRoleBadge(selectedLog.user_role)}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Action Type</div>
                  <div>{getActionTypeBadge(selectedLog.action_type)}</div>
                </div>
              </div>

              <div>
                <div className="text-xs text-muted-foreground mb-1">Description</div>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  {selectedLog.action_description}
                </div>
              </div>

              {selectedLog.metadata && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Additional Data</div>
                  <pre className="p-3 bg-muted rounded-lg text-xs overflow-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.photo_url && (
                <div>
                  <div className="text-xs text-muted-foreground mb-2">Attached Photo</div>
                  <img
                    src={selectedLog.photo_url}
                    alt="Audit photo"
                    className="w-full h-64 object-cover rounded-lg border"
                  />
                </div>
              )}

              {selectedLog.related_entity_type && (
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Related Entity</div>
                  <div className="text-sm">
                    <Badge variant="outline">{selectedLog.related_entity_type}</Badge>
                    {selectedLog.related_entity_id && (
                      <span className="ml-2 font-mono text-xs text-muted-foreground">
                        {selectedLog.related_entity_id}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLog;
