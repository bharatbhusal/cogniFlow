import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '../../store';

interface ReduxProviderProps {
  children: React.ReactNode;
  loading?: React.ReactNode;
}

export const ReduxProvider: React.FC<ReduxProviderProps> = ({ 
  children, 
  loading = <div>Loading...</div> 
}) => {
  return (
    <Provider store={store}>
      <PersistGate loading={loading} persistor={persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
};
