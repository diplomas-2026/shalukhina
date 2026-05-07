package com.github.danbel.shalukhinaapi.auth;

import com.github.danbel.shalukhinaapi.domain.SystemUser;

public record AuthResponse(
        String token,
        UserView user
) {
    public record UserView(
            Long id,
            String fullName,
            String email,
            String username,
            String role,
            String position
    ) {
        public static UserView from(SystemUser user) {
            return new UserView(
                    user.getId(),
                    user.getFullName(),
                    user.getEmail(),
                    user.getUsername(),
                    user.getRole().name(),
                    user.getPosition()
            );
        }
    }

    public static AuthResponse from(String token, SystemUser user) {
        return new AuthResponse(token, UserView.from(user));
    }
}
