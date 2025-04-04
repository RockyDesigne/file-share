package com.titu.file_share.dtos;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FileDataDTO {
    private String name;
    private Long size;
    private String hash;
    private Long lastModified;
    private String userName; // Used instead of User entity in DTO
}
