package com.titu.file_share.repositories;

import com.titu.file_share.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    @Query("SELECT u.username FROM User u")
    public List<String> getAllUsernames();
}
