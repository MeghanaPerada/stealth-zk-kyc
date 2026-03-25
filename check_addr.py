import algosdk

mnemonic = "blame loud cheese quick evolve inquiry spare great hope dinner oyster peace million fly neglect market soft cruise brisk license sting screen orchard about bonus"
private_key = algosdk.mnemonic.to_private_key(mnemonic)
address = algosdk.account.address_from_private_key(private_key)
print(address)
