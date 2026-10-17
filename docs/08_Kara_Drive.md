# 📦 Kara Drive: Sovereign Encrypted File Vault

## Chapter 1: Introduction & Core Purpose
Kara Drive is a zero-knowledge, client-side encrypted file storage system. It ensures that sensitive documents stored within the Kara ecosystem are mathematically protected before they ever touch the disk.

## Chapter 2: Key Features & Functionalities
- **Client-Side Encryption**: Files are obfuscated (V1: Caesar+Base64; V2 Roadmap: AES-256 WebCrypto) before being saved to local storage.
- **Zero-Knowledge Architecture**: The app itself does not store the decryption key in plain text; it is derived at runtime.
- **Secure Download**: Files are decrypted in memory and downloaded directly to your machine, leaving no trace in the browser cache.

## Chapter 3: Step-by-Step Usage Guide
1. **Open**: Select "Kara Drive" from the sidebar.
2. **Upload**: Click "Upload to Vault" and select a .txt or .json file. Watch it encrypt and appear in the ledger with a 🔒 icon.
3. **View Ledger**: See the file name, encrypted size, and date of upload.
4. **Download**: Click the 🔓 (Unlock) icon. The file is decrypted instantly and downloaded to your computer's Downloads folder.
5. **Delete**: Click the Trash icon to permanently wipe the encrypted blob from local storage.

## Chapter 4: Intersections & Ecosystem Integration
- **With Kara Sync**: Kara Drive acts as the secure vault, while Kara Sync handles the safe, bundled transfer of that vault's state to other authorized devices.
