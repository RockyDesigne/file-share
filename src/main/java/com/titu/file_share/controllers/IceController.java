package com.titu.file_share.controllers;

import com.titu.file_share.services.TurnCredentialService;
import io.jsonwebtoken.Jwt;
import lombok.RequiredArgsConstructor;
import lombok.extern.log4j.Log4j2;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
@Log4j2
public class IceController {

    private final TurnCredentialService svc;

    @GetMapping("/turn-cred")
    public ResponseEntity<TurnCredentialService.IceResponse> ice() {
        String subject = UUID.randomUUID().toString();

        TurnCredentialService.IceResponse resp = svc.buildIceResponse(subject);

        log.info(resp);

        return ResponseEntity.ok()
                .cacheControl(CacheControl.noStore())
                .body(resp);
    }
}
