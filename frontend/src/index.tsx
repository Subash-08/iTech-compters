import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import store from './redux/store';  // Should be a default export
import { Provider } from 'react-redux';
// import './index.css'

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);