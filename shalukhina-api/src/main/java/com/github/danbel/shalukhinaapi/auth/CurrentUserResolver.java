package com.github.danbel.shalukhinaapi.auth;

import com.github.danbel.shalukhinaapi.domain.SystemUser;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CurrentUserResolver {

    private final AuthService authService;
    private final TokenService tokenService;

    public SystemUser requireUser(HttpServletRequest request) {
        return resolveUser(request).orElseThrow(() -> new IllegalStateException("Unauthenticated"));
    }

    public java.util.Optional<SystemUser> resolveUser(HttpServletRequest request) {
        Object authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof org.springframework.security.authentication.UsernamePasswordAuthenticationToken token) {
            Object principal = token.getPrincipal();
            if (principal instanceof SystemUser user) {
                return java.util.Optional.of(user);
            }
        }
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return java.util.Optional.empty();
        }
        String token = header.substring(7);
        TokenService.TokenPrincipal principal = tokenService.parseToken(token);
        return authService.findUserByPrincipal(principal);
    }
}
