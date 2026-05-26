import React, { useState } from 'react';
import { format } from 'date-fns';
import { Shield } from 'lucide-react';
import { GlassAppShell, GlassView } from './GlassAppShell';
import { GlassHomeView } from './GlassHomeView';
import { GlassTransactionsView } from './GlassTransactionsView';
import { GlassProfileView } from './GlassProfileView';
import { GlassReportsView } from './GlassReportsView';
import { GlassViewWrapper } from './GlassViewWrapper';
import { TransactionModals } from '../transactions/TransactionModals';
import { GlassCustomersTab } from './GlassCustomersTab';
import { TransactionDetailDialog } from './TransactionDetailDialog';

// Import existing view components - PRESERVE ALL LOGIC
import { AdminViews } from '@/components/views/AdminViews';
import { UserAnalytics } from '@/components/user-analytics/UserAnalytics';
import { LegacyAllTimeUserCashSummary } from '@/components/views/LegacyAllTimeUserCashSummary';
import { Reports } from '@/components/ReportsClean';
import { StudioDocuments } from '@/components/studio-documents/StudioDocuments';

import { useAuth } from '@/hooks/useAuth';
import { useTenant } from '@/contexts/TenantContext';
import { useTransactions, Transaction } from '@/hooks/useTransactions';
import { useCategories } from '@/hooks/useCategories';
import { useTransactionFilters } from '@/hooks/useTransactionFilters';
import { logViewChange } from '@/services/userLogService';
import { useGlobalMonthControl } from '@/hooks/useGlobalMonthControl';

import { CorePlanView } from '../core-plan/CorePlanView';
import { ReserveInvestmentView } from '../views/ReserveInvestmentView';
import { RentReservedView } from '../views/RentReservedView';

