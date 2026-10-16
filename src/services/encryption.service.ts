
import * as CryptoJS from 'crypto-js';

export const encryptData = (
    data: unknown,
    accessKey: string
): string => {
    try {
        if (!accessKey) {
            throw new Error('Encryption key is missing');
        }

        const keyBytes = CryptoJS.enc.Utf8.parse(accessKey);
        const ivBytes = CryptoJS.lib.WordArray.random(16);

        const stringData =
            typeof data === 'string' ? data : JSON.stringify(data);

        const encrypted = CryptoJS.AES.encrypt(stringData, keyBytes, {
            iv: ivBytes,
            mode: CryptoJS.mode.CBC,
            padding: CryptoJS.pad.Pkcs7,
        });

        const encryptedData = encrypted.ciphertext.toString(
            CryptoJS.enc.Base64
        );
        const ivString = ivBytes.toString(CryptoJS.enc.Base64);

        return `${encryptedData}:${ivString}`;
    } catch (error) {
        throw new Error(
            'Encryption failed: ' +
            (error instanceof Error ? error.message : String(error))
        );
    }
};

export const decryptData = (
    encryptedData: string,
    accessKey: string
): string => {
    try {
        if (!accessKey) {
            throw new Error('Encryption key is missing');
        }

        const encryptedBytes = CryptoJS.enc.Base64.parse(encryptedData);

        if (encryptedBytes.sigBytes <= 16) {
            throw new Error('Invalid encrypted response');
        }

        const iv = CryptoJS.lib.WordArray.create(
            encryptedBytes.words.slice(0, 4),
            16
        );

        const cipherText = CryptoJS.lib.WordArray.create(
            encryptedBytes.words.slice(4),
            encryptedBytes.sigBytes - 16
        );

        const keyBytes = CryptoJS.enc.Utf8.parse(accessKey);


        const cipherParams = CryptoJS.lib.CipherParams.create({
            ciphertext: cipherText,
        });

        const decrypted = CryptoJS.AES.decrypt(
            cipherParams,
            keyBytes,
            {
                iv,
                mode: CryptoJS.mode.CBC,
                padding: CryptoJS.pad.Pkcs7,
            }
        );


        const result = decrypted.toString(CryptoJS.enc.Utf8);

        if (!result) {
            throw new Error('Unable to decrypt response');
        }

        return result;
    } catch {
        throw new Error('Decryption failed. Check the key and response format.');
    }
};
