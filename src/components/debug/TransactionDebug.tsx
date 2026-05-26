import { useTransactions } from '@/hooks/useTransactions';
import { useAuth } from '@/hooks/useAuth';

export function TransactionDebug() {
  const { transactions, loading } = useTransactions();
  const { currentUser, isAdmin } = useAuth();

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-300 rounded-lg m-4">
      <h3 className="font-bold text-lg mb-2">🐛 Transaction Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</div>
        <div><strong>Current User:</strong> {currentUser?.username || 'None'}</div>
        <div><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</div>
        <div><strong>Transactions Count:</strong> {transactions.length}</div>
        
        {transactions.length > 0 && (
          <div>
            <strong>First Transaction:</strong>
            <pre className="bg-white p-2 rounded text-xs mt-1">
              {JSON.stringify(transactions[0], null, 2)}
            </pre>
          </div>
        )}
        
        {transactions.length > 0 && (
          <div>
            <strong>Last 3 Transactions:</strong>
            <div className="bg-white p-2 rounded text-xs mt-1">
              {transactions.slice(0, 3).map((t, i) => (
                <div key={i} className="border-b pb-1 mb-1">
                  {t.date} - {t.type} - {t.amount} - {t.customer_name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
