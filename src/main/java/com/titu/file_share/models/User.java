package com.titu.file_share.models;

import jakarta.persistence.*;
import lombok.*;

import java.util.Set;

@Entity
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class User {

    @Id
    private String username;

    @Column(nullable = false, unique = true)
    private String password;

    @Column(name = "public_key")
    private String publicKey;

    @Column()
    private long registerDate;

    @Column()
    private String role;
}
