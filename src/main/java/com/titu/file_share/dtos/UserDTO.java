package com.titu.file_share.dtos;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class UserDTO {
    private String username;
    private String password;
    private String publicKey;
    private String role;
    private String address;
}
