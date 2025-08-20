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
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Log4j2
public class FileService {
    private final FileRepository fileRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public List<FileDataDTO> getUserFiles(String username) {

        List<FileData> f = fileRepository.findAllByUsername(username);

        return f.stream().map((f1) -> FileDataDTO.builder()
                .name(f1.getName())
                .userName(f1.getUser().getUsername())
                .size(f1.getSize())
                .hash(f1.getHash())
                .lastModified(f1.getLastModified())
                .signature(f1.getSignature())
                .build()).toList();
    }

    @Transactional(readOnly = true)
    public List<FileDataDTO> getUserFilesByReg(String reg) {

        List<FileData> f = fileRepository.findAllByRegNumber(reg);

        return f.stream().map((f1) -> FileDataDTO.builder()
                .name(f1.getName())
                .userName(f1.getUser().getUsername())
                .size(f1.getSize())
                .hash(f1.getHash())
                .lastModified(f1.getLastModified())
                .signature(f1.getSignature())
                .build()).toList();
    }

    @Transactional
    public void deleteAllFiles() {
        fileRepository.deleteAll();
    }

    @Transactional
    public void deleteUserFiles(String username) {
        fileRepository.deleteUserFiles(username);
    }

    @Transactional
    public String publishFiles(List<FileDataDTO> fileDataDTO) {
        String regNumber = UUID.randomUUID().toString();
        List<FileData> f = fileDataDTO.stream()
                .map(x -> FileData.builder()
                        .name(x.getName())
                        .user(userService.getUser(x.getUserName()))
                        .size(x.getSize())
                        .hash(x.getHash())
                        .lastModified(x.getLastModified())
                        .sharedAt(System.currentTimeMillis())
                        .signature(x.getSignature())
                        .filesRegistrationNumber(regNumber)
                        .build())
                .toList();
        fileRepository.saveAll(f);
        return regNumber;
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

    @Transactional(readOnly = true)
    public List<FileData> getFiles() {
        return fileRepository.findAll();
    }

}
