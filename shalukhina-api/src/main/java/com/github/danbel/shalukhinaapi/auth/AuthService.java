package com.github.danbel.shalukhinaapi.auth;

import com.github.danbel.shalukhinaapi.domain.SystemUser;
import com.github.danbel.shalukhinaapi.repo.SystemUserRepository;
import java.util.Optional;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final SystemUserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;

    public AuthResponse login(LoginRequest request) {
        SystemUser user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> new AuthException("Неверный логин или пароль"));
        if (!user.isActive() || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new AuthException("Неверный логин или пароль");
        }
        return AuthResponse.from(tokenService.createToken(user), user);
    }

    public Optional<SystemUser> findUserByPrincipal(TokenService.TokenPrincipal principal) {
        if (principal == null) {
            return Optional.empty();
        }
        return userRepository.findById(principal.userId()).filter(SystemUser::isActive);
    }
}
