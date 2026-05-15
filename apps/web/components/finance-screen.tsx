import { formatCurrency } from "@gestor/core";
import type { getFinanceScreen } from "@gestor/api";

import {
  AccountRow,
  BudgetRow,
  CategoryRow,
  CreateAccountForm,
  CreateBudgetForm,
  CreateCategoryForm,
  CreateSavingsGoalForm,
  CreateTransactionForm,
  SavingsGoalEditor,
  TransactionRow
} from "./dashboard-actions";

type FinanceScreenData = Awaited<ReturnType<typeof getFinanceScreen>>;

export function FinanceScreen({ data }: { data: FinanceScreenData }) {
  const balance = data.accounts.reduce((sum, account) => sum + account.balance, 0);
  const monthlySummary = data.monthly[data.currentMonthKey] ?? { income: 0, expense: 0 };
  const expenseRatio = Math.min(
    100,
    Math.round(
      (monthlySummary.expense / Math.max(monthlySummary.income, monthlySummary.expense, 1)) * 100
    )
  );

  return (
    <div className="dashboardPage">
      <section className="screenPage">
        <header className="pageHeader">
          <h1>
            Control <span className="headerAccent">Financiero</span>
          </h1>
          <p>Gestiona dinero, movimientos recientes y metas de ahorro con claridad.</p>
        </header>
        <section className="financeTop">
          <div className="balanceCard card">
            <span>Balance total</span>
            <strong>{formatCurrency(balance)}</strong>
            <div className="financeBadges">
              <span className="badge badge-green">↑ {formatCurrency(monthlySummary.income)}</span>
              <span className="badge badge-pink">↓ {formatCurrency(monthlySummary.expense)}</span>
            </div>
          </div>
          <div className="card financeMetricCard">
            <div className="cardTitle">Ingresos</div>
            <strong className="moneyPositive">{formatCurrency(monthlySummary.income)}</strong>
            <span className="statLabel">Este mes</span>
            <div className="progressTrack">
              <div className="progressFill green" style={{ width: "100%" }} />
            </div>
          </div>
          <div className="card financeMetricCard">
            <div className="cardTitle">Gastos</div>
            <strong className="moneyNegative">{formatCurrency(monthlySummary.expense)}</strong>
            <span className="statLabel">Este mes</span>
            <div className="progressTrack">
              <div className="progressFill pink" style={{ width: `${expenseRatio}%` }} />
            </div>
          </div>
        </section>
        <section className="financeGrid">
          <article className="card moduleCard financeSetupCard">
            <div className="cardTitle">Cuentas</div>
            <CreateAccountForm />
            <div className="compactList">
              {data.accounts.length === 0 ? (
                <p className="emptyState">Crea una cuenta para registrar movimientos.</p>
              ) : (
                data.accounts.map((account) => <AccountRow account={account} key={account.id} />)
              )}
            </div>
          </article>
          <article className="card moduleCard financeSetupCard">
            <div className="cardTitle">Categorías y presupuesto</div>
            <CreateCategoryForm />
            <div className="compactList financeSubList">
              {data.categories.length === 0 ? (
                <p className="emptyState">Crea categorías para clasificar tus movimientos.</p>
              ) : (
                data.categories.map((category) => <CategoryRow category={category} key={category.id} />)
              )}
            </div>
            <CreateBudgetForm categories={data.categories} />
            <div className="compactList">
              {data.budgets.length === 0 ? (
                <p className="emptyState">Define un presupuesto mensual para controlar gastos.</p>
              ) : (
                data.budgets.map((budget) => (
                  <BudgetRow budget={budget} categories={data.categories} key={budget.id} />
                ))
              )}
            </div>
          </article>
          <article className="card moduleCard">
            <div className="cardTitle">Transacciones recientes</div>
            <CreateTransactionForm accounts={data.accounts} categories={data.categories} />
            <div className="transList screenList">
              {data.latestTransactions.length === 0 ? (
                <p className="emptyState">Aún no hay movimientos registrados.</p>
              ) : (
                data.latestTransactions.map((entry) => (
                  <TransactionRow accounts={data.accounts} categories={data.categories} transaction={entry} key={entry.id} />
                ))
              )}
            </div>
          </article>
          <article className="card moduleCard">
            <div className="sectionHeader">
              <div className="cardTitle">Metas de ahorro</div>
              <CreateSavingsGoalForm />
            </div>
            <div className="savingsList">
              {data.savingsGoals.length === 0 ? (
                <p className="emptyState">Añade una meta con importe objetivo.</p>
              ) : (
                data.savingsGoals.map((goal) => <SavingsGoalEditor goal={goal} key={goal.id} />)
              )}
            </div>
          </article>
        </section>
      </section>
    </div>
  );
}