export function GlassMainApp() {
  const [currentView, setCurrentView] = useState<GlassView>(() => {
    return (localStorage.getItem('appState_currentView') as GlassView) || 'home';
  });
  const [showTransactionForm, setShowTransactionForm] = useState(() => {
    return localStorage.getItem('appState_showTransactionForm') === 'true';
  });
  const [transactionType, setTransactionType] = useState<'cash-in' | 'cash-out'>(() => {
    return (localStorage.getItem('appState_transactionType') as 'cash-in' | 'cash-out') || 'cash-in';
  });
  const [newlyCreatedTransaction, setNewlyCreatedTransaction] = useState<Transaction | null>(null);
  const [showNewTransactionDetail, setShowNewTransactionDetail] = useState(false);

  // Global admin-controlled month — read-only for regular users
  const { month: selectedMonth, year: selectedYear } = useGlobalMonthControl();
  const { tenantId, company } = useTenant();
  const companyName = company?.name || 'Lighthouse Media';

  const { currentUser, isAdmin, logout, systemSettings, logAdminAction } = useAuth();

  const { transactions, loading, addTransaction, updateTransaction, deleteTransaction } = useTransactions();
  const { categories, addCategory } = useCategories();
  const { filters, setFilters, getFilteredTransactions } = useTransactionFilters(
    transactions,
    selectedYear,
    selectedMonth
  );

  // Track scroll position
  React.useEffect(() => {
    const handleScroll = () => {
      localStorage.setItem('appState_scrollPosition', window.scrollY.toString());
    };

    let timeout: NodeJS.Timeout;
    const throttledScroll = () => {
      clearTimeout(timeout);
      timeout = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    // Restore scroll position on mount
    const savedScroll = localStorage.getItem('appState_scrollPosition');
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo({ top: parseInt(savedScroll), behavior: 'instant' });
      }, 300);
    }

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      clearTimeout(timeout);
    };
  }, []);

  // Save UI states on change (month/year are now managed by GlobalMonthControl)
  React.useEffect(() => {
    localStorage.setItem('appState_currentView', currentView);
    localStorage.setItem('appState_showTransactionForm', String(showTransactionForm));
    localStorage.setItem('appState_transactionType', transactionType);
  }, [currentView, showTransactionForm, transactionType]);

  const handleViewChange = (newView: GlassView) => {
    if (currentUser && newView !== currentView) {
      logViewChange(currentUser, currentView, newView);
    }
    setCurrentView(newView);
  };

  const handleLogout = () => {
    logout();
  };

  const handleCashIn = () => {
    setTransactionType('cash-in');
    setShowTransactionForm(true);
  };

  const handleCashOut = () => {
    setTransactionType('cash-out');
    setShowTransactionForm(true);
  };

  const handleFabClick = () => {
    setTransactionType('cash-in');
    setShowTransactionForm(true);
  };

  const handleAddTransaction = async (transaction: Omit<Transaction, 'id' | 'added_by'>) => {
    setShowTransactionForm(false);
    try {
      const added = await addTransaction({
        ...transaction,
        category_name: transaction.category_name,
        time: transaction.time || format(new Date(), 'HH:mm'),
      });

      if (!categories.includes(transaction.category_name)) {
        addCategory(transaction.category_name);
        if (isAdmin) {
          logAdminAction(`Added new category: ${transaction.category_name}`);
        }
      }

      if (added && added.type === 'cash-in') {
        const formattedTx: Transaction = {
          id: added.id,
          date: added.date,
          time: added.time || undefined,
          type: added.type as 'cash-in' | 'cash-out',
          category_name: added.category_name,
          amount: Number(added.amount),
          customer_name: added.customer_name,
          number_of_pictures: added.number_of_pictures || 0,
          whatsapp_number: added.whatsapp_number || '',
          details: added.details || '',
          added_by: added.added_by || currentUser?.username || 'Unknown',
        };
        setNewlyCreatedTransaction(formattedTx);
        setShowNewTransactionDetail(true);
      }
    } catch (error) {
      console.error('Failed to add transaction:', error);
    }
  };

  const filteredTransactions = getFilteredTransactions();
  const userSpecificTransactions = filteredTransactions.filter(
    t => t.added_by === currentUser?.username
  );
  const displayTransactions = isAdmin ? filteredTransactions : userSpecificTransactions;

  const adminOnly = (children: React.ReactNode) => {
    if (isAdmin) return children;
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white/50 backdrop-blur-md rounded-2xl border border-red-100 mt-10">
        <Shield className="w-16 h-16 text-red-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">Access Denied</h3>
        <p className="text-slate-600 text-center mb-6">You don't have permission to view this section.</p>
        <button
          onClick={() => setCurrentView('home')}
          className="px-6 py-2 bg-blue-600 text-white rounded-xl font-medium"
        >
          Return Home
        </button>
      </div>
    );
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return (
          <GlassHomeView
            onViewChange={handleViewChange}
            onCashIn={handleCashIn}
            onCashOut={handleCashOut}
          />
        );

      case 'transactions':
        return (
          <GlassTransactionsView
            transactions={transactions}
            filteredTransactions={displayTransactions}
            filters={filters}
            onFiltersChange={setFilters}
            categories={categories}
            isAdmin={isAdmin}
            currentUser={currentUser}
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            onYearChange={() => { }} // controlled centrally by GlobalMonthControl
            onMonthChange={() => { }} // controlled centrally by GlobalMonthControl
            onDeleteTransaction={deleteTransaction}
            onUpdateTransaction={updateTransaction}
            onAddTransaction={handleAddTransaction}
            onAddCategory={addCategory}
          />
        );

      case 'profile':
        return (
          <GlassProfileView
            onViewChange={handleViewChange}
            onLogout={handleLogout}
          />
        );

      case 'reports':
        return <GlassReportsView onViewChange={handleViewChange} />;

      case 'financialreports':
        return adminOnly(
          <GlassViewWrapper title="Financial Reports" subtitle="Monthly & yearly summaries" onBack={() => handleViewChange('reports')}>
            <Reports />
          </GlassViewWrapper>
        );

      case 'analytics':
        return adminOnly(
          <GlassViewWrapper title="Analytics" subtitle="View your financial insights" onBack={() => handleViewChange('reports')}>
            <UserAnalytics />
          </GlassViewWrapper>
        );

      case 'usersummary':
        return adminOnly(
          <GlassViewWrapper title="User Summary" subtitle="Individual user totals" onBack={() => handleViewChange('reports')}>
            <LegacyAllTimeUserCashSummary />
          </GlassViewWrapper>
        );

      case 'reserve-investment':
        return (
          <GlassViewWrapper>
            <ReserveInvestmentView />
          </GlassViewWrapper>
        );

      case 'rent-reserved':
        return (
          <GlassViewWrapper>
            <RentReservedView />
          </GlassViewWrapper>
        );

      case 'studiodocuments':
        return (
          <GlassViewWrapper title="Studio Documents" subtitle="Contracts and presentations" onBack={() => handleViewChange('reports')}>
            <StudioDocuments />
          </GlassViewWrapper>
        );

      case 'core-plan':
        return (
          <GlassViewWrapper title="Core Plan" subtitle="Strategic financial roadmap" onBack={() => handleViewChange('reports')}>
            <CorePlanView />
          </GlassViewWrapper>
        );

      case 'customers':
        return (
          <GlassViewWrapper title="Customers" subtitle="Customer tracking and history" onBack={() => handleViewChange('reports')}>
            <GlassCustomersTab />
          </GlassViewWrapper>
        );
      case 'targets':
      case 'users':
      case 'logs':
      case 'userlogs':
      case 'settings':
      case 'cashvault':
      case 'savings':
      case 'exports':
      case 'invoices':
      case 'companies':
      case 'systemchat':
      case 'emergencyfund': {
        const adminOnlyGeneralViews = ['savings', 'exports', 'invoices', 'companies', 'users', 'logs', 'emergencyfund', 'cashvault'];
        if (adminOnlyGeneralViews.includes(currentView) && !isAdmin) {
          return adminOnly(<div />);
        }

        const reportLinkedViews = ['exports', 'users', 'logs', 'companies'];
        const backHandler = reportLinkedViews.includes(currentView)
          ? () => handleViewChange('reports')
          : undefined;

        return (
          <GlassViewWrapper onBack={backHandler}>
            <AdminViews
              currentView={currentView as any}
              currentUser={currentUser}
            />
          </GlassViewWrapper>
        );
      }

      default:
        return (
          <GlassHomeView
            onViewChange={handleViewChange}
            onCashIn={handleCashIn}
            onCashOut={handleCashOut}
          />
        );
    }
  };

  return (
    <>
      <GlassAppShell
        currentView={currentView}
        onViewChange={handleViewChange}
        onLogout={handleLogout}
        isAdmin={isAdmin}
        companyName={companyName}
        username={currentUser?.username}
        profilePictureUrl={currentUser?.profile_picture_url}
        onFabClick={handleFabClick}
      >
        {renderView()}
      </GlassAppShell>

      <TransactionModals
        showTransactionForm={showTransactionForm}
        showTopCustomers={false}
        showCustomerList={false}
        transactionType={transactionType}
        categories={categories}
        filteredTransactions={displayTransactions}
        onCloseTransactionForm={() => setShowTransactionForm(false)}
        onCloseTopCustomers={() => { }}
        onCloseCustomerList={() => { }}
        onAddTransaction={handleAddTransaction}
        onAddCategory={addCategory}
      />

      <TransactionDetailDialog
        transaction={newlyCreatedTransaction}
        isOpen={showNewTransactionDetail}
        onClose={() => {
          setShowNewTransactionDetail(false);
          setNewlyCreatedTransaction(null);
        }}
        isAdmin={isAdmin}
        onDelete={deleteTransaction}
      />
    </>
  );
}
