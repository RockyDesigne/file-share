package com.titu.file_share.services;

import com.titu.file_share.dtos.FileDataDTO;
import com.titu.file_share.models.FileData;
import com.titu.file_share.repositories.FileRepository;
import com.titu.file_share.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FileService {
    private final FileRepository fileRepository;
    private final UserService userService;

    @Transactional
    public FileData publishFile(FileDataDTO fileDataDTO) {
        return fileRepository.save(FileData.builder()
                .name(fileDataDTO.getName())
                .user(userService.getUser(fileDataDTO.getUserName()))
                .build()
        );
    }

    @Transactional(readOnly = true)
    public List<FileData> getFiles() {
        return fileRepository.findAll();
    }

}
