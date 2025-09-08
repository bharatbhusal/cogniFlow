import cuid

def cuid_str() -> str:
    """Generate a CUID string for use as primary key"""
    return cuid.cuid()
