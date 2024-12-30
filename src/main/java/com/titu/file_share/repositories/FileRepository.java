package com.titu.file_share.repositories;

import com.titu.file_share.models.FileData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface FileRepository extends JpaRepository<FileData, Long> {
}
