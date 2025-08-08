// ============================================================================
// IMPROVED WALLET PAGE COMPONENT
// ============================================================================

// Type Definitions
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: BlockchainType;
}

interface FormattedWalletBalance extends WalletBalance {
  formatted: string;
  usdValue: number;
  priority: number;
}

// Strict blockchain type instead of 'any'
type BlockchainType = 'Osmosis' | 'Ethereum' | 'Arbitrum' | 'Zilliqa' | 'Neo';

// Blockchain priority configuration
const BLOCKCHAIN_PRIORITIES: Record<BlockchainType, number> = {
  'Osmosis': 100,
  'Ethereum': 50,
  'Arbitrum': 30,
  'Zilliqa': 20,
  'Neo': 20,
} as const;

// Minimum priority threshold
const MIN_PRIORITY_THRESHOLD = -99;

// Props interface with proper typing
interface WalletPageProps extends BoxProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any; // For additional props
}

// Custom hook for blockchain priority
const useBlockchainPriority = () => {
  return useCallback((blockchain: BlockchainType): number => {
    return BLOCKCHAIN_PRIORITIES[blockchain] ?? MIN_PRIORITY_THRESHOLD;
  }, []);
};

// Custom hook for balance filtering and sorting
const useSortedBalances = (balances: WalletBalance[], prices: Record<string, number>) => {
  const getPriority = useBlockchainPriority();
  
  return useMemo(() => {
    if (!balances || balances.length === 0) {
      return [];
    }

    return balances
      .filter((balance: WalletBalance) => {
        const priority = getPriority(balance.blockchain);
        const hasValidPriority = priority > MIN_PRIORITY_THRESHOLD;
        const hasPositiveAmount = balance.amount > 0;
        
        return hasValidPriority && hasPositiveAmount;
      })
      .sort((lhs: WalletBalance, rhs: WalletBalance) => {
        const leftPriority = getPriority(lhs.blockchain);
        const rightPriority = getPriority(rhs.blockchain);
        
        // Sort by priority (descending)
        if (leftPriority !== rightPriority) {
          return rightPriority - leftPriority;
        }
        
        // If same priority, sort by amount (descending) my assumption
        return rhs.amount - lhs.amount;
      });
  }, [balances, getPriority]);
};

// Custom hook for formatted balances
const useFormattedBalances = (sortedBalances: WalletBalance[], prices: Record<string, number>) => {
  return useMemo(() => {
    return sortedBalances.map((balance: WalletBalance): FormattedWalletBalance => {
      const priority = BLOCKCHAIN_PRIORITIES[balance.blockchain] ?? MIN_PRIORITY_THRESHOLD;
      const usdValue = (prices[balance.currency] ?? 0) * balance.amount;
      
      return {
        ...balance,
        formatted: formatAmount(balance.amount),
        usdValue,
        priority,
      };
    });
  }, [sortedBalances, prices]);
};

// Utility function for amount formatting
const formatAmount = (amount: number): string => {
  if (amount <= 0) return '0.00';
  
  // Handle large amounts with comma separation
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Error boundary component for wallet rows
const WalletRowErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ErrorBoundary fallback={<div>Error loading wallet row</div>}>
      {children}
    </ErrorBoundary>
  );
};

// Main Wallet Page Component
const WalletPage: React.FC<WalletPageProps> = ({ children, className, ...rest }) => {
  // Custom hooks for data fetching
  const balances = useWalletBalances();
  const prices = usePrices();
  
  // Error handling for data fetching
  const [error, setError] = useState<string | null>(null);
  
  // Validate data
  useEffect(() => {
    if (!balances || !Array.isArray(balances)) {
      setError('Invalid balances data');
      return;
    }
    
    if (!prices || typeof prices !== 'object') {
      setError('Invalid prices data');
      return;
    }
    
    setError(null);
  }, [balances, prices]);
  
  // Process balances with custom hooks
  const sortedBalances = useSortedBalances(balances, prices);
  const formattedBalances = useFormattedBalances(sortedBalances, prices);
  
  // Loading state
  if (!balances || !prices) {
    return (
      <div {...rest}>
        <div className="loading-spinner">Loading wallet data...</div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div {...rest}>
        <div className="error-message">
          <h3>Error Loading Wallet</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  // Empty state
  if (formattedBalances.length === 0) {
    return (
      <div {...rest}>
        <div className="empty-state">
          <h3>No Wallet Balances</h3>
        </div>
      </div>
    );
  }
  
  // Render wallet rows
  const renderWalletRows = () => {
    return formattedBalances.map((balance: FormattedWalletBalance, index: number) => (
      <WalletRowErrorBoundary key={`${balance.currency}-${balance.blockchain}-${index}`}>
        <WalletRow
          className={classes.row}
          balance={balance}
        />
      </WalletRowErrorBoundary>
    ));
  };
  
  return (
    <div {...rest}>
      {renderWalletRows()}
    </div>
  );
};

// Export with proper typing
export default WalletPage;
