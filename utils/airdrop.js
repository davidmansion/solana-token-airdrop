import {
  Connection,
  PublicKey,
  Transaction,
} from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token'; // Updated imports

export async function airdropTokens(
  connection,
  wallet,
  tokenMint,
  recipients,
  amountPerRecipient,
  decimals
) {
  const successful = [];
  const failed = [];
  
  const mintPubkey = new PublicKey(tokenMint);
  
  // Get sender's token account
  const senderTokenAccountAddress = await getAssociatedTokenAddress(
    mintPubkey,
    wallet.publicKey,
    false,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  
  // Process recipients in batches
  const batchSize = 5;
  
  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);
    const transaction = new Transaction();
    
    for (const recipientAddress of batch) {
      try {
        const recipientPubkey = new PublicKey(recipientAddress);
        
        // Get recipient's associated token account
        const recipientTokenAccountAddress = await getAssociatedTokenAddress(
          mintPubkey,
          recipientPubkey,
          false,
          TOKEN_PROGRAM_ID,
          ASSOCIATED_TOKEN_PROGRAM_ID
        );
        
        // Check if recipient token account exists
        const accountInfo = await connection.getAccountInfo(recipientTokenAccountAddress);
        
        // Create account if it doesn't exist
        if (!accountInfo) {
          transaction.add(
            createAssociatedTokenAccountInstruction(
              wallet.publicKey,
              recipientTokenAccountAddress,
              recipientPubkey,
              mintPubkey,
              TOKEN_PROGRAM_ID,
              ASSOCIATED_TOKEN_PROGRAM_ID
            )
          );
        }
        
        // Add transfer instruction
        transaction.add(
          createTransferInstruction(
            senderTokenAccountAddress,
            recipientTokenAccountAddress,
            wallet.publicKey,
            amountPerRecipient * Math.pow(10, decimals),
            undefined, // No multi-signers
            TOKEN_PROGRAM_ID
          )
        );
        
      } catch (error) {
        console.error(`Error preparing transfer to ${recipientAddress}:`, error);
        failed.push({ address: recipientAddress, error: error.message });
      }
    }
    
    // Send transaction if it has instructions
    if (transaction.instructions.length > 0) {
      try {
        const signature = await wallet.sendTransaction(transaction, connection);
        await connection.confirmTransaction(signature, 'confirmed');
        
        batch.forEach(addr => successful.push(addr));
      } catch (error) {
        console.error('Transaction failed:', error);
        batch.forEach(addr => failed.push({ address: addr, error: error.message }));
      }
    }
  }
  
  return {
    successful: successful.length,
    failed: failed.length,
    details: { successful, failed }
  };
}