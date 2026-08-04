package com.smartledger.service;

import com.smartledger.model.Role;
import com.smartledger.model.User;
import com.smartledger.model.VerificationToken;
import com.smartledger.model.dto.RegisterRequest;
import com.smartledger.repository.UserRepository;
import com.smartledger.repository.VerificationTokenRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final VerificationTokenRepository verificationTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final AuditLogService auditLogService;

    public AuthService(UserRepository userRepository, VerificationTokenRepository verificationTokenRepository, PasswordEncoder passwordEncoder, EmailService emailService, AuditLogService auditLogService) {
        this.userRepository = userRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.auditLogService = auditLogService;
    }

    @Transactional
    public User registerUser(RegisterRequest request) {
        String cleanEmail = request.getEmail() != null ? request.getEmail().trim().toLowerCase() : "";
        if (userRepository.existsByEmail(cleanEmail)) {
            throw new RuntimeException("Email is already in use!");
        }

        User user = new User();
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(cleanEmail);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(Role.BUSINESS_OWNER); // Defaulting to business owner for new signups
        
        user = userRepository.save(user);

        String token = UUID.randomUUID().toString();
        VerificationToken verificationToken = new VerificationToken(token, user, LocalDateTime.now().plusHours(24));
        verificationTokenRepository.save(verificationToken);

        emailService.sendVerificationEmail(user.getEmail(), token);

        auditLogService.logAction(user.getEmail(), "USER_REGISTERED", "User", user.getId().toString(), "New user registered with role " + user.getRole());

        return user;
    }

    @Transactional
    public void verifyEmail(String token) {
        VerificationToken verificationToken = verificationTokenRepository.findByToken(token)
                .orElseThrow(() -> new RuntimeException("Invalid token"));

        if (verificationToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Verification token has expired");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        verificationTokenRepository.deleteByUser(user);
        auditLogService.logAction(user.getEmail(), "USER_VERIFIED", "User", user.getId().toString(), "User email verified successfully.");
    }

    private static final org.slf4j.Logger logger = org.slf4j.LoggerFactory.getLogger(AuthService.class);

    @Transactional
    public void processForgotPassword(String email) {
        long tStart = System.currentTimeMillis();
        long uptime = java.lang.management.ManagementFactory.getRuntimeMXBean().getUptime();
        boolean isColdStart = uptime < 45000;

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with this email"));
        long tLookup = System.currentTimeMillis();

        String rawToken = UUID.randomUUID().toString();

        // Upsert token to eliminate Hibernate delete-before-insert flush order race conditions
        VerificationToken verificationToken = verificationTokenRepository.findByUser(user)
                .orElseGet(() -> {
                    VerificationToken vt = new VerificationToken();
                    vt.setUser(user);
                    return vt;
                });

        verificationToken.setToken(rawToken);
        verificationToken.setExpiryDate(LocalDateTime.now().plusHours(1));
        verificationTokenRepository.saveAndFlush(verificationToken);
        long tTokenSave = System.currentTimeMillis();

        logger.info("[FORGOT PASSWORD TOKEN GENERATED] User Email: '{}', Token: '{}', Expiry: '{}'", 
                user.getEmail(), rawToken, verificationToken.getExpiryDate());

        emailService.sendPasswordResetEmail(user.getEmail(), rawToken);
        long tAsyncDispatch = System.currentTimeMillis();

        logger.info("[FORGOT PASSWORD PERFORMANCE] ColdStart: {}, TotalSyncMs: {}ms (LookupMs: {}ms, TokenSaveMs: {}ms, AsyncDispatchTriggerMs: {}ms)",
                isColdStart,
                (tAsyncDispatch - tStart),
                (tLookup - tStart),
                (tTokenSave - tLookup),
                (tAsyncDispatch - tTokenSave));
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        logger.info("[RESET PASSWORD API CALLED] Raw received token: '{}', NewPassword length: {}", token, newPassword != null ? newPassword.length() : 0);

        if (token == null || token.trim().isEmpty()) {
            logger.error("[RESET PASSWORD FAILURE REASON: TOKEN_NULL_OR_EMPTY] Provided token parameter is null or empty");
            throw new RuntimeException("Invalid token");
        }

        String cleanToken = token.trim();
        logger.info("[RESET PASSWORD REPOSITORY QUERY] Executing verificationTokenRepository.findByToken('{}')", cleanToken);

        Optional<VerificationToken> tokenOptional = verificationTokenRepository.findByToken(cleanToken);

        if (tokenOptional.isEmpty()) {
            long totalTokensInDb = verificationTokenRepository.count();
            logger.error("[RESET PASSWORD FAILURE REASON: TOKEN_NOT_FOUND_IN_DB] Received token '{}' did not match any row in verification_tokens table (Total active tokens in DB: {})", cleanToken, totalTokensInDb);
            throw new RuntimeException("Invalid token");
        }

        VerificationToken verificationToken = tokenOptional.get();
        LocalDateTime now = LocalDateTime.now();

        logger.info("[RESET PASSWORD DB MATCH FOUND] Stored Token: '{}', Received Token: '{}', Matches: {}, Expiry: '{}', Server Time: '{}'",
                verificationToken.getToken(), cleanToken, verificationToken.getToken().equals(cleanToken), verificationToken.getExpiryDate(), now);

        if (verificationToken.getExpiryDate().isBefore(now)) {
            logger.error("[RESET PASSWORD FAILURE REASON: TOKEN_EXPIRED] Token '{}' expired at {} (Current Server Time: {})", 
                    cleanToken, verificationToken.getExpiryDate(), now);
            throw new RuntimeException("Token has expired");
        }

        User user = verificationToken.getUser();
        logger.info("[RESET PASSWORD VALIDATION PASSED] Token matched for user ID {} ({})", user.getId(), user.getEmail());

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        verificationTokenRepository.delete(verificationToken);
        verificationTokenRepository.flush();

        logger.info("[RESET PASSWORD COMPLETED SUCCESSFULLY] Password updated and token deleted for user '{}'", user.getEmail());
        auditLogService.logAction(user.getEmail(), "PASSWORD_RESET_SUCCESS", "User", user.getId().toString(), "Password reset successfully via email link.");
    }
}
