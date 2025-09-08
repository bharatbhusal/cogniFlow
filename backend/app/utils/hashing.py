import bcrypt

def hash_data(data: str) -> str:
    """
    Hash a plain text data using bcrypt.
    
    Args:
        data: Plain text data to hash
        
    Returns:
        Hashed data string
    """
    # Generate salt and hash data
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(data.encode('utf-8'), salt)
    return hashed.decode('utf-8')


def verify_data(plain_data: str, hashed_data: str) -> bool:
    """
    Verify a plain text data against a hashed data.
    
    Args:
        plain_data: Plain text data to verify
        hashed_data: Hashed data from database
        
    Returns:
        True if data matches, False otherwise
    """
    return bcrypt.checkpw(
        plain_data.encode('utf-8'), 
        hashed_data.encode('utf-8')
    )