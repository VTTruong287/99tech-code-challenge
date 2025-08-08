// ============================================================================
// COMMENTED CODE
// ============================================================================

// I understand that some not defined parameters are always have the value and I can use it.
// But I think it's better to use strict union types, or use a more specific type for blockchain.


// * Issue: Missing blockchain property
// * Risk: Hard to expand to more blockchains
// * Fix: Add blockchain property
interface WalletBalance {
  currency: string;
  amount: number;
}
interface FormattedWalletBalance {
  currency: string;
  amount: number;
  formatted: string;
}

// * Issue: Should name it with the component name
// * Risk: Hard to understand the component
// * Fix: Name it with the component name
interface Props extends BoxProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: any; // For additional props
}
const WalletPage: React.FC<Props> = (props: Props) => {
  const { children, ...rest } = props;
  const balances = useWalletBalances();
  const prices = usePrices();

  // * Issue: Using `any` defeats TypeScript's purpose
  // * Risk: Runtime errors, no IntelliSense support
  // * Fix: Use strict union types, or use a more specific type for blockchain (enum, type alias)
  const getPriority = (blockchain: any): number => {
    switch (blockchain) {
      case 'Osmosis':
        return 100
      case 'Ethereum':
        return 50
      case 'Arbitrum':
        return 30
      case 'Zilliqa':
        return 20
      case 'Neo':
        return 20
      default:
        return -99
    }
  }

  const sortedBalances = useMemo(() => {
    return balances.filter((balance: WalletBalance) => {
          const balancePriority = getPriority(balance.blockchain);
          // * Issue: misUnderstand condition and using wrong parameter the lhsPriority
          // * Risk: Hard to read
          // * Fix: Use specific condition statement, and use balancePriority instead of lhsPriority
          if (lhsPriority > -99) {
              if (balance.amount <= 0) {
                return true;
              }
          }
          return false
        }).sort((lhs: WalletBalance, rhs: WalletBalance) => {
            const leftPriority = getPriority(lhs.blockchain);
          const rightPriority = getPriority(rhs.blockchain);
          // * Issue: When leftPriority === rightPriority, it will return 0
          // * Risk: Which is not expected
          // * Fix: Return 0 when leftPriority === rightPriority
          if (leftPriority > rightPriority) {
            return -1;
          } else if (rightPriority > leftPriority) {
            return 1;
          }
    });

    // * Issue: missing lhsPriority
    // * Risk: lhsPriority may not change, when the other parameters in this array change
    // * Fix: Add lhsPriority
  }, [balances, prices]);

  const formattedBalances = sortedBalances.map((balance: WalletBalance) => {
    return {
      ...balance,
      formatted: balance.amount.toFixed()
    }
  })

  // * Issue: Using sortedBalances instead of formattedBalances
  // * Risk: Hard to read, b/c the views only show handled data, should not contain more logic (e.g. formatting)
  // * Fix: Use formattedBalances
  const rows = sortedBalances.map((balance: FormattedWalletBalance, index: number) => {
    const usdValue = prices[balance.currency] * balance.amount;
    return (
      // PROBLEM: Using array index as key
      // * Issue: Using array index as key
      // * Risk: Performance issues, re-rendering all rows when the array changes
      // * Fix: Use a unique identifier for each row
      <WalletRow 
        className={classes.row}
        key={index}
        amount={balance.amount}
        usdValue={usdValue}
        formattedAmount={balance.formatted}
      />
    )
  })

  return (
    <div {...rest}>
      {rows}
    </div>
  )
}

// Some other problems:
// - No loading states
// - No error boundaries
// - No validation of data
// - No fallback UI
// - Unnecessary re-renders
// - No memoization of expensive calculations
