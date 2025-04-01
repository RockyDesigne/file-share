package com.titu.file_share.services;

import com.titu.file_share.dtos.FileDataDTO;
import com.titu.file_share.models.FileData;
import com.titu.file_share.repositories.FileRepository;
import com.titu.file_share.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j;
import lombok.extern.log4j.Log4j2;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.util.List;

@Service
@RequiredArgsConstructor
@Log4j2
public class FileService {
    private final FileRepository fileRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<FileDataDTO> getUserFiles(String username) {

        List<FileData> f = fileRepository.findAllByUsername(username);

        return f.stream().map((f1) -> {
            return FileDataDTO.builder()
                    .name(f1.getName())
                    .userName(f1.getUser().getUsername())
                    .size(f1.getSize())
                    .type(f1.getType())
                    .lastModified(f1.getLastModified())
                    .build();
        }).toList();
    }

    @Transactional
    public void deleteAllFiles() {
        fileRepository.deleteAll();
    }

    @Transactional
    public FileData publishFile(FileDataDTO fileDataDTO) {
        List<FileData> userFileLisst = fileRepository.findAllByUsername(fileDataDTO.getUserName());
        if (userFileLisst != null){
            if (userFileLisst.stream()
            .anyMatch((f) -> f.getName().equals(fileDataDTO.getName()))) {
                log.error("user: {} already has file with name: {}", fileDataDTO.getUserName(), fileDataDTO.getName());
                return null;
            }
        }
        return fileRepository.save(FileData.builder()
                .name(fileDataDTO.getName())
                .user(userService.getUser(fileDataDTO.getUserName()))
                .size(fileDataDTO.getSize())
                .type(fileDataDTO.getType())
                .lastModified(fileDataDTO.getLastModified())
                .sharedAt(System.currentTimeMillis())
                .build()
        );
    }

    @Transactional
    public void removeFile(FileDataDTO fileDataDTO) {
        fileRepository
        .findAllByUsername(fileDataDTO.getUserName())
        .stream()
        .filter((f) -> f.getName().equals(fileDataDTO.getName()))
        .findFirst()
        .ifPresent(fileRepository::delete);
    }

    @Transactional
    public void updateFile(FileDataDTO fileDataDTO) {
        removeFile(fileDataDTO);
        publishFile(fileDataDTO);
    }

    @Transactional(readOnly = true)
    public List<FileData> getFiles() {
        return fileRepository.findAll();
    }

}
