package com.library.controller;

import com.library.entity.Role;
import com.library.entity.User;
import com.library.repository.UserRepository;
import com.library.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.graphql.data.method.annotation.Argument;
import org.springframework.graphql.data.method.annotation.MutationMapping;
import org.springframework.graphql.data.method.annotation.QueryMapping;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.stereotype.Controller;

import java.util.List;

@Controller
@RequiredArgsConstructor
public class UserGraphQLController {

    private final UserRepository userRepository;
    private final AuthService authService;

    @QueryMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<User> users() {
        return userRepository.findAll();
    }

    @QueryMapping
    public User currentUser() {
        return authService.getCurrentUser();
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public User updateUserRole(@Argument Long userId, @Argument String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        user.setRole(Role.valueOf(role.toUpperCase()));
        return userRepository.save(user);
    }

    @MutationMapping
    @PreAuthorize("hasRole('ADMIN')")
    public User toggleUserStatus(@Argument Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Người dùng không tồn tại"));

        user.setEnabled(!user.isEnabled());
        return userRepository.save(user);
    }
}
