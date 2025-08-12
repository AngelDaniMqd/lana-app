import React, { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { config } from '@gluestack-ui/config';
import { LogBox } from 'react-native';

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
import UserProfileScreen from './screens/UserProfileScreen';
import BudgetsScreen from './screens/BudgetsScreen';
import RecurringPaymentsScreen from './screens/RecurringPaymentsScreen';

import API_ROUTES, { putUser, deleteUser } from './api';

const STORAGE = {
  TOKEN: '@lana/token',
  USER_ID: '@lana/userId',
  USER: '@lana/user',
};

type Screen =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'register'
  | 'home'
  | 'calculator'
  | 'records'
  | 'statistics'
  | 'debts'
  | 'goals'
  | 'notifications'
  | 'budgets'
  | 'recurring'
  | 'profile';

type LoginParams = {
  token: string;
  userId: string;
  remember?: boolean;
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [booted, setBooted] = useState(false);

  LogBox.ignoreLogs(['useInsertionEffect must not schedule updates']);

  useEffect(() => {
    (async () => {
      try {
        const [savedToken, savedUserId, savedUser] = await Promise.all([
          AsyncStorage.getItem(STORAGE.TOKEN),
          AsyncStorage.getItem(STORAGE.USER_ID),
          AsyncStorage.getItem(STORAGE.USER),
        ]);
        if (savedToken && savedUserId) {
          setToken(savedToken);
          setUserId(savedUserId);
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          } else {
            fetchUser(savedUserId, savedToken);
          }
          setCurrentScreen('home');
        } else {
          setCurrentScreen('onboarding');
        }
      } catch {
        setCurrentScreen('onboarding');
      } finally {
        setTimeout(() => setBooted(true), 400);
      }
    })();
  }, []);

  const fetchUser = useCallback(async (id: string, tk: string) => {
    try {
      const res = await fetch(`${API_ROUTES.USERS}/${id}`, {
        headers: { Authorization: `Bearer ${tk}` },
      });
      const data = await res.json();
      setUser(data);
      await AsyncStorage.setItem(STORAGE.USER, JSON.stringify(data));
    } catch {
      setUser(null);
      await AsyncStorage.removeItem(STORAGE.USER);
    }
  }, []);

  const handleLogin = async ({ token: newToken, userId: newUserId, remember = true }: LoginParams) => {
    setToken(newToken);
    setUserId(newUserId);
    setCurrentScreen('home');
    if (remember) {
      await AsyncStorage.setItem(STORAGE.TOKEN, newToken);
      await AsyncStorage.setItem(STORAGE.USER_ID, newUserId);
    } else {
      await AsyncStorage.multiRemove([STORAGE.TOKEN, STORAGE.USER_ID, STORAGE.USER]);
    }
    fetchUser(newUserId, newToken);
  };

  const handleLogout = async () => {
    setToken(null);
    setUserId(null);
    setUser(null);
    await AsyncStorage.multiRemove([STORAGE.TOKEN, STORAGE.USER_ID, STORAGE.USER]);
    setCurrentScreen('login');
  };

  const handleEditProfile = async (newData: Record<string, any>): Promise<boolean> => {
    if (!userId || !token) return false;

    const res = await putUser(userId, newData, token);
    if (!res.ok) {
      let msg = '';
      try {
        const text = await (res as any).text?.(); // por compatibilidad si usas la versión anterior
        msg = text || `HTTP ${res.status}`;
      } catch {
        msg = `HTTP ${res.status}`;
      }
      alert('Error al actualizar usuario: ' + msg);
      return false;
    }

    try {
      const r = await fetch(`${API_ROUTES.USERS}/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const updated = await r.json();
      setUser(updated);
      await AsyncStorage.setItem(STORAGE.USER, JSON.stringify(updated));
    } catch {}
    return true;
  };

  const go = (scr: Screen) => () => setCurrentScreen(scr);
  const goNotifications = () => setCurrentScreen('notifications');

  useEffect(() => {
    if (userId && token) {
      fetch(`${API_ROUTES.USERS}/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json'
        }
      })
        .then(res => res.json())
        .then(data => setUser(data))
        .catch(() => setUser(null));
    } else {
      setUser(null);
    }
  }, [userId, token]);

  if (!booted) {
    return (
      <SafeAreaProvider>
        <GluestackUIProvider config={config}>
          <SplashScreen />
        </GluestackUIProvider>
      </SafeAreaProvider>
    );
  }

  let ScreenComponent = null;

  if (currentScreen === 'onboarding') {
    ScreenComponent = <OnboardingScreen onDone={go('login')} />;
  } else if (currentScreen === 'login') {
    ScreenComponent = (
      <LoginScreen
        onBack={go('onboarding')}
        onRegister={go('register')}
        onLogin={handleLogin}
      />
    );
  } else if (currentScreen === 'register') {
    ScreenComponent = (
      <RegisterScreen
        onBack={go('login')}
        onLogin={go('login')}
      />
    );
  } else if (currentScreen === 'home') {
    ScreenComponent = (
      <HomeScreen
        user={user}
        token={token}
        onAdd={go('calculator')}
        onMenu={go('records')}
        onStatistics={go('statistics')}
        onDebts={go('debts')}
        onGoals={go('goals')}
        onHome={go('home')}
        onNotifications={goNotifications}
        onBudgets={go('budgets')}
        onRecurring={go('recurring')}
        onLogout={handleLogout}
        onProfile={go('profile')}
      />
    );
  } else if (currentScreen === 'profile') {
    ScreenComponent = (
      <UserProfileScreen
        user={user}
        token={token}
        userId={userId}
        onMenu={go('records')}
        onStatistics={go('statistics')}
        onDebts={go('debts')}
        onGoals={go('goals')}
        onHome={go('home')}
        onBudgets={go('budgets')}
        onRecurring={go('recurring')}
        onLogout={handleLogout}
        onNotifications={goNotifications}
        onProfile={go('profile')}
        onEdit={handleEditProfile}
      />
    );
  } else if (currentScreen === 'budgets') {
    ScreenComponent = (
      <BudgetsScreen
        token={token}
        onMenu={go('records')}
        onStatistics={go('statistics')}
        onDebts={go('debts')}
        onGoals={go('goals')}
        onHome={go('home')}
        onLogout={handleLogout}
        onNotifications={goNotifications}
        onBudgets={go('budgets')}
        onRecurring={go('recurring')}
        onProfile={go('profile')}
      />
    );
  } else if (currentScreen === 'recurring') {
    ScreenComponent = (
      <RecurringPaymentsScreen
        token={token}
        onMenu={go('records')}
        onStatistics={go('statistics')}
        onDebts={go('debts')}
        onGoals={go('goals')}
        onHome={go('home')}
        onLogout={handleLogout}
        onNotifications={goNotifications}
        onBudgets={go('budgets')}
        onRecurring={go('recurring')}
        onProfile={go('profile')}
      />
    );
  } else if (currentScreen === 'calculator') {
    ScreenComponent = (
      <CalculatorScreen
        token={token}           
        user={user}             
        onBack={go('home')}
        onSave={go('records')}
        onHome={go('home')}
        onNotifications={goNotifications}
      />
    );
  } else if (currentScreen === 'records') {
    ScreenComponent = (
      <RecordsScreen
      user={user}
        token={token}
        onAdd={go('calculator')}
        onMenu={go('records')}
        onStatistics={go('statistics')}
        onDebts={go('debts')}
        onGoals={go('goals')}
        onHome={go('home')}
        onNotifications={goNotifications}
        onLogout={handleLogout}
        onBudgets={go('budgets')}
        onRecurring={go('recurring')}
        onProfile={go('profile')}
      />
    );
  } else if (currentScreen === 'statistics') {
    ScreenComponent = (
      <StatisticsScreen
       token={token} 
        onMenu={go('records')}
        onStatistics={go('statistics')}
        onDebts={go('debts')}
        onGoals={go('goals')}
        onBack={go('home')}
        onHome={go('home')}
        onNotifications={goNotifications}
        onLogout={handleLogout}
        onBudgets={go('budgets')}
        onRecurring={go('recurring')}
        onProfile={go('profile')}
      />
    );
  } else if (currentScreen === 'debts') {
    ScreenComponent = (
      <DebtsScreen
      
       token={token}
        onMenu={go('records')}
        onStatistics={go('statistics')}
        onDebts={go('debts')}
        onGoals={go('goals')}
        onHome={go('home')}
        onNotifications={goNotifications}
        onLogout={handleLogout}
        onBudgets={go('budgets')}
        onRecurring={go('recurring')}
        onProfile={go('profile')}
      />
    );
  } else if (currentScreen === 'goals') {
    ScreenComponent = (
      <GoalsScreen
      token={token}
        onMenu={go('records')}
        onRecurring={go('recurring')}
        onAdd={go('calculator')}
        onStatistics={go('statistics')}
        onDebts={go('debts')}
        onGoals={go('goals')}
        onHome={go('home')}
        onNotifications={goNotifications}
        onLogout={handleLogout}
        onBudgets={go('budgets')}
        onProfile={go('profile')}
      />
    );
  } else if (currentScreen === 'notifications') {
    ScreenComponent = (
      <NotificationsScreen
       token={token} 
        onBack={go('home')}
        onBudgets={go('budgets')}
        onRecurring={go('recurring')}
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
