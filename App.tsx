import React, { useState, useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';

import SplashScreen from './screens/SplashScreen';
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import HomeScreen from './screens/HomeScreen';
import CalculatorScreen from './screens/CalculatorScreen';
import RecordsScreen from './screens/RecordsScreen';
import StatisticsScreen from './screens/StatisticsScreen';
import DebtsScreen from './screens/DebtsScreen';
import GoalsScreen from './screens/GoalsScreen';
import NotificationsScreen from './screens/NotificationsScreen';

import BudgetsScreen from './screens/BudgetsScreen';
import RecurringPaymentsScreen from './screens/RecurringPaymentsScreen';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<
    'splash' | 'onboarding' | 'login' | 'register' | 'home' | 'calculator' | 'records' | 'statistics' | 'debts' | 'goals' | 'notifications' | 'budgets' | 'recurring'
  >('splash');

  useEffect(() => {
    const timer = setTimeout(() => setCurrentScreen('onboarding'), 2000);
    return () => clearTimeout(timer);
  }, []);

  const goNotifications = () => setCurrentScreen('notifications');
  const handleLogout = () => setCurrentScreen('login');

  let ScreenComponent = null;

  if (currentScreen === 'splash') {
    ScreenComponent = <SplashScreen />;
  } else if (currentScreen === 'onboarding') {
    ScreenComponent = <OnboardingScreen onDone={() => setCurrentScreen('login')} />;
  } else if (currentScreen === 'login') {
    ScreenComponent = (
      <LoginScreen
        onBack={() => setCurrentScreen('onboarding')}
        onRegister={() => setCurrentScreen('register')}
        onLogin={() => setCurrentScreen('home')}
      />
    );
  } else if (currentScreen === 'register') {
    ScreenComponent = (
      <RegisterScreen
        onBack={() => setCurrentScreen('login')}
        onLogin={() => setCurrentScreen('login')}
      />
    );
  } else if (currentScreen === 'home') {
    ScreenComponent = (
      <HomeScreen
        onAdd={() => setCurrentScreen('calculator')}
        onMenu={() => setCurrentScreen('records')}
        onStatistics={() => setCurrentScreen('statistics')}
        onDebts={() => setCurrentScreen('debts')}
        onGoals={() => setCurrentScreen('goals')}
        onHome={() => setCurrentScreen('home')}
        onNotifications={goNotifications}
        onBudgets={() => setCurrentScreen('budgets')}
        onRecurring={() => setCurrentScreen('recurring')}
        onLogout={handleLogout}
      />
    );
  } else if (currentScreen === 'budgets') {
    ScreenComponent = (
      <BudgetsScreen
        onMenu={() => setCurrentScreen('records')}
        onStatistics={() => setCurrentScreen('statistics')}
        onDebts={() => setCurrentScreen('debts')}
        onGoals={() => setCurrentScreen('goals')}
        onHome={() => setCurrentScreen('home')}
        onLogout={() => setCurrentScreen('login')}
        onNotifications={goNotifications}
        onBudgets={() => setCurrentScreen('budgets')}
        onRecurring={() => setCurrentScreen('recurring')}
      />
    );
  } else if (currentScreen === 'recurring') {
    ScreenComponent = (
      <RecurringPaymentsScreen
        onMenu={() => setCurrentScreen('records')}
        onStatistics={() => setCurrentScreen('statistics')}
        onDebts={() => setCurrentScreen('debts')}
        onGoals={() => setCurrentScreen('goals')}
        onHome={() => setCurrentScreen('home')}
        onLogout={() => setCurrentScreen('login')}
        onNotifications={goNotifications}
        onBudgets={() => setCurrentScreen('budgets')}
        onRecurring={() => setCurrentScreen('recurring')}
      />
    );
  } else if (currentScreen === 'calculator') {
    ScreenComponent = (
      <CalculatorScreen
        onBack={() => setCurrentScreen('home')}
        onSave={() => setCurrentScreen('records')}
        onHome={() => setCurrentScreen('home')}
        onNotifications={goNotifications}
      />
    );
  } else if (currentScreen === 'records') {
    ScreenComponent = (
      <RecordsScreen
        onAdd={() => setCurrentScreen('calculator')}
        onMenu={() => setCurrentScreen('records')}
        onStatistics={() => setCurrentScreen('statistics')}
        onDebts={() => setCurrentScreen('debts')}
        onGoals={() => setCurrentScreen('goals')}
        onHome={() => setCurrentScreen('home')}
        onNotifications={goNotifications}
        onLogout={handleLogout}
        onBudgets={() => setCurrentScreen('budgets')}
        onRecurring={() => setCurrentScreen('recurring')}
      />
    );
  } else if (currentScreen === 'statistics') {
    ScreenComponent = (
      <StatisticsScreen
        onMenu={() => setCurrentScreen('records')}
        onStatistics={() => setCurrentScreen('statistics')}
        onDebts={() => setCurrentScreen('debts')}
        onGoals={() => setCurrentScreen('goals')}
        onBack={() => setCurrentScreen('home')}
        onHome={() => setCurrentScreen('home')}
        onNotifications={goNotifications}
        onLogout={handleLogout}
        onBudgets={() => setCurrentScreen('budgets')}
        onRecurring={() => setCurrentScreen('recurring')}
      />
    );
  } else if (currentScreen === 'debts') {
    ScreenComponent = (
      <DebtsScreen
        onMenu={() => setCurrentScreen('records')}
        onStatistics={() => setCurrentScreen('statistics')}
        onDebts={() => setCurrentScreen('debts')}
        onGoals={() => setCurrentScreen('goals')}
        onHome={() => setCurrentScreen('home')}
        onNotifications={goNotifications}
        onLogout={handleLogout}
             onBudgets={() => setCurrentScreen('budgets')}
        onRecurring={() => setCurrentScreen('recurring')}
      />
    );
  } else if (currentScreen === 'goals') {
    ScreenComponent = (
      <GoalsScreen
        onMenu={() => setCurrentScreen('records')}
      
        onRecurring={() => setCurrentScreen('recurring')}
        onAdd={() => setCurrentScreen('calculator')}
        onStatistics={() => setCurrentScreen('statistics')}
        onDebts={() => setCurrentScreen('debts')}
        onGoals={() => setCurrentScreen('goals')}
        onHome={() => setCurrentScreen('home')}
        onNotifications={goNotifications}
        onLogout={handleLogout}
              onBudgets={() => setCurrentScreen('budgets')}
        onRecurring={() => setCurrentScreen('recurring')}
      />
    );
  } else if (currentScreen === 'notifications') {
    ScreenComponent = (
      <NotificationsScreen
        onBack={() => setCurrentScreen('home')}
        onBudgets={() => setCurrentScreen('budgets')}
        onRecurring={() => setCurrentScreen('recurring')}
      />
    );
  }

  return (
    <SafeAreaProvider>
      <GluestackUIProvider config={config}>
        {ScreenComponent}
      </GluestackUIProvider>
    </SafeAreaProvider>
  );
}
