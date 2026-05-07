package com.github.danbel.shalukhinaapi.auth;

import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.domain.UserRole;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

    private final String secret;

    public TokenService(@Value("${shalukhina.auth.secret:change-me-in-production}") String secret) {
        this.secret = secret;
    }

    public String createToken(SystemUser user) {
        String payload = user.getId() + "|" + user.getUsername() + "|" + user.getRole().name() + "|" + Instant.now().toEpochMilli();
        String encodedPayload = base64Url(payload.getBytes(StandardCharsets.UTF_8));
        String signature = sign(encodedPayload);
        return encodedPayload + "." + signature;
    }

    public TokenPrincipal parseToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        String[] parts = token.split("\\.");
        if (parts.length != 2) {
            return null;
        }
        String payload = parts[0];
        String signature = parts[1];
        if (!sign(payload).equals(signature)) {
            return null;
        }
        String decoded = new String(Base64.getUrlDecoder().decode(payload), StandardCharsets.UTF_8);
        String[] values = decoded.split("\\|");
        if (values.length < 4) {
            return null;
        }
        return new TokenPrincipal(Long.valueOf(values[0]), values[1], UserRole.valueOf(values[2]));
    }

    private String sign(String payload) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return base64Url(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Cannot sign token", exception);
        }
    }

    private String base64Url(byte[] bytes) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public record TokenPrincipal(Long userId, String username, UserRole role) {
    }
}
