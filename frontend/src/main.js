import "./App.css";
import idl from "./idl.json";
import { PublicKey, clusterApiUrl } from "@solana/web3.js";
import { Program, AnchorProvider, web3, utils, BN,setProvider  } from "@coral-xyz/anchor";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import { Buffer } from 'buffer';


const Main = () => {


    window.Buffer = Buffer;

    console.log(idl.metadata.address, "d");

    const [campaigns, setCampaigns] = useState([]);

    const programId = new PublicKey(idl.address);

    const { SystemProgram } = web3;

    console.log(programId.toString());

    const { connection } = useConnection();
    const wallet = useAnchorWallet();

   




        const provider = new AnchorProvider(connection, wallet, {
            commitment: "confirmed",
          });
        setProvider(provider);
    
  

    const createCampaign = async () => {
        try {
            if (!wallet) {
                console.error("Wallet not connected.");
                return;
            }
            console.log("Creating a new campaign account…");
            // const provider = getProvider();
            console.log(idl , programId, provider);

            // const program = new Program(idl, programId, provider);
            const program = new Program(idl , provider);

            console.log("Program", program);

            const [campaign] = PublicKey.findProgramAddressSync(
                [
                    utils.bytes.utf8.encode("CAMPAIGN_DEMO"),
                    wallet.publicKey.toBuffer(),
                ],
                program.programId
            );

            console.log("Campaign", campaign);
            console.log("Provider", provider.wallet.publicKey.toString());
            console.log("SystemProgram", SystemProgram.programId.toString());

            

            await program.methods
                .create("campaign name", "campaign description")
                .accounts({
                    campaign,
                    user: wallet.publicKey,
                    systemProgram: SystemProgram.programId,
                })
                .rpc();

            console.log(
                "Created a new campaign w/ address:",
                campaign.toString()
            );
            alert("Created a new campaign w/ address:" + campaign.toString());



        } catch (error) {
            console.error("Error creating campaign account:", error);
            alert("Error creating campaign account:" + error);
        }
    };


    const getCampaigns = async () => {
		// const connection = new Connection(network, opts.preflightCommitment);
		// const provider = getProvider();
		const program = new Program(idl, provider);
		Promise.all(
			(await connection.getProgramAccounts(programId)).map(
				async (campaign) => ({
					...(await program.account.campaign.fetch(campaign.pubkey)),
					pubkey: campaign.pubkey,
				})
			)
		).then((campaigns) => {setCampaigns(campaigns)
                console.log("campaigns: ",campaigns)
        });
	};
    

    const donate = async (publicKey) => {
        try {
            // const provider = getProvider();
            const provider = new AnchorProvider(connection, wallet, {
                commitment: "confirmed",
              });
              
            const program = new Program(idl, provider);
    
            await program.methods
                .donate(new BN(0.2 * web3.LAMPORTS_PER_SOL)) // Pass only the amount here
                .accounts({
                    campaign: publicKey,
                    user: provider.wallet.publicKey,
                    systemProgram: web3.SystemProgram.programId,
                })
                .rpc();
                
            console.log("Donated some money to:", publicKey.toString());
            getCampaigns();
            alert("Donated some money to:" + publicKey.toString());
        } catch (error) {
            alert("Error donating:" + error);
            console.error("Error donating:", error);
        }
    };

    const withdraw = async (publicKey) => {
        try {
            // const provider = getProvider();
            const provider = new AnchorProvider(connection, wallet, {
                commitment: "confirmed",
              });
            const program = new Program(idl, provider);
    
            await program.methods
                .withdraw(new BN(0.2 * web3.LAMPORTS_PER_SOL))
                .accounts({
                    campaign: publicKey,
                    user: provider.wallet.publicKey,
                  
                })
                .rpc();
    
            console.log("Withdrew some money from:", publicKey.toString());
            getCampaigns();
            alert("Withdrew some money from:" + publicKey.toString());
        } catch (error) {
            alert("Error withdrawing:" + error);
            console.error("Error withdrawing:", error);
        }
    }
    const renderNotConnectedContainer = () => (
        <button >Connect to Wallet</button>
    );

    const renderConnectedContainer = () => (
        <>
            <button onClick={createCampaign}>Create a campaign…</button>
         
            <div>
                <h2>Campaigns</h2>
                <ul>
                    {campaigns?.map((campaign) => (
                        <li key={campaign.pubkey.toString()}>
                            <p>Pubkey: {campaign.pubkey.toString()}</p>
                            <p>Name: {campaign.name}</p>
                            <p>Description: {campaign.description}</p>
                            <p>Balance: {(campaign.amountDonated / web3.LAMPORTS_PER_SOL).toFixed(2)} SOL</p>
                            <p>admin: {campaign.admin.toString()}</p>
                            <button onClick={() => donate(campaign.pubkey)}>Donate</button>
                            {campaign.admin.toString() === wallet.publicKey.toString() && (
                                <button onClick={() => withdraw(campaign.pubkey)}>Withdraw</button>
                            )}

                        </li>
                    ))}

                    
                </ul>
            </div>

        </>
    );

    useEffect(() => {
        if (wallet) {
            console.log("Wallet object:", wallet);
            console.log("Wallet publicKey:", wallet.publicKey);
            console.log("Wallet signTransaction method:", wallet.signTransaction);
            console.log("Wallet signAllTransactions method:", wallet.signAllTransactions);
            console.log("Wallet is connected:", wallet.publicKey.toString());
            getCampaigns();
        }
    }, [wallet]);

    return (
        <div>
            
            {wallet && renderConnectedContainer()}
        </div>
    );
};

export default Main;
