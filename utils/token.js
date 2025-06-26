import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL
} from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
  MINT_SIZE,
  ASSOCIATED_TOKEN_PROGRAM_ID
} from '@solana/spl-token'; // Updated imports
import {
  createCreateMetadataAccountV3Instruction,
  PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID
} from '@metaplex-foundation/mpl-token-metadata';

export async function createToken(
  connection,
  wallet,
  tokenInfo
) {
  try {
    const mintKeypair = Keypair.generate();
    const mintRent = await connection.getMinimumBalanceForRentExemption(MINT_SIZE); // Use MINT_SIZE

    // Create mint account instruction
    const createMintAccountIx = SystemProgram.createAccount({
      fromPubkey: wallet.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      lamports: mintRent,
      space: MINT_SIZE,
      programId: TOKEN_PROGRAM_ID,
    });

    // Initialize mint using new function
    const initMintIx = createInitializeMintInstruction(
      mintKeypair.publicKey,
      tokenInfo.decimals,
      wallet.publicKey,
      wallet.publicKey
    );

    // Get metadata PDA
    const [metadataPDA] = await PublicKey.findProgramAddress(
      [
        Buffer.from('metadata'),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintKeypair.publicKey.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID
    );

    // Create metadata instruction (fixed structure)
    const createMetadataIx = createCreateMetadataAccountV3Instruction(
      {
        metadata: metadataPDA,
        mint: mintKeypair.publicKey,
        mintAuthority: wallet.publicKey,
        payer: wallet.publicKey,
        updateAuthority: wallet.publicKey,
      },
      {
        createMetadataAccountArgsV3: {
          data: {
            name: tokenInfo.name,
            symbol: tokenInfo.symbol,
            uri: tokenInfo.uri || '',
            sellerFeeBasisPoints: 0,
            creators: null,
            collection: null,
            uses: null,
          },
          isMutable: true,
          collectionDetails: null,
        },
      }
    );

    // Get associated token account address
    const associatedTokenAddress = await getAssociatedTokenAddress(
      mintKeypair.publicKey,
      wallet.publicKey,
      false,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Create ATA instruction
    const createATAIx = createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      associatedTokenAddress,
      wallet.publicKey,
      mintKeypair.publicKey,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    // Mint tokens instruction
    const mintToIx = createMintToInstruction(
      mintKeypair.publicKey,
      associatedTokenAddress,
      wallet.publicKey,
      tokenInfo.supply * Math.pow(10, tokenInfo.decimals),
      undefined, // Multi-signers (not needed)
      TOKEN_PROGRAM_ID
    );

    // Build and send transaction
    const transaction = new Transaction().add(
      createMintAccountIx,
      initMintIx,
      createMetadataIx,
      createATAIx,
      mintToIx
    );

    const signature = await wallet.sendTransaction(transaction, connection, {
      signers: [mintKeypair],
    });
    
    await connection.confirmTransaction(signature, 'confirmed');
    
    return {
      mint: mintKeypair.publicKey.toString(),
      signature,
      associatedTokenAccount: associatedTokenAddress.toString(),
    };
  } catch (error) {
    console.error('Error creating token:', error);
    throw error;
  }
}