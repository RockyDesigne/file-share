package com.titu.file_share.configuration;

import com.google.zxing.qrcode.QRCodeWriter;
import com.titu.file_share.services.QRCodeService;
import com.titu.file_share.services.TOTPService;
import org.apache.commons.codec.binary.Base32;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.security.SecureRandom;

@Configuration
public class BeanConfig {
    @Bean
    public TOTPService totpService() {
        return new TOTPService(
                new SecureRandom(),
                new Base32()
        );
    }
    @Bean
    public QRCodeService qrCodeService() {
        return new QRCodeService(
                new QRCodeWriter()
        );
    }
}
