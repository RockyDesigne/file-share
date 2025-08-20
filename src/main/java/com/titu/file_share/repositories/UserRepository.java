package com.titu.file_share.repositories;

import com.titu.file_share.models.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRepository extends JpaRepository<User, String> {
    @Query("SELECT u.username FROM User u")
    List<String> getAllUsernames();
    @Modifying
    @Query("delete from User u where u.registerDate <= :cutoff")
    int deleteByRegisterDateLessThanEqual(@Param("cutoff") long cutoff);
}
