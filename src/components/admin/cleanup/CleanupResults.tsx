import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface CleanupResultsProps {
  results: {
    success: boolean;
    total_processed?: number;
    deleted?: number;
    failed?: number;
    protected?: number;
    details?: Array<{
      email: string;
      status: 'deleted' | 'failed' | 'protected';
    }>;
  };
}

export function CleanupResults({ results }: CleanupResultsProps) {
  return (
    <div className="mt-4 p-4 border rounded-md">
      <h4 className="font-semibold mb-2">Cleanup Results:</h4>
      <div className="space-y-1 text-sm">
        <p>Total Processed: {results.total_processed}</p>
        <p className="text-green-600">✓ Deleted: {results.deleted}</p>
        <p className="text-red-600">✗ Failed: {results.failed}</p>
        <p className="text-yellow-600">⚠ Protected: {results.protected}</p>
      </div>

      {results.details && results.details.length > 0 && (
        <div className="mt-4">
          <h5 className="font-semibold mb-2">Details:</h5>
          <ul className="space-y-1 text-sm">
            {results.details.map((detail, idx) => (
              <li key={idx} className="flex items-center gap-2">
                {detail.status === 'deleted' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                {detail.status === 'failed' && <XCircle className="h-4 w-4 text-red-500" />}
                {detail.status === 'protected' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
                <span>{detail.email} - {detail.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
