package com.titu.file_share.dtos;

import lombok.Data;

@Data
public class LoginWithCodeDTO {
    private String username;
    private String code;
}
