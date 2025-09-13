import os
import base64
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from dotenv import load_dotenv

load_dotenv()

class TokenEncryption:
    def __init__(self):
        self.password = os.getenv('SECRET_KEY', 'default-secret-key').encode()
        self.salt = b'stable_salt_for_tokens'  
        
    def _get_key(self):
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=self.salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(self.password))
        return key
    
    def encrypt_token(self, token_json: str) -> str:
        """Encrypt a token JSON string"""
        try:
            f = Fernet(self._get_key())
            encrypted_data = f.encrypt(token_json.encode())
            return base64.urlsafe_b64encode(encrypted_data).decode()
        except Exception as e:
            raise Exception(f"Failed to encrypt token: {e}")
    
    def decrypt_token(self, encrypted_token: str) -> str:
        """Decrypt a token and return JSON string"""
        try:
            f = Fernet(self._get_key())
            encrypted_data = base64.urlsafe_b64decode(encrypted_token.encode())
            decrypted_data = f.decrypt(encrypted_data)
            return decrypted_data.decode()
        except Exception as e:
            raise Exception(f"Failed to decrypt token: {e}")


token_encryptor = TokenEncryption()