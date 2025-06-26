import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Head from 'next/head';

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Head>
        <title>Solana Token Airdrop</title>
        <meta name="description" content="Create and airdrop SPL tokens" />
      </Head>
      
      <nav className="bg-gray-800 p-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">SPL Token Airdrop</h1>
          <WalletMultiButton className="!bg-purple-600 hover:!bg-purple-700" />
        </div>
      </nav>
      
      <main className="container mx-auto p-4">
        {children}
      </main>
    </div>
  );
}