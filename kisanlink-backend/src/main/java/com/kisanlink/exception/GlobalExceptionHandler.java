package com.kisanlink.exception;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({IllegalArgumentException.class, MethodArgumentNotValidException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public Map<String, String> handleBadRequest(Exception exception) {
        if (exception instanceof MethodArgumentNotValidException validationException) {
            String message = validationException.getBindingResult().getFieldErrors().stream()
                    .findFirst().map(error -> error.getField() + ": " + error.getDefaultMessage())
                    .orElse("Invalid request");
            return Map.of("error", message);
        }
        return Map.of("error", exception.getMessage() == null ? "Invalid request" : exception.getMessage());
    }

    /**
     * Returns 403 when a user attempts to mutate a resource they do not own.
     * Spring Security's default behaviour would redirect to /error; this ensures
     * the API always returns structured JSON regardless of Accept header.
     */
    @ExceptionHandler(AccessDeniedException.class)
    @ResponseStatus(HttpStatus.FORBIDDEN)
    public Map<String, String> handleAccessDenied(AccessDeniedException exception) {
        String msg = exception.getMessage() != null
                ? exception.getMessage()
                : "Access denied: you do not own this resource";
        return Map.of("error", msg);
    }
}

