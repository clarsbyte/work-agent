#!/usr/bin/env python3

import json
from token_encryption import token_encryptor

def test_token_encryption():
    """Test token encryption and decryption functionality"""
    
    # Sample token data (similar to what Google OAuth returns)
    sample_token_data = {
        "token": "ya29.sample_access_token",
        "refresh_token": "1//sample_refresh_token",
        "token_uri": "https://oauth2.googleapis.com/token",
        "client_id": "sample_client_id.apps.googleusercontent.com",
        "client_secret": "sample_client_secret",
        "scopes": ["https://www.googleapis.com/auth/gmail.send"]
    }
    
    token_json = json.dumps(sample_token_data)
    print("Original token data:")
    print(token_json)
    print()
    
    # Test encryption
    try:
        encrypted_token = token_encryptor.encrypt_token(token_json)
        print("Encrypted token:")
        print(encrypted_token)
        print(f"Encrypted token length: {len(encrypted_token)}")
        print()
        
        # Test decryption
        decrypted_token = token_encryptor.decrypt_token(encrypted_token)
        print("Decrypted token data:")
        print(decrypted_token)
        print()
        
        # Verify data integrity
        original_data = json.loads(token_json)
        decrypted_data = json.loads(decrypted_token)
        
        if original_data == decrypted_data:
            print("SUCCESS: Encryption and decryption working correctly!")
            print("Data integrity verified - original and decrypted data match")
        else:
            print("FAILED: Data integrity check failed")
            print("Original != Decrypted")
            
    except Exception as e:
        print(f"ERROR: {e}")

if __name__ == "__main__":
    test_token_encryption()