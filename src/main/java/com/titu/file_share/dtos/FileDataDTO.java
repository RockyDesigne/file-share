package com.titu.file_share.dtos;

import com.titu.file_share.models.User;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class FileDataDTO {
    private String name;
    private String userName;
}
