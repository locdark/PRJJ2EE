package com.library.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FacebookLoginRequest {
    private String email;
    private String fullName;
    private String avatar;
    private String facebookToken;
}
