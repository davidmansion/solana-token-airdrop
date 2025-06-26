import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { toast } from 'react-hot-toast';
import { createToken } from '../utils/token';

export default function CreateToken({ onTokenCreated }) {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 9,
    supply: '',
    description: '',
    image: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!publicKey) {
      toast.error('Please connect your wallet first');
      return;
    }

    setLoading(true);
    
    try {
      // Create the token
      const result = await createToken(
        connection,
        { publicKey, sendTransaction },
        {
          name: formData.name,
          symbol: formData.symbol,
          decimals: formData.decimals,
          supply: formData.supply,
          uri: '', // You can add metadata URI here if needed
        }
      );
      
      toast.success('Token created successfully!');
      onTokenCreated({
        ...formData,
        mint: result.mint,
        signature: result.signature,
        associatedTokenAccount: result.associatedTokenAccount
      });
    } catch (error) {
      console.error('Error creating token:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg mx-auto bg-gray-800 p-6 rounded-lg">
      <h2 className="text-2xl font-bold mb-6">Create New Token</h2>
      
      <div className="mb-4">
        <label className="block mb-2">Token Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          className="w-full p-2 bg-gray-700 rounded"
          placeholder="My Awesome Token"
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Token Symbol</label>
        <input
          type="text"
          value={formData.symbol}
          onChange={(e) => setFormData({...formData, symbol: e.target.value})}
          className="w-full p-2 bg-gray-700 rounded"
          placeholder="MAT"
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Decimals</label>
        <input
          type="number"
          value={formData.decimals}
          onChange={(e) => setFormData({...formData, decimals: parseInt(e.target.value)})}
          className="w-full p-2 bg-gray-700 rounded"
          min="0"
          max="9"
          required
        />
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Initial Supply</label>
        <input
          type="number"
          value={formData.supply}
          onChange={(e) => setFormData({...formData, supply: e.target.value})}
          className="w-full p-2 bg-gray-700 rounded"
          placeholder="1000000"
          required
        />
      </div>
      
      <button
        type="submit"
        disabled={loading || !publicKey}
        className="w-full bg-purple-600 hover:bg-purple-700 p-3 rounded font-bold disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Token'}
      </button>
    </form>
  );
}