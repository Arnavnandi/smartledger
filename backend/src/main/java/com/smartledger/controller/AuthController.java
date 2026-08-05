package com.smartledger.controller;
import com.smartledger.model.RefreshToken;
import com.smartledger.model.dto.*;
import com.smartledger.security.CustomUserDetails;
import com.smartledger.security.JwtTokenProvider;
import com.smartledger.service.AuthService;
import com.smartledger.service.RefreshTokenService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider tokenProvider;
    private final AuthService authService;
    private final RefreshTokenService refreshTokenService;

    public AuthController(AuthenticationManager authenticationManager, JwtTokenProvider tokenProvider, AuthService authService, RefreshTokenService refreshTokenService) {
        this.authenticationManager = authenticationManager;
        this.tokenProvider = tokenProvider;
        this.authService = authService;
        this.refreshTokenService = refreshTokenService;
    }

    private static final java.util.Map<String, Integer> loginAttempts = new java.util.concurrent.ConcurrentHashMap<>();
    private static final int MAX_ATTEMPTS = 10;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        String email = loginRequest.getEmail() != null ? loginRequest.getEmail().trim().toLowerCase() : "";
        int attempts = loginAttempts.getOrDefault(email, 0);
        if (attempts >= MAX_ATTEMPTS) {
            return ResponseEntity.status(429).body(new ApiResponse(false, "Too many login attempts. Please try again later."));
        }
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, loginRequest.getPassword())
            );

            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            
            if (!userDetails.isEmailVerified()) {
                return ResponseEntity.badRequest().body(new ApiResponse(false, "Please verify your email before logging in."));
            }

            loginAttempts.remove(email);
            SecurityContextHolder.getContext().setAuthentication(authentication);
            String jwt = tokenProvider.generateToken(authentication);
            
            RefreshToken refreshToken = refreshTokenService.createRefreshToken(userDetails.getId());

            return ResponseEntity.ok(new JwtAuthenticationResponse(jwt, refreshToken.getToken()));
        } catch (org.springframework.security.core.AuthenticationException e) {
            loginAttempts.put(email, attempts + 1);
            return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED)
                    .body(new ApiResponse(false, "Invalid email address or password. Please try again."));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        authService.registerUser(registerRequest);
        return ResponseEntity.status(org.springframework.http.HttpStatus.CREATED).body(new ApiResponse(true, "User registered successfully! Please check your email to verify."));
    }

    @GetMapping("/verify-email")
    public ResponseEntity<?> verifyEmail(@RequestParam String token) {
        authService.verifyEmail(token);
        return ResponseEntity.ok(new ApiResponse(true, "Email verified successfully!"));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<?> refreshtoken(@Valid @RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    // Create authentication for token generation
                    Authentication authentication = new UsernamePasswordAuthenticationToken(
                            com.smartledger.security.CustomUserDetails.create(user), null, 
                            com.smartledger.security.CustomUserDetails.create(user).getAuthorities());
                    
                    String token = tokenProvider.generateToken(authentication);
                    return ResponseEntity.ok(new TokenRefreshResponse(token, requestRefreshToken));
                })
                .orElseThrow(() -> new RuntimeException("Refresh token is not in database!"));
    }

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AuthController.class);

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        long t0 = System.currentTimeMillis();
        authService.processForgotPassword(request.getEmail());
        long totalMs = System.currentTimeMillis() - t0;
        logger.info("[AUTH CONTROLLER FORGOT-PASSWORD] Synchronous response returned to client in {}ms", totalMs);
        return ResponseEntity.ok(new ApiResponse(true, "If the email exists, a password reset link has been sent."));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(new ApiResponse(true, "Password has been successfully reset."));
    }
    
    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CustomUserDetails) {
            CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
            refreshTokenService.deleteByUserId(userDetails.getId());
        }
        return ResponseEntity.ok(new ApiResponse(true, "Log out successful"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof CustomUserDetails)) {
            return ResponseEntity.status(401).body(new ApiResponse(false, "Not authenticated"));
        }
        CustomUserDetails userDetails = (CustomUserDetails) authentication.getPrincipal();
        return ResponseEntity.ok(userDetails);
    }
}
