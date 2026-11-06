from fastapi import HTTPException, status


def unauthorized(detail: str = "Invalid or expired credentials") -> HTTPException:
    return HTTPException(status.HTTP_401_UNAUTHORIZED, detail, headers={"WWW-Authenticate": "Bearer"})


def forbidden(detail: str = "You do not have permission to do this") -> HTTPException:
    return HTTPException(status.HTTP_403_FORBIDDEN, detail)


def conflict(detail: str) -> HTTPException:
    return HTTPException(status.HTTP_409_CONFLICT, detail)