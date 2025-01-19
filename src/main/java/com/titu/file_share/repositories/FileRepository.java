package com.titu.file_share.repositories;

import com.titu.file_share.models.FileData;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface FileRepository extends JpaRepository<FileData, Long> {
    @Query("SELECT f FROM FileData f WHERE f.user.username = :username")
    public List<FileData> findAllByUsername(@Param("username") String username);
}
