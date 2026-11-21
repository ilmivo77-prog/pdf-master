import {AppRouter} from './app/router';
import {ToastProvider} from './components/ui';
import {LocaleProvider} from './services/localization/i18nService';

export default function App() {
  return (
    <LocaleProvider>
      <ToastProvider>
        <AppRouter />
      </ToastProvider>
    </LocaleProvider>
  );
}
