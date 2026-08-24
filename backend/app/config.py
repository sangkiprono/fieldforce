from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = "sqlite:///./fieldforce.db"
    secret_key: str = "change-this"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 1440
    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"

settings = Settings()
