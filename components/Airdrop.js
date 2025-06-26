import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { airdropTokens } from '../utils/airdrop';

export default function Airdrop({ tokenMint, decimals = 9 }) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [recipients, setRecipients] = useState('');
  const [amountPerRecipient, setAmountPerRecipient] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAirdrop = async () => {
    if (!publicKey) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!tokenMint) {
      toast.error('Please create a token first');
      return;
    }

    setLoading(true);

    try {
      // Parse recipients (one address per line)
      const recipientAddresses = recipients
        .split('\n')
        .map(addr => addr.trim())
        .filter(addr => addr.length > 0);

      if (recipientAddresses.length === 0) {
        throw new Error('No valid recipient addresses');
      }

      // Call airdrop function
      const result = await airdropTokens(
        connection,
        { publicKey, sendTransaction },
        tokenMint,
        recipientAddresses,
        parseFloat(amountPerRecipient),
        decimals
      );

      toast.success(`Airdrop successful! ${result.successful} transfers completed`);
      
      if (result.failed > 0) {
        toast.error(`${result.failed} transfers failed. Check console for details.`);
        console.log('Failed transfers:', result.details.failed);
      }
      
      // Clear form
      setRecipients('');
      setAmountPerRecipient('');
    } catch (error) {
      toast.error(`Airdrop failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto bg-gray-800 p-6 rounded-lg mt-8">
      <h2 className="text-2xl font-bold mb-6">Airdrop Tokens</h2>
      
      <div className="mb-4">
        <label className="block mb-2">Token Mint Address</label>
        <input
          type="text"
          value={tokenMint || ''}
          className="w-full p-2 bg-gray-700 rounded opacity-50"
          disabled
        />
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Recipient Addresses (one per line)</label>
        <textarea
          value={recipients}
          onChange={(e) => setRecipients(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded h-32"
          placeholder="Enter wallet addresses...
5FHwkrYPNyDzKLfqctRV8uy8SBU6YjLafZpCAsmZYtTX
9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM"
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Amount per Recipient</label>
        <input
          type="number"
          value={amountPerRecipient}
          onChange={(e) => setAmountPerRecipient(e.target.value)}
          className="w-full p-2 bg-gray-700 rounded"
          placeholder="100"
          step="0.000000001"
          required
        />
      </div>
      
      <button
        onClick={handleAirdrop}
        disabled={loading || !publicKey || !tokenMint}
        className="w-full bg-green-600 hover:bg-green-700 p-3 rounded font-bold disabled:opacity-50"
      >
        {loading ? 'Processing Airdrop...' : 'Start Airdrop'}
      </button>
      
      <div className="mt-4 text-sm text-gray-400">
        <p>Note: You'll need to approve one transaction for every ~5 recipients.</p>
      </div>
    </div>
  );
}