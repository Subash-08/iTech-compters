// components/ReloadDetector.tsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const ReloadDetector: React.FC = () => {
  const [reloadCount, setReloadCount] = useState(
    parseInt(sessionStorage.getItem('reloadCount') || '0')
  );
  const location = useLocation();

  useEffect(() => {
    // Detect if this is a fresh load
    const navigationEntries = performance.getEntriesByType('navigation');
    const isReload = navigationEntries.length > 0 && 
                    (navigationEntries[0] as PerformanceNavigationTiming).type === 'reload';

    if (isReload) {
      const newCount = reloadCount + 1;
      setReloadCount(newCount);
      sessionStorage.setItem('reloadCount', newCount.toString());
      console.trace('Stack trace for reload:');
    }

    // Monitor for form submissions
    const forms = document.querySelectorAll('form');
    forms.forEach((form, index) => {
      const originalSubmit = form.onsubmit;
      form.onsubmit = function(e) {
        console.trace();
        if (originalSubmit) {
          return originalSubmit.call(this, e);
        }
      };
    });

    // Monitor for window.location changes
    const originalLocationHref = Object.getOwnPropertyDescriptor(window.location, 'href')!;
    Object.defineProperty(window.location, 'href', {
      get: originalLocationHref.get,
      set: (value) => {
        console.trace();
        return originalLocationHref.set!.call(window.location, value);
      }
    });

    // Monitor for reload calls
    const originalReload = window.location.reload;
    window.location.reload = function() {
      console.trace();
      return originalReload.call(this);
    };

  }, [location.pathname, reloadCount]);

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      background: reloadCount > 0 ? 'red' : 'green',
      color: 'white',
      padding: '10px',
      fontSize: '12px',
      zIndex: 9999,
      borderRadius: '5px',
      border: '2px solid white'
    }}>
      Reloads: {reloadCount}
      {reloadCount > 0 && ' ⚠️'}
    </div>
  );
};

export default ReloadDetector;