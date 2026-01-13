import '../styles/globals.css';
import Layout from '../components/Layout';
import { AuthProvider } from '../contexts/AuthContext';
import { DataProvider } from '../contexts/DataContext';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const router = useRouter();

  return (
    // The AuthProvider and DataProvider wrap everything, which is correct.
    <AuthProvider>
      <DataProvider>
        {/* REPAIR: This is the crucial fix. We now conditionally render the Layout. */}
        {/* If the user is on the login page, we render ONLY the login component. */}
        {router.pathname === '/login' ? (
          <Component {...pageProps} />
        ) : (
          // For every OTHER page, we wrap it in our secure Layout, which
          // will handle redirecting unauthenticated users.
          <Layout>
            <Component {...pageProps} />
          </Layout>
        )}
      </DataProvider>
    </AuthProvider>
  );
}

export default MyApp;

