To create `cert.key` (the private key) and `cert.crt` (the certificate) from a keystore, you'll typically follow these steps using the Java Keytool and OpenSSL. Here’s a concise guide:

### Step 1: Generate a Keystore

If you do not have a keystore yet, you can create one using the `keytool` command:

```bash
keytool -genkeypair -alias myalias -keyalg RSA -keystore mykeystore.jks -keysize 2048
```

- `-alias`: A name to refer to your key pair.
- `-keyalg`: The algorithm to be used (RSA in this case).
- `-keystore`: The file where the keystore is saved (mykeystore.jks).
- `-keysize`: The size of the key.

You will be prompted to enter a password and some information about the certificate.

### Step 2: Export the Certificate

Next, export the certificate from the keystore to a `.crt` file:

```bash
keytool -exportcert -alias myalias -keystore mykeystore.jks -file cert.crt
```

You will need to provide the keystore password.

### Step 3: Export the Private Key

To extract the private key (`.key` file) and the certificate (`.crt` file) from the keystore, you will need to convert the keystore into a format that can be manipulated. You might be required to convert your JKS keystore into a PKCS12 format, as OpenSSL can work with that:

```bash
keytool -importkeystore -srckeystore mykeystore.jks -destkeystore mykeystore.p12 -deststoretype PKCS12
```

### Step 4: Convert PKCS12 to PEM Format

Finalizing, use OpenSSL to extract the private key and certificate from the PKCS#12 file:

```bash
# Extract the private key
openssl pkcs12 -in mykeystore.p12 -nocerts -out cert.key -nodes

# Extract the certificate
openssl pkcs12 -in mykeystore.p12 -clcerts -nokeys -out cert.crt
```

You will be prompted for the password set on the PKCS#12 keystore.

### Summary Files Created
- `cert.key`: Your private key.
- `cert.crt`: Your certificate.

### Note
Make sure to handle your private key securely and restrict access to it.

You now have the `cert.key` and `cert.crt` files ready for use!
